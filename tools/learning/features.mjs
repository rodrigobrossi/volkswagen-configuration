// Part-signature features — what makes a door a door, independent of file naming.
// Every mesh group is described in the VEHICLE frame as fractions of the vehicle bbox, so the
// same part has the same signature across assets authored at any scale.
// Brain: brain/algorithms/signature-features.md, brain/contracts/part-signature.md
import fs from 'node:fs'
import path from 'node:path'
import { boxCenter, boxSize, emptyBox, union } from '../glb/read-glb.mjs'

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')

export function loadJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'))
}

const vocabulary = loadJson('src/core/ontology/vocabulary.json').tokens

// Same rule as src/core/parts/discovery.ts nodeBaseName (keep in sync — brain:check compares).
const DROP_TOKEN = /^(mat\d*|jantes|pneus|joint|noir|chrome|material\d*|glass|verre|vitre|verres)$/i
export function nodeBaseName(name) {
  const tokens = name.split('_')
  while (tokens.length > 1) {
    const last = tokens[tokens.length - 1]
    if (last === '' || /^\d+$/.test(last) || DROP_TOKEN.test(last) || /^[0-9a-f]{6}$/i.test(last)) tokens.pop()
    else break
  }
  return tokens.filter(Boolean).join('_') || name
}

// Store watermark plates (material named like "2020-2025") — the app removes them at normalize.
const WATERMARK = /^\d{4}-\d{4}$/

/** Restrict to a root node's subtree (files bundling several objects) and drop watermarks —
 * the same view of the asset the app's normalize stage produces. */
export function scopeMeshes(glb, rootNode) {
  const inScope = rootNode ? glb.meshes.filter((m) => m.nodeName === rootNode || m.path.includes(rootNode)) : glb.meshes
  return inScope.filter((m) => !WATERMARK.test(m.material))
}

/**
 * Vehicle frame: overall bbox; the LONGEST horizontal axis is the length axis. When it's X the
 * asset needs a 90° heading (rotationY) — features are then computed with X/Z swapped.
 */
export function vehicleFrame(meshes) {
  const box = emptyBox()
  meshes.forEach((m) => union(box, m.box))
  const size = boxSize(box)
  const lengthAxis = size[0] > size[2] ? 'x' : 'z'
  return { box, size, lengthAxis, nativeLength: Math.max(size[0], size[2]), totalVerts: meshes.reduce((s, m) => s + m.vertexCount, 0) }
}

// Names that carry no part semantics: exporter placeholders and scene roots.
const GENERIC_NAME = /^(object|mesh|node|group|primitive|polysurface\d*|scene|root|rootnode|sketchfab_model|gltf_scenerootnode)(_?\d+)?$/i
const FILE_ROOT = /(fbx|obj|blend|max|dae|glb|gltf)$/i

/** A name is meaningful when it isn't an exporter placeholder or a file/scene root. */
export function isMeaningful(name) {
  return !!name && !GENERIC_NAME.test(name) && !FILE_ROOT.test(name)
}

/**
 * The node a mesh semantically belongs to: itself or its nearest ancestor with a meaningful name.
 * A primitive child named after its parent ("porte_1_Mat_0" under "porte_1") collapses into the
 * parent. This is what makes "Object_4 under DoorL_3" a DOOR, not an "Object".
 * Brain: brain/algorithms/signature-features.md#anchors
 */
export function anchorOf(glb, mesh) {
  const chain = [...mesh.pathIdx, mesh.node] // root … self
  for (let i = chain.length - 1; i >= 0; i--) {
    const n = glb.nodes[chain[i]]
    if (!isMeaningful(n.name)) continue
    const parent = i > 0 ? glb.nodes[chain[i - 1]] : null
    if (parent && isMeaningful(parent.name) && n.name.startsWith(parent.name) && n.name !== parent.name) return parent
    return n
  }
  return glb.nodes[mesh.node]
}

const normName = (n) => n.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\d+$/, '')
const volume = (b) => Math.max(0, b.max[0] - b.min[0]) * Math.max(0, b.max[1] - b.min[1]) * Math.max(0, b.max[2] - b.min[2])

