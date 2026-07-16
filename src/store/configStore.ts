import { create } from 'zustand'
import { stylePresets } from '../data/fusca'

interface ConfigState {
  chassisYearId: string
  wheelId: string
  steeringWheelId: string
  suspensionId: string
  exteriorColorId: string
  interiorId: string
  engineId: string
  activePresetId: string | null
  set: (patch: Partial<Omit<ConfigState, 'set' | 'applyPreset'>>) => void
  applyPreset: (presetId: string) => void
}

const defaultPreset = stylePresets.find((p) => p.id === 'resto-stock')!

export const useConfigStore = create<ConfigState>((set) => ({
  ...defaultPreset.config,
  activePresetId: defaultPreset.id,
  set: (patch) => set({ ...patch, activePresetId: null }),
  applyPreset: (presetId) => {
    const preset = stylePresets.find((p) => p.id === presetId)
    if (!preset) return
    set({ ...preset.config, activePresetId: presetId })
  },
}))
