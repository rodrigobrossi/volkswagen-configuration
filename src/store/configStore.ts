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
  autoRotate: boolean
  doorsOpen: boolean
  frontTrunkOpen: boolean
  engineLidOpen: boolean
  set: (
    patch: Partial<
      Omit<
        ConfigState,
        'set' | 'applyPreset' | 'toggleAutoRotate' | 'toggleDoors' | 'toggleFrontTrunk' | 'toggleEngineLid'
      >
    >,
  ) => void
  applyPreset: (presetId: string) => void
  toggleAutoRotate: () => void
  toggleDoors: () => void
  toggleFrontTrunk: () => void
  toggleEngineLid: () => void
}

const defaultPreset = stylePresets.find((p) => p.id === 'resto-stock')!

export const useConfigStore = create<ConfigState>((set) => ({
  ...defaultPreset.config,
  activePresetId: defaultPreset.id,
  autoRotate: true,
  doorsOpen: false,
  frontTrunkOpen: false,
  engineLidOpen: false,
  set: (patch) => set({ ...patch, activePresetId: null }),
  applyPreset: (presetId) => {
    const preset = stylePresets.find((p) => p.id === presetId)
    if (!preset) return
    set({ ...preset.config, activePresetId: presetId })
  },
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  toggleDoors: () => set((s) => ({ doorsOpen: !s.doorsOpen })),
  toggleFrontTrunk: () => set((s) => ({ frontTrunkOpen: !s.frontTrunkOpen })),
  toggleEngineLid: () => set((s) => ({ engineLidOpen: !s.engineLidOpen })),
}))
