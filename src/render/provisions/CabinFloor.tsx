/**
 * Cabin floor provision — a thin panel capping a hollow cabin so an open door shows a floor, not
 * the dark void under the seats. Takes the SELECTED paint (never the asset's original colour).
 * Brain: brain/algorithms/cabin-floor.md.
 */
export function CabinFloor({
  position,
  size,
  paintHex,
}: {
  /** Group-local centre [x, y, z]. */
  position: [number, number, number]
  /** Group-local [width, thickness, depth]. */
  size: [number, number, number]
  paintHex: string
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={paintHex} roughness={0.7} metalness={0.1} />
    </mesh>
  )
}
