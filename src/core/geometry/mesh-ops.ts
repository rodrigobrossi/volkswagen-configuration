/**
 * Triangle-level mesh operations used to EXTRACT parts an asset never modelled separately.
 * Never mutate a shared cached geometry: every op builds fresh BufferGeometries.
 * Brain: brain/algorithms/split-merged-x.md, brain/algorithms/region-clip.md,
 *        brain/algorithms/capture-companions.md.
 */
import * as THREE from 'three'
import type { FractionBox } from '../contracts/profile'

/** New geometry holding the given (non-indexed) vertex indices of `src`. */
function buildFromIndices(
  indices: number[],
  position: THREE.BufferAttribute,
  normal?: THREE.BufferAttribute,
  uv?: THREE.BufferAttribute,
): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  const p = new Float32Array(indices.length * 3)
  const n2 = normal ? new Float32Array(indices.length * 3) : null
  const u2 = uv ? new Float32Array(indices.length * 2) : null
  indices.forEach((srcI, i) => {
    p[i * 3] = position.getX(srcI)
    p[i * 3 + 1] = position.getY(srcI)
    p[i * 3 + 2] = position.getZ(srcI)
    if (normal && n2) {
      n2[i * 3] = normal.getX(srcI)
      n2[i * 3 + 1] = normal.getY(srcI)
      n2[i * 3 + 2] = normal.getZ(srcI)
    }
    if (uv && u2) {
      u2[i * 2] = uv.getX(srcI)
      u2[i * 2 + 1] = uv.getY(srcI)
    }
  })
  g.setAttribute('position', new THREE.BufferAttribute(p, 3))
  if (n2) g.setAttribute('normal', new THREE.BufferAttribute(n2, 3))
  if (u2) g.setAttribute('uv', new THREE.BufferAttribute(u2, 2))
  return g
}

function attributesOf(mesh: THREE.Mesh) {
  const src = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry
  return {
    position: src.getAttribute('position') as THREE.BufferAttribute | undefined,
    normal: src.getAttribute('normal') as THREE.BufferAttribute | undefined,
    uv: src.getAttribute('uv') as THREE.BufferAttribute | undefined,
  }
}

/**
 * One node that merges BOTH sides (left + right door in one mesh) → two clones, each keeping only
 * the triangles whose world-space centroid falls on its side of X = 0.
 * brain/algorithms/split-merged-x.md
 */
export function splitNodeByWorldX(sourceNode: THREE.Object3D): { left: THREE.Object3D; right: THREE.Object3D } {
  const leftClone = sourceNode.clone(true)
  const rightClone = sourceNode.clone(true)
  leftClone.name = `${sourceNode.name}_L`
  rightClone.name = `${sourceNode.name}_R`

  const origMeshes: THREE.Mesh[] = []
  sourceNode.traverse((n) => n instanceof THREE.Mesh && origMeshes.push(n))
  const leftMeshes: THREE.Mesh[] = []
  leftClone.traverse((n) => n instanceof THREE.Mesh && leftMeshes.push(n))
  const rightMeshes: THREE.Mesh[] = []
  rightClone.traverse((n) => n instanceof THREE.Mesh && rightMeshes.push(n))

  const v = new THREE.Vector3()
  origMeshes.forEach((origMesh, meshIndex) => {
    const { position, normal, uv } = attributesOf(origMesh)
    if (!position) return
    const leftTris: number[] = []
    const rightTris: number[] = []
    // The ORIGINAL (still attached) mesh has a valid matrixWorld; clones share its local vertices.
    for (let tri = 0; tri < position.count; tri += 3) {
      let sumX = 0
      for (let k = 0; k < 3; k++) {
        v.fromBufferAttribute(position, tri + k).applyMatrix4(origMesh.matrixWorld)
        sumX += v.x
      }
      ;(sumX >= 0 ? rightTris : leftTris).push(tri, tri + 1, tri + 2)
    }
    leftMeshes[meshIndex].geometry = buildFromIndices(leftTris, position, normal, uv)
    rightMeshes[meshIndex].geometry = buildFromIndices(rightTris, position, normal, uv)
  })

  return { left: leftClone, right: rightClone }
}

/**
 * Partitions triangles by whether their world-space CENTROID is inside `box` (whole triangles —
 * the cut edge is stair-stepped). Only for glass/trim where the edge is never seen up close.
 */
export function partitionMeshByWorldBox(
  mesh: THREE.Mesh,
  box: THREE.Box3,
): { inside: THREE.BufferGeometry | null; outside: THREE.BufferGeometry | null } {
  const { position, normal, uv } = attributesOf(mesh)
  if (!position) return { inside: null, outside: null }
  mesh.updateWorldMatrix(true, false)
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const cen = new THREE.Vector3()
  const inside: number[] = []
  const outside: number[] = []
  for (let tri = 0; tri < position.count; tri += 3) {
    a.fromBufferAttribute(position, tri).applyMatrix4(mesh.matrixWorld)
    b.fromBufferAttribute(position, tri + 1).applyMatrix4(mesh.matrixWorld)
    c.fromBufferAttribute(position, tri + 2).applyMatrix4(mesh.matrixWorld)
    cen.copy(a).add(b).add(c).multiplyScalar(1 / 3)
    ;(box.containsPoint(cen) ? inside : outside).push(tri, tri + 1, tri + 2)
  }
  return {
    inside: inside.length ? buildFromIndices(inside, position, normal, uv) : null,
    outside: outside.length ? buildFromIndices(outside, position, normal, uv) : null,
  }
}

type ClipVert = { p: THREE.Vector3; n: THREE.Vector3 | null; uv: THREE.Vector2 | null }

