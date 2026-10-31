// GLB reader for the learning tools — no three.js, no dependencies. Parses the JSON chunk and
// derives, per mesh node, its WORLD-space AABB from the POSITION accessor min/max (8 corners
// through the node's world matrix). Names are sanitized EXACTLY like three's GLTFLoader
// (PropertyBinding.sanitizeNodeName) so tokens here match what the app sees at runtime.
// Brain: brain/algorithms/signature-features.md, brain/learnings/L-0001-gltf-name-sanitization.md
import fs from 'node:fs'

export function sanitizeNodeName(name) {
  return String(name ?? '').replace(/\s/g, '_').replace(/[[\].:/]/g, '')
}

const mul = (a, b) => {
  const o = new Array(16)
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      let s = 0
      for (let k = 0; k < 4; k++) s += a[k * 4 + c] * b[r * 4 + k]
      o[r * 4 + c] = s
    }
  return o
}
const trs = (n) => {
  if (n.matrix) return n.matrix.slice()
  const t = n.translation || [0, 0, 0]
  const q = n.rotation || [0, 0, 0, 1]
  const s = n.scale || [1, 1, 1]
  const [x, y, z, w] = q
  const x2 = x + x, y2 = y + y, z2 = z + z
  const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2
  return [
    (1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0,
    (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
    (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0,
    t[0], t[1], t[2], 1,
  ]
}
const apply = (m, p) => [
  m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
  m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
  m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
]
const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

export const emptyBox = () => ({ min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] })
export const expand = (box, p) => {
  for (let k = 0; k < 3; k++) {
    box.min[k] = Math.min(box.min[k], p[k])
    box.max[k] = Math.max(box.max[k], p[k])
  }
}
export const union = (a, b) => {
  expand(a, b.min)
  expand(a, b.max)
  return a
}
export const boxSize = (b) => [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]]
export const boxCenter = (b) => [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2]

/**
 * Parse a .glb into:
 *  nodes:   [{ index, name (sanitized), parent, path: [ancestor names], world, meshIndex }]
 *  meshes:  one entry per (mesh node × primitive): { node, nodeName, path, material, materialIndex,
 *           vertexCount, box (world AABB), opaque }
 *  materials: [{ name, opaque, hasMap, baseColor }]
 */
export function readGlb(file) {
  const buf = fs.readFileSync(file)
  let off = 12
  let json = null
  while (off < buf.length) {
    const len = buf.readUInt32LE(off)
    const type = buf.readUInt32LE(off + 4)
    if (type === 0x4e4f534a) json = JSON.parse(buf.subarray(off + 8, off + 8 + len).toString('utf8'))
    off += 8 + len
  }
  if (!json) throw new Error(`${file}: no JSON chunk (is this a .gltf? convert to .glb)`)
  const g = json

  const materials = (g.materials ?? []).map((m) => {
    const pbr = m.pbrMetallicRoughness ?? {}
    const baseColor = pbr.baseColorFactor ?? [1, 1, 1, 1]
    const opaque = (m.alphaMode ?? 'OPAQUE') !== 'BLEND' && baseColor[3] >= 0.9
    return { name: m.name ?? '', opaque, hasMap: pbr.baseColorTexture != null, baseColor }
  })

  const nodes = []
  const walk = (idx, parent, parentWorld, path, pathIdx) => {
    const n = g.nodes[idx]
    const world = mul(parentWorld, trs(n))
    const name = sanitizeNodeName(n.name)
    nodes[idx] = { index: idx, name, parent, path, pathIdx, world, meshIndex: n.mesh ?? null }
    ;(n.children ?? []).forEach((c) => walk(c, idx, world, [...path, name], [...pathIdx, idx]))
  }
  ;(g.scenes[g.scene ?? 0].nodes ?? []).forEach((r) => walk(r, null, I, [], []))

  const meshes = []
  nodes.forEach((node) => {
    if (!node || node.meshIndex == null) return
    g.meshes[node.meshIndex].primitives.forEach((pr) => {
      const a = g.accessors[pr.attributes.POSITION]
      if (!a?.min) return
      const box = emptyBox()
      const [ax, ay, az] = a.min
      const [bx, by, bz] = a.max
      for (const c of [[ax, ay, az], [bx, by, bz], [ax, by, bz], [bx, ay, az], [ax, ay, bz], [bx, by, az], [ax, by, az], [bx, ay, bz]])
        expand(box, apply(node.world, c))
      const mat = materials[pr.material] ?? { name: '', opaque: true }
      meshes.push({
        node: node.index,
        nodeName: node.name,
        path: node.path,
        /** Ancestor node indices, root first. */
        pathIdx: node.pathIdx,
        material: mat.name,
        materialIndex: pr.material ?? -1,
        vertexCount: a.count,
        box,
        opaque: mat.opaque,
      })
    })
  })
  return { json: g, nodes, meshes, materials }
}
