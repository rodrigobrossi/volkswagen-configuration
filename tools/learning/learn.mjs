#!/usr/bin/env node
// LEARN — builds the part-signature library from every VERIFIED model profile.
// Each verified binding (a door node, a lid, a wheel mount, the paint material, a companion…)
// becomes a labelled example: its geometric signature in the vehicle frame + its name tokens.
// Articulations, region-clip boxes and frame scales become priors for future ingestions.
// The more models are verified, the better the next ingestion guesses. Output:
// brain/learning/signature-library.json. Brain: brain/algorithms/learning-loop.md
//
//   npm run brain:learn
import fs from 'node:fs'
import path from 'node:path'
import { boxSize, emptyBox, readGlb, union } from '../glb/read-glb.mjs'
import { ROOT, genericSlot, groupMeshes, loadJson, meshesFor, nameEvidence, scopeMeshes, signature, vehicleFrame } from './features.mjs'

const vocabulary = loadJson('src/core/ontology/vocabulary.json').tokens
const GROUP_SLOT = { doors: 'closure.door', frontLid: 'closure.lid.front', rearLid: 'closure.lid.rear' }

function profilesOnDisk() {
  const out = []
  const vehiclesDir = path.join(ROOT, 'src/vehicles')
  for (const fam of fs.readdirSync(vehiclesDir)) {
    const dir = path.join(vehiclesDir, fam, 'models')
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.profile.json')))
      out.push({ file: path.relative(ROOT, path.join(dir, f)), profile: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) })
  }
  return out
}

function main() {
  const examples = []
  const articulationPriors = {}
  const regionPriors = []
  const frames = []
  const skipped = []

  for (const { file, profile } of profilesOnDisk()) {
    if (profile.provenance?.status !== 'verified') {
      skipped.push(`${profile.id} (${profile.provenance?.status ?? 'no status'})`)
      continue
    }
    const glbPath = path.join(ROOT, 'public', profile.asset.path)
    if (!fs.existsSync(glbPath)) {
      skipped.push(`${profile.id} (asset missing: ${profile.asset.path})`)
      continue
    }
    const glb = readGlb(glbPath)
    const meshes = scopeMeshes(glb, profile.asset.rootNode)
    const frame = vehicleFrame(meshes)
    frames.push({ model: profile.id, family: profile.family, nativeLength: frame.nativeLength, scale: profile.frame.scale, metres: frame.nativeLength * profile.frame.scale, lengthAxis: frame.lengthAxis, rotationY: profile.frame.rotationY })

    const used = new Set() // meshes already labelled by a stronger source
    const add = (slot, key, members, source, extra = {}) => {
      if (!members.length) return
      members.forEach((m) => used.add(m))
      const sig = signature(members, frame)
      examples.push({ slot: genericSlot(slot), model: profile.id, family: profile.family, key, source, tokens: [...new Set(nameEvidence(key).map((h) => h.token))], ...sig.features, vector: sig.vector, ...extra })
    }

    for (const o of profile.openables ?? []) {
      const slot = GROUP_SLOT[o.group]
      ;(articulationPriors[o.group] ??= []).push({ model: profile.id, ...o.articulation, strategy: o.extract.kind })
      const e = o.extract
      if (e.kind === 'node') e.match.forEach((t) => add(slot, t, meshesFor(meshes, t), 'binding'))
      if (e.kind === 'node-split-x') add(slot, e.match, meshesFor(meshes, e.match), 'binding', { merged: 'pair' })
      if (e.kind === 'region-clip') {
        // Fractions are relative to the SOURCE shell; re-express them in VEHICLE-frame fractions so
        // they transfer to an asset whose shell is cut differently (cabin-only vs whole car).
        const src = emptyBox()
        meshesFor(meshes, e.source[0]).forEach((m) => union(src, m.box))
        const ss = boxSize(src)
        const toVehicle = (r) => {
          const out = {}
          ;[['x', 0], ['y', 1], ['z', 2]].forEach(([a, k]) => {
            for (const edge of ['Min', 'Max']) {
              const world = src.min[k] + r[a + edge] * ss[k]
              out[a + edge] = +((world - frame.box.min[k]) / frame.size[k]).toFixed(4)
            }
          })
          return out
        }
        regionPriors.push({ slot, model: profile.id, source: e.source, region: e.region, regionVehicle: toVehicle(e.region), mirrorX: !!e.mirrorX, trim: e.trim ? { ...e.trim, regionVehicle: toVehicle(e.trim.region) } : null, lengthAxis: frame.lengthAxis })
      }
      for (const t of o.companions?.attachNearest ?? []) add(vocabulary[t]?.slot ?? 'trim.companion', t, meshesFor(meshes, t), 'companion', { follows: slot })
      for (const t of o.companions?.splitByFootprint ?? []) add(vocabulary[t]?.slot ?? 'trim.companion', t, meshesFor(meshes, t), 'companion-split', { follows: slot })
    }
    for (const w of profile.wheels?.mounts ?? []) add('wheel', w.node, meshesFor(meshes, w.node), 'binding', w.splitX ? { merged: 'axle' } : {})

    // Paint: explicit materials, else the volume-dominant opaque material (same rule as the app).
    const paintMats = profile.paint?.materials ?? (() => {
      const vol = new Map()
      meshes.filter((m) => m.opaque).forEach((m) => {
        const s = [m.box.max[0] - m.box.min[0], m.box.max[1] - m.box.min[1], m.box.max[2] - m.box.min[2]]
        vol.set(m.material, (vol.get(m.material) ?? 0) + s[0] * s[1] * s[2])
      })
      const best = [...vol.entries()].sort((a, b) => b[1] - a[1])[0]
      return best ? [best[0]] : []
    })()
    for (const mat of paintMats) add('body.shell', mat, meshes.filter((m) => m.material === mat), 'paint')

    // Weak labels: any group whose name the vocabulary already knows and whose meshes no binding
    // already labelled (avoids counting the same door twice).
    for (const [key, members] of groupMeshes(meshes, profile.parts?.groupBy ?? 'node')) {
      if (members.some((m) => used.has(m))) continue
      const hit = nameEvidence(key)[0]
      if (hit) add(hit.slot, key, members, 'vocabulary')
    }
  }

  const library = {
    version: 1,
    doc: 'Generated by `npm run brain:learn` from verified profiles — do not edit by hand. brain/contracts/part-signature.md',
    generatedAt: new Date().toISOString(),
    stats: { examples: examples.length, models: frames.length, skipped },
    frames,
    articulationPriors,
    regionPriors,
    examples,
  }
  const out = path.join(ROOT, 'brain/learning/signature-library.json')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, JSON.stringify(library, null, 1) + '\n')
  const bySlot = examples.reduce((a, x) => ((a[x.slot] = (a[x.slot] ?? 0) + 1), a), {})
  console.log(`learned ${examples.length} examples from ${frames.length} verified models → ${path.relative(ROOT, out)}`)
  console.log('examples per slot:', bySlot)
  console.log('region priors:', regionPriors.length, '| articulation priors:', Object.fromEntries(Object.entries(articulationPriors).map(([k, v]) => [k, v.length])))
  if (skipped.length) console.log('skipped:', skipped.join(', '))
}

main()
