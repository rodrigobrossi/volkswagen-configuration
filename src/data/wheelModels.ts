/**
 * Maps the curated `wheelOptions` catalog (fusca.ts) onto the 3 real, licensed wheel `.glb`
 * models (see CREDITS.md / RealWheel.tsx) used to visually swap wheels on real GLTF car models
 * (see RealCarModel.tsx). Only 3 real wheel assets exist for ~6 curated options, so some options
 * share a model — picked for closest visual match, verified by opening each asset's own node/
 * material dump, not guessed from its filename alone.
 */

export type RealWheelModelKey = 'gramlights-57cr' | 'mustang64' | 'retro'

export interface RealWheelModelConfig {
  path: string
  /** Extra yaw (radians) applied on top of the per-hub left/right mirror rotation in
   * RealCarModel.tsx, to bring this model's own native axle axis in line with the car's local X
   * (left-right) axle direction. Determined by loading each wheel .glb and comparing its bounding
   * box dimensions: the axle is always the SMALLEST of the three (the disc's own thickness), so
   * this is 0 when that smallest dimension is already native X, or a 90° yaw when it's native Z
   * instead (only wheel-57cr.glb — its own bounds are ~0.50 x 0.50 x 0.24, thinnest axis Z).
   * wheel-mustang64.glb (~0.21 x 0.64 x 0.64) and wheel-retro.glb (~0.58 x 2.00 x 2.00) are both
   * already thinnest along X, so 0. NOT yet confirmed against an actual render (this sandbox has
   * no browser) — verify tread/spoke orientation reads correctly by screenshot before trusting it.
   */
  axleRealignYaw: number
}

export const realWheelModels: Record<RealWheelModelKey, RealWheelModelConfig> = {
  'gramlights-57cr': { path: '/models/wheels/wheel-57cr.glb', axleRealignYaw: Math.PI / 2 },
  mustang64: { path: '/models/wheels/wheel-mustang64.glb', axleRealignYaw: 0 },
  retro: { path: '/models/wheels/wheel-retro.glb', axleRealignYaw: 0 },
}

// wheelOptions.id -> which real wheel model stands in for it on a real GLTF car. Chosen by
// matching each option's rimStyle to the closest of the 3 real assets:
// - 'hubcap' options (steel-stock, whitewall-classic, aco-hubcap) -> wheel-mustang64.glb, a
//   classic chrome/steel wheel with a domed hubcap-like center, the closest of the 3 to a factory
//   steel wheel silhouette.
// - 'five-spoke' options (empi-5-spoke, baja-offroad) -> wheel-57cr.glb, a mesh/spoked alloy
//   wheel — untextured flat-color materials (verified: no baseColorTexture on any of its 4
//   materials, just baseColorFactor), so its plain grey disc material can still be recolored via
//   rimColor (see RealWheel.tsx's tint prop) to tell baja's dark steel apart from EMPI's light alloy.
// - 'multi-spoke' (brm-style) -> wheel-retro.glb, its thin multi-spoke design is the closest
//   visual match to a BRM-style wheel among the 3.
export const wheelOptionModel: Record<string, RealWheelModelKey> = {
  'steel-stock': 'mustang64',
  'whitewall-classic': 'mustang64',
  'aco-hubcap': 'mustang64',
  'empi-5-spoke': 'gramlights-57cr',
  'baja-offroad': 'gramlights-57cr',
  'brm-style': 'retro',
}
