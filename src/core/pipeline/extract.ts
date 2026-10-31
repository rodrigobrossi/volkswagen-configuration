/**
 * Stage 2 — extract: turn an ExtractStrategy into the concrete panel objects to articulate.
 * Every strategy works in the BUILD frame. Brain: brain/contracts/extraction-strategy.md and one
 * algorithm note per strategy (extract-node, split-merged-x, region-clip, trim-pass).
 */
import * as THREE from 'three'
import type { ExtractStrategy, FractionBox } from '../contracts/profile'
import { clipMeshByWorldBox, detachSlice, fractionsToBox, splitNodeByWorldX } from '../geometry/mesh-ops'
import { collectMeshes, findByName, meshMaterial, resolveNodeGroup } from '../geometry/scene'

/** Clips every mesh of `meshes` by `box`; slices go into `group`. True when anything was taken. */
function clipInto(meshes: THREE.Mesh[], box: THREE.Box3, group: THREE.Group): boolean {
  let got = false
  meshes.forEach((src) => {
    if (!src.parent) return
    const { inside, outside } = clipMeshByWorldBox(src, box)
    if (!inside) return
    group.attach(detachSlice(src, inside, outside))
    got = true
  })
  return got
}

/**
 * region-clip: the panel is fused into the shell with no node of its own. Fractions are of the
 * FIRST `source` token's bbox (the shell) so they stay tied to the panel — even when a trim pass
 * cuts a mesh whose own bbox spans the whole cabin. One group per side (R then L).
 * brain/algorithms/region-clip.md, brain/algorithms/trim-pass.md
 */
function extractRegion(object: THREE.Object3D, strategy: Extract<ExtractStrategy, { kind: 'region-clip' }>, label: string) {
  const refBox = new THREE.Box3()
  collectMeshes(object, [strategy.source[0]]).forEach((m) => refBox.expandByObject(m))
  const refMin = refBox.min.clone()
  const refSize = refBox.getSize(new THREE.Vector3())

  const passes: { region: FractionBox; meshes: THREE.Mesh[] }[] = [
    { region: strategy.region, meshes: collectMeshes(object, strategy.source) },
  ]
  if (strategy.trim) {
    const exclude = strategy.trim.excludeMaterials ?? []
    const trimMeshes = collectMeshes(object, strategy.trim.match).filter((m) => {
      const name = meshMaterial(m)?.name ?? ''
      return !exclude.some((t) => name.includes(t))
    })
    passes.push({ region: strategy.trim.region, meshes: trimMeshes })
  }

  const nodes: THREE.Object3D[] = []
  const sides = strategy.mirrorX ? [1, -1] : [1]
  sides.forEach((sx) => {
    const group = new THREE.Group()
    group.name = `cut:${label}:${sx > 0 ? 'R' : 'L'}`
    object.add(group)
    group.updateMatrixWorld(true)
    let got = false
    passes.forEach(({ region, meshes }) => {
      if (clipInto(meshes, fractionsToBox(region, refMin, refSize, sx < 0), group)) got = true
    })
    if (got) nodes.push(group)
    else object.remove(group)
  })
  return nodes
}

export function extractPanels(object: THREE.Object3D, strategy: ExtractStrategy, label: string): THREE.Object3D[] {
  switch (strategy.kind) {
    case 'region-clip':
      return extractRegion(object, strategy, label)
    case 'node-split-x': {
      const source = findByName(object, strategy.match)
      if (!source?.parent) return []
      const { left, right } = splitNodeByWorldX(source)
      const parent = source.parent
      parent.remove(source)
      parent.add(left)
      parent.add(right)
      return [left, right]
    }
    case 'node': {
      const nodes: THREE.Object3D[] = []
      strategy.match.forEach((name) => {
        const node = resolveNodeGroup(object, name)
        if (node) nodes.push(node)
      })
      return nodes
    }
  }
}
