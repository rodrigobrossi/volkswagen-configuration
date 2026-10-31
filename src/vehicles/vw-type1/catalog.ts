/**
 * VW Type 1 (Fusca / Beetle) catalog — hand-curated reference data inspired by Brazilian
 * production history and customization scenes. NOT scraped or verified against factory records:
 * a baseline to refine. Brain: brain/vehicles/vw-type1/catalog.md.
 * Adding an option: use the `add-catalog-option` skill (it walks brain/specs/catalog.md).
 */
import type { CatalogOption, OptionGroup, PaintOption, StylePreset, WheelOption } from '../../core/contracts/catalog'

export type BodyStyle = 'oval' | 'round-tail' | 'square-tail' | 'itamar'
export type TaillightShape = 'round' | 'square' | 'vertical-oval'

export interface EraOption extends CatalogOption {
  yearRange: string
  bodyStyle: BodyStyle
  taillightShape: TaillightShape
  note: string
}
export interface SteeringOption extends CatalogOption {
  rimMaterial: 'plastic' | 'wood' | 'sport'
}
export interface SuspensionOption extends CatalogOption {
  /** Relative offset from stock, negative = lowered. */
  rideHeightMm: number
}
export interface InteriorOption extends CatalogOption {
  hex: string
  material: 'vinyl' | 'fabric' | 'bucket-sport'
}
export interface EngineOption extends CatalogOption {
  displacementCc: number
  parts: string[]
}

