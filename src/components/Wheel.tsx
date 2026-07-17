import type { WheelOption } from '../data/fusca'

interface WheelProps {
  position: [number, number, number]
  wheel: WheelOption
}

export function Wheel({ position, wheel }: WheelProps) {
  const tireWidth = wheel.tireProfile === 'offroad' ? 0.28 : 0.2
  const tireRadius = wheel.tireProfile === 'offroad' ? 0.36 : 0.32
  const showWhitewall = wheel.tireProfile === 'whitewall'

  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[tireRadius, tireRadius, tireWidth, 24]} />
        <meshStandardMaterial color={showWhitewall ? '#e8e8e2' : '#1a1a1a'} roughness={0.9} />
      </mesh>
      {showWhitewall && (
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[tireRadius - 0.05, tireRadius - 0.05, tireWidth - 0.01, 24]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      )}
      <mesh position={[0, tireWidth / 2 + 0.01, 0]}>
        <cylinderGeometry args={[tireRadius * 0.6, tireRadius * 0.6, 0.02, 20]} />
        <meshStandardMaterial color={wheel.rimColor} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, -(tireWidth / 2 + 0.01), 0]}>
        <cylinderGeometry args={[tireRadius * 0.6, tireRadius * 0.6, 0.02, 20]} />
        <meshStandardMaterial color={wheel.rimColor} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}
