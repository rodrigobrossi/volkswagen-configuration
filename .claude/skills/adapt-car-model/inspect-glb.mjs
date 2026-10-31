// Offline GLB inspector — no browser, no deps. Lists node names, material names, mesh/accessor
// counts and the WORLD-space bounding box (for calibration scale). Used by the adapt-car-model skill.
//   node inspect-glb.mjs <caminho/para/modelo.glb>
import fs from 'node:fs'

const file = process.argv[2]
if (!file) {
  console.error('uso: node inspect-glb.mjs <arquivo.glb>')
  process.exit(1)
}
const buf = fs.readFileSync(file)
let off = 12
let json = null
while (off < buf.length) {
  const len = buf.readUInt32LE(off)
  const type = buf.readUInt32LE(off + 4)
  const data = buf.subarray(off + 8, off + 8 + len)
  if (type === 0x4e4f534a) json = JSON.parse(data.toString('utf8'))
  off += 8 + len
}
const g = json
if (!g) {
  console.error('sem chunk JSON — arquivo .gltf (não .glb)? use um parser de glTF texto')
  process.exit(1)
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
const world = {}
const walk = (idx, parent) => {
  const n = g.nodes[idx]
  const m = mul(parent, trs(n))
  world[idx] = m
  ;(n.children || []).forEach((c) => walk(c, m))
}
const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
;(g.scenes[g.scene || 0].nodes || []).forEach((r) => walk(r, I))

const apply = (m, p) => [
  m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
  m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
  m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
]
const mn = [1e9, 1e9, 1e9]
const mx = [-1e9, -1e9, -1e9]
g.nodes.forEach((n, i) => {
  if (n.mesh == null || !world[i]) return
  g.meshes[n.mesh].primitives.forEach((pr) => {
    const a = g.accessors[pr.attributes.POSITION]
    if (!a || !a.min) return
    const [ax, ay, az] = a.min
    const [bx, by, bz] = a.max
    for (const c of [[ax, ay, az], [bx, by, bz], [ax, by, bz], [bx, ay, az], [ax, ay, bz], [bx, by, az], [ax, by, az], [bx, ay, bz]]) {
      const w = apply(world[i], c)
      for (let k = 0; k < 3; k++) {
        mn[k] = Math.min(mn[k], w[k])
        mx[k] = Math.max(mx[k], w[k])
      }
    }
  })
})
const size = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]]
const longest = Math.max(...size)

console.log('meshes:', (g.meshes || []).length, 'nodes:', (g.nodes || []).length, 'materials:', (g.materials || []).length)
console.log('\n== NODES ==\n' + (g.nodes || []).map((n) => n.name).filter(Boolean).join('\n'))
console.log('\n== MATERIALS ==\n' + (g.materials || []).map((m) => m.name).filter(Boolean).join('\n'))
console.log('\n== BBOX (native) ==')
console.log('min', mn.map((v) => +v.toFixed(4)))
console.log('max', mx.map((v) => +v.toFixed(4)))
console.log('size', size.map((v) => +v.toFixed(4)))
console.log('longest axis:', ['x', 'y', 'z'][size.indexOf(longest)], '=', longest.toFixed(4))
console.log('SUGGESTED calibration.scale (target 4.07 m length):', (4.07 / longest).toFixed(4))
console.log('front-back axis is the LONGEST; width/height are the other two — check the ratio (~2.4:1 length:width for a Beetle)')
