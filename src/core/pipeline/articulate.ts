/**
 * Stage 3 — articulate: wrap each extracted panel in a hinge Group at its bbox edge, decide the
 * outward sign, and bring its companions (handles, mirrors, fused glass) along.
 * Brain: brain/algorithms/articulate-hinge.md, brain/algorithms/capture-companions.md,
 *        brain/learnings/L-0002-attach-while-parented.md.
 */
import * as THREE from 'three'
import type { Rig } from '../contracts/built'
import type { OpenableBinding, PivotEdge } from '../contracts/profile'
import { slotForHinge } from '../ontology'
import { partitionMeshByWorldBox } from '../geometry/mesh-ops'
import { collectMeshes } from '../geometry/scene'
import { extractPanels } from './extract'

function edgeValue(box: THREE.Box3, axis: 'y' | 'z', edge: PivotEdge) {
  if (edge === 'center') return (box.min[axis] + box.max[axis]) / 2
  return box[edge][axis]
}

function attachToNearestHinge(mesh: THREE.Mesh, hinges: THREE.Group[], hingeX: number[]) {
  const bb = new THREE.Box3().setFromObject(mesh)
  if (bb.isEmpty()) return
  const cx = (bb.min.x + bb.max.x) / 2
  let best = 0
  let bestDist = Infinity
  hingeX.forEach((hx, i) => {
    const d = Math.abs(cx - hx)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  hinges[best]?.attach(mesh)
}

/** Triangle-splits a shared glass/trim mesh by a panel footprint; the slice rides the hinge. */
function splitIntoHinge(mesh: THREE.Mesh, region: THREE.Box3, hinge: THREE.Group) {
  if (!mesh.parent) return
  const { inside, outside } = partitionMeshByWorldBox(mesh, region)
  if (!inside) return
  const captured = new THREE.Mesh(inside, mesh.material)
  captured.position.copy(mesh.position)
  captured.quaternion.copy(mesh.quaternion)
  captured.scale.copy(mesh.scale)
  mesh.parent.add(captured)
  hinge.attach(captured)
  mesh.geometry = outside ?? new THREE.BufferGeometry()
}

export function rigOpenable(object: THREE.Object3D, binding: OpenableBinding): Rig | null {
  const { articulation: art, companions } = binding
  const nodes = extractPanels(object, binding.extract, binding.group)

  // Snapshot companions BEFORE hinging, while still in place.
  const attachMeshes = companions?.attachNearest?.length ? collectMeshes(object, companions.attachNearest) : []
  const splitMeshes = companions?.splitByFootprint?.length ? collectMeshes(object, companions.splitByFootprint) : []

  const hinges: THREE.Group[] = []
  const signs: number[] = []
  const centers: THREE.Vector3[] = []
  const sizes: THREE.Vector3[] = []
  const slots: string[] = []

  nodes.forEach((node, i) => {
    if (!node.parent) return
    const box = new THREE.Box3().setFromObject(node)
    const center = box.getCenter(new THREE.Vector3())
    centers.push(center.clone())
    sizes.push(box.getSize(new THREE.Vector3()))

    const pivot = new THREE.Vector3(center.x, edgeValue(box, 'y', art.pivotY), edgeValue(box, 'z', art.pivotZ))
    // Outward for a vertical hinge depends on BOTH the car side (sign x) and which side of the
    // hinge the panel's mass sits (sign dz) — brain/algorithms/articulate-hinge.md.
    const dz = center.z - pivot.z
    const autoSide = art.axis === 'y' ? (Math.sign(dz) || 1) * (Math.sign(center.x) || 1) : 1

    const hinge = new THREE.Group()
    hinge.userData.isHinge = true // the per-part transform editor skips articulated parts
    const slot = slotForHinge(binding.group, center.x)
    hinge.userData.slot = slot
    hinge.name = `hinge:${slot}`
    hinge.position.copy(pivot)
    object.add(hinge)
    // attach() must run while the node is STILL parented — brain/learnings/L-0002.
    hinge.attach(node)

    hinges.push(hinge)
    signs.push(art.signs?.[i] ?? autoSide)
    slots.push(slot)
  })

  if ((attachMeshes.length || splitMeshes.length) && hinges.length) {
    const hingeX = centers.map((c) => c.x)
    attachMeshes.forEach((mesh) => attachToNearestHinge(mesh, hinges, hingeX))
    // A shared mesh (e.g. the belt-line trim across both doors) is cut once per panel.
    splitMeshes.forEach((mesh) => {
      hinges.forEach((hinge, i) => {
        const c = centers[i]
        const s = sizes[i]
        // Panel skin is thin in X; glass/trim sits proud of it → widen X by a share of the depth.
        const xHalf = s.x / 2 + s.z * 0.35
        const region = new THREE.Box3(
          new THREE.Vector3(c.x - xHalf, c.y - s.y, c.z - s.z / 2 - s.z * 0.1),
          new THREE.Vector3(c.x + xHalf, c.y + s.y, c.z + s.z / 2 + s.z * 0.1),
        )
        splitIntoHinge(mesh, region, hinge)
      })
    })
  }

  return hinges.length
    ? { group: binding.group, axis: art.axis, angle: art.openAngle, hinges, signs, centers, sizes, slots }
    : null
}
