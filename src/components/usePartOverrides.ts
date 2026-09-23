import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { CarModelDef } from '../data/carModels'
import { partKeyForMesh, type PartGroupBy } from '../data/carParts'
import { partKey, usePartsStore, type Finish } from '../store/partsStore'

// Acabamentos (roughness/metalness) reaproveitados do FuscaModel/useBodyPaint para consistência.
const FINISH: Record<Finish, { roughness: number; metalness: number }> = {
  matte: { roughness: 0.85, metalness: 0.05 },
  patina: { roughness: 0.95, metalness: 0.1 },
  metallic: { roughness: 0.35, metalness: 0.6 },
  gloss: { roughness: 0.25, metalness: 0.15 },
}

type PartMat = THREE.MeshStandardMaterial & { __partClone?: boolean }

function hasHingeAncestor(mesh: THREE.Object3D, root: THREE.Object3D): boolean {
  let p: THREE.Object3D | null = mesh.parent
  while (p && p !== root) {
    if (p.userData?.isHinge) return true
    p = p.parent
  }
  return false
}

/**
 * Aplica os overrides por-peça (mostrar/ocultar, cor/acabamento e transformação) às malhas do modelo
 * real, agrupando cada malha pela chave de peça (ver carParts.ts).
 *
 * Ocultar/cor: por malha, guardando material/visibilidade ORIGINAIS (WeakMap) para reverter.
 * Transformação: por PEÇA — na primeira vez que uma peça recebe posição/escala/rotação, suas malhas
 * são reparented para um GRUPO-PIVÔ no centro da peça; depois é só mover/girar/escalar esse grupo.
 * Peças articuladas (com uma dobradiça no caminho — userData.isHinge) são puladas para não quebrar a
 * abertura de portas/tampas.
 */
export function usePartOverrides(object: THREE.Object3D, model: CarModelDef, groupBy: PartGroupBy) {
  const overrides = usePartsStore((s) => s.partOverrides)
  const original = useRef(new WeakMap<THREE.Mesh, { material: THREE.Material | THREE.Material[]; visible: boolean }>())
  const hiddenByUs = useRef(new Set<THREE.Mesh>())
  const pivots = useRef(new Map<string, { group: THREE.Group; pivot: THREE.Vector3 }>())

  // Novo objeto (troca de modelo) → esquece os grupos-pivô do anterior.
  useEffect(() => {
    pivots.current = new Map()
  }, [object])

  useEffect(() => {
    const baseScale = model.calibration.scale
    const meshesByPart = new Map<string, THREE.Mesh[]>()

    // Passo 1 — ocultar/cor por malha, e coleta das malhas por peça.
    object.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      if ((mesh.geometry as THREE.BufferGeometry | undefined)?.type === 'PlaneGeometry') return
      const key = partKeyForMesh(mesh, groupBy)
      if (!key) return
      ;(meshesByPart.get(key) ?? meshesByPart.set(key, []).get(key)!).push(mesh)
      const ov = overrides[partKey(model.key, key)]

      if (!original.current.has(mesh)) original.current.set(mesh, { material: mesh.material, visible: mesh.visible })
      const orig = original.current.get(mesh)!

      if (ov?.hidden) {
        mesh.visible = false
        hiddenByUs.current.add(mesh)
      } else if (hiddenByUs.current.has(mesh)) {
        mesh.visible = orig.visible
        hiddenByUs.current.delete(mesh)
      }

      if (ov?.color && !Array.isArray(mesh.material)) {
        let mat = mesh.material as PartMat
        if (!mat.__partClone) {
          mat = (mesh.material as THREE.Material).clone() as PartMat
          mat.__partClone = true
          mesh.material = mat
        }
        if (mat.color) mat.color.set(ov.color)
        if (mat.map) mat.map = null
        if (ov.finish && mat.isMeshStandardMaterial) {
          mat.roughness = FINISH[ov.finish].roughness
          mat.metalness = FINISH[ov.finish].metalness
        }
        mat.needsUpdate = true
      } else if ((mesh.material as PartMat).__partClone) {
        mesh.material = orig.material
      }
    })

    // Passo 2 — transformação por peça (grupo-pivô).
    for (const [key, meshes] of meshesByPart) {
      const ov = overrides[partKey(model.key, key)]
      const hasXf = !!(ov && (ov.position || ov.scale || ov.rotation))
      const cached = pivots.current.get(key)

      if (hasXf) {
        // Cria o grupo-pivô na primeira vez (pula peças articuladas).
        let entry = cached
        if (!entry) {
          if (meshes.some((m) => hasHingeAncestor(m, object))) continue
          const box = new THREE.Box3()
          meshes.forEach((m) => box.expandByObject(m))
          if (box.isEmpty()) continue
          const worldPivot = box.getCenter(new THREE.Vector3())
          object.updateWorldMatrix(true, false)
          const pivot = object.worldToLocal(worldPivot.clone())
          const group = new THREE.Group()
          group.position.copy(pivot)
          object.add(group)
          meshes.forEach((m) => group.attach(m))
          entry = { group, pivot }
          pivots.current.set(key, entry)
        }
        const { group, pivot } = entry
        const [px, py, pz] = ov!.position ?? [0, 0, 0]
        group.position.set(pivot.x + px / baseScale, pivot.y + py / baseScale, pivot.z + pz / baseScale)
        const [sx, sy, sz] = ov!.scale ?? [1, 1, 1]
        group.scale.set(sx, sy, sz)
        const [rx, ry, rz] = ov!.rotation ?? [0, 0, 0]
        group.rotation.set(THREE.MathUtils.degToRad(rx), THREE.MathUtils.degToRad(ry), THREE.MathUtils.degToRad(rz))
      } else if (cached) {
        // Transformação removida → volta o grupo-pivô à identidade.
        cached.group.position.copy(cached.pivot)
        cached.group.scale.set(1, 1, 1)
        cached.group.rotation.set(0, 0, 0)
      }
    }
  }, [object, model.key, model.calibration.scale, overrides, groupBy])
}
