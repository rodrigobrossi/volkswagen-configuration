/**
 * Real GLTF Beetle models — see .specs/3d-model.spec.md "Real GLTF Models" section and
 * CREDITS.md for licensing. These are actual sourced 3D models (not the procedural
 * FuscaModel.tsx placeholder), swapped in wholesale for specific presets/eras where a good
 * real-world match exists. See pickRealModel() for the selection rule.
 */

export type CarModelKey = 'model-1948' | 'model-1968' | 'model-callook' | 'model-ratlook'

export interface CarModelDef {
  key: CarModelKey
  path: string
  label: string
  credit: string
  /** Name of the single node to render within the GLTF scene, if the file bundles more than
   * one object (the 1968 file bundles two cars — see the memory log entry for why). Undefined
   * means "render the whole loaded scene". */
  nodeName?: string
  /** Per-model placement calibration, determined by screenshot-verifying each model in the
   * scene (see .specs/3d-model.spec.md). X/Z centering and ground contact (Y) are computed
   * automatically from the object's bounding box (see RealCarModel.tsx) — only orientation and
   * real-world scale need to be figured out per model, since each was authored at a different
   * native unit scale and not necessarily facing the same way. */
  calibration: {
    rotationY: number
    /** Multiplies the model's native units so it matches LENGTH/WIDTH/HEIGHT in
     * .specs/3d-model.spec.md (1 unit = 1 meter in our scene) — derived from each model's
     * logged bounding box divided into the real ~4m target length, not assumed. */
    scale: number
  }
}

export const carModels: Record<CarModelKey, CarModelDef> = {
  'model-1948': {
    key: 'model-1948',
    path: '/models/fusca-1948.glb',
    label: 'VW Typ 11 (1948)',
    credit: 'Peter Boehm — CC-BY-4.0',
    // Native bounds ~(0.27,0.26,0.72) — authored much smaller than meters. scale =
    // target length (4.07m) / native length (0.724) ≈ 5.62, verified by screenshot.
    calibration: { rotationY: 0, scale: 5.62 },
  },
  'model-1968': {
    key: 'model-1968',
    path: '/models/fusca-1968.glb',
    label: '1968 Volkswagen Beetle',
    credit: 'KrStolorz — Sketchfab Standard',
    // three.js's GLTFLoader sanitizes node names (spaces -> underscores) at load time — this
    // must match the *sanitized* name, not the raw name from the source glTF JSON, or
    // findByName() silently fails to match and falls back to rendering the whole scene
    // (both bundled cars). Verified by loading the file through useGLTF and logging node names,
    // not by reading the raw JSON.
    nodeName: '1968_Volkswagen_Beetle_(new)_38',
    calibration: { rotationY: 0, scale: 1 },
  },
  'model-callook': {
    key: 'model-callook',
    path: '/models/fusca-callook.glb',
    label: 'VW Beetle Florida (Cal Look)',
    credit: 'Libau Media — CC-BY-4.0',
    // Native bounds ~(226,152,388) units — authored ~100x larger than meters. scale =
    // target length (4.07m) / native length (388.25) ≈ 0.0105, verified by screenshot.
    // Faces backward relative to the other models by default — rotated 180° for consistency.
    calibration: { rotationY: Math.PI, scale: 0.0105 },
  },
  'model-ratlook': {
    key: 'model-ratlook',
    path: '/models/fusca-ratlook.glb',
    label: 'Old VW Bug (Rat Look)',
    credit: 'jtressle — CC-BY-4.0',
    calibration: { rotationY: 0, scale: 1 },
  },
}

const PRESET_MODEL: Partial<Record<string, CarModelKey>> = {
  'cal-look': 'model-callook',
  'rat-look': 'model-ratlook',
  'resto-stock': 'model-1968',
}

const CHASSIS_YEAR_MODEL: Partial<Record<string, CarModelKey>> = {
  'oval-59-65': 'model-1948',
  'round-66-70': 'model-1968',
}

/**
 * Selects which real GLTF model (if any) should render in place of the procedural FuscaModel.
 * Priority: an active style preset with a curated real-model match wins outright — even over a
 * chassis-year match — so e.g. baja-bug (round-66-70) does NOT fall back to the stock 1968
 * model, which would misrepresent a raised/off-road build as a clean stock car. Only when no
 * preset is active (freeform tweaking) does chassis year alone pick a real model. Returns null
 * when nothing matches, meaning: render the procedural FuscaModel.
 */
export function pickRealModel(activePresetId: string | null, chassisYearId: string): CarModelDef | null {
  if (activePresetId) {
    const key = PRESET_MODEL[activePresetId]
    if (key) return carModels[key]
    return null
  }
  const key = CHASSIS_YEAR_MODEL[chassisYearId]
  return key ? carModels[key] : null
}
