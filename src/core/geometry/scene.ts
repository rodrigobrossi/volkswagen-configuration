/**
 * Scene-graph queries over a loaded asset. Pure three.js, no React.
 * Brain: brain/learnings/L-0001-gltf-name-sanitization.md, brain/algorithms/extract-node.md.
 */
import * as THREE from 'three'

/** First node with exactly this name. GLTFLoader SANITIZES names (spaces → underscores) at load:
 * always match the sanitized form. brain/learnings/L-0001-gltf-name-sanitization.md */
export function findByName(root: THREE.Object3D, name: string): THREE.Object3D | undefined {
  let found: THREE.Object3D | undefined
  root.traverse((obj) => {
    if (!found && obj.name === name) found = obj
  })
  return found
}

/** Every mesh whose (sanitized) name contains any of the tokens. */
export function collectMeshes(root: THREE.Object3D, tokens: string[]): THREE.Mesh[] {
  const out: THREE.Mesh[] = []
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && tokens.some((t) => o.name.includes(t))) out.push(o)
  })
  return out
}

/**
 * Resolves one `node` match token to a SINGLE riggable object: the exact node when one exists;
 * otherwise every mesh containing the token wrapped in one Group (attach() keeps world poses), so
 * a part authored as several meshes (paint + trim) hinges off ONE combined bbox instead of
 * drifting apart. brain/algorithms/extract-node.md
 */
export function resolveNodeGroup(root: THREE.Object3D, token: string): THREE.Object3D | undefined {
  const exact = findByName(root, token)
  if (exact) return exact
  const matches = collectMeshes(root, [token])
  if (matches.length === 0) return undefined
  if (matches.length === 1 && matches[0].parent) return matches[0]
  const host = matches[0].parent ?? root
  const group = new THREE.Group()
  group.name = `rig:${token}`
  host.add(group)
  group.updateMatrixWorld(true)
  matches.forEach((m) => group.attach(m))
  return group
}

/** Only the node's OWN mesh children — deliberately shallow (some assets nest the rear axle
 * inside the front axle node). brain/learnings/L-0006-nested-axle-nodes.md */
export function directMeshChildren(node: THREE.Object3D): THREE.Mesh[] {
  return node.children.filter((c): c is THREE.Mesh => c instanceof THREE.Mesh)
}

// Sketchfab bakes a licence watermark plate as its own mesh, material named like "2020-2025".
const WATERMARK_MATERIAL_PATTERN = /^\d{4}-\d{4}$/

/** Drops store watermark plates. brain/learnings/L-0004-sketchfab-watermark.md */
export function removeWatermarkNodes(root: THREE.Object3D) {
  const toRemove: THREE.Object3D[] = []
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return
    const materials = Array.isArray(node.material) ? node.material : [node.material]
    if (materials.some((mat) => WATERMARK_MATERIAL_PATTERN.test(mat.name))) toRemove.push(node)
  })
  toRemove.forEach((node) => node.parent?.remove(node))
}

/** Material of a mesh (first slot for multi-material meshes). */
export function meshMaterial(mesh: THREE.Mesh): THREE.Material | undefined {
  return Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
}
