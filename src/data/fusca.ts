/**
 * Curated reference data for the Fusca (VW Beetle, Brazilian market) configurator.
 *
 * This is a hand-curated baseline inspired by real Fusca production history and
 * well-known Brazilian customization scenes (Cal Look, Baja Bug, Rat Look/patina,
 * resto-stock, "rebaixado" street style). It is not scraped live from the internet —
 * treat it as a starting reference set to refine with verified sources over time.
 */

export type BodyStyle = 'oval' | 'round-tail' | 'square-tail' | 'itamar'
export type TaillightShape = 'round' | 'square' | 'vertical-oval'

export interface ChassisYear {
  id: string
  label: string
  yearRange: string
  bodyStyle: BodyStyle
  taillightShape: TaillightShape
  note: string
}

export interface WheelOption {
  id: string
  label: string
  rimColor: string
  tireProfile: 'street' | 'whitewall' | 'offroad'
  note: string
}

export interface SteeringWheelOption {
  id: string
  label: string
  rimMaterial: 'plastic' | 'wood' | 'sport'
  note: string
}

export interface SuspensionOption {
  id: string
  label: string
  rideHeightMm: number // relative offset from stock, negative = lowered
  note: string
}

export interface ExteriorColor {
  id: string
  label: string
  hex: string
  finish: 'gloss' | 'matte' | 'metallic' | 'patina'
}

export interface InteriorOption {
  id: string
  label: string
  hex: string
  material: 'vinyl' | 'fabric' | 'bucket-sport'
}

export interface EngineOption {
  id: string
  label: string
  displacementCc: number
  parts: string[]
}

export interface StylePreset {
  id: string
  label: string
  description: string
  config: {
    chassisYearId: string
    wheelId: string
    steeringWheelId: string
    suspensionId: string
    exteriorColorId: string
    interiorId: string
    engineId: string
  }
}

export const chassisYears: ChassisYear[] = [
  {
    id: 'oval-59-65',
    label: '1959–1965',
    yearRange: '1959-1965',
    bodyStyle: 'oval',
    taillightShape: 'round',
    note: 'Early Brazilian production, oval rear window, split/narrow bumpers.',
  },
  {
    id: 'round-66-70',
    label: '1966–1970',
    yearRange: '1966-1970',
    bodyStyle: 'round-tail',
    taillightShape: 'round',
    note: 'Larger rear window, round "olho-de-boi" taillights introduced.',
  },
  {
    id: 'square-71-85',
    label: '1971–1985',
    yearRange: '1971-1985',
    bodyStyle: 'square-tail',
    taillightShape: 'vertical-oval',
    note: 'Curved windshield (from 1973), vertical oval taillights, MacPherson front end (from 1976). Matches the reference car in reference/fusca-photos.',
  },
  {
    id: 'itamar-86-96',
    label: '1986–1996',
    yearRange: '1986-1996',
    bodyStyle: 'itamar',
    taillightShape: 'square',
    note: 'Final Brazilian production run, incl. the 1993-1996 "Fusca Itamar" relaunch.',
  },
]

export const wheelOptions: WheelOption[] = [
  {
    id: 'steel-stock',
    label: 'Steel Stock',
    rimColor: '#c9cdd1',
    tireProfile: 'street',
    note: 'Painted steel wheel, factory look.',
  },
  {
    id: 'whitewall-classic',
    label: 'Chrome + Whitewall',
    rimColor: '#e8e8e2',
    tireProfile: 'whitewall',
    note: 'Chrome rim with whitewall tire, classic resto style.',
  },
  {
    id: 'empi-5-spoke',
    label: 'EMPI 5-Spoke',
    rimColor: '#f2f2f2',
    tireProfile: 'street',
    note: 'Popular aftermarket alloy wheel in the Cal Look scene.',
  },
  {
    id: 'brm-style',
    label: 'BRM-Style',
    rimColor: '#d8b23a',
    tireProfile: 'street',
    note: 'BRM-inspired wheel, a Brazilian custom-scene favorite.',
  },
  {
    id: 'baja-offroad',
    label: 'Baja Off-Road',
    rimColor: '#3b3b3b',
    tireProfile: 'offroad',
    note: 'Wide knobby tire on a steel rim, for Baja Bug builds.',
  },
  {
    id: 'aco-hubcap',
    label: 'Aço + Calota (Meu Fusca)',
    rimColor: '#c7c9c7',
    tireProfile: 'street',
    note: 'Painted steel wheel with a small chrome hubcap, matching the reference photos closely.',
  },
]

export const steeringWheelOptions: SteeringWheelOption[] = [
  {
    id: 'stock-plastic',
    label: 'Stock Plastic',
    rimMaterial: 'plastic',
    note: 'Factory two-spoke wheel by era.',
  },
  {
    id: 'wood-classic',
    label: 'Wood Rim Classic',
    rimMaterial: 'wood',
    note: 'Grant/EMPI-style wood-rim wheel, popular in resto builds.',
  },
  {
    id: 'sport-banana',
    label: 'Sport "Banana"',
    rimMaterial: 'sport',
    note: 'Slim sport wheel common in Cal Look and lowered builds.',
  },
]

export const suspensionOptions: SuspensionOption[] = [
  {
    id: 'slammed',
    label: 'Rebaixado (Slammed)',
    rideHeightMm: -60,
    note: 'Lowered stance typical of Brazilian street Fuscas.',
  },
  {
    id: 'stock-height',
    label: 'Stock',
    rideHeightMm: 0,
    note: 'Factory ride height.',
  },
  {
    id: 'raised-baja',
    label: 'Raised (Baja)',
    rideHeightMm: 50,
    note: 'Lifted for off-road Baja Bug builds.',
  },
]

