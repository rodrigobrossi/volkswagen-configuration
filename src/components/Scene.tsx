import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { CarModel } from './CarModel'
import { useConfigStore } from '../store/configStore'

export function Scene() {
  const autoRotate = useConfigStore((s) => s.autoRotate)

  return (
    <Canvas shadows camera={{ position: [4.5, 2.2, 5], fov: 40 }}>
      <color attach="background" args={['#1b1d22']} />
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
