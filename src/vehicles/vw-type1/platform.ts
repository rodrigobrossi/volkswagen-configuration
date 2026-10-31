/**
 * VW Type 1 platform (chassis). The Fusca has no ladder frame: two flat floor pans welded to a
 * central tunnel, the "chapéu de napoleão" fork at the front anchoring the axle beam, and
 * crossmembers. Metres in the VEHICLE frame (origin = car centre at ground; X left(−)/right(+),
 * Y up, Z front(+)/rear(−)). Anchored on model-1980 measurements: axles z≈±1.24, track ±0.66.
 * Brain: brain/vehicles/vw-type1/platform.md.
 */
import type { PlatformPart } from '../../core/contracts/family'

export const platformParts: PlatformPart[] = [
  { id: 'floor-pan-left', label: 'Assoalho esquerdo', kind: 'box', size: [0.54, 0.05, 2.6], position: [-0.37, 0.19, -0.05], explode: [-0.55, 0.1, 0] },
  { id: 'floor-pan-right', label: 'Assoalho direito', kind: 'box', size: [0.54, 0.05, 2.6], position: [0.37, 0.19, -0.05], explode: [0.55, 0.1, 0] },
  { id: 'central-tunnel', label: 'Túnel central', kind: 'box', size: [0.2, 0.22, 2.8], position: [0, 0.28, -0.05], explode: [0, 0.55, 0] },
  { id: 'napoleon-hat', label: 'Chapéu de napoleão', kind: 'box', size: [0.5, 0.18, 0.52], position: [0, 0.25, 1.4], explode: [0, 0.15, 0.85] },
  { id: 'front-axle-beam', label: 'Viga dianteira', kind: 'tube', size: [0.05, 1.42, 0], position: [0, 0.31, 1.24], explode: [0, 0.05, 1.15] },
  { id: 'mid-crossmember', label: 'Travessa central', kind: 'box', size: [1.28, 0.08, 0.12], position: [0, 0.17, -0.05], explode: [0, -0.45, 0] },
  { id: 'rear-crossmember', label: 'Travessa traseira', kind: 'box', size: [1.34, 0.14, 0.16], position: [0, 0.26, -1.24], explode: [0, 0.1, -0.9] },
  { id: 'tunnel-ridge', label: 'Espinha do túnel', kind: 'tube', size: [0.11, 2.8, 0], tubeAxis: 'z', position: [0, 0.39, -0.05], explode: [0, 0.75, 0] },
  { id: 'napoleon-fork-left', label: 'Braço esq. (chapéu)', kind: 'box', size: [0.62, 0.1, 0.12], position: [-0.33, 0.26, 1.28], rotationYDeg: 28, explode: [-0.2, 0.15, 0.7] },
  { id: 'napoleon-fork-right', label: 'Braço dir. (chapéu)', kind: 'box', size: [0.62, 0.1, 0.12], position: [0.33, 0.26, 1.28], rotationYDeg: -28, explode: [0.2, 0.15, 0.7] },
]