/**
 * Candidate groups at the node-INSTANCE level. Each mesh starts at its anchor and CLIMBS to the
 * assembly that wraps the same part, but only when the parent is
 *   (a) the same part by name ("Door_L_0" → "DoorL_3", "capot" → "CAPOT", "Hood_lid_15" → "Hood_17";
 *       normalized names equal or prefix-related, within 1.6× the volume), or
 *   (b) a PURE wrapper (exactly the same meshes: "Wheel_BL_8" → "B_wheelL_9" → "B_wheelL_10"),
 * never into a node that brings a different part along (a wheel's knuckle, the other axle).
 * The group keeps every name met on the way as evidence (`aliases`) and binds with the TOP of the
 * climb (`token`): the whole assembly — a lid with the trims riding it — hinges together.
 * Brain: brain/algorithms/signature-features.md#anchors
 */
export function instanceGroups(glb, meshes) {
  const total = meshes.reduce((n, m) => n + m.vertexCount, 0)
  const subtree = new Map() // node index → { box, verts, meshes:Set }
  for (const m of meshes)
    for (const idx of [...m.pathIdx, m.node]) {
      if (!subtree.has(idx)) subtree.set(idx, { box: emptyBox(), verts: 0, meshes: new Set() })
      const st = subtree.get(idx)
      union(st.box, m.box)
      st.verts += m.vertexCount
      st.meshes.add(m)
    }
  const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x))
  const climb = (node) => {
    const chain = [node]
    let cur = node
    for (;;) {
      const parent = cur.parent != null ? glb.nodes[cur.parent] : null
      if (!parent || !isMeaningful(parent.name)) break
      const pc = subtree.get(parent.index)
      const cc = subtree.get(cur.index)
      if (!pc || !cc || pc.verts / total > 0.35) break
      const pure = sameSet(pc.meshes, cc.meshes)
      // Same part by name: equal, or one normalized name prefixes the other ("hood" ⊂ "hoodlid").
      const [pn, cn] = [normName(parent.name), normName(cur.name)]
      const related = pn.length >= 3 && cn.length >= 3 && (pn === cn || cn.startsWith(pn) || pn.startsWith(cn))
      const sameName = related && volume(pc.box) <= 1.6 * Math.max(volume(cc.box), 1e-12)
      if (!pure && !sameName) break
      cur = parent
      chain.push(cur)
    }
    return { top: cur, chain }
  }
  const byNode = new Map()
  for (const m of meshes) {
    const { top, chain } = climb(anchorOf(glb, m))
    if (!byNode.has(top.index)) byNode.set(top.index, { key: top.name, aliases: new Set(), chains: [], members: [] })
    const g = byNode.get(top.index)
    chain.forEach((n) => g.aliases.add(n.name))
    g.chains.push(chain)
    g.members.push(m)
  }
  return [...byNode.values()].map((g) => ({ key: g.key, token: g.key, aliases: [...g.aliases], members: g.members }))
}

/** Leading alphabetic tokens of a name ("vSM_Hood_0000_001…" → "vSM_Hood", "Wheel_FL_20" → "Wheel_FL"). */
export function sectionPrefix(name) {
  const out = []
  for (const t of name.split('_')) {
    if (!t || /\d/.test(t)) break
    out.push(t)
  }
  return out.join('_')
}

/** Candidate groups at the SECTION level: sibling instances sharing a meaningful name prefix
 * (a part authored as several meshes — paint + trim). Only kept when every member mesh name
 * contains the prefix, so the runtime token-group match (resolveNodeGroup) selects exactly them. */
export function sectionGroups(instances) {
  const bySection = new Map()
  for (const g of instances) {
    const p = sectionPrefix(g.key)
    if (!p || !isMeaningful(p) || p === g.key) continue
    if (!bySection.has(p)) bySection.set(p, [])
    bySection.get(p).push(g)
  }
  return [...bySection.entries()]
    .filter(([, gs]) => gs.length >= 2)
    .map(([p, gs]) => ({ key: p, token: p, members: gs.flatMap((g) => g.members) }))
    .filter((g) => g.members.every((m) => m.nodeName.includes(g.token)))
}

