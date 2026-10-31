#!/usr/bin/env node
// EVALUATE — leave-one-out: for every verified model, hide it from the library, ingest its asset
// as if unseen, and compare the proposal with the verified profile. The score is how much the
// software has LEARNED about vehicle parts; it should rise as more models are verified.
// Brain: brain/algorithms/learning-loop.md
//
//   npm run brain:evaluate
import fs from 'node:fs'
import path from 'node:path'
import { readGlb } from '../glb/read-glb.mjs'
import { ROOT, meshesFor, scopeMeshes } from './features.mjs'
import { ingest } from './ingest-core.mjs'

const vehiclesDir = path.join(ROOT, 'src/vehicles')
const profiles = []
for (const fam of fs.readdirSync(vehiclesDir)) {
  const dir = path.join(vehiclesDir, fam, 'models')
  if (!fs.existsSync(dir)) continue
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.profile.json'))) profiles.push(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
}

const tokensOf = (o) => (o.extract.kind === 'region-clip' ? o.extract.source : [].concat(o.extract.match))
// Two bindings are equivalent when their tokens select the SAME meshes (names may differ:
// "SM_Hood" and "vSM_Hood" pick the same two hood meshes).
const meshSet = (meshes, tokens) => new Set(tokens.flatMap((t) => meshesFor(meshes, t)))
const sameMeshes = (meshes, a, b) => {
  const A = meshSet(meshes, a)
  const B = meshSet(meshes, b)
  if (!A.size || A.size !== B.size) return false
  for (const m of A) if (!B.has(m)) return false
  return true
}
let hits = 0
let total = 0
const lines = []
for (const p of profiles.filter((x) => x.provenance?.status === 'verified')) {
  const glb = path.join(ROOT, 'public', p.asset.path)
  const meshes = scopeMeshes(readGlb(glb), p.asset.rootNode)
  const { profile: d } = ingest(glb, { family: p.family, id: p.id, rootNode: p.asset.rootNode, excludeModel: p.id })
  const checks = []
  for (const truth of p.openables ?? []) {
    const guess = d.openables?.find((o) => o.group === truth.group)
    const ok = !!guess && guess.extract.kind === truth.extract.kind && sameMeshes(meshes, tokensOf(guess), tokensOf(truth))
    checks.push([`${truth.group}:${truth.extract.kind}`, ok, guess ? `${guess.extract.kind} ${tokensOf(guess).join(',')}` : 'missing'])
  }
  for (const m of p.wheels?.mounts ?? []) {
    const hit = d.wheels?.mounts.find((g) => !!g.splitX === !!m.splitX && sameMeshes(meshes, [g.node], [m.node]))
    checks.push([`wheel:${m.node}`, !!hit, hit ? `found as ${hit.node}` : 'missing'])
  }
  const scaleErr = Math.abs(d.frame.scale - p.frame.scale) / p.frame.scale
  checks.push(['frame.scale', scaleErr < 0.05, `${d.frame.scale} vs ${p.frame.scale}`])
  checks.push(['interior', d.interior.source === (p.interior?.source ?? 'own'), `${d.interior.source} vs ${p.interior?.source ?? 'own'}`])
  checks.forEach(([, ok]) => {
    total++
    if (ok) hits++
  })
  lines.push(`\n${p.id}:`)
  checks.forEach(([what, ok, got]) => lines.push(`  ${ok ? '✓' : '✗'} ${what.padEnd(28)} ${got}`))
}
console.log(lines.join('\n'))
console.log(`\nleave-one-out: ${hits}/${total} bindings recovered (${((100 * hits) / Math.max(total, 1)).toFixed(0)}%)`)
