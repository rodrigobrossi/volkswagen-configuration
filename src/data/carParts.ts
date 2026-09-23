import * as THREE from 'three'

/**
 * Descoberta automática de "peças" a partir dos arquivos GLTF, para o configurador por-peça
 * (mostrar/ocultar + cor por peça) — ver usePartConfig / RealCarModel e o painel "Peças" no
 * ConfigPanel. Uma peça = um conjunto de malhas do GLTF agrupadas por uma CHAVE.
 *
 * A chave vem do próprio arquivo, mas QUAL campo é legível varia por modelo:
 *  - model-1980: os NÓS têm nomes bons (phares, feux_ar, porte, capot…) e os materiais são
 *    genéricos (Mat_0, Mat.2…) → agrupa por nome do nó (`partGroupBy: 'node'`, o padrão).
 *  - model-1968 / model-1948: os nós são genéricos (Object_23…) mas os MATERIAIS são bons
 *    (Body, Glass, Chrom, Wheel… / metal_schwarz, glas, spiegel…) → agrupa por material.
 *  - model-ratlook: ambos genéricos (material0000…) → agrupa por material mesmo assim (separa as
 *    superfícies, com rótulos "Superfície N").
 */

export type PartGroupBy = 'node' | 'material'

export interface CarPart {
  /** Chave estável da peça (base do nome do nó, ou nome do material). */
  key: string
  /** Rótulo amigável (traduzido quando conhecido, senão o nome cru embelezado). */
  label: string
  /** Quantas malhas compõem a peça. */
  count: number
}

// Tokens finais descartáveis ao derivar a base de um nome de nó (material/índice do exportador).
const DROP_TOKEN = /^(mat\d*|jantes|pneus|joint|noir|chrome|material\d*|glass|verre|vitre|verres)$/i

/** Base "lógica" de um nome de nó: "phares_Mat3_0" → "phares", "retro_ext_joint_0" → "retro_ext".
 * Também descarta tokens vazios de duplo-underscore ("feux_ar__0" → "feux_ar"). */
export function nodeBaseName(name: string): string {
  const tokens = name.split('_')
  while (tokens.length > 1) {
    const last = tokens[tokens.length - 1]
    if (last === '' || /^\d+$/.test(last) || DROP_TOKEN.test(last) || /^[0-9a-f]{6}$/i.test(last)) tokens.pop()
    else break
  }
  return tokens.filter(Boolean).join('_') || name
}

/** A chave de peça de UMA malha, conforme a estratégia do modelo. */
export function partKeyForMesh(mesh: THREE.Mesh, groupBy: PartGroupBy): string | null {
  if (groupBy === 'material') {
    const mat = mesh.material as THREE.Material | THREE.Material[]
    if (Array.isArray(mat)) return mat[0]?.name || null
    return mat?.name || null
  }
  return mesh.name ? nodeBaseName(mesh.name) : null
}

// Rótulos PT para chaves conhecidas (nós FR do 1980; materiais do 1968/1948). Chave em minúsculas.
const PART_LABELS: Record<string, string> = {
  // model-1980 (nós, francês)
  phares: 'Faróis',
  feux_ar: 'Lanternas traseiras',
  porte: 'Portas',
  capot: 'Capô dianteiro',
  capot_moteur: 'Tampa do motor',
  retro_ext: 'Retrovisores',
  jonc_lateral: 'Frisos laterais',
  jonc_capot: 'Friso do capô',
  jonc_aile_av: 'Frisos dos para-lamas',
  roue: 'Rodas',
  roue_1: 'Rodas traseiras',
  echappement: 'Escapamento',
  plaque_av: 'Placa dianteira',
  plaque_ar: 'Placa traseira',
  pc_av: 'Para-choque dianteiro',
  pc_ar: 'Para-choque traseiro',
  ailes_av: 'Para-lamas dianteiros',
  ailes_ar: 'Para-lamas traseiros',
  joue: 'Laterais dianteiras',
  toit: 'Teto',
  toit_2: 'Teto',
  vitres: 'Vidros laterais',
  lunette: 'Vidro traseiro',
  pb: 'Para-brisa',
  poignee_porte: 'Maçanetas',
  poignee_capot: 'Maçaneta do capô',
  plaquette: 'Maçaneta',
  joint_porte: 'Borrachas das portas',
  joint_custode: 'Borracha da custódia',
  joint_ailes_ar: 'Borrachas traseiras',
  joint_aile_av: 'Borrachas dianteiras',
  joint_eclair: 'Frisos',
  deflecteurs: 'Defletores',
  ouies: 'Grelhas do motor',
  logo: 'Emblema',
  serrure: 'Fechadura',
  goutiere: 'Calhas',
  jupe_av: 'Saia dianteira',
  jupe_ar: 'Saia traseira',
  lave_glace: 'Esguicho',
  sweep: 'Molduras dos vidros',
  sweep_2: 'Molduras dos vidros',
  supp: 'Suportes',
  supports_pc: 'Suportes do para-choque',
  cube: 'Estrutura',
  cube_2: 'Assoalho',
  cube_3: 'Estrutura',
  cylinder: 'Estrutura',
  cylinder_2: 'Estrutura',
  passages_roues: 'Caixas de roda',
  '1303': 'Emblema 1303',
  // model-1968 / model-ratlook (materiais, inglês)
  body: 'Carroceria',
  paint_new: 'Carroceria',
  glass: 'Vidros',
  chrom: 'Cromados',
  wheel: 'Rodas',
  interior: 'Interior',
  headlight: 'Faróis',
  tail_lights: 'Lanternas',
  reverse_lights: 'Luz de ré',
  orange_plastic: 'Plásticos laranja',
  plate: 'Placa',
  // model-1948 (materiais, alemão)
  metal_schwarz: 'Pintura',
  metal_weis: 'Cromados',
  glas: 'Vidros',
  spiegel: 'Retrovisores',
  gummi: 'Borrachas',
  chrom_alt: 'Cromados',
  schwazmatt: 'Pintura fosca',
  schwarzmatt: 'Pintura fosca',
  wei_matt: 'Detalhes claros',
  weissmatt: 'Detalhes claros',
  lights: 'Faróis',
  eg: 'Vidro do retrovisor',
  lateral: 'Laterais',
}

function prettify(key: string): string {
  const known = PART_LABELS[key.toLowerCase()]
  if (known) return known
  if (/^material\d+$/i.test(key)) return `Superfície ${Number(key.replace(/\D/g, '')) + 1}`
  // fallback: troca _ por espaço, primeira letra maiúscula
  const s = key.replace(/_/g, ' ').trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Enumera as peças de um objeto GLTF já carregado, agrupando conforme `groupBy`. Ordena por rótulo. */
export function discoverParts(object: THREE.Object3D, groupBy: PartGroupBy): CarPart[] {
  const counts = new Map<string, number>()
  object.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    if ((mesh.geometry as THREE.BufferGeometry | undefined)?.type === 'PlaneGeometry') return // helpers
    const key = partKeyForMesh(mesh, groupBy)
    if (!key) return
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: prettify(key), count }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}
