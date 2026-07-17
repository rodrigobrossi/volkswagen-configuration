import { useMemo } from 'react'
import {
  chassisYears,
  exteriorColors,
  interiorOptions,
  steeringWheelOptions,
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

// Front trunk lid (porta-malas) = the HOOD mesh, hinged near the cowl (its rear/top edge,
// closest to the windshield) and rotated open around local X.
const TRUNK_HINGE = {
  y: HOOD.y + HOOD.scale[1] * 0.6,
  z: HOOD.z - HOOD.scale[2] * 0.85,
}
const HOOD_LOCAL = { y: HOOD.y - TRUNK_HINGE.y, z: HOOD.z - TRUNK_HINGE.z }
const HOOD_SEAM_ABS = { y: HOOD.y + HOOD.scale[1] * 0.75, z: HOOD.z * 0.85 }
const HOOD_SEAM_LOCAL = { y: HOOD_SEAM_ABS.y - TRUNK_HINGE.y, z: HOOD_SEAM_ABS.z - TRUNK_HINGE.z }
const TRUNK_OPEN_ANGLE = -1.1

// Engine lid (tampa do motor) = the REAR_DECK mesh, hinged near the cabin (its front/top edge)
// and rotated open around local X — mirrored from the trunk since it's at the opposite end.
const ENGINE_LID_HINGE = {
  y: REAR_DECK.y + REAR_DECK.scale[1] * 0.6,
  z: REAR_DECK.z + REAR_DECK.scale[2] * 0.85,
}
const REAR_DECK_LOCAL = { y: REAR_DECK.y - ENGINE_LID_HINGE.y, z: REAR_DECK.z - ENGINE_LID_HINGE.z }
const VENT_Y = [0.42, 0.5, 0.58, 0.66]
const VENT_Z_ABS = -HALF_L * 0.82
const ENGINE_LID_OPEN_ANGLE = 1.1

// Doors: a real panel mesh (not just a seam line) hinged at its front edge (vertical axis),
// swinging outward when open. DOOR_X/DOOR_MID_Y/DOOR_Z match the previous crease-only version's
// position so the panel sits where the seam used to be.
const DOOR_TOP_Y = 0.62
const DOOR_BOTTOM_Y = 0.14
const DOOR_MID_Y = (DOOR_TOP_Y + DOOR_BOTTOM_Y) / 2
const DOOR_X = halfWidthAt(LOWER_BODY, DOOR_MID_Y) * 0.95
const DOOR_Z = -0.05
const DOOR_WIDTH = 0.7
const DOOR_HEIGHT = DOOR_TOP_Y - DOOR_BOTTOM_Y
const DOOR_HINGE_Z = DOOR_Z + DOOR_WIDTH / 2
const DOOR_OPEN_ANGLE = 1.3

function DoorDetails({
  side,
  open,
  color,
  materialProps,
}: {
  side: 1 | -1
  open: boolean
  color: string
  materialProps: Record<string, number>
}) {
  const x = side * DOOR_X
  return (
    <group position={[x, DOOR_MID_Y, DOOR_HINGE_Z]} rotation={[0, open ? side * -DOOR_OPEN_ANGLE : 0, 0]}>
      {/* Door panel */}
      <mesh position={[0, 0, -DOOR_WIDTH / 2]} castShadow>
        <boxGeometry args={[0.06, DOOR_HEIGHT, DOOR_WIDTH]} />
        <meshPhysicalMaterial color={color} {...materialProps} />
      </mesh>
      {/* Front + rear seam accents */}
      <mesh position={[side * 0.032, 0, -0.01]}>
        <boxGeometry args={[0.005, DOOR_HEIGHT, 0.02]} />
        <meshStandardMaterial {...SEAM} />
      </mesh>
      <mesh position={[side * 0.032, 0, -DOOR_WIDTH + 0.01]}>
        <boxGeometry args={[0.005, DOOR_HEIGHT, 0.02]} />
        <meshStandardMaterial {...SEAM} />
      </mesh>
      {/* Handle */}
      <mesh position={[side * 0.02, -0.1, -DOOR_WIDTH + 0.13]}>
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

// Interior: dashboard + steering wheel (reactive to rimMaterial) + two simplified seats
// (reactive to interior color). Visible through the glass and through open doors — not an
// occlusion-correct cutaway, see .specs/3d-model.spec.md Interior section.
const DASH_Y = 0.48
const DASH_Z = GLASS_Z + GLASS_SCALE[2] * 0.55
const STEERING_X = -HALF_W * 0.42
const STEERING_Y = 0.52
const STEERING_Z = DASH_Z - 0.22
const SEAT_Y = 0.2
const SEAT_Z = GLASS_Z - 0.05

// The exterior body is composed of solid (not hollow) overlapping ellipsoids — see
// .specs/3d-model.spec.md Interior section: there is no actual cavity for interior geometry to
// sit in, so it would otherwise be fully buried inside solid paint regardless of glass/doors.
// `depthTest={false}` + a high `renderOrder` makes these render on top unconditionally — a
// documented approximation ("always visible" instead of true occlusion), not an accident.
const INTERIOR_RENDER_ORDER = 2

function SteeringWheel({ rimMaterial }: { rimMaterial: 'plastic' | 'wood' | 'sport' }) {
  const rimColor = rimMaterial === 'wood' ? '#6b4326' : rimMaterial === 'sport' ? '#0d0d0d' : '#1a1a1a'
  const tube = rimMaterial === 'sport' ? 0.014 : 0.02
  return (
    <group position={[STEERING_X, STEERING_Y, STEERING_Z]} rotation={[Math.PI / 2.6, 0, 0]}>
      <mesh renderOrder={INTERIOR_RENDER_ORDER}>
        <torusGeometry args={[0.15, tube, 10, 20]} />
        <meshStandardMaterial color={rimColor} roughness={0.5} depthTest={false} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 5]} renderOrder={INTERIOR_RENDER_ORDER}>
        <boxGeometry args={[0.02, 0.02, 0.26]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} depthTest={false} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 5]} renderOrder={INTERIOR_RENDER_ORDER}>
        <boxGeometry args={[0.02, 0.02, 0.26]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} depthTest={false} />
      </mesh>
      {/* Steering column */}
      <mesh position={[0, 0, -0.18]} renderOrder={INTERIOR_RENDER_ORDER}>
        <cylinderGeometry args={[0.025, 0.03, 0.3, 10]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.6} depthTest={false} />
      </mesh>
    </group>
  )
}

