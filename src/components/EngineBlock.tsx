import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Air-cooled engine block — see CREDITS.md for licensing. X/Z self-centered, Y GROUND-anchored
// (bottom at 0) so callers place it by "where should the engine sit down onto" — i.e. the caller's
// Y position is the bay-floor height the block rests on. scale/rotation are per-context.
export function EngineBlock({
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number]
  scale?: number
  rotation?: [number, number, number]
}) {
  const { scene } = useGLTF('/models/engine/scene.gltf')

  const { object, centering } = useMemo(() => {
    const obj = scene.clone(true)
    obj.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(obj)
    const center = new THREE.Vector3()
    box.getCenter(center)

    // Materials render as authored (BaseColor + Normal + ORM maps from public/models/engine/
    // textures/) — the scene now provides a procedural environment map (see Scene.tsx), so the
    // engine's metallic surfaces have something to reflect and no longer need the base-colour to
    // be forced through by capping metalness / stripping the normal map, which is what the earlier
    // no-environment workaround did.
    return { object: obj, centering: [-center.x, -box.min.y, -center.z] as [number, number, number] }
  }, [scene])

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={object} position={centering} />
    </group>
  )
}

useGLTF.preload('/models/engine/scene.gltf')
