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
const GLASS = { color: '#0a1216', roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.85 }
const SEAM = { color: '#000000', roughness: 0.6 }

// Body is composed of 4 overlapping ellipsoids rather than one symmetric blob: a wide, low
// LOWER_BODY spanning nearly the full length, a low tapering HOOD (front) and slightly taller
// REAR_DECK, and a distinctly NARROWER, taller, rear-biased CABIN sitting on top. The width/
// height difference between CABIN and LOWER_BODY is what creates a visible shoulder/beltline —
// a single ellipsoid can't do this because it's symmetric and has no shoulder line at all.
const LOWER_BODY = { y: 0.36, scale: [HALF_W, 0.4, HALF_L * 0.9] as const }
const HOOD = { y: 0.28, z: HALF_L * 0.7, scale: [HALF_W * 0.8, 0.24, HALF_L * 0.32] as const }
const REAR_DECK = { y: 0.33, z: -HALF_L * 0.66, scale: [HALF_W * 0.84, 0.3, HALF_L * 0.34] as const }
const CABIN = { y: 0.8, z: -0.12, scale: [HALF_W * 0.68, 0.38, HALF_L * 0.44] as const }

function halfWidthAt(center: { y: number; scale: readonly [number, number, number] }, y: number) {
  const dy = (y - center.y) / center.scale[1]
  return center.scale[0] * Math.sqrt(Math.max(0, 1 - dy * dy))
}

// Door crease + handle: kept within LOWER_BODY's gently-curved equator band so a straight
// vertical element stays close to the surface across its whole height.
const DOOR_TOP_Y = 0.62
const DOOR_BOTTOM_Y = 0.14
const DOOR_MID_Y = (DOOR_TOP_Y + DOOR_BOTTOM_Y) / 2
const DOOR_X = halfWidthAt(LOWER_BODY, DOOR_MID_Y) * 0.95
const DOOR_Z = -0.05

