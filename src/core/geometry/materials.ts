/**
 * Material analysis: which material is the body paint, what colour it reads as.
 * Brain: brain/algorithms/paint-detection.md, brain/learnings/L-0005-textured-paint.md.
 */
import * as THREE from 'three'

/** Average colour of a texture (linear space). Paint baked into a map with a white base factor
 * reads white from material.color alone — sampling the image recovers the real colour. */
export function averageTextureColor(map: THREE.Texture): THREE.Color | null {
  const img = map.image as CanvasImageSource & { width?: number; height?: number }
  if (!img || !img.width) return null
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 16
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  try {
    ctx.drawImage(img, 0, 0, 16, 16)
  } catch {
    return null // cross-origin taint or undecodable — caller falls back
  }
  const data = ctx.getImageData(0, 0, 16, 16).data
  let r = 0
  let g = 0
  let b = 0
  const n = data.length / 4
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
  }
  return new THREE.Color(r / n / 255, g / n / 255, b / n / 255).convertSRGBToLinear()
}

function isOpaqueStandard(mat: THREE.Material | THREE.Material[] | undefined): mat is THREE.MeshStandardMaterial {
  if (!mat || Array.isArray(mat)) return false
  const m = mat as THREE.MeshStandardMaterial
  if (!m.color) return false
  return !(m.transparent && m.opacity < 0.9) // glass is never paint
}

/**
 * Volume-weighted vote: the opaque non-glass material covering the most mesh-bbox volume.
 * `skipNearBlack` drops flat near-black materials (rubber/interior) — used for the engine-bay tint,
 * NOT for recolouring (a car's paint may legitimately be black).
 */
export function dominantMaterial(object: THREE.Object3D, skipNearBlack: boolean): THREE.MeshStandardMaterial | null {
  const volumeByMat = new Map<THREE.MeshStandardMaterial, number>()
  const box = new THREE.Box3()
  const size = new THREE.Vector3()
  object.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || !isOpaqueStandard(mesh.material)) return
    const mat = mesh.material as THREE.MeshStandardMaterial
    if (skipNearBlack && !mat.map && mat.color.r + mat.color.g + mat.color.b < 0.12) return
    box.setFromObject(mesh)
    box.getSize(size)
    volumeByMat.set(mat, (volumeByMat.get(mat) ?? 0) + size.x * size.y * size.z)
  })
  let best: THREE.MeshStandardMaterial | null = null
  let bestVol = -1
  for (const [mat, vol] of volumeByMat) {
    if (vol > bestVol) {
      bestVol = vol
      best = mat
    }
  }
  return best
}

/** The asset's ORIGINAL body colour (engine-bay tint). Samples textured paint. */
export function findBodyColor(object: THREE.Object3D): THREE.Color {
  const best = dominantMaterial(object, true)
  if (!best) return new THREE.Color('#3a3a3a')
  if (best.map) {
    const sampled = averageTextureColor(best.map)
    if (sampled) return sampled
  }
  return best.color.clone()
}

/** Every mesh that is body paint: the explicit material names, else every mesh sharing the
 * dominant material (auto). brain/algorithms/paint-detection.md */
export function findPaintMeshes(object: THREE.Object3D, explicitMaterials?: string[]): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = []
  if (explicitMaterials?.length) {
    const names = new Set(explicitMaterials)
    object.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh && !Array.isArray(mesh.material) && names.has(mesh.material.name)) meshes.push(mesh)
    })
    return meshes
  }
  const dominant = dominantMaterial(object, false)
  if (!dominant) return []
  object.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (mesh.isMesh && mesh.material === dominant) meshes.push(mesh)
  })
  return meshes
}