export const exteriorColors: ExteriorColor[] = [
  { id: 'perola-branca', label: 'Pérola (Pearl White)', hex: '#f2efe6', finish: 'gloss' },
  { id: 'bege-bahia', label: 'Bege Bahia', hex: '#d8c39c', finish: 'gloss' },
  { id: 'vermelho-cordoba', label: 'Vermelho Córdoba', hex: '#9c2b2b', finish: 'gloss' },
  { id: 'azul-aster', label: 'Azul Aster', hex: '#3b5a78', finish: 'metallic' },
  { id: 'verde-rio', label: 'Verde Rio', hex: '#4a6b4f', finish: 'gloss' },
  { id: 'preto', label: 'Preto (Black)', hex: '#181818', finish: 'gloss' },
  { id: 'amarelo-pele', label: 'Amarelo Pele', hex: '#e0b84a', finish: 'gloss' },
  { id: 'matte-cinza', label: 'Cinza Fosco (Matte Grey)', hex: '#8a8a86', finish: 'matte' },
  { id: 'patina-bare', label: 'Patina / Rat Look', hex: '#7a6a52', finish: 'patina' },
  {
    // Sampled from reference/fusca-photos, not an official VW factory color code.
    id: 'meu-fusca-cobre',
    label: 'Cobre Metálico (Meu Fusca)',
    hex: '#b2502d',
    finish: 'metallic',
  },
]

export const interiorOptions: InteriorOption[] = [
  { id: 'black-vinyl', label: 'Black Vinyl', hex: '#141414', material: 'vinyl' },
  { id: 'off-white-vinyl', label: 'Off-White Vinyl', hex: '#e6ded0', material: 'vinyl' },
  { id: 'tan-vinyl', label: 'Tan Vinyl', hex: '#b08a5a', material: 'vinyl' },
  { id: 'houndstooth', label: 'Houndstooth Fabric', hex: '#3a3a3a', material: 'fabric' },
  { id: 'red-bucket', label: 'Red Sport Bucket', hex: '#7a1f1f', material: 'bucket-sport' },
]

export const engineOptions: EngineOption[] = [
  { id: '1200-stock', label: '1200cc Stock', displacementCc: 1200, parts: ['Single carb', 'Stock exhaust'] },
  { id: '1300-stock', label: '1300cc Stock', displacementCc: 1300, parts: ['Single carb', 'Stock exhaust'] },
  { id: '1500-stock', label: '1500cc Stock', displacementCc: 1500, parts: ['Single carb', 'Stock exhaust'] },
  {
    id: '1600-performance',
    label: '1600cc Performance',
    displacementCc: 1600,
    parts: ['Dual carbs', 'Upgraded headers', 'Oil cooler'],
  },
]

export const stylePresets: StylePreset[] = [
  {
    id: 'cal-look',
    label: 'Cal Look',
    description: 'Lowered stance, EMPI wheels, minimalist chrome, sport steering wheel.',
    config: {
      chassisYearId: 'square-71-85',
      wheelId: 'empi-5-spoke',
      steeringWheelId: 'sport-banana',
      suspensionId: 'slammed',
      exteriorColorId: 'preto',
      interiorId: 'black-vinyl',
      engineId: '1600-performance',
    },
  },
  {
    id: 'baja-bug',
    label: 'Baja Bug',
    description: 'Raised off-road suspension, knobby tires, rugged stock cabin.',
    config: {
      chassisYearId: 'round-66-70',
      wheelId: 'baja-offroad',
      steeringWheelId: 'stock-plastic',
      suspensionId: 'raised-baja',
      exteriorColorId: 'amarelo-pele',
      interiorId: 'tan-vinyl',
      engineId: '1600-performance',
    },
  },
  {
    id: 'rat-look',
    label: 'Rat Look / Patina',
    description: 'Bare patina body, mismatched steel wheels, unapologetically weathered.',
    config: {
      chassisYearId: 'oval-59-65',
      wheelId: 'steel-stock',
      steeringWheelId: 'wood-classic',
      suspensionId: 'slammed',
      exteriorColorId: 'patina-bare',
      interiorId: 'black-vinyl',
      engineId: '1300-stock',
    },
  },
  {
    id: 'resto-stock',
    label: 'Resto / Stock',
    description: 'Period-correct factory-original look.',
    config: {
      chassisYearId: 'round-66-70',
      wheelId: 'whitewall-classic',
      steeringWheelId: 'stock-plastic',
      suspensionId: 'stock-height',
      exteriorColorId: 'bege-bahia',
      interiorId: 'off-white-vinyl',
      engineId: '1300-stock',
    },
  },
  {
    id: 'rebaixado-br',
    label: 'Rebaixado (Brazilian Street)',
    description: 'Lowered street style with custom wheels and a modern interior touch.',
    config: {
      chassisYearId: 'itamar-86-96',
      wheelId: 'brm-style',
      steeringWheelId: 'sport-banana',
      suspensionId: 'slammed',
      exteriorColorId: 'azul-aster',
      interiorId: 'red-bucket',
      engineId: '1500-stock',
    },
  },
  {
    id: 'meu-fusca',
    label: 'Meu Fusca (Reference)',
    description: 'Approximation of the reference car in reference/fusca-photos: copper metallic, steel wheels with small hubcaps, sport steering wheel, stock ride height.',
    config: {
      chassisYearId: 'square-71-85',
      wheelId: 'aco-hubcap',
      steeringWheelId: 'sport-banana',
      suspensionId: 'stock-height',
      exteriorColorId: 'meu-fusca-cobre',
      interiorId: 'black-vinyl',
      engineId: '1300-stock',
    },
  },
]
