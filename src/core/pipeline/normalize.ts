/**
 * Stage 1 — normalize: isolate the vehicle root, clone it, zero its own transform, drop store
 * watermarks. Output is the BUILD frame (native units, uncentered).
 * Brain: brain/algorithms/normalize.md, brain/learnings/L-0003-zero-root-transform.md.
 */
import * as THREE from 'three'
import { findByName, removeWatermarkNodes } from '../geometry/scene'

export function normalizeAsset(scene: THREE.Object3D, rootNode?: string): THREE.Object3D {
  const target = rootNode ? findByName(scene, rootNode) : scene
  const obj = (target ?? scene).clone(true)
  // A root isolated out of a multi-object file keeps its ORIGINAL translation inside that file;
  // left in place it contaminates every descendant's matrixWorld and throws hinges off by that
  // offset (brain/learnings/L-0003-zero-root-transform.md). Zero it at the source.
  obj.position.set(0, 0, 0)
  obj.quaternion.identity()
  obj.scale.set(1, 1, 1)
  obj.updateMatrixWorld(true)
  removeWatermarkNodes(obj)
  return obj
}
