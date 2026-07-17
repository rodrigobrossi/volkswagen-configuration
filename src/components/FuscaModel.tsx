import { useMemo } from 'react'
import {
  chassisYears,
  exteriorColors,
  suspensionOptions,
  wheelOptions,
} from '../data/fusca'
import { useConfigStore } from '../store/configStore'
import { Wheel } from './Wheel'

// Real-world dimensions (meters) — see .specs/3d-model.spec.md. 1 Three.js unit = 1 meter.
const LENGTH = 4.07
const WIDTH = 1.55
const WHEELBASE = 2.4
const TRACK = 1.3
const WHEEL_RADIUS = 0.32

const HALF_L = LENGTH / 2
const HALF_W = WIDTH / 2
const AXLE_X = TRACK / 2
const FRONT_Z = WHEELBASE / 2
const REAR_Z = -WHEELBASE / 2

const CHROME = { color: '#d7d7d7', metalness: 0.85, roughness: 0.2 }
const GLASS = { color: '#0d1418', roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.82 }
const SEAM = { color: '#000000', roughness: 0.6 }

// Body shell ellipsoid params (must match the main shell mesh below) — used so glass/pillars/
// door creases hug the curved surface instead of floating off a straight box against a sphere.
const SHELL_CENTER_Y = 0.5
const SHELL_SCALE_Y = 0.68
function shellHalfWidthAtY(y: number) {
  const dy = (y - SHELL_CENTER_Y) / SHELL_SCALE_Y
  return HALF_W * Math.sqrt(Math.max(0, 1 - dy * dy))
}

// Door crease + handle: kept within a band close to the shell's equator, where curvature is
// gentle, so a straight vertical element stays close to the surface across its whole height.
const DOOR_TOP_Y = 0.8
const DOOR_BOTTOM_Y = 0.2
const DOOR_MID_Y = (DOOR_TOP_Y + DOOR_BOTTOM_Y) / 2
const DOOR_X = shellHalfWidthAtY(DOOR_MID_Y) * 0.94
const DOOR_Z = -0.05

