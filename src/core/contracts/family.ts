/**
 * VehicleFamily — everything shared by the models of one vehicle line (e.g. VW Type 1 / Fusca):
 * the catalog, presets, how a configuration picks a model, and the reusable provisions (donor
 * interior, engine, platform, wheel assets) any of its models can receive.
 * Brain: brain/contracts/vehicle-family.md. Adding a new vehicle = a new family + profiles; no code.
 */
import type { OpenGroupId } from '../ontology'
import type { OptionGroup, StylePreset } from './catalog'
import type { ModelProfile } from './profile'

/** One member of a procedural platform (chassis) — metres, vehicle frame. brain/algorithms/platform.md */
export interface PlatformPart {
  id: string
  label: string
  kind: 'box' | 'tube'
  /** box: [x width, y height, z length]; tube: [radius, length, _] lying along `tubeAxis`. */
  size: [number, number, number]
  tubeAxis?: 'x' | 'z'
  rotationYDeg?: number
  position: [number, number, number]
  /** Offset applied (×1) in the exploded view. */
  explode: [number, number, number]
  color?: string
}

export interface WheelAsset {
  path: string
  /** Extra yaw aligning the asset's native axle with the vehicle's X axis. */
  axleRealignYaw: number
}

export interface VehicleFamily {
  id: string
  label: string
  subtitle: string
  optionGroups: OptionGroup[]
  presets: StylePreset[]
  defaultPresetId: string
  /** How a configuration resolves to a model. brain/algorithms/model-resolution.md */
  modelRules: {
    /** A preset with a curated model wins. */
    byPreset: Record<string, string>
    /** Otherwise the option of `group` picks the model (e.g. era → body generation). */
    byOption: { group: string; map: Record<string, string> }
  }
  /** Profiles of every model of this family. */
  models: ModelProfile[]
  /** Panel labels for each articulated group (a Beetle's front lid is the trunk). */
  openGroupLabels: Record<OpenGroupId, string>
  /** Engine provisioning for models with an engine-access lid. brain/algorithms/engine-bay.md */
  engine?: {
    accessGroup: OpenGroupId
    assetPath: string
    /** Engine asset scale in metres (asset is ~1 m authored). */
    realScale: number
    floorHeightM: number
    rearInsetM: number
    bay: { heightM: number; firewallHeightM: number; floorDropM: number; fit: number }
  }
  /** Cabin fitted into models whose profile says `interior.source = 'donor'`. brain/algorithms/donor-interior.md */
  donorInterior?: {
    assetPath: string
    /** Mesh-name token of the donor's cabin meshes. */
    match: string
    /** Donor material that is body paint (retinted to the host's colour). */
    paintMaterial: string
  }
  platform?: { parts: PlatformPart[]; color: string; metalness: number; roughness: number }
  wheels?: {
    assets: Record<string, WheelAsset>
    /** wheels option id → asset key; unmapped options use `defaultAsset`. */
    optionAsset: Record<string, string>
    defaultAsset: string
  }
  /** Id of a procedural renderer used when no real model resolves (see render/procedural). */
  proceduralRenderer?: string
}
