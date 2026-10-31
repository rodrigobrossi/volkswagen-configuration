/**
 * The build pipeline: ModelProfile × loaded asset → BuiltVehicle.
 *   normalize → articulate (extract + hinge + companions) → measure wheels → frame
 * Deterministic and side-effect free outside the returned object graph, so the same function
 * serves the app and verification tooling. Brain: brain/algorithms/pipeline.md.
 */
import * as THREE from 'three'
import type { BuiltVehicle, Rig } from '../contracts/built'
import type { ModelProfile } from '../contracts/profile'
import { rigOpenable } from './articulate'
import { normalizeAsset } from './normalize'
import { measureWheelMount } from './wheels'

export function buildVehicle(scene: THREE.Object3D, profile: ModelProfile): BuiltVehicle {
  const object = normalizeAsset(scene, profile.asset.rootNode)

  const rigs = (profile.openables ?? [])
    .map((binding) => rigOpenable(object, binding))
    .filter((rig): rig is Rig => rig !== null)

  // Measured while the baked wheels are still in place (articulation never touches wheels).
  const wheelHubs = (profile.wheels?.mounts ?? []).flatMap((mount) => measureWheelMount(object, mount))

  // Vehicle frame: X/Z centred, grounded at Y = 0 (applied as a position inside the scaled group).
  const box = new THREE.Box3().setFromObject(object)
  const center = box.getCenter(new THREE.Vector3())
  return {
    object,
    rigs,
    wheelHubs,
    centering: [-center.x, -box.min.y, -center.z],
    size: box.getSize(new THREE.Vector3()),
  }
}