function DoorDetails({ side }: { side: 1 | -1 }) {
  const x = side * DOOR_X
  return (
    <group>
      {/* Door crease */}
      <mesh position={[x, DOOR_MID_Y, DOOR_Z]}>
        <boxGeometry args={[0.02, DOOR_TOP_Y - DOOR_BOTTOM_Y, 0.02]} />
        <meshStandardMaterial {...SEAM} />
      </mesh>
      {/* Handle */}
      <mesh position={[x + side * 0.01, 0.62, DOOR_Z - 0.2]}>
        <boxGeometry args={[0.04, 0.03, 0.14]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
    </group>
  )
}

// Greenhouse (glass) — a smaller ellipsoid nested against the main shell, same technique as
// the shell itself so it hugs the curve by construction, plus pillars sized per-position from
// the glass ellipsoid's own equation so they stay inside its surface instead of poking out
// (the dome narrows vertically near its front/rear, same curvature issue as the door crease).
const GLASS_Y = 0.92
const GLASS_SCALE = [HALF_W * 0.58, 0.36, HALF_L * 0.5] as const

function Pillar({ z }: { z: number }) {
  const zRatio = z / GLASS_SCALE[2]
  // Place the pillar at 70% of the dome's half-width at this z, leaving room below for height.
  const xAtZ = GLASS_SCALE[0] * Math.sqrt(Math.max(0, 1 - zRatio * zRatio)) * 0.7
  const xRatio = xAtZ / GLASS_SCALE[0]
  const halfHeight = GLASS_SCALE[1] * Math.sqrt(Math.max(0.05, 1 - xRatio * xRatio - zRatio * zRatio))
  const height = halfHeight * 1.7
  return (
    <>
      <mesh position={[xAtZ, GLASS_Y, z]}>
        <boxGeometry args={[0.02, height, 0.03]} />
        <meshStandardMaterial {...SEAM} />
      </mesh>
      <mesh position={[-xAtZ, GLASS_Y, z]}>
        <boxGeometry args={[0.02, height, 0.03]} />
        <meshStandardMaterial {...SEAM} />
      </mesh>
    </>
  )
}

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
      ? { roughness: 0.85, metalness: 0.05, clearcoat: 0.05, clearcoatRoughness: 0.6 }
      : exteriorColor.finish === 'patina'
        ? { roughness: 0.95, metalness: 0.1, clearcoat: 0, clearcoatRoughness: 1 }
        : exteriorColor.finish === 'metallic'
          ? { roughness: 0.35, metalness: 0.6, clearcoat: 0.5, clearcoatRoughness: 0.2 }
          : { roughness: 0.25, metalness: 0.15, clearcoat: 0.6, clearcoatRoughness: 0.15 }

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
          <boxGeometry args={[WIDTH * 0.82, 0.12, LENGTH * 0.84]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </mesh>

        {/* Main rounded body shell (cabin + roof) */}
        <mesh position={[0, 0.5, 0]} scale={[HALF_W, 0.68, HALF_L * 0.66]} castShadow receiveShadow>
          <sphereGeometry args={[1, 32, 24]} />
          <meshPhysicalMaterial color={exteriorColor.hex} {...bodyMaterialProps} />
        </mesh>

        {/* Front hood bump (nose) */}
        <mesh position={[0, 0.32, HALF_L * 0.74]} scale={[HALF_W * 0.9, 0.4, HALF_L * 0.26]} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
          <meshPhysicalMaterial color={exteriorColor.hex} {...bodyMaterialProps} />
        </mesh>
        {/* Hood centerline seam */}
        <mesh position={[0, 0.68, HALF_L * 0.66]}>
          <boxGeometry args={[0.015, 0.015, HALF_L * 0.5]} />
          <meshStandardMaterial {...SEAM} />
        </mesh>

        {/* Rear engine cover (tail) */}
        <mesh position={[0, 0.38, -HALF_L * 0.74]} scale={[HALF_W * 0.9, 0.44, HALF_L * 0.26]} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
          <meshPhysicalMaterial color={exteriorColor.hex} {...bodyMaterialProps} />
        </mesh>
        {/* Rear vent louvers */}
        {[0.48, 0.56, 0.64, 0.72].map((y) => (
          <mesh key={y} position={[0, y, -HALF_L * 0.85]}>
            <boxGeometry args={[0.5, 0.018, 0.03]} />
            <meshStandardMaterial color="#151515" roughness={0.7} />
          </mesh>
        ))}

        {/* Greenhouse glass — nests against the shell like the shell itself is built, so it
            hugs the curve instead of floating. Pillars split it into windshield / side / rear. */}
        <mesh position={[0, GLASS_Y, 0]} scale={GLASS_SCALE} renderOrder={1}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial {...GLASS} />
        </mesh>
        <Pillar z={GLASS_SCALE[2] * 0.55} />
        <Pillar z={-0.08} />
        <Pillar z={-GLASS_SCALE[2] * 0.65} />

        {/* Doors: crease + handle */}
        <DoorDetails side={1} />
        <DoorDetails side={-1} />

        {/* Running boards */}
        <mesh position={[shellHalfWidthAtY(0.08) + 0.03, 0.05, 0]}>
          <boxGeometry args={[0.05, 0.02, WHEELBASE * 0.85]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        <mesh position={[-(shellHalfWidthAtY(0.08) + 0.03), 0.05, 0]}>
          <boxGeometry args={[0.05, 0.02, WHEELBASE * 0.85]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>

        {/* Front bumper */}
        <mesh position={[0, 0.18, HALF_L * 0.96]} castShadow>
          <boxGeometry args={[WIDTH * 0.94, 0.14, 0.12]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>

        {/* Rear bumper */}
        <mesh position={[0, 0.18, -HALF_L * 0.96]} castShadow>
          <boxGeometry args={[WIDTH * 0.94, 0.14, 0.12]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>

        {/* Headlights */}
        <mesh position={[HALF_W * 0.8, 0.55, HALF_L * 0.81]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color="#fdfdf0" emissive="#fdfdc0" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[-HALF_W * 0.8, 0.55, HALF_L * 0.81]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color="#fdfdf0" emissive="#fdfdc0" emissiveIntensity={0.3} />
        </mesh>

        {/* Taillights - shape reflects chassis era */}
        {taillightShape === 'round' && (
          <>
            <mesh position={[HALF_W * 0.88, 0.55, -HALF_L * 0.79]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-HALF_W * 0.88, 0.55, -HALF_L * 0.79]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
          </>
        )}
        {taillightShape === 'square' && (
          <>
            <mesh position={[HALF_W * 0.88, 0.55, -HALF_L * 0.8]}>
              <boxGeometry args={[0.14, 0.28, 0.06]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-HALF_W * 0.88, 0.55, -HALF_L * 0.8]}>
              <boxGeometry args={[0.14, 0.28, 0.06]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
          </>
        )}
        {taillightShape === 'vertical-oval' && (
          <>
            <mesh position={[HALF_W * 0.88, 0.53, -HALF_L * 0.79]} scale={[0.62, 1, 0.5]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-HALF_W * 0.88, 0.53, -HALF_L * 0.79]} scale={[0.62, 1, 0.5]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
          </>
        )}
      </group>
    </group>
  )
}
