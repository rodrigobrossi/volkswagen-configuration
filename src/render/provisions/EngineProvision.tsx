import type * as THREE from 'three'
import type { Rig } from '../../core/contracts/built'
import type { VehicleFamily } from '../../core/contracts/family'
import { EngineBay } from './EngineBay'
import { EngineBlock } from './EngineBlock'

/**
 * Engine provision — places the family's engine + an opaque body-coloured bay under the
 * engine-access lid while it is open (a hollow shell otherwise shows as a black frame). Sizes are
 * DERIVED from the lid's own footprint (the lid spans the hole it covers); only the family's
 * real-world constants are fixed. Brain: brain/algorithms/engine-bay.md.
 */
export function EngineProvision({
  engine,
  lidRig,
  centering,
  size,
  scale,
  bodyColor,
}: {
  engine: NonNullable<VehicleFamily['engine']>
  lidRig: Rig
  centering: [number, number, number]
  size: THREE.Vector3
  /** Base model scale — real metres are divided by it to land at true world size. */
  scale: number
  bodyColor: THREE.Color
}) {
  // X centred on the lid; Z inset forward from the tail so the block clears the inward-curving shell.
  const rearSign = Math.sign(lidRig.centers[0].z + centering[2]) || -1
  const engineX = lidRig.centers[0].x + centering[0]
  const engineZ = rearSign * (size.z / 2 - engine.rearInsetM / scale)
  // The bay fills the lid OPENING, centred between the engine and the opening.
  const lidCenterZ = lidRig.centers[0].z + centering[2]
  const bayWidth = lidRig.sizes[0].x * engine.bay.fit
  const bayDepth = lidRig.sizes[0].z * engine.bay.fit
  const bayCenterZ = (engineZ + lidCenterZ) / 2
  return (
    <>
      <EngineBay
        position={[engineX, (engine.floorHeightM - engine.bay.floorDropM) / scale, bayCenterZ]}
        size={[bayWidth, engine.bay.heightM / scale, bayDepth]}
        firewallHeight={engine.bay.firewallHeightM / scale}
        color={bodyColor}
      />
      <EngineBlock assetPath={engine.assetPath} position={[engineX, engine.floorHeightM / scale, engineZ]} scale={engine.realScale / scale} />
    </>
  )
}
