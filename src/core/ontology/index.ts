/**
 * Canonical vehicle ontology — typed access to ontology.json + vocabulary.json.
 * Brain: brain/ontology/README.md (taxonomy, frames), brain/ontology/vocabulary.md.
 *
 * The ontology is the ONE vocabulary every layer speaks: model profiles bind asset geometry to
 * slot ids, render systems act on slots/capabilities, the learning tools classify asset meshes
 * into slots. File-specific node/material names never leak past a profile.
 */
import ontologyJson from './ontology.json'
import vocabularyJson from './vocabulary.json'

export type SystemId =
  | 'body'
  | 'closure'
  | 'glazing'
  | 'lighting'
  | 'trim'
  | 'wheel'
  | 'chassis'
  | 'powertrain'
  | 'interior'

/** Articulated closures are driven in groups (one UI toggle per group). */
export type OpenGroupId = 'doors' | 'frontLid' | 'rearLid'

export type Capability = 'paint' | 'hide' | 'recolor' | 'articulate' | 'swap' | 'provision' | 'explode'

export interface SlotDef {
  id: string
  system: SystemId
  label: string
  capabilities: Capability[]
  side?: 'left' | 'right'
  end?: 'front' | 'rear'
  axle?: 'front' | 'rear'
  openGroup?: OpenGroupId
  /** This slot is carried by another (e.g. a door handle rides its door's hinge). */
  follows?: string
}

export interface VocabularyEntry {
  label: string
  slot?: string
  lang?: string
}

export const OPEN_GROUPS: OpenGroupId[] = ['doors', 'frontLid', 'rearLid']

export const slots: SlotDef[] = ontologyJson.slots as SlotDef[]
const slotById = new Map(slots.map((s) => [s.id, s]))

export function getSlot(id: string): SlotDef | undefined {
  return slotById.get(id)
}

/** Slot ids an open group drives (from ontology.json `openGroups`). */
export function slotsOfOpenGroup(group: OpenGroupId): string[] {
  return ontologyJson.openGroups.find((g) => g.id === group)?.slots ?? []
}

/** Assigns the concrete slot for one hinge of an open group from its position in the vehicle frame
 * (+X = right, −X = left — see brain/ontology/vehicle-frame.md). Doors are the only group with
 * two members; lids map 1:1. */
export function slotForHinge(group: OpenGroupId, centerX: number): string {
  if (group === 'doors') return centerX < 0 ? 'closure.door.left' : 'closure.door.right'
  return group === 'frontLid' ? 'closure.lid.front' : 'closure.lid.rear'
}

const vocabulary = vocabularyJson.tokens as Record<string, VocabularyEntry>

export function lookupToken(token: string): VocabularyEntry | undefined {
  return vocabulary[token.toLowerCase()]
}
