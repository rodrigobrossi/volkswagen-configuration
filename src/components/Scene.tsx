import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { CarModel } from './CarModel'
import { useConfigStore } from '../store/configStore'

// Image-based lighting for every PBR material in the scene (car paint, glass, the engine block's
// metallic surfaces, wheel rims). Uses three's PROCEDURAL RoomEnvironment (a small scene of
// emissive panels baked into a PMREM cubemap) rather than loading an .hdr — an external HDRI fetch
// hung in this sandboxed dev setup once, and this needs no network at all. Without an environment
// map, highly-metallic surfaces have nothing to reflect and render as near-black regardless of
// their textures; with it, they read as real metal and the base-colour maps show through.
function ProceduralEnvironment() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTexture
    return () => {
      envTexture.dispose()
      pmrem.dispose()
      scene.environment = null
    }
  }, [gl, scene])
  return null
}

export function Scene() {
  const autoRotate = useConfigStore((s) => s.autoRotate)

  return (
    <Canvas shadows camera={{ position: [4.5, 2.2, 5], fov: 40 }} onCreated={(state) => { (window as unknown as { __r3f?: unknown; __scene?: THREE.Scene }).__r3f = state; (window as unknown as { __scene?: THREE.Scene }).__scene = state.scene }}>
      <color attach="background" args={['#1b1d22']} />
      <ProceduralEnvironment />
      <hemisphereLight args={['#8899aa', '#101112', 0.6]} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 6, 4]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 3, -4]} intensity={0.4} />
      <CarModel />
      <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={10} blur={2} far={2} />
      <gridHelper args={[20, 20, '#333333', '#2a2a2a']} position={[0, 0.001, 0]} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={3}
        maxDistance={10}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate={autoRotate}
        autoRotateSpeed={2}
        enableDamping
        dampingFactor={0.1}
      />
    </Canvas>
  )
}
