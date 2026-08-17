import * as THREE from 'three'

// An open engine-bay "cradle" (floor + firewall + two side walls) that stands in for the car's
// engine bay. The real GLTF body shells have NO actual cavity — they're solid/hollow closed
// surfaces — so looking into an opened engine lid otherwise reveals the unlit BACK faces of the
// shell and the dark trim behind the engine, which read as a black frame/void around the block
// (confirmed by raycasting: nothing opaque actually covers the engine, it just sits in the car's
// dark interior). This opaque, body-coloured cradle replaces that void with a believable bay.
//
// Deliberately has NO top and NO tail-side (rear) wall: a Beetle's engine lid hinges up at the rear,
// so the block is viewed from above and from BEHIND — a rear wall would sit between the viewer and
// the engine, hiding it and reading as a green/black box bolted onto the tail (the exact bug this
// replaces). The tail side is backed by the car's own solid rear bodywork, so omitting that wall
// exposes no gap. The remaining firewall (cabin side) + floor + side walls hide the hollow cabin
// interior that was the actual source of the dark frame. Sized/placed per-model in RealCarModel.tsx.
export function EngineBay({
  position = [0, 0, 0],
  size,
  firewallHeight,
  color,
}: {
  /** Floor-centre of the cradle, in the parent group's local (pre-scale) units. */
  position?: [number, number, number]
  /** [width (x), height (y), depth (z)] in the parent group's local units. Floor is at the group
   * origin (y=0); the SIDE walls rise to `height`. +z is the cabin (firewall) side; -z (tail) open. */
  size: [number, number, number]
  /** Height of the cabin-side firewall, in local units. Taller than the side walls: it stands
   * BEHIND the engine (from the rear viewer) and must rise high enough to hide the cabin seats that
   * would otherwise show through the opening. Defaults to the side-wall height. */
  firewallHeight?: number
  color: THREE.ColorRepresentation
}) {
  const [w, h, d] = size
  const fh = firewallHeight ?? h

  // floor + firewall (+z, cabin side) + two side walls. Open top and open tail (-z). DoubleSide so
  // each wall reads as solid from inside and outside alike.
  const faces: { position: [number, number, number]; rotation: [number, number, number]; args: [number, number] }[] = [
    { position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0], args: [w, d] }, // floor
    { position: [w / 2, h / 2, 0], rotation: [0, Math.PI / 2, 0], args: [d, h] }, // +x wall
    { position: [-w / 2, h / 2, 0], rotation: [0, Math.PI / 2, 0], args: [d, h] }, // -x wall
    { position: [0, fh / 2, d / 2], rotation: [0, 0, 0], args: [w, fh] }, // +z firewall (taller)
  ]

  return (
    <group position={position}>
      {faces.map((f, i) => (
        <mesh key={i} position={f.position} rotation={f.rotation}>
          <planeGeometry args={f.args} />
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}
