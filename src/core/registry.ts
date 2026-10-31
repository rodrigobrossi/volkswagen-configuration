/**
 * Registry — the single place families and model profiles are looked up, and where a
 * configuration is resolved to a model. Brain: brain/algorithms/model-resolution.md.
 */
import type { VehicleFamily } from './contracts/family'
import type { ModelProfile } from './contracts/profile'
import type { CatalogOption, OptionGroup, OptionRole } from './contracts/catalog'
import { validateProfile } from './contracts/validate'

const families = new Map<string, VehicleFamily>()
const profiles = new Map<string, ModelProfile>()

export function registerFamily(family: VehicleFamily) {
  families.set(family.id, family)
  for (const profile of family.models) {
    const problems = validateProfile(profile)
    // A broken profile must never render half-rigged: surface it loudly and skip it.
    if (problems.length) {
      console.error(`[registry] rejected ${profile.id}:\n  ${problems.join('\n  ')}`)
      continue
    }
    if (profile.family !== family.id) console.warn(`[registry] ${profile.id} declares family ${profile.family}`)
    profiles.set(profile.id, profile)
  }
}

export function getFamily(id: string): VehicleFamily {
  const f = families.get(id)
  if (!f) throw new Error(`Unknown vehicle family "${id}"`)
  return f
}

export function getProfile(id: string): ModelProfile | undefined {
  return profiles.get(id)
}

export function listProfiles(familyId?: string): ModelProfile[] {
  return [...profiles.values()].filter((p) => !familyId || p.family === familyId)
}

export function groupByRole(family: VehicleFamily, role: OptionRole): OptionGroup | undefined {
  return family.optionGroups.find((g) => g.role === role)
}

/** The selected option of the group with `role` (or the group's fallback). */
export function selectedOption<T extends CatalogOption = CatalogOption>(
  family: VehicleFamily,
  selections: Record<string, string>,
  role: OptionRole,
): T {
  const group = groupByRole(family, role)
  if (!group) throw new Error(`Family ${family.id} has no option group with role "${role}"`)
  const found = group.options.find((o) => o.id === selections[group.id])
  return (found ?? group.options[group.fallbackIndex ?? 0]) as T
}

/**
 * Which model renders for a configuration: explicit override → curated preset model → the model
 * of the `byOption` group's selected option → none (the family's procedural renderer).
 */
export function resolveModel(
  family: VehicleFamily,
  state: { selections: Record<string, string>; activePresetId: string | null; modelOverride: string | null },
): ModelProfile | null {
  if (state.modelOverride) {
    const p = profiles.get(state.modelOverride)
    if (p && p.family === family.id) return p
  }
  if (state.activePresetId) {
    const id = family.modelRules.byPreset[state.activePresetId]
    if (id && profiles.has(id)) return profiles.get(id)!
  }
  const { group, map } = family.modelRules.byOption
  const id = map[state.selections[group]]
  return id ? (profiles.get(id) ?? null) : null
}
