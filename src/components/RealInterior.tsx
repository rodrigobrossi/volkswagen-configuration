import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Shared interior for every real model that doesn't bake in its own cabin (see hasInterior in
// carModels.ts). It extracts model-1968's REAL dashboard/seats + steering-wheel geometry (not a
// procedural stand-in) and — rather than being hand-anchored per model — reproduces the exact
// spatial relationship the interior has to 1968's OWN body, then maps that same relationship onto
// each host model's bounding box. So it lands at the same fraction-of-length/width/height and the
// same relative size it occupies in the reference car, automatically adapting to each model's own
// dimensions with no per-model tuning. This is the "replicate 1968, adjusted to each model's
// dimensions" requirement made literal.
const SOURCE_PATH = '/models/fusca-1968.glb'
// The file bundles two cars (see .specs/3d-model.spec.md Real GLTF Models section) — this is the
// same isolated "new" car subtree model-1968 itself renders, found by loading through useGLTF
// and searching the sanitized runtime name, not the raw glTF JSON.
const SOURCE_CAR_NODE = '1968_Volkswagen_Beetle_(new)_38'
// Dashboard+seats and steering-wheel meshes, found by dumping the isolated subtree's node/
// material list directly (both use a material literally named "Interior") — not guessed.
const DASHBOARD_NODE = 'Object_65'
const STEERING_WHEEL_NODE = 'Object_39'

function findByName(root: THREE.Object3D, name: string): THREE.Object3D | undefined {
  let found: THREE.Object3D | undefined
  root.traverse((obj) => {
    if (!found && obj.name === name) found = obj
  })
  return found
}

export function RealInterior({
  hostBoxMin,
  hostBoxSize,
  flipZ = false,
}: {
  /** The host body's bounding box, expressed in the host model's own group-local space (the same
   * space `object` renders in inside RealCarModel — i.e. native units, X/Z centered on 0, Y
   * grounded at 0). RealCarModel derives both from the host's own runtime bounding box. */
  hostBoxMin: [number, number, number]
  hostBoxSize: [number, number, number]
  /** True when the host model's geometry faces -Z where 1968 faces +Z, so the interior's depth
   * placement (and facing) must be mirrored. Determined per model by screenshot. */
  flipZ?: boolean
}) {
  const { scene } = useGLTF(SOURCE_PATH)

  const { object, centering, frac, srcSize } = useMemo(() => {
    const carRoot = findByName(scene, SOURCE_CAR_NODE)
    // Clone just the isolated car subtree (not the whole two-car scene) and zero its own local
    // transform before reading it — same fix as RealCarModel.tsx's own use of this subtree: left
    // in place, it's a translation offset from sitting next to the "old" car in the source file,
    // which throws off both the body bounding box and attach()'s composition below.
    const clone = carRoot?.clone(true) ?? new THREE.Group()
    clone.position.set(0, 0, 0)
    clone.quaternion.identity()
    clone.scale.set(1, 1, 1)
    clone.updateMatrixWorld(true)

    // The reference car's whole body box, measured BEFORE extracting the interior — this is the
    // denominator for the fractional placement.
    const bodyBox = new THREE.Box3().setFromObject(clone)
    const bodyMin = bodyBox.min.clone()
    const bodySize = new THREE.Vector3()
    bodyBox.getSize(bodySize)

    const dash = findByName(clone, DASHBOARD_NODE)
    const wheel = findByName(clone, STEERING_WHEEL_NODE)
    const container = new THREE.Group()
    clone.add(container)
    // attach() (not a bare re-parent) preserves each node's real position/orientation relative
    // to the car body it was modeled in, composing through `clone`'s now-valid matrixWorld chain
    // — see riggPart() in RealCarModel.tsx for the fuller explanation of why this matters.
    if (dash) container.attach(dash)
    if (wheel) container.attach(wheel)
    container.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(container)
    const center = new THREE.Vector3()
    box.getCenter(center)

    // Where the interior's center sits as a fraction (0..1) of the reference body box, per axis.
    const fracVec: [number, number, number] = [
      bodySize.x > 0 ? (center.x - bodyMin.x) / bodySize.x : 0.5,
      bodySize.y > 0 ? (center.y - bodyMin.y) / bodySize.y : 0.5,
      bodySize.z > 0 ? (center.z - bodyMin.z) / bodySize.z : 0.5,
    ]

    return {
      object: container,
      // Center the container on its own center so the group's position places that center.
      centering: [-center.x, -center.y, -center.z] as [number, number, number],
      frac: fracVec,
      srcSize: [bodySize.x, bodySize.y, bodySize.z] as [number, number, number],
    }
  }, [scene])

  // Uniform scale so the interior keeps the same proportion of the host body it had of the
  // reference body — using the width (X) ratio, the least distortion-prone axis to key off since
  // all these cars share a near-identical track width.
  const k = srcSize[0] > 0 ? hostBoxSize[0] / srcSize[0] : 1

  // Map each fractional position into the host's own box. Z is mirrored for models whose geometry
  // faces the opposite way from 1968.
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

useGLTF.preload(SOURCE_PATH)
