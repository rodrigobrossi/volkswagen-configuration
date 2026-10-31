/**
 * Role-based selectors: systems ask "what paint is selected?", never "what is chassisYearId?".
 * This is what keeps render systems vehicle-agnostic. Brain: brain/contracts/configuration.md.
 */
import { useShallow } from 'zustand/react/shallow'
import type { CatalogOption, OptionRole } from '../core/contracts/catalog'
import type { VehicleFamily } from '../core/contracts/family'
import type { ModelProfile } from '../core/contracts/profile'
import { getFamily, resolveModel, selectedOption } from '../core/registry'
import { useConfigStore } from './configStore'

export function useFamily(): VehicleFamily {
  const familyId = useConfigStore((s) => s.familyId)
  return getFamily(familyId)
}

/** The selected option of the group with this role, typed by the caller. */
export function useSelected<T extends CatalogOption = CatalogOption>(role: OptionRole): T {
  const family = useFamily()
  const selections = useConfigStore((s) => s.selections)
  return selectedOption<T>(family, selections, role)
}

/** The model the current configuration resolves to (null = procedural renderer). */
export function useResolvedModel(): ModelProfile | null {
  const family = useFamily()
  const state = useConfigStore(
    useShallow((s) => ({ selections: s.selections, activePresetId: s.activePresetId, modelOverride: s.modelOverride })),
  )
  return resolveModel(family, state)
}
