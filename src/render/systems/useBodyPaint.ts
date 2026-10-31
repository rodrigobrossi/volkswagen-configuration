import { useEffect } from 'react'
import * as THREE from 'three'
import { FINISH_PROPS, type PaintOption } from '../../core/contracts/catalog'
import type { ModelProfile } from '../../core/contracts/profile'
import { findPaintMeshes } from '../../core/geometry/materials'

/** A paint material this system already cloned for private mutation. */
type PaintMaterial = THREE.MeshStandardMaterial & { __fuscaPaintClone?: boolean }

/**
 * Paint system — repaints the `body.shell` paint material(s) of a built vehicle to the selected
 * paint option (colour + finish). Brain: brain/algorithms/paint-detection.md.
 *
 * Mutates ONE private clone shared by every paint mesh, never the useGLTF-cached original (clone(true)
 * does not clone materials). Sharing a single clone is what lets later colour changes still resolve
 * the whole panel set; textured paint has its map dropped so the new colour isn't multiplied by the
 * old bake (brain/learnings/L-0005-textured-paint.md).
 */
export function useBodyPaint(object: THREE.Object3D, profile: ModelProfile, paint: PaintOption) {
  useEffect(() => {
    if (profile.paint?.recolorable === false) return
    const { roughness, metalness } = FINISH_PROPS[paint.finish]
    const meshes = findPaintMeshes(object, profile.paint?.materials)
    if (meshes.length === 0) return
    const existing = meshes.map((m) => m.material as PaintMaterial).find((m) => m.__fuscaPaintClone)
    const mat = existing ?? ((meshes[0].material as PaintMaterial).clone() as PaintMaterial)
    mat.__fuscaPaintClone = true
    mat.map = null
    mat.color.set(paint.hex)
    mat.roughness = roughness
    mat.metalness = metalness
    mat.needsUpdate = true
    meshes.forEach((mesh) => (mesh.material = mat))
  }, [object, profile, paint])
}
