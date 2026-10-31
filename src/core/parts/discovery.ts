/**
 * Part discovery for the per-part editor: groups an asset's meshes into user-facing "parts" by a
 * readable key — node base name or material name, whichever the asset authored legibly (declared
 * in the profile: `parts.groupBy`). Labels come from the ontology vocabulary.
 * Brain: brain/algorithms/part-discovery.md.
 */
import * as THREE from 'three'
import { lookupToken } from '../ontology'

export type PartGroupBy = 'node' | 'material'

export interface CarPart {
  /** Stable key (node base name or material name). */
  key: string
  label: string
  /** Meshes composing the part. */
  count: number
}

// Exporter suffixes that carry no meaning (material/index/colour tokens).
const DROP_TOKEN = /^(mat\d*|jantes|pneus|joint|noir|chrome|material\d*|glass|verre|vitre|verres)$/i

/** "phares_Mat3_0" → "phares", "retro_ext_joint_0" → "retro_ext", "feux_ar__0" → "feux_ar". */
export function nodeBaseName(name: string): string {
  const tokens = name.split('_')
  while (tokens.length > 1) {
    const last = tokens[tokens.length - 1]
    if (last === '' || /^\d+$/.test(last) || DROP_TOKEN.test(last) || /^[0-9a-f]{6}$/i.test(last)) tokens.pop()
    else break
  }
  return tokens.filter(Boolean).join('_') || name
}

export function partKeyForMesh(mesh: THREE.Mesh, groupBy: PartGroupBy): string | null {
  if (groupBy === 'material') {
    const mat = mesh.material as THREE.Material | THREE.Material[]
    if (Array.isArray(mat)) return mat[0]?.name || null
    return mat?.name || null
  }
  return mesh.name ? nodeBaseName(mesh.name) : null
}

export function partLabel(key: string): string {
  const known = lookupToken(key)?.label
  if (known) return known
  if (/^material\d+$/i.test(key)) return `Superfície ${Number(key.replace(/\D/g, '')) + 1}`
  const s = key.replace(/_/g, ' ').trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

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
    .map(([key, count]) => ({ key, label: partLabel(key), count }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}
