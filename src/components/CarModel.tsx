import { Suspense } from 'react'
import { pickRealModel } from '../data/carModels'
import { useConfigStore } from '../store/configStore'
import { FuscaModel } from './FuscaModel'
import { RealCarModel } from './RealCarModel'

// Decides whether to render one of the real GLTF models or the procedural FuscaModel — see
// pickRealModel() in data/carModels.ts and .specs/3d-model.spec.md Real GLTF Models section.
export function CarModel() {
  const activePresetId = useConfigStore((s) => s.activePresetId)
  const chassisYearId = useConfigStore((s) => s.chassisYearId)

  const model = pickRealModel(activePresetId, chassisYearId)
  if (!model) return <FuscaModel />

  return (
    <Suspense fallback={null}>
      <RealCarModel key={model.key} model={model} />
    </Suspense>
  )
}
