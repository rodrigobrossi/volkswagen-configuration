import { useEffect } from 'react'
import * as THREE from 'three'
import type { CarModelDef } from '../data/carModels'
import type { ExteriorColor } from '../data/fusca'
import { exteriorColors } from '../data/fusca'
import { useConfigStore } from '../store/configStore'

// Mirrors FuscaModel.tsx's `bodyMaterialProps` finish table (see there) so a real GLTF model's
// paint reads consistently with the procedural placeholder across finishes. These GLTF files load
// as plain MeshStandardMaterial (confirmed by inspecting each .glb's materials — all use
// pbrMetallicRoughness, none have clearcoat extensions), which has no `clearcoat` property, so
// only roughness/metalness carry over from the placeholder's table.
const FINISH_PROPS: Record<ExteriorColor['finish'], { roughness: number; metalness: number }> = {
  matte: { roughness: 0.85, metalness: 0.05 },
  patina: { roughness: 0.95, metalness: 0.1 },
  metallic: { roughness: 0.35, metalness: 0.6 },
  gloss: { roughness: 0.25, metalness: 0.15 },
}

// A material this hook has already cloned for private mutation (see useBodyPaint's doc comment
// below for why cloning, not mutating the shared cached material, is required). Once set, later
// runs (e.g. switching exterior color while the same car object stays mounted) mutate this same
// clone in place instead of cloning again on every change.
type PaintMaterial = THREE.MeshStandardMaterial & { __fuscaPaintClone?: boolean }

function isOpaqueStandardMaterial(mat: THREE.Material | THREE.Material[] | undefined): mat is THREE.MeshStandardMaterial {
  if (!mat || Array.isArray(mat)) return false
  const m = mat as THREE.MeshStandardMaterial
  if (!m.color) return false
  if (m.transparent && m.opacity < 0.9) return false // skip glass — same rule as findBodyColor
  return true
}

// Same "largest opaque non-glass mesh volume wins" heuristic as findBodyColor() in
// RealCarModel.tsx, kept as a SEPARATE implementation (not a shared import) so that function's
// existing near-black skip stays untouched and its one call site (the engine-bay tint) keeps
// behaving identically. We deliberately do NOT skip near-black here: a real car's paint can
// legitimately BE black (model-1948's "metal_schwarz"), and skipping it would wrongly hand
// recoloring to some smaller, non-paint material instead.
function findDominantPaintMaterial(object: THREE.Object3D): THREE.MeshStandardMaterial | null {
  const volumeByMat = new Map<THREE.MeshStandardMaterial, number>()
  const box = new THREE.Box3()
  const size = new THREE.Vector3()
  object.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || !isOpaqueStandardMaterial(mesh.material)) return
    const mat = mesh.material as THREE.MeshStandardMaterial
    box.setFromObject(mesh)
    box.getSize(size)
    const vol = size.x * size.y * size.z
    volumeByMat.set(mat, (volumeByMat.get(mat) ?? 0) + vol)
  })
  let best: THREE.MeshStandardMaterial | null = null
  let bestVol = -1
  for (const [mat, vol] of volumeByMat) {
    if (vol > bestVol) {
      bestVol = vol
      best = mat
    }
  }
  return best
}

// Collects every mesh whose material should be treated as body paint: either the model's explicit
// `paintMaterialNames` override, or — when that's absent — every mesh sharing whichever single
// material findDominantPaintMaterial() picks. An explicit override is needed for models where the
// visible paint is split across more than one distinct material (findDominantPaintMaterial can
// only ever pick ONE) — confirmed on model-1968, whose "Paint_new" and "Body" materials both
// reference the very same baked paint texture (verified offline: both point at the identical
// image, average colour ~(112,88,38)/255 with ~75/255 average per-pixel saturation — a genuinely
// colored bake, not a neutral/greyscale map, so dropping the map and tinting is correct for both).
function findPaintMeshes(object: THREE.Object3D, model: CarModelDef): THREE.Mesh[] {
  if (model.paintMaterialNames?.length) {
    const names = new Set(model.paintMaterialNames)
    const meshes: THREE.Mesh[] = []
    object.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh && !Array.isArray(mesh.material) && names.has(mesh.material.name)) meshes.push(mesh)
    })
    return meshes
  }
  const dominant = findDominantPaintMaterial(object)
  if (!dominant) return []
  const meshes: THREE.Mesh[] = []
  object.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (mesh.isMesh && mesh.material === dominant) meshes.push(mesh)
  })
  return meshes
}

