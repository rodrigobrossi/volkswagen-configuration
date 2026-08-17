// Interior: dashboard + steering wheel + two simplified seats. Extracted from FuscaModel so real
// GLTF models lacking their own baked-in cabin (see hasInterior in carModels.ts) can reuse it.
//
// The exterior body/shell in every context this mounts into is solid (procedural: overlapping
// ellipsoids; real models: unsegmented single-shell meshes) — there's no actual cavity for this
// geometry to sit in, so it would otherwise be fully buried regardless of glass/open doors.
// `depthTest={false}` + a high `renderOrder` makes it render on top unconditionally — a
// documented approximation ("always visible" instead of true occlusion), not an accident. See
// .specs/3d-model.spec.md Interior section.
const INTERIOR_RENDER_ORDER = 2

function SteeringWheel({
  position,
  rimMaterial,
}: {
  position: readonly [number, number, number]
  rimMaterial: 'plastic' | 'wood' | 'sport'
}) {
  const rimColor = rimMaterial === 'wood' ? '#6b4326' : rimMaterial === 'sport' ? '#0d0d0d' : '#1a1a1a'
  const tube = rimMaterial === 'sport' ? 0.014 : 0.02
  return (
    <group position={[position[0], position[1], position[2]]} rotation={[Math.PI / 2.6, 0, 0]}>
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

function Seat({ position, hex }: { position: readonly [number, number, number]; hex: string }) {
  return (
    <group position={[position[0], position[1], position[2]]}>
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

export function CarInterior({
  dashboardPosition,
  dashboardWidth,
  steeringPosition,
  seatLeftPosition,
  seatRightPosition,
  rimMaterial = 'plastic',
  seatHex = '#232323',
}: {
  dashboardPosition: readonly [number, number, number]
  dashboardWidth: number
  steeringPosition: readonly [number, number, number]
  seatLeftPosition: readonly [number, number, number]
  seatRightPosition: readonly [number, number, number]
  rimMaterial?: 'plastic' | 'wood' | 'sport'
  seatHex?: string
}) {
  return (
    <>
      <mesh position={[dashboardPosition[0], dashboardPosition[1], dashboardPosition[2]]} renderOrder={INTERIOR_RENDER_ORDER}>
        <boxGeometry args={[dashboardWidth, 0.08, 0.22]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.7} depthTest={false} />
      </mesh>
      <SteeringWheel position={steeringPosition} rimMaterial={rimMaterial} />
      <Seat position={seatLeftPosition} hex={seatHex} />
      <Seat position={seatRightPosition} hex={seatHex} />
    </>
  )
}
