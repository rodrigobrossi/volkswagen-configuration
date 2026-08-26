import { create } from 'zustand'
import { stylePresets } from '../data/fusca'

/** Modo de visualização do chassi (só se aplica ao model-1980 hoje — ver Chassis.tsx):
 * 'off' = carro normal; 'assembled' = corpo escondido, chassi montado; 'exploded' = peças afastadas. */
export type ChassisView = 'off' | 'assembled' | 'exploded'

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
  chassisView: ChassisView
  set: (
    patch: Partial<
      Omit<
        ConfigState,
        | 'set'
        | 'applyPreset'
        | 'toggleAutoRotate'
        | 'toggleDoors'
        | 'toggleFrontTrunk'
        | 'toggleEngineLid'
        | 'setChassisView'
      >
    >,
  ) => void
  applyPreset: (presetId: string) => void
  toggleAutoRotate: () => void
  toggleDoors: () => void
  toggleFrontTrunk: () => void
  toggleEngineLid: () => void
  /** Dedicado (não mexe em activePresetId): trocar a vista do chassi não deve trocar o modelo. */
  setChassisView: (view: ChassisView) => void
}

const defaultPreset = stylePresets.find((p) => p.id === 'resto-stock')!

export const useConfigStore = create<ConfigState>((set) => ({
  ...defaultPreset.config,
  activePresetId: defaultPreset.id,
  autoRotate: true,
  doorsOpen: false,
  frontTrunkOpen: false,
  engineLidOpen: false,
  chassisView: 'off',
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
  setChassisView: (view) => set({ chassisView: view }),
}))
