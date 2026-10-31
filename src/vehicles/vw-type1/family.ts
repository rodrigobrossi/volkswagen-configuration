/**
 * VW Type 1 — Fusca / Beetle family. Brain: brain/vehicles/vw-type1/family.md.
 * Everything specific to this vehicle line is DATA here or in its profiles; the core never names it.
 */
import type { ModelProfile } from '../../core/contracts/profile'
import type { VehicleFamily } from '../../core/contracts/family'
import { optionGroups, presets } from './catalog'
import { platformParts } from './platform'

// Every VERIFIED profile dropped in ./models is registered automatically — onboarding a model is a
// data change (drafts live in ./drafts and are never loaded). The registry validates each one.
const modelFiles = import.meta.glob<ModelProfile>('./models/*.profile.json', { eager: true, import: 'default' })
const models = Object.values(modelFiles).sort((a, b) => a.id.localeCompare(b.id))

export const vwType1: VehicleFamily = {
  id: 'vw-type1',
  label: 'Fusca Configurator',
  subtitle: 'Monte seu Fusca — Brazilian VW Beetle 3D builder',
  optionGroups,
  presets,
  defaultPresetId: 'resto-stock',
  modelRules: {
    // A preset with a curated model wins; others fall through to their era's model.
    byPreset: { 'resto-stock': 'model-1968', 'meu-fusca': 'model-1973' },
    byOption: {
      group: 'era',
      map: { 'oval-59-65': 'model-1948', 'round-66-70': 'model-1968', 'square-71-85': 'model-1973' },
    },
  },
  models,
  // Rear-engined: the front lid is the luggage trunk, the rear lid gives engine access.
  openGroupLabels: { doors: 'Doors', frontLid: 'Porta-malas', rearLid: 'Tampa do Motor' },
  engine: {
    accessGroup: 'rearLid',
    assetPath: '/models/engine/scene.gltf',
    realScale: 0.55,
    floorHeightM: 0.5,
    rearInsetM: 0.6,
    bay: { heightM: 0.34, firewallHeightM: 0.56, floorDropM: 0.04, fit: 0.94 },
  },
  donorInterior: {
    // The user picked the 1973's cabin as the reference interior for every exterior-only asset.
    assetPath: '/models/fusca-1973.glb',
    match: 'SM_Interior',
    paintMaterial: 'vMAT_Volkswagen_Beetle_1968_Base1',
  },
  platform: { parts: platformParts, color: '#242424', metalness: 0.55, roughness: 0.5 },
  wheels: {
    // Only wheel-retro.glb has a full tyre at the right proportion — every option uses it until
    // tyred assets exist for the others (brain/vehicles/vw-type1/family.md#wheels).
    assets: {
      'gramlights-57cr': { path: '/models/wheels/wheel-57cr.glb', axleRealignYaw: Math.PI / 2 },
      mustang64: { path: '/models/wheels/wheel-mustang64.glb', axleRealignYaw: 0 },
      retro: { path: '/models/wheels/wheel-retro.glb', axleRealignYaw: 0 },
    },
    optionAsset: {},
    defaultAsset: 'retro',
  },
  proceduralRenderer: 'vw-type1-procedural',
}