/**
 * Repaints a real GLTF car's body-paint material(s) to match the selected `exteriorColorId`,
 * reacting to store changes — the real-model counterpart to FuscaModel.tsx's
 * `bodyMaterialProps`/`exteriorColor.hex` reactivity described in .specs/3d-model.spec.md. See
 * findPaintMeshes() above for how the paint material(s) are identified per model.
 *
 * Flat-color materials (model-1948's "metal_schwarz", model-1980's "Mat_0" — both confirmed
 * offline to have no base-color map) just get their `color` set directly. Textured paint
 * (model-1968's "Paint_new"/"Body": a white/default base-colour factor with the actual paint
 * baked into the map — confirmed offline by sampling, see findPaintMeshes' doc comment) would
 * otherwise MULTIPLY a newly-set color against that already-colored bake, so its `map` is dropped
 * first — the clean result keeps the material's normal/roughness/AO maps (surface detail) while
 * giving a correct, uniform body color.
 *
 * `model.recolorable === false` (model-ratlook) opts a model out entirely: its 8 generic
 * `material0000..0007` materials are all rust/patina photo textures with no distinct paint
 * material to isolate — tinting them would just discolor the weathering rather than repaint the
 * car, fighting the "Rat Look / Patina" theme. See carModels.ts for the opt-out and rationale.
 *
 * Mutates a private CLONE of the paint material, never the material still shared from useGLTF's
 * cache: RealCarModel clones the scene graph (`scene.clone(true)`), but `THREE.Object3D.clone()`
 * does NOT clone materials (`Mesh.copy()` copies the reference) — every instance of a given model
 * shares the exact same material objects unless cloned here. One clone (flagged via
 * `__fuscaPaintClone`) is made and assigned to ALL paint meshes, then reused in place on later
 * color changes; assigning a SINGLE shared clone (not one per mesh) is also what keeps a later
 * color change resolving the whole panel set — see the effect body. The pristine original coming
 * out of useGLTF's cache is never touched — remounting the model (a fresh `scene.clone(true)`, see
 * RealCarModel's own useMemo, and `CarModel.tsx`'s `key={model.key}` which fully remounts
 * `RealCarModel` on model switch) always starts from that untouched original, so no explicit
 * restore-on-cleanup is needed.
 */
export function useBodyPaint(object: THREE.Object3D, model: CarModelDef) {
  const exteriorColorId = useConfigStore((s) => s.exteriorColorId)

  useEffect(() => {
    if (model.recolorable === false) return
    const exteriorColor = exteriorColors.find((c) => c.id === exteriorColorId) ?? exteriorColors[0]
    const { roughness, metalness } = FINISH_PROPS[exteriorColor.finish]

    const meshes = findPaintMeshes(object, model)
    if (meshes.length === 0) return

    // Clone ONE material and share it across every paint mesh (reusing the existing clone on a
    // later color change). Sharing — rather than a clone per mesh — is what makes a color *change*
    // reach the whole body: cloning per mesh splits the panels into N distinct materials, after
    // which findPaintMeshes' dominant-material lookup resolves to only ONE of them and the recolor
    // touches a single panel (the original bug). With one shared material, every panel stays on it,
    // so both the dominant lookup and the name match keep resolving the full set. The pristine
    // cached original from useGLTF is never mutated (see this hook's doc comment).
    const existing = meshes.map((m) => m.material as PaintMaterial).find((m) => m.__fuscaPaintClone)
    const paint = existing ?? ((meshes[0].material as PaintMaterial).clone() as PaintMaterial)
    paint.__fuscaPaintClone = true
    paint.map = null
    paint.color.set(exteriorColor.hex)
    paint.roughness = roughness
    paint.metalness = metalness
    paint.needsUpdate = true
    meshes.forEach((mesh) => (mesh.material = paint))
  }, [object, model, exteriorColorId])
}
