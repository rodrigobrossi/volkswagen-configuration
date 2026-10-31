import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { PaintOption, WheelOption } from '../core/contracts/catalog'
import type { VehicleFamily } from '../core/contracts/family'
import type { ModelProfile } from '../core/contracts/profile'
import { findBodyColor } from '../core/geometry/materials'
import { discoverParts } from '../core/parts/discovery'
import { buildVehicle } from '../core/pipeline/build'
import { unifiedWheelDiameter } from '../core/pipeline/wheels'
import { useConfigStore } from '../store/configStore'
import { usePartsStore } from '../store/partsStore'
import { useSelected } from '../store/selectors'
import { CabinFloor } from './provisions/CabinFloor'
import { DonorInterior } from './provisions/DonorInterior'
import { EngineProvision } from './provisions/EngineProvision'
import { ExtraPart } from './provisions/ExtraPart'
import { Platform } from './provisions/Platform'
import { RealWheel } from './provisions/RealWheel'
import { useArticulation } from './systems/useArticulation'
import { useBodyPaint } from './systems/useBodyPaint'
import { useNodeVisibility } from './systems/useNodeVisibility'
import { usePartOverrides } from './systems/usePartOverrides'

/**
 * Renders ONE real asset through its ModelProfile: the build pipeline turns asset + profile into a
 * BuiltVehicle, then generic systems (articulation, paint, visibility, part overrides) and
 * provisions (engine, donor interior, cabin floor, wheels, platform) act on it. Nothing here knows
 * which vehicle it is. Brain: brain/algorithms/pipeline.md, brain/contracts/built-vehicle.md.
 */
export function RealVehicle({ profile, family }: { profile: ModelProfile; family: VehicleFamily }) {
  const { scene } = useGLTF(profile.asset.path)
  const open = useConfigStore((s) => s.open)
  const chassisView = useConfigStore((s) => s.chassisView)
  const paint = useSelected<PaintOption>('paint')
  const wheelOption = useSelected<WheelOption>('wheels')

  // Build once per asset/profile (hinges, extracted panels, measured hubs, vehicle frame).
  const built = useMemo(() => buildVehicle(scene, profile), [scene, profile])
  const { object, rigs, wheelHubs, centering, size } = built

  // The asset's ORIGINAL paint colour tints the engine bay (on purpose — see engine-bay.md).
  const bodyColor = useMemo(() => findBodyColor(object), [object])

  useBodyPaint(object, profile, paint)
  useArticulation(rigs, open)

  const accessGroup = family.engine?.accessGroup
  const engineOpen = accessGroup ? open[accessGroup] : false
  useNodeVisibility(object, profile.engineBay?.hideNodes, engineOpen)
  // Baked wheels are always replaced when the profile declares mounts.
  useNodeVisibility(
    object,
    profile.wheels?.mounts.map((m) => m.node),
    true,
  )

  // Per-part editor: publish discovered parts and apply saved overrides.
  const groupBy = profile.parts?.groupBy ?? 'node'
  const setDiscoveredParts = usePartsStore((s) => s.setDiscoveredParts)
  const extraParts = usePartsStore((s) => s.extraParts)
  useEffect(() => {
    setDiscoveredParts(discoverParts(object, groupBy))
  }, [object, groupBy, setDiscoveredParts])
  usePartOverrides(object, profile, groupBy)

  // Editor calibration multiplies the OUTER group only; inner sizing keeps using the base scale.
  const { rotationY, scale } = profile.frame
  const calib = usePartsStore((s) => s.modelCalib[profile.id])
  const effScale = scale * (calib?.scaleMul ?? 1)
  const effRotationY = rotationY + THREE.MathUtils.degToRad(calib?.rotationYDeg ?? 0)

  const lidRig = accessGroup ? rigs.find((rig) => rig.group === accessGroup) : undefined
  const wheelAssets = family.wheels
  const wheelAsset = wheelAssets
    ? wheelAssets.assets[wheelAssets.optionAsset[wheelOption.id] ?? wheelAssets.defaultAsset]
    : undefined
  const wheelDiameter = unifiedWheelDiameter(wheelHubs)
  const platformActive = chassisView !== 'off' && !!profile.platform?.enabled && !!family.platform

  return (
    <group rotation={[0, effRotationY, 0]} scale={effScale}>
      <primitive object={object} position={centering} visible={!platformActive} />
      {platformActive && <Platform platform={family.platform!} scale={scale} exploded={chassisView === 'exploded'} />}
      {!platformActive && family.engine && lidRig && engineOpen && (
        <EngineProvision engine={family.engine} lidRig={lidRig} centering={centering} size={size} scale={scale} bodyColor={bodyColor} />
      )}
      {!platformActive && profile.cabinFloor && (
        <CabinFloor
          position={[0, profile.cabinFloor.y / scale, (profile.cabinFloor.zMin + profile.cabinFloor.zMax) / 2 / scale]}
          size={[
            (profile.cabinFloor.halfWidth * 2) / scale,
            0.04 / scale,
            (profile.cabinFloor.zMax - profile.cabinFloor.zMin) / scale,
          ]}
          paintHex={paint.hex}
        />
      )}
      {!platformActive && profile.interior?.source === 'donor' && family.donorInterior && (
        <DonorInterior
          donor={family.donorInterior}
          hostBoxMin={[-size.x / 2, 0, -size.z / 2]}
          hostBoxSize={[size.x, size.y, size.z]}
          paintHex={paint.hex}
          flipZ={profile.interior.flipZ}
          scaleMul={profile.interior.donorScale}
        />
      )}
      {wheelAsset &&
        wheelHubs.map((hub, i) => {
          const worldX = hub.position.x + centering[0]
          // Mirror by measured side (node L/R labels are unreliable — L-0006).
          const rotationY = wheelAsset.axleRealignYaw + (worldX >= 0 ? 0 : Math.PI)
          return (
            <RealWheel
              key={i}
              path={wheelAsset.path}
              position={[worldX, hub.position.y + centering[1], hub.position.z + centering[2]]}
              rotation={[0, rotationY, 0]}
              diameter={wheelDiameter}
              tint={wheelOption.rimColor}
            />
          )
        })}
      {extraParts
        .filter((p) => p.modelKey === profile.id)
        .map((p) => (
          <ExtraPart key={p.id} data={p} baseScale={scale} />
        ))}
    </group>
  )
}

/** Warm the loader cache for every asset a family can show, so switching never flashes empty. */
export function preloadFamily(family: VehicleFamily) {
  family.models.forEach((m) => useGLTF.preload(m.asset.path))
  if (family.donorInterior) useGLTF.preload(family.donorInterior.assetPath)
  if (family.engine) useGLTF.preload(family.engine.assetPath)
  Object.values(family.wheels?.assets ?? {}).forEach((w) => useGLTF.preload(w.path))
}
