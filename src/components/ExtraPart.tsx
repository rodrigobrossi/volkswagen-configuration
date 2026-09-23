import { useEffect, useMemo, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { getAssetURL } from '../data/partsAssets'
import type { ExtraPart as ExtraPartData } from '../store/partsStore'

// Renderiza uma peça GLTF ADICIONADA pelo usuário, dentro do grupo (já escalado) do modelo. A peça é
// centrada e normalizada para ~1 m no maior lado (base previsível); daí os sliders de posição (m),
// escala (multiplicador) e rotação (graus) do partsStore posicionam/dimensionam ela sobre o carro.
// Posições/escala vêm em metros/mundo → divididas por baseScale (a mesma convenção das outras peças).
function LoadedPart({ url, data, baseScale }: { url: string; data: ExtraPartData; baseScale: number }) {
  const { scene } = useGLTF(url)
  const { object, center, norm } = useMemo(() => {
    const obj = scene.clone(true)
    obj.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(obj)
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    return { object: obj, center: box.getCenter(new THREE.Vector3()), norm: 1 / maxDim }
  }, [scene])

  const s = baseScale
  const [px, py, pz] = data.position
  const [sx, sy, sz] = data.scale
  const [rx, ry, rz] = data.rotation
  return (
    <group
      position={[px / s, py / s, pz / s]}
      rotation={[THREE.MathUtils.degToRad(rx), THREE.MathUtils.degToRad(ry), THREE.MathUtils.degToRad(rz)]}
      scale={[sx / s, sy / s, sz / s]}
    >
      <group scale={norm}>
        <primitive object={object} position={[-center.x, -center.y, -center.z]} />
      </group>
    </group>
  )
}

export function ExtraPart({ data, baseScale }: { data: ExtraPartData; baseScale: number }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    let created: string | null = null
    getAssetURL(data.assetId).then((u) => {
      if (active) {
        created = u
        setUrl(u)
      } else if (u) {
        URL.revokeObjectURL(u)
      }
    })
    return () => {
      active = false
      if (created) URL.revokeObjectURL(created)
    }
  }, [data.assetId])

  if (!url) return null
  return <LoadedPart url={url} data={data} baseScale={baseScale} />
}