/**
 * CLIPS triangles exactly at the box's six planes (straddling triangles are split with vertices
 * interpolated on the plane) → the extracted piece and the remainder both get STRAIGHT cut edges.
 * Works in the mesh's local space so the result keeps the source transform.
 * brain/algorithms/region-clip.md, brain/learnings/L-0010-clip-not-centroid.md
 */
export function clipMeshByWorldBox(
  mesh: THREE.Mesh,
  box: THREE.Box3,
): { inside: THREE.BufferGeometry | null; outside: THREE.BufferGeometry | null } {
  const { position, normal, uv } = attributesOf(mesh)
  if (!position) return { inside: null, outside: null }
  mesh.updateWorldMatrix(true, false)
  const inv = new THREE.Matrix4().copy(mesh.matrixWorld).invert()
  // Inward-facing planes (distance >= 0 = inside), transformed into the mesh's local space.
  const planes = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), -box.min.x),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), box.max.x),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), -box.min.y),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), box.max.y),
    new THREE.Plane(new THREE.Vector3(0, 0, 1), -box.min.z),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), box.max.z),
  ].map((pl) => pl.applyMatrix4(inv))

  const lerpVert = (A: ClipVert, B: ClipVert, t: number): ClipVert => ({
    p: A.p.clone().lerp(B.p, t),
    n: A.n && B.n ? A.n.clone().lerp(B.n, t).normalize() : null,
    uv: A.uv && B.uv ? A.uv.clone().lerp(B.uv, t) : null,
  })
  const split = (poly: ClipVert[], pl: THREE.Plane) => {
    const pos: ClipVert[] = []
    const neg: ClipVert[] = []
    for (let i = 0; i < poly.length; i++) {
      const A = poly[i]
      const B = poly[(i + 1) % poly.length]
      const dA = pl.distanceToPoint(A.p)
      const dB = pl.distanceToPoint(B.p)
      if (dA >= 0) pos.push(A)
      else neg.push(A)
      if (dA < 0 !== dB < 0) {
        const I = lerpVert(A, B, dA / (dA - dB))
        pos.push(I)
        neg.push(I)
      }
    }
    return { pos, neg }
  }
  const insideTris: ClipVert[] = []
  const outsideTris: ClipVert[] = []
  const fan = (poly: ClipVert[], out: ClipVert[]) => {
    for (let i = 1; i + 1 < poly.length; i++) out.push(poly[0], poly[i], poly[i + 1])
  }
  const vAt = (i: number): ClipVert => ({
    p: new THREE.Vector3().fromBufferAttribute(position, i),
    n: normal ? new THREE.Vector3().fromBufferAttribute(normal, i) : null,
    uv: uv ? new THREE.Vector2().fromBufferAttribute(uv, i) : null,
  })
  for (let tri = 0; tri < position.count; tri += 3) {
    let insidePolys: ClipVert[][] = [[vAt(tri), vAt(tri + 1), vAt(tri + 2)]]
    for (const pl of planes) {
      const next: ClipVert[][] = []
      for (const poly of insidePolys) {
        const { pos, neg } = split(poly, pl)
        if (pos.length >= 3) next.push(pos)
        if (neg.length >= 3) fan(neg, outsideTris)
      }
      insidePolys = next
    }
    insidePolys.forEach((poly) => fan(poly, insideTris))
  }

  const build = (tris: ClipVert[]) => {
    if (!tris.length) return null
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(tris.length * 3)
    const n2 = normal ? new Float32Array(tris.length * 3) : null
    const u2 = uv ? new Float32Array(tris.length * 2) : null
    tris.forEach((v, i) => {
      p[i * 3] = v.p.x
      p[i * 3 + 1] = v.p.y
      p[i * 3 + 2] = v.p.z
      if (n2 && v.n) {
        n2[i * 3] = v.n.x
        n2[i * 3 + 1] = v.n.y
        n2[i * 3 + 2] = v.n.z
      }
      if (u2 && v.uv) {
        u2[i * 2] = v.uv.x
        u2[i * 2 + 1] = v.uv.y
      }
    })
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    if (n2) g.setAttribute('normal', new THREE.BufferAttribute(n2, 3))
    if (u2) g.setAttribute('uv', new THREE.BufferAttribute(u2, 2))
    return g
  }
  return { inside: build(insideTris), outside: build(outsideTris) }
}

/**
 * FractionBox (0..1 of `ref`) → world Box3. `mirror` maps x → 1 - x (the other side of a pair).
 * brain/learnings/L-0008-build-frame-fractions.md
 */
export function fractionsToBox(r: FractionBox, refMin: THREE.Vector3, refSize: THREE.Vector3, mirror = false): THREE.Box3 {
  const [fx0, fx1] = mirror ? [1 - r.xMax, 1 - r.xMin] : [r.xMin, r.xMax]
  return new THREE.Box3(
    new THREE.Vector3(refMin.x + fx0 * refSize.x, refMin.y + r.yMin * refSize.y, refMin.z + r.zMin * refSize.z),
    new THREE.Vector3(refMin.x + fx1 * refSize.x, refMin.y + r.yMax * refSize.y, refMin.z + r.zMax * refSize.z),
  )
}

/** Replaces `src` with `outside` and returns a sibling mesh holding `inside` (same material and
 * local transform), ready to be attached to a hinge/group. */
export function detachSlice(src: THREE.Mesh, inside: THREE.BufferGeometry, outside: THREE.BufferGeometry | null): THREE.Mesh {
  const slice = new THREE.Mesh(inside, src.material)
  slice.position.copy(src.position)
  slice.quaternion.copy(src.quaternion)
  slice.scale.copy(src.scale)
  src.parent!.add(slice)
  src.geometry = outside ?? new THREE.BufferGeometry()
  return slice
}
