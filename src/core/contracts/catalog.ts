/**
 * Catalog contracts — what a user can pick, independent of vehicle. A family declares OptionGroups;
 * each group has a ROLE that tells the software what the options MEAN (paint → recolor the body,
 * wheels → swap wheel assets, era → pick a model, …). Brain: brain/contracts/option-group.md.
 */

export type Finish = 'gloss' | 'matte' | 'metallic' | 'patina'

/** Semantic role of an option group — systems bind to roles, never to group ids. */
export type OptionRole = 'era' | 'paint' | 'wheels' | 'suspension' | 'steering' | 'interior' | 'engine'

export interface CatalogOption {
  id: string
  label: string
  note?: string
}

/** Contract every option of a `paint` group satisfies. */
export interface PaintOption extends CatalogOption {
  hex: string
  finish: Finish
}

/** Contract every option of a `wheels` group satisfies. */
export interface WheelOption extends CatalogOption {
  rimColor: string
  rimStyle: 'hubcap' | 'five-spoke' | 'multi-spoke'
  tireProfile: 'street' | 'whitewall' | 'offroad'
}

export interface OptionGroup<T extends CatalogOption = CatalogOption> {
  /** Key in Configuration.selections. */
  id: string
  role: OptionRole
  /** Section title in the configurator panel. */
  title: string
  /** 'select' = dropdown; 'swatch' = text buttons; 'color' = colour dots (needs `hex`). */
  ui: 'select' | 'swatch' | 'color'
  options: T[]
  /** Index of the fallback option when a selection is missing/unknown. */
  fallbackIndex?: number
}

export interface StylePreset {
  id: string
  label: string
  description: string
  /** groupId → optionId, one per group. */
  selections: Record<string, string>
}

/** Roughness/metalness per paint finish — the single table shared by every paint path. */
export const FINISH_PROPS: Record<Finish, { roughness: number; metalness: number }> = {
  matte: { roughness: 0.85, metalness: 0.05 },
  patina: { roughness: 0.95, metalness: 0.1 },
  metallic: { roughness: 0.35, metalness: 0.6 },
  gloss: { roughness: 0.25, metalness: 0.15 },
}
