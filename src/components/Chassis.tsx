import * as THREE from 'three'
import {
  chassisParts,
  CHASSIS_COLOR,
  CHASSIS_METALNESS,
  CHASSIS_ROUGHNESS,
  type ChassisPart,
} from '../data/chassisParts'

// Plataforma/chassi do Fusca montado a partir de peças conectadas (assoalhos, túnel central, chapéu
// de napoleão, viga dianteira, travessas) — ver chassisParts.ts para as dimensões e a convenção de
// coordenadas. Renderizado DENTRO do <group scale> de RealCarModel, então todo metro real é dividido
// por `scale` (mesmo padrão do EngineBay) para aparecer no tamanho certo, alinhado ao carro.
//
// `exploded` afasta cada peça pelo seu vetor `explode` (fator 0 = montado, 1 = explodido), no estilo
// de um diagrama de kit de restauração; a vista montada é o padrão.
export function Chassis({ scale, exploded }: { scale: number; exploded: boolean }) {
  const f = exploded ? 1 : 0
  const s = (m: number) => m / scale // metro real → unidade local do grupo

  const material = (part: ChassisPart) => (
    <meshStandardMaterial
      color={part.color ?? CHASSIS_COLOR}
      metalness={CHASSIS_METALNESS}
      roughness={CHASSIS_ROUGHNESS}
    />
  )

  return (
    <group>
      {chassisParts.map((part) => {
        const pos: [number, number, number] = [
          s(part.position[0] + part.explode[0] * f),
          s(part.position[1] + part.explode[1] * f),
          s(part.position[2] + part.explode[2] * f),
        ]
        if (part.kind === 'tube') {
          const [radius, length] = part.size
          // O cilindro nasce no eixo Y. tubeAxis 'x' → gira 90° em Z (transversal, viga/travessa);
          // 'z' → gira 90° em X (longitudinal, espinha do túnel).
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

// Extent bruto usado por callers para posicionar câmera/legendas se preciso (mundo, metros).
export function chassisWorldBounds() {
  const box = new THREE.Box3()
  chassisParts.forEach((p) => {
    const half =
      p.kind === 'tube'
        ? new THREE.Vector3(p.size[1] / 2, p.size[0], p.size[0])
        : new THREE.Vector3(p.size[0] / 2, p.size[1] / 2, p.size[2] / 2)
    const c = new THREE.Vector3(...p.position)
    box.expandByPoint(c.clone().sub(half))
    box.expandByPoint(c.clone().add(half))
  })
  return box
}
