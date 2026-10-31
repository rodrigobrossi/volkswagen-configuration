/**
 * Every vehicle family the app knows. Adding a vehicle line = add its folder + one line here.
 * Brain: brain/agents/ingestion-agent.md (how a new family/model is onboarded).
 */
import { registerFamily } from '../core/registry'
import { vwType1 } from './vw-type1/family'

registerFamily(vwType1)

export const DEFAULT_FAMILY_ID = vwType1.id
