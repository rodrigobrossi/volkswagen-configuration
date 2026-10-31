/**
 * Stage 4 — measure wheels: hub centre + diameter of each baked wheel, derived from its own
 * geometry (never hardcoded). Brain: brain/algorithms/measure-wheels.md.
 */
import * as THREE from 'three'
import type { WheelHub } from '../contracts/built'
import type { WheelMountBinding } from '../contracts/profile'
import { directMeshChildren, findByName } from '../geometry/scene'

function toHub(box: THREE.Box3): WheelHub | null {
  if (box.isEmpty()) return null
  const size = box.getSize(new THREE.Vector3())
  return { position: box.getCenter(new THREE.Vector3()), diameter: (size.y + size.z) / 2 }
}

export function measureWheelMount(object: THREE.Object3D, mount: WheelMountBinding): WheelHub[] {
  const node = findByName(object, mount.node)
  if (!node) return []
  const meshes = directMeshChildren(node)
  if (meshes.length === 0) return []

  if (!mount.splitX) {
    const box = new THREE.Box3()
    meshes.forEach((m) => box.expandByObject(m))
    const hub = toHub(box)
    return hub ? [hub] : []
  }
  // One node = both wheels of an axle: split its vertices by world X to recover each hub.
  const left = new THREE.Box3()
  const right = new THREE.Box3()
  const v = new THREE.Vector3()
  meshes.forEach((mesh) => {
    const position = mesh.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld)
      ;(v.x >= 0 ? right : left).expandByPoint(v)
    }
  })
  return [right, left].map(toHub).filter((hub): hub is WheelHub => hub !== null)
}

/** One tyre size for all four corners: the SMALLEST measured AABB diameter is the least polluted
 * by bundled brakes/knuckles. brain/learnings/L-0007-wheel-diameter-min.md */
export function unifiedWheelDiameter(hubs: WheelHub[]): number {
  return hubs.length ? Math.min(...hubs.map((h) => h.diameter)) : 0
}
