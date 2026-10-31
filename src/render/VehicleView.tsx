import { Suspense, type ComponentType } from 'react'
import { useFamily, useResolvedModel } from '../store/selectors'
import { FuscaModel } from './procedural/FuscaModel'
import { preloadFamily, RealVehicle } from './RealVehicle'
import { vwType1 } from '../vehicles/vw-type1/family'

/** Procedural renderers by id (VehicleFamily.proceduralRenderer) — used when no model resolves. */
const PROCEDURAL: Record<string, ComponentType> = {
  'vw-type1-procedural': FuscaModel,
}

preloadFamily(vwType1)

/**
 * The vehicle in the scene: the model the configuration resolves to (registry rules), rendered
 * through its profile — or the family's procedural renderer when none resolves.
 * Brain: brain/algorithms/model-resolution.md.
 */
export function VehicleView() {
  const family = useFamily()
  const profile = useResolvedModel()
  if (!profile) {
    const Procedural = family.proceduralRenderer ? PROCEDURAL[family.proceduralRenderer] : undefined
    return Procedural ? <Procedural /> : null
  }
  return (
    <Suspense fallback={null}>
      {/* key: a different asset is a fresh build — never reuse a rigged graph across models. */}
      <RealVehicle key={profile.id} profile={profile} family={family} />
    </Suspense>
  )
}