export const eras: EraOption[] = [
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

export const wheels: WheelOption[] = [
  { id: 'steel-stock', label: 'Steel Stock', rimColor: '#c9cdd1', rimStyle: 'hubcap', tireProfile: 'street', note: 'Painted steel wheel, factory look.' },
  { id: 'whitewall-classic', label: 'Chrome + Whitewall', rimColor: '#e8e8e2', rimStyle: 'hubcap', tireProfile: 'whitewall', note: 'Chrome rim with whitewall tire, classic resto style.' },
  { id: 'empi-5-spoke', label: 'EMPI 5-Spoke', rimColor: '#f2f2f2', rimStyle: 'five-spoke', tireProfile: 'street', note: 'Popular aftermarket alloy wheel in the Cal Look scene, 5 visible spokes.' },
  { id: 'brm-style', label: 'BRM-Style', rimColor: '#d8b23a', rimStyle: 'multi-spoke', tireProfile: 'street', note: 'BRM-inspired wheel, a Brazilian custom-scene favorite, 10 thin spokes around a small center cap.' },
  { id: 'baja-offroad', label: 'Baja Off-Road', rimColor: '#3b3b3b', rimStyle: 'five-spoke', tireProfile: 'offroad', note: 'Wide knobby tire on a steel rim, for Baja Bug builds.' },
  { id: 'aco-hubcap', label: 'Aço + Calota (Meu Fusca)', rimColor: '#c7c9c7', rimStyle: 'hubcap', tireProfile: 'street', note: 'Painted steel wheel with a small chrome hubcap, matching the reference photos closely.' },
]

export const steering: SteeringOption[] = [
  { id: 'stock-plastic', label: 'Stock Plastic', rimMaterial: 'plastic', note: 'Factory two-spoke wheel by era.' },
  { id: 'wood-classic', label: 'Wood Rim Classic', rimMaterial: 'wood', note: 'Grant/EMPI-style wood-rim wheel, popular in resto builds.' },
  { id: 'sport-banana', label: 'Sport "Banana"', rimMaterial: 'sport', note: 'Slim sport wheel common in Cal Look and lowered builds.' },
]

export const suspension: SuspensionOption[] = [
  { id: 'slammed', label: 'Rebaixado (Slammed)', rideHeightMm: -60, note: 'Lowered stance typical of Brazilian street Fuscas.' },
  { id: 'stock-height', label: 'Stock', rideHeightMm: 0, note: 'Factory ride height.' },
  { id: 'raised-baja', label: 'Raised (Baja)', rideHeightMm: 50, note: 'Lifted for off-road Baja Bug builds.' },
]

export const paints: PaintOption[] = [
  { id: 'perola-branca', label: 'Pérola (Pearl White)', hex: '#f2efe6', finish: 'gloss' },
  { id: 'bege-bahia', label: 'Bege Bahia', hex: '#d8c39c', finish: 'gloss' },
  { id: 'vermelho-cordoba', label: 'Vermelho Córdoba', hex: '#9c2b2b', finish: 'gloss' },
  { id: 'azul-aster', label: 'Azul Aster', hex: '#3b5a78', finish: 'metallic' },
  { id: 'verde-rio', label: 'Verde Rio', hex: '#4a6b4f', finish: 'gloss' },
  { id: 'preto', label: 'Preto (Black)', hex: '#181818', finish: 'gloss' },
  { id: 'amarelo-pele', label: 'Amarelo Pele', hex: '#e0b84a', finish: 'gloss' },
  { id: 'matte-cinza', label: 'Cinza Fosco (Matte Grey)', hex: '#8a8a86', finish: 'matte' },
  { id: 'patina-bare', label: 'Patina / Rat Look', hex: '#7a6a52', finish: 'patina' },
  // Sampled from reference/fusca-photos — not an official VW factory code.
  { id: 'meu-fusca-cobre', label: 'Cobre Metálico (Meu Fusca)', hex: '#b2502d', finish: 'metallic' },
]

export const interiors: InteriorOption[] = [
  { id: 'black-vinyl', label: 'Black Vinyl', hex: '#141414', material: 'vinyl' },
  { id: 'off-white-vinyl', label: 'Off-White Vinyl', hex: '#e6ded0', material: 'vinyl' },
  { id: 'tan-vinyl', label: 'Tan Vinyl', hex: '#b08a5a', material: 'vinyl' },
  { id: 'houndstooth', label: 'Houndstooth Fabric', hex: '#3a3a3a', material: 'fabric' },
  { id: 'red-bucket', label: 'Red Sport Bucket', hex: '#7a1f1f', material: 'bucket-sport' },
]

export const engines: EngineOption[] = [
  { id: '1200-stock', label: '1200cc Stock', displacementCc: 1200, parts: ['Single carb', 'Stock exhaust'] },
  { id: '1300-stock', label: '1300cc Stock', displacementCc: 1300, parts: ['Single carb', 'Stock exhaust'] },
  { id: '1500-stock', label: '1500cc Stock', displacementCc: 1500, parts: ['Single carb', 'Stock exhaust'] },
  { id: '1600-performance', label: '1600cc Performance', displacementCc: 1600, parts: ['Dual carbs', 'Upgraded headers', 'Oil cooler'] },
]

/** Group order = panel order. Group ids are the keys of Configuration.selections. */
export const optionGroups: OptionGroup[] = [
  { id: 'era', role: 'era', title: 'Chassis Year', ui: 'select', options: eras },
  { id: 'paint', role: 'paint', title: 'Exterior Color', ui: 'color', options: paints },
  { id: 'wheels', role: 'wheels', title: 'Wheels', ui: 'swatch', options: wheels },
  { id: 'suspension', role: 'suspension', title: 'Suspension Height', ui: 'swatch', options: suspension, fallbackIndex: 1 },
  { id: 'steering', role: 'steering', title: 'Steering Wheel', ui: 'swatch', options: steering },
  { id: 'interior', role: 'interior', title: 'Interior', ui: 'color', options: interiors },
  { id: 'engine', role: 'engine', title: 'Engine', ui: 'swatch', options: engines },
]

// "Rebaixado" is a suspension height (and, later, the "catraca mexicana"), not a preset.
export const presets: StylePreset[] = [
  {
    id: 'baja-bug',
    label: 'Baja Bug',
    description: 'Raised off-road suspension, knobby tires, rugged stock cabin.',
    selections: { era: 'round-66-70', wheels: 'baja-offroad', steering: 'stock-plastic', suspension: 'raised-baja', paint: 'amarelo-pele', interior: 'tan-vinyl', engine: '1600-performance' },
  },
  {
    id: 'rat-look',
    label: 'Rat Look / Patina',
    description: 'Bare patina body, mismatched steel wheels, unapologetically weathered.',
    selections: { era: 'oval-59-65', wheels: 'steel-stock', steering: 'wood-classic', suspension: 'slammed', paint: 'patina-bare', interior: 'black-vinyl', engine: '1300-stock' },
  },
  {
    id: 'resto-stock',
    label: 'Resto / Stock',
    description: 'Period-correct factory-original look.',
    selections: { era: 'round-66-70', wheels: 'whitewall-classic', steering: 'stock-plastic', suspension: 'stock-height', paint: 'bege-bahia', interior: 'off-white-vinyl', engine: '1300-stock' },
  },
  {
    id: 'meu-fusca',
    label: 'Meu Fusca (Reference)',
    description: 'Approximation of the reference car in reference/fusca-photos: copper metallic, steel wheels with small hubcaps, sport steering wheel, stock ride height.',
    selections: { era: 'square-71-85', wheels: 'aco-hubcap', steering: 'sport-banana', suspension: 'stock-height', paint: 'meu-fusca-cobre', interior: 'black-vinyl', engine: '1300-stock' },
  },
]
