import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { VehicleFamily } from '../../core/contracts/family'

/**
 * Donor interior provision — fits the family's reference cabin into an exterior-only asset
 * (profile `interior.source = 'donor'`). Brain: brain/algorithms/donor-interior.md.
 *
 * Placement is DERIVED, not hand-anchored: the donor cabin's centre is measured as a fraction of
 * the donor's own body bbox and mapped onto the host's bbox, scaled by the width ratio (× the
 * profile's `donorScale` when a host cabin is narrower). The donor's painted interior metal shares
 * the donor's body-paint material: it is cloned privately and retinted to the host's paint so the
 * cabin never shows the donor's colour (brain/learnings/L-0011-interior-paint-bleed.md).
 */
export function DonorInterior({
  donor,
  hostBoxMin,
  hostBoxSize,
  paintHex,
  flipZ = false,
  scaleMul = 1,
}: {
  donor: NonNullable<VehicleFamily['donorInterior']>
  /** Host body bbox in the host group's local (build) units, X/Z centred, grounded. */
  hostBoxMin: [number, number, number]
  hostBoxSize: [number, number, number]
  paintHex: string
  flipZ?: boolean
  scaleMul?: number
}) {
  const { scene } = useGLTF(donor.assetPath)

  const { object, centering, frac, srcSize, bodyTintMats } = useMemo(() => {
    const clone = scene.clone(true)
    clone.position.set(0, 0, 0)
    clone.quaternion.identity()
    clone.scale.set(1, 1, 1)
    clone.updateMatrixWorld(true)

    // Denominator for the fractional placement: the whole donor body, before extraction.
    const bodyBox = new THREE.Box3().setFromObject(clone)
    const bodyMin = bodyBox.min.clone()
    const bodySize = bodyBox.getSize(new THREE.Vector3())

    const interiorMeshes: THREE.Object3D[] = []
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o.name.includes(donor.match)) interiorMeshes.push(o)
    })
    const container = new THREE.Group()
    clone.add(container)
    container.updateMatrixWorld(true)
    interiorMeshes.forEach((m) => container.attach(m))
    container.updateMatrixWorld(true)

    const tintMats: THREE.MeshStandardMaterial[] = []
    container.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh || Array.isArray(mesh.material) || !mesh.material) return
      if (mesh.material.name !== donor.paintMaterial) return
      const cloned = (mesh.material as THREE.MeshStandardMaterial).clone()
      cloned.map = null
      mesh.material = cloned
      tintMats.push(cloned)
    })

    const center = new THREE.Box3().setFromObject(container).getCenter(new THREE.Vector3())
    return {
      object: container,
      centering: [-center.x, -center.y, -center.z] as [number, number, number],
      frac: [
        bodySize.x > 0 ? (center.x - bodyMin.x) / bodySize.x : 0.5,
        bodySize.y > 0 ? (center.y - bodyMin.y) / bodySize.y : 0.5,
        bodySize.z > 0 ? (center.z - bodyMin.z) / bodySize.z : 0.5,
      ] as [number, number, number],
      srcSize: [bodySize.x, bodySize.y, bodySize.z] as [number, number, number],
      bodyTintMats: tintMats,
    }
  }, [scene, donor.match, donor.paintMaterial])

  // Interior sheet metal follows the host's paint, semi-matte.
  useEffect(() => {
    bodyTintMats.forEach((mat) => {
      mat.color.set(paintHex)
      mat.roughness = 0.6
      mat.metalness = 0.1
      mat.needsUpdate = true
    })
  }, [bodyTintMats, paintHex])

  const k = (srcSize[0] > 0 ? hostBoxSize[0] / srcSize[0] : 1) * scaleMul
  const zFrac = flipZ ? 1 - frac[2] : frac[2]
  const position: [number, number, number] = [
    hostBoxMin[0] + frac[0] * hostBoxSize[0],
    hostBoxMin[1] + frac[1] * hostBoxSize[1],
    hostBoxMin[2] + zFrac * hostBoxSize[2],
  ]
  return (
    <group position={position} scale={[k, k, flipZ ? -k : k]}>
      <primitive object={object} position={centering} />
    </group>
  )
}
