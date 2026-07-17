import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { CarModelDef } from '../data/carModels'

// Finds a named node anywhere in the scene graph — used to pick just one car object out of
// fusca-1968.glb, which bundles two (see .specs/3d-model.spec.md Real GLTF Models section).
function findByName(root: THREE.Object3D, name: string): THREE.Object3D | undefined {
  let found: THREE.Object3D | undefined
  root.traverse((obj) => {
    if (!found && obj.name === name) found = obj
  })
  return found
}

export function RealCarModel({ model }: { model: CarModelDef }) {
  const { scene } = useGLTF(model.path)

  const object = useMemo(() => {
    const target = model.nodeName ? findByName(scene, model.nodeName) : scene
    return (target ?? scene).clone(true)
  }, [scene, model.nodeName])

  // Centering (X/Z) and ground contact (Y) are derived from the object's own bounding box in
  // its native (pre-scale) units, then applied as a position on the primitive itself — since
  // that position is inside the scaled outer group, it's automatically scaled along with
  // everything else, so this works regardless of the model's native unit scale (some of these
  // 4 models are authored in meters, some in units ~100x larger — verified per-model by
  // logging bounds, not assumed). Only rotationY and scale are manually calibrated per model.
  const centering = useMemo(() => {
    const box = new THREE.Box3().setFromObject(object)
    const center = new THREE.Vector3()
    box.getCenter(center)
    return [-center.x, -box.min.y, -center.z] as [number, number, number]
  }, [object])

  const { rotationY, scale } = model.calibration

  return (
    <group rotation={[0, rotationY, 0]} scale={scale}>
      <primitive object={object} position={centering} />
    </group>
  )
}

// Preload all four so switching between presets doesn't show a blank frame while fetching.
useGLTF.preload('/models/fusca-1948.glb')
useGLTF.preload('/models/fusca-1968.glb')
useGLTF.preload('/models/fusca-callook.glb')
useGLTF.preload('/models/fusca-ratlook.glb')
