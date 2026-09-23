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

// wheelOptions.id -> which real wheel model stands in for it on a real GLTF car.
//
// TODAS as opções usam a BRM (wheel-retro.glb) por enquanto. Motivo: dos 3 assets, só a BRM tem um
// PNEU completo e proporção correta — a mustang64 e a 57cr renderizavam "sem pneu" (só o aro/calota)
// e em tamanhos diferentes, então as rodas ficavam inconsistentes de modelo para modelo. Padronizar
// na BRM garante pneu + tamanho uniforme em todos os carros (pedido do usuário: "todas no tamanho da
// BRM"). Para voltar a ter variedade de estilos, é preciso de assets de roda que também tenham pneu.
export const wheelOptionModel: Record<string, RealWheelModelKey> = {
  'steel-stock': 'retro',
  'whitewall-classic': 'retro',
  'aco-hubcap': 'retro',
  'empi-5-spoke': 'retro',
  'baja-offroad': 'retro',
  'brm-style': 'retro',
}
