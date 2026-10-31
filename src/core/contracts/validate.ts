/**
 * Runtime guard for ModelProfile data (profiles are JSON — the compiler can't vouch for them).
 * Mirrors brain/contracts/model-profile.schema.json; `npm run brain:check` runs the same rules
 * offline. Returns the list of problems (empty = valid) so callers decide how loud to be.
 */
import { OPEN_GROUPS, getSlot } from '../ontology'
import { PROFILE_SCHEMA, type FractionBox, type ModelProfile } from './profile'

function checkFractions(box: FractionBox | undefined, where: string, out: string[]) {
  if (!box) return
  for (const k of ['xMin', 'xMax', 'yMin', 'yMax', 'zMin', 'zMax'] as const) {
    const v = box[k]
    // Slightly outside 0..1 is legal (a box reaching past a mesh edge to take its natural border).
    if (typeof v !== 'number' || v < -0.5 || v > 1.5) out.push(`${where}.${k} must be a fraction near 0..1`)
  }
  if (box.xMin >= box.xMax || box.yMin >= box.yMax || box.zMin >= box.zMax) out.push(`${where} is empty (min >= max)`)
}

export function validateProfile(p: ModelProfile): string[] {
  const out: string[] = []
  const at = `profile ${p?.id ?? '?'}`
  if (p.schema !== PROFILE_SCHEMA) out.push(`${at}: schema must be "${PROFILE_SCHEMA}"`)
  if (!p.id || !p.family || !p.label) out.push(`${at}: id, family and label are required`)
  if (!p.asset?.path) out.push(`${at}: asset.path is required`)
  if (!(p.frame?.scale > 0)) out.push(`${at}: frame.scale must be > 0`)
  if (!p.provenance?.status) out.push(`${at}: provenance.status is required`)
  p.openables?.forEach((o, i) => {
    const w = `${at}.openables[${i}]`
    if (!OPEN_GROUPS.includes(o.group)) out.push(`${w}.group must be one of ${OPEN_GROUPS.join('|')}`)
    if (!['x', 'y'].includes(o.articulation?.axis)) out.push(`${w}.articulation.axis must be x|y`)
    const e = o.extract
    if (e.kind === 'node' && !e.match?.length) out.push(`${w}.extract.match must list at least one node`)
    if (e.kind === 'region-clip') {
      if (!e.source?.length) out.push(`${w}.extract.source must list the reference mesh first`)
      checkFractions(e.region, `${w}.extract.region`, out)
      checkFractions(e.trim?.region, `${w}.extract.trim.region`, out)
    }
  })
  if (p.wheels && !p.wheels.mounts?.length) out.push(`${at}: wheels.mounts must not be empty (omit wheels instead)`)
  return out
}

/** Every slot id referenced in docs/code must exist in the ontology. */
export function assertSlot(id: string): void {
  if (!getSlot(id)) throw new Error(`Unknown ontology slot "${id}" — add it to core/ontology/ontology.json first`)
}
