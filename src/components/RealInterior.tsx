import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { exteriorColors } from '../data/fusca'
import { useConfigStore } from '../store/configStore'

// Shared interior for every real model that doesn't bake in its own cabin (see hasInterior in
// carModels.ts). It extracts the 1973 base model's REAL interior (dashboard/seats/steering wheel —
// the "SM_Interior" section, which the user picked as the reference cabin) and — rather than being
// hand-anchored per model — reproduces the exact spatial relationship the interior has to the 1973's
// OWN body, then maps that same relationship onto each host model's bounding box. So it lands at the
// same fraction-of-length/width/height and the same relative size it occupies in the reference car,
// adapting to each model's dimensions with no per-model tuning.
const SOURCE_PATH = '/models/fusca-1973.glb'
// The interior meshes in fusca-1973.glb all carry "SM_Interior" in their (loader-sanitized) node
// name — dashboard, seats and steering wheel — so match by substring rather than a single node id.
const INTERIOR_MATCH = 'SM_Interior'
// One of the interior meshes (the painted metal panels — dash face, door frames, the parts that on a
// real Beetle ARE the exterior body colour) shares the 1973's DOMINANT BODY-PAINT material
// ("vMAT_Volkswagen_Beetle_1968_Base1", baked dark red [0.286,0,0] with NO map). On the 1973 itself
// useBodyPaint recolours it along with the shell (correct — it follows the car). But an OVERLAY on a
// different host (1948/1980) carries the untouched original material and would render that panel a
// fixed dark red that clashes with the host's chosen colour — exactly the interior-colour bleed to
// avoid. So we clone that material privately (never the shared cache — that would corrupt Meu Fusca's
// 1973 body) and retint it to the host's exterior colour here. The soft-trim materials (seat vinyl,
// dash pad — all textured, default-white factor) are left alone so their baked colours read cleanly.
const BODY_PAINT_MATCH = 'vMAT_Volkswagen_Beetle_1968_Base1'

export function RealInterior({
  hostBoxMin,
  hostBoxSize,
  flipZ = false,
  scaleMul = 1,
}: {
  /** The host body's bounding box, in the host model's own group-local space (native units, X/Z
   * centered on 0, Y grounded at 0). RealCarModel derives both from the host's runtime bbox. */
  hostBoxMin: [number, number, number]
  hostBoxSize: [number, number, number]
  /** True when the host model's geometry faces -Z where the 1973 source faces +Z, so the interior's
   * depth placement (and facing) must be mirrored. Determined per host by screenshot. */
  flipZ?: boolean
  /** Extra multiplier on the auto width-ratio scale (model.interiorScale) — < 1 tucks the interior
   * inside a cabin narrower than the reference car's. Applied around the interior's own centre, so
   * it stays put in the cabin. Defaults to 1. */
  scaleMul?: number
}) {
  const { scene } = useGLTF(SOURCE_PATH)
  const exteriorColorId = useConfigStore((s) => s.exteriorColorId)

  const { object, centering, frac, srcSize, bodyTintMats } = useMemo(() => {
    // Clone the whole 1973 car (the file is a single car, unlike 1968's two-car scene) and zero its
    // own local transform before measuring/extracting.
    const clone = scene.clone(true)
    clone.position.set(0, 0, 0)
    clone.quaternion.identity()
    clone.scale.set(1, 1, 1)
    clone.updateMatrixWorld(true)

    // Whole-body box measured BEFORE extracting the interior — the denominator for the fractional
    // placement.
    const bodyBox = new THREE.Box3().setFromObject(clone)
    const bodyMin = bodyBox.min.clone()
    const bodySize = new THREE.Vector3()
    bodyBox.getSize(bodySize)

    // Collect every interior mesh, then attach into a container (attach() preserves each mesh's real
    // pose relative to the body it was modeled in — see riggPart() for why this matters).
    const interiorMeshes: THREE.Object3D[] = []
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o.name.includes(INTERIOR_MATCH)) interiorMeshes.push(o)
    })
    const container = new THREE.Group()
    clone.add(container)
    container.updateMatrixWorld(true)
    interiorMeshes.forEach((m) => container.attach(m))
    container.updateMatrixWorld(true)

    // Privately clone the body-paint material on any interior metal panel and collect the clones so
    // the effect below can retint them to the host colour without touching the shared 1973 cache.
    const tintMats: THREE.MeshStandardMaterial[] = []
    container.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh || Array.isArray(mesh.material) || !mesh.material) return
      if (mesh.material.name !== BODY_PAINT_MATCH) return
      const cloned = (mesh.material as THREE.MeshStandardMaterial).clone()
      cloned.map = null
      mesh.material = cloned
      tintMats.push(cloned)
    })

    const box = new THREE.Box3().setFromObject(container)
    const center = box.getCenter(new THREE.Vector3())

    const fracVec: [number, number, number] = [
      bodySize.x > 0 ? (center.x - bodyMin.x) / bodySize.x : 0.5,
      bodySize.y > 0 ? (center.y - bodyMin.y) / bodySize.y : 0.5,
      bodySize.z > 0 ? (center.z - bodyMin.z) / bodySize.z : 0.5,
    ]

    return {
      object: container,
      centering: [-center.x, -center.y, -center.z] as [number, number, number],
      frac: fracVec,
      srcSize: [bodySize.x, bodySize.y, bodySize.z] as [number, number, number],
      bodyTintMats: tintMats,
    }
  }, [scene])

  // Keep the interior's painted metal in step with the host car's exterior colour (semi-matte, since
  // interior sheet metal isn't as glossy as the outer shell). See BODY_PAINT_MATCH above.
  useEffect(() => {
    if (bodyTintMats.length === 0) return
    const exteriorColor = exteriorColors.find((c) => c.id === exteriorColorId) ?? exteriorColors[0]
    bodyTintMats.forEach((mat) => {
      mat.color.set(exteriorColor.hex)
      mat.roughness = 0.6
      mat.metalness = 0.1
      mat.needsUpdate = true
    })
  }, [bodyTintMats, exteriorColorId])

  // Uniform scale so the interior keeps the same proportion of the host body it had of the reference
  // body — keyed off width (X), the least distortion-prone axis (all these cars share ~the same track).
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

useGLTF.preload(SOURCE_PATH)
