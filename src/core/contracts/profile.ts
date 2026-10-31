/**
 * ModelProfile — the captured "essence" of ONE 3D asset: how its geometry maps onto the canonical
 * ontology and what the software may do with it. Pure data (JSON, `vehicle-profile/v1`), produced
 * by the ingestion agent and verified by a human. Brain: brain/contracts/model-profile.md,
 * JSON Schema: brain/contracts/model-profile.schema.json.
 *
 * Invariants (enforced by validateProfile + `npm run brain:check`):
 *  - no code path may special-case a model id — every per-asset fact lives here;
 *  - region fractions are 0..1 of the reference mesh bbox in the BUILD frame (native, uncentered);
 *  - metric values (cabinFloor) are metres in the VEHICLE frame (centered, grounded, +Z forward).
 */
import type { OpenGroupId } from '../ontology'

export const PROFILE_SCHEMA = 'vehicle-profile/v1'

/** Box expressed as fractions (0..1) of a reference bbox. Authored for the +X (right) side. */
export interface FractionBox {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  zMin: number
  zMax: number
}

export type PivotEdge = 'min' | 'max' | 'center'

/** How a hinge is placed and swung. brain/algorithms/articulate-hinge.md */
export interface Articulation {
  /** 'y' = vertical hinge (doors swing out); 'x' = horizontal hinge (lids swing up). */
  axis: 'x' | 'y'
  /** Radians when open, authored for the +X side; doors mirror automatically. */
  openAngle: number
  pivotY: PivotEdge
  pivotZ: 'min' | 'max'
  /** Per-hinge sign override when the automatic outward rule is wrong for an asset. */
  signs?: number[]
}

/** Second, tighter cut pass (e.g. the door card inside the cabin mesh). brain/algorithms/trim-pass.md */
export interface TrimPass {
  /** Mesh-name tokens to cut. */
  match: string[]
  region: FractionBox
  /** Material-name substrings never taken, even inside the region (e.g. seats). */
  excludeMaterials?: string[]
}

/**
 * How the geometry of a slot is obtained from the asset. brain/contracts/extraction-strategy.md
 *  - node:          a real node (exact name) or every mesh containing a token, grouped;
 *  - node-split-x:  one node holding BOTH sides merged → split by world X;
 *  - region-clip:   panel fused into the shell, no node at all → clipped out by a fraction box.
 */
export type ExtractStrategy =
  | { kind: 'node'; match: string[] }
  | { kind: 'node-split-x'; match: string }
  | {
      kind: 'region-clip'
      /** Meshes to cut; the FIRST token is also the reference bbox for the fractions. */
      source: string[]
      region: FractionBox
      /** Also cut the mirrored (1 - x) region — a door pair. */
      mirrorX?: boolean
      trim?: TrimPass
    }

/** Satellite meshes that must travel with an articulated panel. brain/algorithms/capture-companions.md */
export interface Companions {
  /** Whole per-side meshes re-parented to the nearest hinge (handles, mirrors, seals). */
  attachNearest?: string[]
  /** Shared meshes triangle-split by each panel's footprint (door glass fused with quarter glass). */
  splitByFootprint?: string[]
}

export interface OpenableBinding {
  group: OpenGroupId
  extract: ExtractStrategy
  articulation: Articulation
  companions?: Companions
  note?: string
}

export interface WheelMountBinding {
  /** Baked wheel node to hide and measure. */
  node: string
  /** The node merges both wheels of an axle → split by world X. */
  splitX?: boolean
}

export interface ModelProfile {
  schema: typeof PROFILE_SCHEMA
  /** Stable id (also the persistence key for user overrides — never rename casually). */
  id: string
  family: string
  label: string
  asset: {
    path: string
    /** Render only this node (files that bundle several objects). */
    rootNode?: string
    credit: string
  }
  /** Asset units → metres, and heading. Centering/grounding are always automatic. */
  frame: { rotationY: number; scale: number }
  /** How the parts editor groups meshes: by readable node names or readable material names. */
  parts?: { groupBy: 'node' | 'material' }
  paint?: {
    /** Explicit paint materials; absent = auto (largest opaque non-glass material). */
    materials?: string[]
    recolorable?: boolean
  }
  openables?: OpenableBinding[]
  /** Absent = baked wheels are fused to the body and stay. */
  wheels?: { mounts: WheelMountBinding[] }
  interior?: {
    /** 'own' = baked cabin; 'donor' = the family's donor cabin is fitted in. */
    source: 'own' | 'donor'
    donorScale?: number
    flipZ?: boolean
  }
  /** Caps the hollow cabin so an open door shows a floor, not a void. Metres, vehicle frame. */
  cabinFloor?: { y: number; halfWidth: number; zMin: number; zMax: number }
  /** Nodes hidden while the engine-access lid is open (inner shells that occlude the engine). */
  engineBay?: { hideNodes?: string[] }
  /** The family's procedural platform (chassis) can replace the body on this model. */
  platform?: { enabled: boolean }
  provenance: {
    status: 'draft' | 'verified'
    /** Brain note with the rationale/evidence for every binding. */
    notes?: string
    /** Classifier confidence for drafts produced by ingestion (0..1). */
    confidence?: number
  }
}
