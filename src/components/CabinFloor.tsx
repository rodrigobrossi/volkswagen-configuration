import { useMemo } from 'react'
import { exteriorColors } from '../data/fusca'
import { useConfigStore } from '../store/configStore'

// A thin, body-coloured panel that caps the bottom of the cabin. The real car bodies are hollow
// shells with no floor pan modeled and their baked/overlaid interior geometry stops at the seat base
// (measured: model-1968's "Interior" bbox bottoms out at y≈0.40 with nothing below it), so opening a
// door exposes the dark hollow underneath as a black wedge in the door opening — the "área preta na
// lataria". This fills that void the same way EngineBay hides the hollow behind the engine lid.
//
// It tracks the SELECTED exterior colour (not the model's original paint) so a repainted car doesn't
// show an off-colour floor through the open door — the interior-colour-bleed the user flagged. Placed
// inside RealCarModel's already-scaled/rotated group, so its geometry is in group-local units (the
// per-model cabinFloor config is authored in metres and divided by the model's scale at the call
// site, matching the engine constants).
export function CabinFloor({
  position,
  size,
}: {
  /** Group-local centre [x, y, z]. */
  position: [number, number, number]
  /** Group-local box size [width, thickness, depth]. */
  size: [number, number, number]
}) {
  const exteriorColorId = useConfigStore((s) => s.exteriorColorId)
  const hex = useMemo(
    () => (exteriorColors.find((c) => c.id === exteriorColorId) ?? exteriorColors[0]).hex,
    [exteriorColorId],
  )
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={hex} roughness={0.7} metalness={0.1} />
    </mesh>
  )
}
