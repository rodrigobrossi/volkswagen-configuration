import { create } from 'zustand'
import { OPEN_GROUPS, type OpenGroupId } from '../core/ontology'
import { getFamily } from '../core/registry'
import { DEFAULT_FAMILY_ID } from '../vehicles'

/**
 * The active configuration — vehicle-agnostic. `selections` maps each of the family's option
 * groups to an option id; systems read options by ROLE (see store/selectors.ts), never by group.
 * Brain: brain/contracts/configuration.md.
 */

/** Platform (chassis) view: 'off' = car; 'assembled' = body hidden, platform shown; 'exploded'. */
export type ChassisView = 'off' | 'assembled' | 'exploded'

interface ConfigState {
  familyId: string
  selections: Record<string, string>
  activePresetId: string | null
  /** Explicit model choice (dev: `?model=<id>` or `window.__setModel(id)`); beats every rule. */
  modelOverride: string | null
  open: Record<OpenGroupId, boolean>
  autoRotate: boolean
  chassisView: ChassisView
  /** Picks one option; a manual pick leaves the active preset (freeform) and any override. */
  select: (groupId: string, optionId: string) => void
  applyPreset: (presetId: string) => void
  setModelOverride: (modelId: string | null) => void
  toggleOpen: (group: OpenGroupId) => void
  toggleAutoRotate: () => void
  /** Doesn't touch the preset/model: changing the platform view must not swap the car. */
  setChassisView: (view: ChassisView) => void
}

const family = getFamily(DEFAULT_FAMILY_ID)
const defaultPreset = family.presets.find((p) => p.id === family.defaultPresetId) ?? family.presets[0]
const closed = Object.fromEntries(OPEN_GROUPS.map((g) => [g, false])) as Record<OpenGroupId, boolean>
const urlModel = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('model') : null

export const useConfigStore = create<ConfigState>((set) => ({
  familyId: family.id,
  selections: { ...defaultPreset.selections },
  activePresetId: defaultPreset.id,
  modelOverride: urlModel,
  open: closed,
  autoRotate: true,
  chassisView: 'off',
  select: (groupId, optionId) =>
    set((s) => ({ selections: { ...s.selections, [groupId]: optionId }, activePresetId: null, modelOverride: null })),
  applyPreset: (presetId) => {
    const preset = getFamily(useConfigStore.getState().familyId).presets.find((p) => p.id === presetId)
    if (!preset) return
    set((s) => ({ selections: { ...s.selections, ...preset.selections }, activePresetId: presetId, modelOverride: null }))
  },
  setModelOverride: (modelId) => set({ modelOverride: modelId }),
  toggleOpen: (group) => set((s) => ({ open: { ...s.open, [group]: !s.open[group] } })),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  setChassisView: (view) => set({ chassisView: view }),
}))

// Dev/verification hook: load any registered model regardless of rules (e.g. model-1980).
if (typeof window !== 'undefined') {
  ;(window as unknown as { __setModel?: (id: string | null) => void }).__setModel = (id) =>
    useConfigStore.getState().setModelOverride(id)
}
