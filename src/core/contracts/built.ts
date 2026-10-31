/**
 * BuiltVehicle — output of the build pipeline (core/pipeline/build.ts): a profile applied to a
 * loaded asset. Everything the render systems need, with no file-specific names left.
 * Brain: brain/contracts/built-vehicle.md.
 */
import type * as THREE from 'three'
import type { OpenGroupId } from '../ontology'

export interface Rig {
  group: OpenGroupId
  axis: 'x' | 'y'
  angle: number
  /** One hinge per extracted panel (userData.isHinge = true, userData.slot = ontology slot). */
  hinges: THREE.Group[]
  /** Open-direction sign per hinge. */
  signs: number[]
  /** Build-frame bbox centre / size of each panel before hinging (e.g. the engine-lid opening). */
  centers: THREE.Vector3[]
  sizes: THREE.Vector3[]
  /** Ontology slot of each hinge. */
  slots: string[]
}

export interface WheelHub {
  /** Build-frame hub centre. */
  position: THREE.Vector3
  /** Build-frame diameter estimate (AABB-derived — over-estimates when brakes are bundled). */
  diameter: number
}

export interface BuiltVehicle {
  object: THREE.Object3D
  rigs: Rig[]
  wheelHubs: WheelHub[]
  /** Build frame → vehicle frame: position the object at `centering` (X/Z centred, grounded). */
  centering: [number, number, number]
  /** Build-frame bbox size of the whole vehicle. */
  size: THREE.Vector3
}
