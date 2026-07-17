import type { WheelOption } from '../data/fusca'

interface WheelProps {
  position: [number, number, number]
  wheel: WheelOption
}

// One face of the wheel (the car's left or right side). Rendered in the disc's own local XZ
// plane (its normal is local Y) so spokes just rotate around Y to fan out radially.
function WheelFace({
  y,
  radius,
  thickness,
  rimColor,
  rimStyle,
}: {
  y: number
  radius: number
  thickness: number
  rimColor: string
  rimStyle: WheelOption['rimStyle']
}) {
  const rimMaterial = { color: rimColor, metalness: 0.6, roughness: 0.3 }

  if (rimStyle === 'hubcap') {
    return (
      <group position={[0, y, 0]}>
        <mesh>
          <cylinderGeometry args={[radius, radius, thickness, 20]} />
          <meshStandardMaterial {...rimMaterial} />
        </mesh>
        {/* Raised dome center, like a real hubcap */}
        <mesh position={[0, Math.sign(y) * thickness * 0.6, 0]}>
          <sphereGeometry args={[radius * 0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial {...rimMaterial} />
        </mesh>
      </group>
    )
  }

  const spokeCount = rimStyle === 'five-spoke' ? 5 : 10
  const spokeWidth = rimStyle === 'five-spoke' ? 0.045 : 0.022

  return (
    <group position={[0, y, 0]}>
      {/* Small center hub */}
      <mesh>
        <cylinderGeometry args={[radius * 0.22, radius * 0.22, thickness, 16]} />
        <meshStandardMaterial {...rimMaterial} />
      </mesh>
      {/* Outer rim lip */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.96, thickness * 0.5, 6, 24]} />
        <meshStandardMaterial {...rimMaterial} />
      </mesh>
      {/* Spokes fan out radially in this face's own plane */}
      {Array.from({ length: spokeCount }, (_, i) => (
        <group key={i} rotation={[0, (i * Math.PI * 2) / spokeCount, 0]}>
          <mesh position={[0, 0, radius * 0.56]}>
            <boxGeometry args={[spokeWidth, thickness, radius * 0.72]} />
            <meshStandardMaterial {...rimMaterial} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function Wheel({ position, wheel }: WheelProps) {
  const tireWidth = wheel.tireProfile === 'offroad' ? 0.28 : 0.2
  const tireRadius = wheel.tireProfile === 'offroad' ? 0.36 : 0.32
  const showWhitewall = wheel.tireProfile === 'whitewall'
  const rimRadius = tireRadius * 0.6
  const rimThickness = 0.02

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
      <WheelFace
        y={tireWidth / 2 + 0.01}
        radius={rimRadius}
        thickness={rimThickness}
        rimColor={wheel.rimColor}
        rimStyle={wheel.rimStyle}
      />
      <WheelFace
        y={-(tireWidth / 2 + 0.01)}
        radius={rimRadius}
        thickness={rimThickness}
        rimColor={wheel.rimColor}
        rimStyle={wheel.rimStyle}
      />
    </group>
  )
}
