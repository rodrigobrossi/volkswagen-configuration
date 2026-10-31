// INGEST core — proposes a draft ModelProfile for an unseen asset from the learned library.
// Classification = name evidence (ontology vocabulary) + geometric kNN against verified examples.
// Everything it proposes is a DRAFT: the verifier agent / a human confirms by rendering.
// Brain: brain/algorithms/classify-knn.md, brain/agents/ingestion-agent.md
import { readGlb } from '../glb/read-glb.mjs'
import { distance, genericSlot, groupMeshes, instanceGroups, loadJson, nameEvidence, scopeMeshes, sectionGroups, signature, vehicleFrame } from './features.mjs'

const K = 5
const W_NAME = 0.55
const W_GEOM = 0.45
export const MIN_CONF = 0.35
/** Generic prior for a door fused into the shell (fractions of the shell bbox, +X side): the outer
 * skin band, running board to roof, B-pillar to A-pillar. Used only when nothing was learned. */
const DEFAULT_DOOR_REGION = { xMin: 0.8, xMax: 1.0, yMin: 0.0, yMax: 1.0, zMin: 0.05, zMax: 0.95 }

const median = (xs) => {
  if (!xs.length) return undefined
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}
const mode = (items, keyFn) => {
  const counts = new Map()
  items.forEach((it) => counts.set(keyFn(it), [...(counts.get(keyFn(it)) ?? []), it]))
  return [...counts.values()].sort((a, b) => b.length - a.length)[0]?.[0]
}

export function loadLibrary(excludeModel) {
  const lib = loadJson('brain/learning/signature-library.json')
  if (!excludeModel) return lib
  return {
    ...lib,
    examples: lib.examples.filter((e) => e.model !== excludeModel),
    frames: lib.frames.filter((f) => f.model !== excludeModel),
    regionPriors: lib.regionPriors.filter((r) => r.model !== excludeModel),
    articulationPriors: Object.fromEntries(Object.entries(lib.articulationPriors).map(([k, v]) => [k, v.filter((a) => a.model !== excludeModel)])),
  }
}

/** Slot probabilities for one group: name evidence + distance-weighted kNN over the library. */
export function classify(key, sig, library) {
  const votes = {}
  const nearest = library.examples
    .map((e) => ({ e, d: distance(sig.vector, e.vector) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, K)
  const wsum = nearest.reduce((s, n) => s + 1 / (n.d + 0.05), 0)
  nearest.forEach((n) => (votes[n.e.slot] = (votes[n.e.slot] ?? 0) + (W_GEOM * (1 / (n.d + 0.05))) / wsum))
  const names = nameEvidence(key)
  const shares = names.reduce((n, h) => n + h.share, 0)
  names.forEach((h) => (votes[genericSlot(h.slot)] = (votes[genericSlot(h.slot)] ?? 0) + (W_NAME * h.share) / shares))
  const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1])
  const [slot, conf] = ranked[0] ?? [null, 0]
  return {
    slot,
    confidence: +conf.toFixed(3),
    runnerUp: ranked[1] ? { slot: ranked[1][0], confidence: +ranked[1][1].toFixed(3) } : null,
    evidence: {
      names: names.map((h) => `${h.token}→${h.slot}`),
      neighbours: nearest.map((n) => `${n.e.model}:${n.e.key}(${n.e.slot}, d=${n.d.toFixed(2)})`),
    },
  }
}

/** The token a binding uses for a candidate group (anchor node name or section prefix). */
const bindingToken = (group) => group.token ?? group.key