function Seat({ x, hex }: { x: number; hex: string }) {
  return (
    <group position={[x, SEAT_Y, SEAT_Z]}>
      {/* Cushion */}
      <mesh position={[0, 0, 0.12]} renderOrder={INTERIOR_RENDER_ORDER}>
        <boxGeometry args={[0.42, 0.12, 0.4]} />
        <meshStandardMaterial color={hex} roughness={0.8} depthTest={false} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.22, -0.1]} rotation={[-0.15, 0, 0]} renderOrder={INTERIOR_RENDER_ORDER}>
        <boxGeometry args={[0.42, 0.44, 0.1]} />
        <meshStandardMaterial color={hex} roughness={0.8} depthTest={false} />
      </mesh>
    </group>
  )
}

export function FuscaModel() {
  const chassisYearId = useConfigStore((s) => s.chassisYearId)
  const wheelId = useConfigStore((s) => s.wheelId)
  const suspensionId = useConfigStore((s) => s.suspensionId)
  const exteriorColorId = useConfigStore((s) => s.exteriorColorId)
  const steeringWheelId = useConfigStore((s) => s.steeringWheelId)
  const interiorId = useConfigStore((s) => s.interiorId)
  const doorsOpen = useConfigStore((s) => s.doorsOpen)
  const frontTrunkOpen = useConfigStore((s) => s.frontTrunkOpen)
  const engineLidOpen = useConfigStore((s) => s.engineLidOpen)

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
  const steeringWheel = useMemo(
    () => steeringWheelOptions.find((s) => s.id === steeringWheelId) ?? steeringWheelOptions[0],
    [steeringWheelId],
  )
  const interior = useMemo(
    () => interiorOptions.find((i) => i.id === interiorId) ?? interiorOptions[0],
    [interiorId],
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

        {/* Front trunk lid (porta-malas) = HOOD, hinged near the cowl */}
        <group position={[0, TRUNK_HINGE.y, TRUNK_HINGE.z]} rotation={[frontTrunkOpen ? TRUNK_OPEN_ANGLE : 0, 0, 0]}>
          <mesh position={[0, HOOD_LOCAL.y, HOOD_LOCAL.z]} scale={HOOD.scale} castShadow>
            <sphereGeometry args={[1, 24, 16]} />
            <meshPhysicalMaterial color={exteriorColor.hex} {...bodyMaterialProps} />
          </mesh>
          {/* Hood centerline seam */}
          <mesh position={[0, HOOD_SEAM_LOCAL.y, HOOD_SEAM_LOCAL.z]}>
            <boxGeometry args={[0.02, 0.02, HALF_L * 0.5]} />
            <meshStandardMaterial {...SEAM} />
          </mesh>
        </group>

        {/* Engine lid (tampa do motor) = REAR_DECK, hinged near the cabin */}
        <group
          position={[0, ENGINE_LID_HINGE.y, ENGINE_LID_HINGE.z]}
          rotation={[engineLidOpen ? ENGINE_LID_OPEN_ANGLE : 0, 0, 0]}
        >
          <mesh position={[0, REAR_DECK_LOCAL.y, REAR_DECK_LOCAL.z]} scale={REAR_DECK.scale} castShadow>
            <sphereGeometry args={[1, 24, 16]} />
            <meshPhysicalMaterial color={exteriorColor.hex} {...bodyMaterialProps} />
          </mesh>
          {/* Rear vent louvers move with the lid */}
          {VENT_Y.map((y) => (
            <mesh key={y} position={[0, y - ENGINE_LID_HINGE.y, VENT_Z_ABS - ENGINE_LID_HINGE.z]}>
              <boxGeometry args={[0.5, 0.02, 0.035]} />
              <meshStandardMaterial color="#151515" roughness={0.7} />
            </mesh>
          ))}
        </group>

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

        {/* Interior: dashboard, steering wheel, seats */}
        <mesh position={[0, DASH_Y, DASH_Z]} renderOrder={INTERIOR_RENDER_ORDER}>
          <boxGeometry args={[HALF_W * 1.5, 0.08, 0.22]} />
          <meshStandardMaterial color="#1c1c1c" roughness={0.7} depthTest={false} />
        </mesh>
        <SteeringWheel rimMaterial={steeringWheel.rimMaterial} />
        <Seat x={STEERING_X} hex={interior.hex} />
        <Seat x={-STEERING_X} hex={interior.hex} />

        {/* Doors: real panels that swing open on doorsOpen */}
        <DoorDetails side={1} open={doorsOpen} color={exteriorColor.hex} materialProps={bodyMaterialProps} />
        <DoorDetails side={-1} open={doorsOpen} color={exteriorColor.hex} materialProps={bodyMaterialProps} />

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