/** Meshes a binding token selects — exact node (and its subtree) first, else mesh-name substring.
 * Mirrors src/core/geometry/scene.ts resolveNodeGroup. */
export function meshesFor(meshes, token) {
  const exact = meshes.filter((m) => m.nodeName === token || m.path.includes(token))
  return exact.length ? exact : meshes.filter((m) => m.nodeName.includes(token))
}

/** Group meshes by node base name or by material name. */
export function groupMeshes(meshes, groupBy) {
  const groups = new Map()
  for (const m of meshes) {
    const key = groupBy === 'material' ? m.material : nodeBaseName(m.nodeName)
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(m)
  }
  return groups
}

/** Numeric signature of a mesh group inside a vehicle frame. */
export function signature(members, frame) {
  const box = emptyBox()
  members.forEach((m) => union(box, m.box))
  const c = boxCenter(box)
  const s = boxSize(box)
  const V = frame.box
  const VS = frame.size
  // Lateral axis = the non-length horizontal axis.
  const [lat, lon] = frame.lengthAxis === 'z' ? [0, 2] : [2, 0]
  const fx = VS[lat] > 0 ? (c[lat] - V.min[lat]) / VS[lat] : 0.5
  const fy = VS[1] > 0 ? (c[1] - V.min[1]) / VS[1] : 0.5
  const fz = VS[lon] > 0 ? (c[lon] - V.min[lon]) / VS[lon] : 0.5
  const verts = members.reduce((n, m) => n + m.vertexCount, 0)
  const features = {
    lateral: Math.abs(fx - 0.5) * 2, // 0 = centreline, 1 = flank
    side: fx < 0.5 ? 'left' : 'right',
    spanX: VS[lat] > 0 ? s[lat] / VS[lat] : 0,
    height: fy,
    longitudinal: fz, // 0 = min end, 1 = max end (which end is FRONT is decided by the frame)
    sizeY: VS[1] > 0 ? s[1] / VS[1] : 0,
    sizeZ: VS[lon] > 0 ? s[lon] / VS[lon] : 0,
    vertShare: frame.totalVerts ? verts / frame.totalVerts : 0,
    opaque: members.every((m) => m.opaque),
  }
  return { features, vector: toVector(features), box, verts }
}

/** The vector kNN runs on (brain/algorithms/classify-knn.md): weights favour position over size. */
export function toVector(f) {
  return [f.lateral * 1.2, f.spanX * 1.0, f.height * 1.0, f.longitudinal * 1.4, f.sizeY * 0.8, f.sizeZ * 0.8]
}

export function distance(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2
  return Math.sqrt(s)
}

/** Name evidence: vocabulary slots hinted by the name(s) — whole name, base name, tokens and
 * adjacent-token pairs. Accepts one name or several (a group's aliases). */
export function nameEvidence(keyOrKeys) {
  const candidates = new Set()
  for (const key of [].concat(keyOrKeys)) {
    const low = key.toLowerCase()
    const tokens = low.split(/[_\s-]+/).filter(Boolean)
    ;[low, nodeBaseName(low), ...tokens].forEach((t) => candidates.add(t))
    for (let i = 0; i + 1 < tokens.length; i++) candidates.add(`${tokens[i]}_${tokens[i + 1]}`)
  }
  const hits = []
  for (const t of candidates) {
    const v = vocabulary[t]
    if (!v?.slot) continue
    // A generic slot ("closure.lid") says WHAT but not WHICH end — let geometry decide between the
    // specific slots it covers.
    const specific = AMBIGUOUS[v.slot]
    if (specific) specific.forEach((slot) => hits.push({ token: t, slot, share: 1 / specific.length }))
    else hits.push({ token: t, slot: v.slot, share: 1 })
  }
  return hits
}

const AMBIGUOUS = { 'closure.lid': ['closure.lid.front', 'closure.lid.rear'] }

/** Collapse a concrete slot to its generic class for learning (sides/axles are positional). */
export function genericSlot(slot) {
  return slot.replace(/\.(left|right)$/, '').replace(/^wheel\..*$/, 'wheel')
}
