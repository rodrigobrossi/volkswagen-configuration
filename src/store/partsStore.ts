import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CarPart } from '../data/carParts'

/**
 * Estado do editor de PEÇAS (separado do configStore de presets): overrides por peça
 * (mostrar/ocultar, cor, e — nas próximas etapas — transformação), calibração por modelo e peças
 * extras carregadas via GLTF. Persistido em localStorage (só os dados de edição; seleção e modo de
 * ajuste são efêmeros da UI). Chave de override = `${modelKey}:${partKey}`; calibração = `${modelKey}`.
 */
export type Finish = 'gloss' | 'matte' | 'metallic' | 'patina'
type Vec3 = [number, number, number]

export interface PartOverride {
  hidden?: boolean
  color?: string
  finish?: Finish
  /** Deltas de transformação da peça (etapa de ajuste). Posição em metros; escala multiplicadora;
   * rotação em graus. Aplicados relativos ao pivô (centro) da peça. */
  position?: Vec3
  scale?: Vec3
  rotation?: Vec3
}

export interface ModelCalib {
  /** Multiplica a escala calibrada do modelo. 1 = sem mudança. */
  scaleMul?: number
  /** Soma à rotação Y calibrada (graus). */
  rotationYDeg?: number
}

export interface ExtraPart {
  id: string
  modelKey: string
  name: string
  /** Chave do blob GLTF no IndexedDB (ver partsAssets.ts). */
  assetId: string
  position: Vec3
  scale: Vec3
  rotation: Vec3
}

interface PartsState {
  partOverrides: Record<string, PartOverride>
  modelCalib: Record<string, ModelCalib>
  extraParts: ExtraPart[]
  // efêmeros (não persistidos)
  selectedPartKey: string | null
  adjustMode: boolean
  /** Editor de peças aberto (fica escondido atrás de um botão por padrão). */
  editorOpen: boolean
  /** Peças do modelo atualmente carregado (o RealCarModel descobre e publica aqui). */
  discoveredParts: CarPart[]

  setEditorOpen: (open: boolean) => void
  setDiscoveredParts: (parts: CarPart[]) => void
  setPartOverride: (key: string, patch: Partial<PartOverride>) => void
  resetPart: (key: string) => void
  selectPart: (key: string | null) => void
  setAdjustMode: (on: boolean) => void
  setModelCalib: (modelKey: string, patch: Partial<ModelCalib>) => void
  resetModelCalib: (modelKey: string) => void
  addExtraPart: (part: ExtraPart) => void
  updateExtraPart: (id: string, patch: Partial<ExtraPart>) => void
  removeExtraPart: (id: string) => void
}

export const partKey = (modelKey: string, key: string) => `${modelKey}:${key}`

export const usePartsStore = create<PartsState>()(
  persist(
    (set) => ({
      partOverrides: {},
      modelCalib: {},
      extraParts: [],
      selectedPartKey: null,
      adjustMode: false,
      editorOpen: false,
      discoveredParts: [],

      setEditorOpen: (open) => set({ editorOpen: open }),
      setDiscoveredParts: (parts) => set({ discoveredParts: parts }),
      setPartOverride: (key, patch) =>
        set((s) => ({ partOverrides: { ...s.partOverrides, [key]: { ...s.partOverrides[key], ...patch } } })),
      resetPart: (key) =>
        set((s) => {
          const next = { ...s.partOverrides }
          delete next[key]
          return { partOverrides: next }
        }),
      selectPart: (key) => set({ selectedPartKey: key }),
      setAdjustMode: (on) => set({ adjustMode: on }),
      setModelCalib: (modelKey, patch) =>
        set((s) => ({ modelCalib: { ...s.modelCalib, [modelKey]: { ...s.modelCalib[modelKey], ...patch } } })),
      resetModelCalib: (modelKey) =>
        set((s) => {
          const next = { ...s.modelCalib }
          delete next[modelKey]
          return { modelCalib: next }
        }),
      addExtraPart: (part) => set((s) => ({ extraParts: [...s.extraParts, part] })),
      updateExtraPart: (id, patch) =>
        set((s) => ({ extraParts: s.extraParts.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      removeExtraPart: (id) => set((s) => ({ extraParts: s.extraParts.filter((p) => p.id !== id) })),
    }),
    {
      name: 'fusca-parts-editor',
      // só persiste os dados de edição; seleção/modo são da UI
      partialize: (s) => ({ partOverrides: s.partOverrides, modelCalib: s.modelCalib, extraParts: s.extraParts }),
    },
  ),
)
