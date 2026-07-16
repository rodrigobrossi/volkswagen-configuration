import { useMemo } from 'react'
import {
  chassisYears,
  exteriorColors,
  suspensionOptions,
  wheelOptions,
} from '../data/fusca'
import { useConfigStore } from '../store/configStore'
import { Wheel } from './Wheel'

const WHEEL_RADIUS = 0.38
const AXLE_X = 1.15
const FRONT_Z = 1.35
const REAR_Z = -1.35

export function FuscaModel() {
  const chassisYearId = useConfigStore((s) => s.chassisYearId)
  const wheelId = useConfigStore((s) => s.wheelId)
  const suspensionId = useConfigStore((s) => s.suspensionId)
  const exteriorColorId = useConfigStore((s) => s.exteriorColorId)

  const chassisYear = useMemo(
    () => chassisYears.find((c) => c.id === chassisYearId) ?? chassisYears[0],
    [chassisYearId],
  )
  const wheel = useMemo(
    () => wheelOptions.find((w) => w.id === wheelId) ?? wheelOptions[0],
    [wheelId],
  )
  const suspension = useMemo(
    () => suspensionOptions.find((s) => s.id === suspensionId) ?? suspensionOptions[1],
    [suspensionId],
  )
  const exteriorColor = useMemo(
    () => exteriorColors.find((c) => c.id === exteriorColorId) ?? exteriorColors[0],
    [exteriorColorId],
  )

  const bodyLift = (suspension.rideHeightMm / 1000) * 2.5
  const bodyMaterialProps =
    exteriorColor.finish === 'matte'
      ? { roughness: 0.85, metalness: 0.05 }
      : exteriorColor.finish === 'patina'
        ? { roughness: 0.95, metalness: 0.1 }
        : exteriorColor.finish === 'metallic'
          ? { roughness: 0.35, metalness: 0.6 }
          : { roughness: 0.25, metalness: 0.15 }

  const taillightShape = chassisYear.taillightShape

  return (
    <group>
      {/* Wheels stay fixed at ground height regardless of suspension */}
      <Wheel position={[AXLE_X, WHEEL_RADIUS, FRONT_Z]} wheel={wheel} />
      <Wheel position={[-AXLE_X, WHEEL_RADIUS, FRONT_Z]} wheel={wheel} />
      <Wheel position={[AXLE_X, WHEEL_RADIUS, REAR_Z]} wheel={wheel} />
      <Wheel position={[-AXLE_X, WHEEL_RADIUS, REAR_Z]} wheel={wheel} />

      {/* Body group rides up/down with suspension setting */}
      <group position={[0, WHEEL_RADIUS + bodyLift, 0]}>
        {/* Chassis pan */}
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.12, 3.4]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </mesh>

        {/* Main rounded body shell */}
        <mesh position={[0, 0.55, 0]} scale={[1, 0.62, 1.9]} castShadow receiveShadow>
          <sphereGeometry args={[0.95, 32, 24]} />
          <meshStandardMaterial color={exteriorColor.hex} {...bodyMaterialProps} />
        </mesh>

        {/* Front hood bump */}
        <mesh position={[0, 0.35, 1.55]} scale={[0.85, 0.4, 0.5]} castShadow>
          <sphereGeometry args={[0.9, 24, 16]} />
          <meshStandardMaterial color={exteriorColor.hex} {...bodyMaterialProps} />
        </mesh>

        {/* Rear engine cover */}
        <mesh position={[0, 0.4, -1.55]} scale={[0.85, 0.45, 0.45]} castShadow>
          <sphereGeometry args={[0.9, 24, 16]} />
          <meshStandardMaterial color={exteriorColor.hex} {...bodyMaterialProps} />
        </mesh>

        {/* Window belt */}
        <mesh position={[0, 0.98, 0]} scale={[0.72, 0.34, 1.35]}>
          <sphereGeometry args={[0.9, 24, 16]} />
          <meshStandardMaterial color="#12181c" roughness={0.15} metalness={0.4} transparent opacity={0.85} />
        </mesh>

        {/* Front bumper */}
        <mesh position={[0, 0.18, 1.78]} castShadow>
          <boxGeometry args={[1.5, 0.14, 0.12]} />
          <meshStandardMaterial color="#d7d7d7" metalness={0.8} roughness={0.25} />
        </mesh>

        {/* Rear bumper */}
        <mesh position={[0, 0.18, -1.78]} castShadow>
          <boxGeometry args={[1.5, 0.14, 0.12]} />
          <meshStandardMaterial color="#d7d7d7" metalness={0.8} roughness={0.25} />
        </mesh>

        {/* Headlights */}
        <mesh position={[0.62, 0.55, 1.65]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color="#fdfdf0" emissive="#fdfdc0" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[-0.62, 0.55, 1.65]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color="#fdfdf0" emissive="#fdfdc0" emissiveIntensity={0.3} />
        </mesh>

        {/* Taillights - shape reflects chassis era */}
        {taillightShape === 'round' && (
          <>
            <mesh position={[0.68, 0.55, -1.6]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-0.68, 0.55, -1.6]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
          </>
        )}
        {taillightShape === 'square' && (
          <>
            <mesh position={[0.68, 0.55, -1.62]}>
              <boxGeometry args={[0.14, 0.28, 0.06]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-0.68, 0.55, -1.62]}>
              <boxGeometry args={[0.14, 0.28, 0.06]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
          </>
        )}
        {taillightShape === 'vertical-oval' && (
          <>
            <mesh position={[0.68, 0.53, -1.6]} scale={[0.62, 1, 0.5]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-0.68, 0.53, -1.6]} scale={[0.62, 1, 0.5]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
          </>
        )}
      </group>
    </group>
  )
}