function DoorDetails({ side }: { side: 1 | -1 }) {
  const x = side * DOOR_X
  return (
    <group>
      {/* Door crease */}
      <mesh position={[x, DOOR_MID_Y, DOOR_Z]}>
        <boxGeometry args={[0.03, DOOR_TOP_Y - DOOR_BOTTOM_Y, 0.03]} />
        <meshStandardMaterial {...SEAM} />
      </mesh>
      {/* Handle */}
      <mesh position={[x + side * 0.015, 0.52, DOOR_Z - 0.22]}>
        <boxGeometry args={[0.05, 0.035, 0.16]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
    </group>
  )
}

// Greenhouse (glass) — nested against CABIN using the same ellipsoid technique so it hugs the
// curve by construction. Pillars are sized per-position from the glass ellipsoid's own equation
// (it narrows vertically near its front/rear) so they stay inside the surface, not poking out.
const GLASS_Y = 0.84
const GLASS_Z = CABIN.z
const GLASS_SCALE = [HALF_W * 0.6, 0.32, HALF_L * 0.4] as const

function Pillar({ z }: { z: number }) {
  const zRatio = (z - GLASS_Z) / GLASS_SCALE[2]
  const xAtZ = GLASS_SCALE[0] * Math.sqrt(Math.max(0, 1 - zRatio * zRatio)) * 0.72
  const xRatio = xAtZ / GLASS_SCALE[0]
  const halfHeight = GLASS_SCALE[1] * Math.sqrt(Math.max(0.05, 1 - xRatio * xRatio - zRatio * zRatio))
  const height = halfHeight * 1.8
  return (
    <>
      <mesh position={[xAtZ, GLASS_Y, z]}>
        <boxGeometry args={[0.03, height, 0.04]} />
        <meshStandardMaterial {...SEAM} />
      </mesh>
      <mesh position={[-xAtZ, GLASS_Y, z]}>
        <boxGeometry args={[0.03, height, 0.04]} />
        <meshStandardMaterial {...SEAM} />
      </mesh>
    </>
  )
}

const ARCH_RADIUS = WHEEL_RADIUS + 0.1

// A smooth half-ring (torus, arc=π) arcing over the top of each wheel from back to front,
// tying the wheel visually into the body instead of leaving a gap. rotation.y=90° turns the
// torus (normally flat in the XY plane) so it stands in the Y-Z plane, arcing over Y.
function FenderArch({
  x,
  z,
  color,
  materialProps,
}: {
  x: number
  z: number
  color: string
  materialProps: Record<string, number>
}) {
  return (
    <mesh position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]} castShadow>
      <torusGeometry args={[ARCH_RADIUS, 0.07, 10, 24, Math.PI * 1.1]} />
      <meshPhysicalMaterial color={color} {...materialProps} />
    </mesh>
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
        <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
          <boxGeometry args={[WIDTH * 0.82, 0.1, LENGTH * 0.84]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </mesh>

        {/* Fender arches over each wheel, tying wheels visually to the body */}
        <FenderArch x={AXLE_X} z={FRONT_Z} color={exteriorColor.hex} materialProps={bodyMaterialProps} />
        <FenderArch x={-AXLE_X} z={FRONT_Z} color={exteriorColor.hex} materialProps={bodyMaterialProps} />
        <FenderArch x={AXLE_X} z={REAR_Z} color={exteriorColor.hex} materialProps={bodyMaterialProps} />
        <FenderArch x={-AXLE_X} z={REAR_Z} color={exteriorColor.hex} materialProps={bodyMaterialProps} />

        {/* Lower body: wide, low, spans nearly the full length */}
        <mesh position={[0, LOWER_BODY.y, 0]} scale={LOWER_BODY.scale} castShadow receiveShadow>
          <sphereGeometry args={[1, 32, 24]} />
          <meshPhysicalMaterial color={exteriorColor.hex} {...bodyMaterialProps} />
        </mesh>

        {/* Hood (front, low, tapering to the nose) */}
        <mesh position={[0, HOOD.y, HOOD.z]} scale={HOOD.scale} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
          <meshPhysicalMaterial color={exteriorColor.hex} {...bodyMaterialProps} />
        </mesh>
        {/* Hood centerline seam */}
        <mesh position={[0, HOOD.y + HOOD.scale[1] * 0.75, HOOD.z * 0.85]}>
          <boxGeometry args={[0.02, 0.02, HALF_L * 0.5]} />
          <meshStandardMaterial {...SEAM} />
        </mesh>

        {/* Rear deck (engine lid, slightly taller than the hood) */}
        <mesh position={[0, REAR_DECK.y, REAR_DECK.z]} scale={REAR_DECK.scale} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
          <meshPhysicalMaterial color={exteriorColor.hex} {...bodyMaterialProps} />
        </mesh>
        {/* Rear vent louvers */}
        {[0.42, 0.5, 0.58, 0.66].map((y) => (
          <mesh key={y} position={[0, y, -HALF_L * 0.82]}>
            <boxGeometry args={[0.5, 0.02, 0.035]} />
            <meshStandardMaterial color="#151515" roughness={0.7} />
          </mesh>
        ))}

        {/* Cabin/roof: distinctly narrower + taller + rear-biased — this is what creates the
            visible shoulder/beltline against the wider lower body below it. */}
        <mesh position={[0, CABIN.y, CABIN.z]} scale={CABIN.scale} castShadow receiveShadow>
          <sphereGeometry args={[1, 32, 24]} />
          <meshPhysicalMaterial color={exteriorColor.hex} {...bodyMaterialProps} />
        </mesh>

        {/* Greenhouse glass, split into windshield / side / rear by pillars */}
        <mesh position={[0, GLASS_Y, GLASS_Z]} scale={GLASS_SCALE} renderOrder={1}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial {...GLASS} />
        </mesh>
        <Pillar z={GLASS_Z + GLASS_SCALE[2] * 0.55} />
        <Pillar z={GLASS_Z} />
        <Pillar z={GLASS_Z - GLASS_SCALE[2] * 0.62} />

        {/* Doors: crease + handle */}
        <DoorDetails side={1} />
        <DoorDetails side={-1} />

        {/* Running boards */}
        <mesh position={[halfWidthAt(LOWER_BODY, 0.08) + 0.04, 0.05, 0]}>
          <boxGeometry args={[0.06, 0.025, WHEELBASE * 0.85]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        <mesh position={[-(halfWidthAt(LOWER_BODY, 0.08) + 0.04), 0.05, 0]}>
          <boxGeometry args={[0.06, 0.025, WHEELBASE * 0.85]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>

        {/* Front bumper */}
        <mesh position={[0, 0.16, HALF_L * 0.96]} castShadow>
          <boxGeometry args={[WIDTH * 0.94, 0.14, 0.12]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>

        {/* Rear bumper */}
        <mesh position={[0, 0.16, -HALF_L * 0.96]} castShadow>
          <boxGeometry args={[WIDTH * 0.94, 0.14, 0.12]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>

        {/* Headlights */}
        <mesh position={[HALF_W * 0.78, 0.42, HALF_L * 0.86]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color="#fdfdf0" emissive="#fdfdc0" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[-HALF_W * 0.78, 0.42, HALF_L * 0.86]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color="#fdfdf0" emissive="#fdfdc0" emissiveIntensity={0.3} />
        </mesh>

        {/* Taillights - shape reflects chassis era */}
        {taillightShape === 'round' && (
          <>
            <mesh position={[HALF_W * 0.86, 0.42, -HALF_L * 0.86]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-HALF_W * 0.86, 0.42, -HALF_L * 0.86]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
          </>
        )}
        {taillightShape === 'square' && (
          <>
            <mesh position={[HALF_W * 0.86, 0.42, -HALF_L * 0.87]}>
              <boxGeometry args={[0.14, 0.28, 0.06]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-HALF_W * 0.86, 0.42, -HALF_L * 0.87]}>
              <boxGeometry args={[0.14, 0.28, 0.06]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
          </>
        )}
        {taillightShape === 'vertical-oval' && (
          <>
            <mesh position={[HALF_W * 0.86, 0.4, -HALF_L * 0.86]} scale={[0.62, 1, 0.5]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-HALF_W * 0.86, 0.4, -HALF_L * 0.86]} scale={[0.62, 1, 0.5]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color="#8a1f1f" emissive="#4a0000" emissiveIntensity={0.4} />
            </mesh>
          </>
        )}
      </group>
    </group>
  )
}
