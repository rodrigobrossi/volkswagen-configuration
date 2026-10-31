import * as THREE from 'three'
import type { PlatformPart, VehicleFamily } from '../../core/contracts/family'

/**
 * Platform provision — the family's procedural chassis (floor pans, tunnel, crossmembers…) shown in
 * place of the body when the platform view is on. Rendered INSIDE the vehicle's scaled group, so
 * every real metre is divided by the model scale. `exploded` offsets each member by its `explode`
 * vector (restoration-kit diagram). Brain: brain/vehicles/vw-type1/platform.md.
 */
export function Platform({
  platform,
  scale,
  exploded,
}: {
  platform: NonNullable<VehicleFamily['platform']>
  scale: number
  exploded: boolean
}) {
  const f = exploded ? 1 : 0
  const s = (m: number) => m / scale
  const material = (part: PlatformPart) => (
    <meshStandardMaterial color={part.color ?? platform.color} metalness={platform.metalness} roughness={platform.roughness} />
  )
  return (
    <group>
      {platform.parts.map((part) => {
        const pos: [number, number, number] = [
          s(part.position[0] + part.explode[0] * f),
          s(part.position[1] + part.explode[1] * f),
          s(part.position[2] + part.explode[2] * f),
        ]
        if (part.kind === 'tube') {
          const [radius, length] = part.size
          // Cylinders are born along Y: 'x' → rotate about Z (transverse), 'z' → about X (longitudinal).
          const rot: [number, number, number] = part.tubeAxis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, Math.PI / 2]
          return (
            <mesh key={part.id} position={pos} rotation={rot}>
              <cylinderGeometry args={[s(radius), s(radius), s(length), 20]} />
              {material(part)}
            </mesh>
          )
        }
        const [w, h, d] = part.size
        return (
          <mesh key={part.id} position={pos} rotation={[0, THREE.MathUtils.degToRad(part.rotationYDeg ?? 0), 0]}>
            <boxGeometry args={[s(w), s(h), s(d)]} />
            {material(part)}
          </mesh>
        )
      })}
    </group>
  )
}