export function ingest(glbPath, { family, id, label, rootNode, length, excludeModel } = {}) {
  const library = loadLibrary(excludeModel)
  const glb = readGlb(glbPath)
  const meshes = scopeMeshes(glb, rootNode)
  const frame = vehicleFrame(meshes)
  const notes = []

  // Frame: scale to the family's typical length; heading from the longest horizontal axis.
  const famFrames = library.frames.filter((f) => !family || f.family === family)
  const targetLength = length ?? median(famFrames.map((f) => f.metres)) ?? 4.07
  const scale = +(targetLength / frame.nativeLength).toFixed(4)
  const rotationY = frame.lengthAxis === 'x' ? +(Math.PI / 2).toFixed(4) : 0
  if (frame.lengthAxis === 'x') notes.push('Length runs along X → proposed rotationY = π/2. Confirm which end is the FRONT (flip to −π/2 if needed).')

  // Candidates: node INSTANCES (anchor nodes), SECTIONS (sibling instances sharing a prefix) and
  // MATERIAL groups. Only instances/sections can be bound (a node token); materials add evidence.
  const describe = (by, g) => {
    const sig = signature(g.members, frame)
    return { by, ...g, sig, ...classify(g.aliases ?? g.key, sig, library) }
  }
  const instances = instanceGroups(glb, meshes)
  const bindable = [...instances.map((g) => describe('instance', g)), ...sectionGroups(instances).map((g) => describe('section', g))]
  const materialGroups = [...groupMeshes(meshes, 'material').entries()].map(([key, members]) => describe('material', { key, members }))
  // Parts-editor grouping: whichever naming the vocabulary understands better.
  const vocabHits = (by) => [...groupMeshes(meshes, by).keys()].filter((k) => nameEvidence(k).length).length
  const groupBy = vocabHits('material') > vocabHits('node') ? 'material' : 'node'
  const nodeGroups = bindable
  const all = [...bindable, ...materialGroups]
  // Best candidates for a slot. When a candidate is covered by a bigger one of the same slot with
  // comparable confidence (an instance inside its section), prefer the bigger: it takes the whole
  // part (paint + trim), not one of its meshes.
  const confident = (slot) => {
    const cands = nodeGroups.filter((g) => g.slot === slot && g.confidence >= MIN_CONF).sort((a, b) => b.confidence - a.confidence)
    return cands
      .map((g) => {
        const set = new Set(g.members)
        const cover = cands.find((o) => o !== g && o.members.length > g.members.length && g.members.every((m) => o.members.includes(m)) && o.confidence >= g.confidence - 0.15)
        return cover && ![...set].some((m) => !cover.members.includes(m)) ? cover : g
      })
      .filter((g, i, arr) => arr.indexOf(g) === i)
  }

  const artPrior = (group, fallback) => {
    const pick = mode(library.articulationPriors[group] ?? [], (a) => `${a.axis}|${a.openAngle}|${a.pivotY}|${a.pivotZ}`)
    return pick ? { axis: pick.axis, openAngle: pick.openAngle, pivotY: pick.pivotY, pivotZ: pick.pivotZ } : fallback
  }

  const openables = []
  const used = []

  // Doors: a merged pair (one node on the centreline spanning the width), two side nodes, or none
  // (fused into the shell → region-clip from the learned prior, flagged for tuning).
  const doorCands = confident('closure.door')
  const pair = doorCands.find((g) => g.sig.features.lateral < 0.2 && g.sig.features.spanX > 0.6)
  const sides = doorCands.filter((g) => g.sig.features.lateral > 0.4)
  const doorArt = artPrior('doors', { axis: 'y', openAngle: 1.3, pivotY: 'center', pivotZ: 'max' })
  if (pair) {
    openables.push({ group: 'doors', extract: { kind: 'node-split-x', match: bindingToken(pair) }, articulation: doorArt, note: `draft: merged pair (conf ${pair.confidence})` })
    used.push(pair)
  } else if (sides.length >= 2) {
    const L = sides.find((g) => g.sig.features.side === 'left')
    const R = sides.find((g) => g.sig.features.side === 'right')
    const chosen = [L, R].filter(Boolean)
    openables.push({ group: 'doors', extract: { kind: 'node', match: chosen.map(bindingToken) }, articulation: doorArt, note: `draft: side nodes (conf ${chosen.map((g) => g.confidence).join('/')})` })
    used.push(...chosen)
  } else {
    // Fused doors: cut from the biggest bindable body-shell candidate, seeded by a LEARNED region
    // when one exists, else by the generic ontology prior (door column of a 2-door sedan).
    const learned = library.regionPriors.find((r) => r.slot === 'closure.door')
    const prior = learned ?? { model: 'ontology default', region: DEFAULT_DOOR_REGION }
    // The cabin shell: a body candidate spanning the width across the MIDDLE of the car (where
    // doors live) — not merely the one with most vertices (that is often a front/rear kit).
    const cabinScore = (g) => g.sig.features.spanX - Math.abs(g.sig.features.longitudinal - 0.5) * 2
    const shell = nodeGroups.filter((g) => g.slot === 'body.shell' && g.sig.features.spanX > 0.7).sort((a, b) => cabinScore(b) - cabinScore(a))[0]
    if (shell) {
      // Learned priors live in VEHICLE-frame fractions → re-express them against this shell's bbox.
      const region = prior.regionVehicle
        ? (() => {
            const S = shell.sig.box
            const out = {}
            ;[['x', 0], ['y', 1], ['z', 2]].forEach(([a, k]) => {
              const size = S.max[k] - S.min[k] || 1
              for (const edge of ['Min', 'Max']) {
                const world = frame.box.min[k] + prior.regionVehicle[a + edge] * frame.size[k]
                out[a + edge] = +((world - S.min[k]) / size).toFixed(3)
              }
            })
            return out
          })()
        : prior.region
      if (prior.lengthAxis && prior.lengthAxis !== frame.lengthAxis) notes.push('The region prior was learned on an asset with a different length axis — rotate before trusting it.')
      openables.push({
        group: 'doors',
        extract: { kind: 'region-clip', source: [bindingToken(shell)], region, mirrorX: true },
        articulation: doorArt,
        note: `draft: NO door node — region-clip seeded from ${prior.model}; MUST be tuned on the real panel lines (brain/algorithms/region-clip.md)`,
      })
      notes.push(`Doors look fused into the shell: region-clip seeded from ${learned ? 'a learned' : 'the generic'} prior — tune the fractions on the panel lines.`)
    } else notes.push('No door evidence found — doors stay closed until a binding is added.')
  }

  // Companions of side doors: per-side trim near the doors rides the nearest hinge.
  if (openables[0]?.extract.kind !== 'region-clip') {
    const comp = nodeGroups.filter((g) => ['trim.mirror', 'trim.handle'].includes(g.slot) && g.confidence >= MIN_CONF && g.sig.features.lateral > 0.3)
    if (comp.length && openables[0]) openables[0].companions = { attachNearest: comp.map(bindingToken) }
  }

  // Lids: the most confident candidate per end.
  for (const [group, slot, fallback] of [
    ['frontLid', 'closure.lid.front', { axis: 'x', openAngle: -1.1, pivotY: 'max', pivotZ: 'min' }],
    ['rearLid', 'closure.lid.rear', { axis: 'x', openAngle: 1.1, pivotY: 'max', pivotZ: 'max' }],
  ]) {
    const best = confident(slot)[0]
    if (best) {
      openables.push({ group, extract: { kind: 'node', match: [bindingToken(best)] }, articulation: artPrior(group, fallback), note: `draft: conf ${best.confidence}` })
      used.push(best)
    }
  }

  // Wheels: one mount per wheel node, or per axle node (split by X). A group spanning BOTH axles is
  // a fused wheel set — no mount (baked wheels stay).
  const mounts = []
  for (const g of confident('wheel')) {
    const f = g.sig.features
    if (f.sizeZ > 0.45) {
      notes.push(`Wheel group "${g.key}" spans both axles — not mountable; baked wheels stay.`)
      continue
    }
    mounts.push(f.lateral < 0.2 && f.spanX > 0.6 ? { node: bindingToken(g), splitX: true } : { node: bindingToken(g) })
    used.push(g)
  }

  // Own cabin only with CABIN evidence (seats/dashboard/cabin) — a floor pan alone isn't a cabin.
  const hasInterior = all.some((g) => ['interior.cabin', 'interior.seat', 'interior.dashboard'].includes(g.slot) && g.confidence >= 0.5)
  const profile = {
    schema: 'vehicle-profile/v1',
    id,
    family,
    label: label ?? id,
    asset: { path: '/models/<file>.glb', ...(rootNode ? { rootNode } : {}), credit: 'TODO' },
    frame: { rotationY, scale },
    parts: { groupBy },
    ...(openables.length ? { openables } : {}),
    ...(mounts.length ? { wheels: { mounts } } : {}),
    interior: { source: hasInterior ? 'own' : 'donor' },
    provenance: {
      status: 'draft',
      confidence: used.length ? +(used.reduce((s, g) => s + g.confidence, 0) / used.length).toFixed(3) : 0,
    },
  }
  if (!hasInterior) notes.push('No cabin found — the family donor interior will be fitted (check it sits inside the glass).')

  return { profile, frame, groupBy, notes, candidates: all.filter((g) => g.slot && g.confidence >= 0.25) }
}
