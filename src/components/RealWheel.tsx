import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Matches WHEEL_RADIUS in FuscaModel.tsx / .specs/3d-model.spec.md (0.32m tire radius) — the
// default real-world diameter real wheel models get scaled to when a caller doesn't pass its own
// measured `diameter` (see RealCarModel.tsx, which measures each car's own baked wheels instead
// of using this constant, so its replacement wheels match that specific model's proportions).
const WHEEL_DIAMETER = 0.64

// A real, licensed wheel model (see CREDITS.md) swapped in for specific wheel style selections
// on real car models — see RealCarModel.tsx. Self-centers on all 3 axes (unlike EngineBlock/
// CarInterior, which ground to the floor) since a wheel is positioned by its own hub/axle
// center, not its lowest point, and auto-scales to `diameter` using whichever two of its
// three bounding-box dimensions are largest (the disc plane) — the smallest is always the
// wheel's own thickness/axle axis, regardless of which native axis that happens to be per
// model. Callers pass `rotation` to align that axle axis with the car's own (local X, hub
// pointing left/right) — verified per model by screenshot, not assumed from node names.
export function RealWheel({
  path,
  position,
  rotation = [0, 0, 0],
  diameter = WHEEL_DIAMETER,
  tint,
}: {
  path: string
  position: [number, number, number]
  rotation?: [number, number, number]
  /** Real-world-scale target diameter for this wheel, in whatever unit space the caller's own
   * position/scale live in — RealCarModel.tsx passes its measured baked-wheel diameter directly
   * (already in that car's group-local, pre-outer-scale units, same convention as EngineBlock's
   * `size`/`centers`), so the replacement wheel matches that specific car's proportions instead
   * of one universal constant. Defaults to WHEEL_DIAMETER for any other caller. */
  diameter?: number
  /** Optional rim recolor, from `wheelOptions[selected].rimColor` — applied ONLY to materials
   * with no base-color texture (a flat `baseColorFactor`-only material), never to a textured one:
   * wheel-mustang64.glb and wheel-retro.glb each cover their WHOLE wheel (rim + tire) with one
   * single photo-textured material, so tinting it would wash out the photoreal finish AND
   * incorrectly recolor the black tire; wheel-57cr.glb's rim material ("2.007") has no texture at
   * all (verified: `baseColorFactor` only), so it's the only one of the 3 this currently affects.
   * A no-op (and harmless) on any model without an untextured material. */
  tint?: THREE.ColorRepresentation
}) {
  const { scene } = useGLTF(path)

  const { object, centering, scale } = useMemo(() => {
    const obj = scene.clone(true)
    obj.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(obj)
    const center = new THREE.Vector3()
    box.getCenter(center)
    const size = new THREE.Vector3()
    box.getSize(size)

    const dims = [size.x, size.y, size.z].sort((a, b) => a - b)
    const diskDiameter = (dims[1] + dims[2]) / 2

    // Same fix as EngineBlock.tsx: this scene has no environment map (an HDRI hung on fetch in
    // this sandboxed dev setup once already, see the memory log), so a highly metallic material
    // (glTF default metallicFactor is 1.0 unless a model overrides it, and none of these three
    // wheels do) renders as a near-featureless black silhouette — there's nothing for it to
    // reflect. Capping metalness keeps the base-color texture/tint visible under this scene's
    // plain directional/ambient lighting.
    //
    // `obj.clone(true)` (three's Object3D.clone) deep-clones the node hierarchy but NOT each
    // mesh's own material/geometry — those stay shared references back to useGLTF's cached
    // scene, same as EngineBlock.tsx's own metalness-cap comment above notes. Mutating `mat.color`
    // here is only
    // safe because every RealWheel of a given `path` mounted at once (all 4 wheels on one car)
    // always shares the same `tint` (one wheelOption applies car-wide) — if that ever stops being
    // true (e.g. per-wheel tint), this needs its own cloned material instead of mutating the
    // shared one.
    obj.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((mat) => {
        if (!(mat instanceof THREE.MeshStandardMaterial)) return
        mat.metalness = Math.min(mat.metalness, 0.4)
        if (tint && !mat.map) mat.color.set(tint)
      })
    })

    return {
      object: obj,
      centering: [-center.x, -center.y, -center.z] as [number, number, number],
      scale: diameter / diskDiameter,
    }
  }, [scene, diameter, tint])

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={object} position={centering} />
    </group>
  )
}

useGLTF.preload('/models/wheels/wheel-57cr.glb')
useGLTF.preload('/models/wheels/wheel-mustang64.glb')
useGLTF.preload('/models/wheels/wheel-retro.glb')
