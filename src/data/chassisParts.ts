/**
 * Chassi do Fusca (plataforma Type 1) para o model-1980 — ver .specs/3d-model.spec.md.
 *
 * O Fusca não tem "chassi de longarinas": é uma PLATAFORMA — dois assoalhos planos soldados a um
 * TÚNEL CENTRAL, com o "chapéu de napoleão" (cabeçote/forquilha dianteira que ancora a viga de eixo
 * dianteira) na frente e travessas ligando os lados. Estas peças substituem o corpo fixo quando o
 * modo chassi está ligado (store: chassisView) — ver Chassis.tsx.
 *
 * SISTEMA DE COORDENADAS — metros reais, no MESMO referencial já centrado/aterrado do carro dentro
 * de RealCarModel (origem = centro do carro no nível do chão; X = esq(−)/dir(+), Y = cima,
 * Z = frente(+)/traseira(−)). Chassis.tsx divide tudo por model.calibration.scale (0.52 no 1980),
 * exatamente como EngineBay faz, então os números aqui são o tamanho/posagem REAL que aparece na
 * tela. Ancorados nas medições do model-1980: eixo dianteiro z≈+1.24, traseiro z≈−1.24 (entre-eixos
 * ~2.48 m, bem perto dos 2.40 m reais), bitola ±0.66, largura do corpo ±0.83, centro da roda y≈0.35.
 */

export type ChassisPartKind = 'box' | 'tube'

export interface ChassisPart {
  id: string
  /** Rótulo PT exibido na vista explodida / UI. */
  label: string
  kind: ChassisPartKind
  /** box: [largura X, altura Y, comprimento Z] em metros. tube: [raio, comprimento, _] — o tubo
   * fica deitado ao longo de X (viga/travessa transversal). */
  size: [number, number, number]
  /** Posição MONTADA (metros reais, referencial do carro acima). */
  position: [number, number, number]
  /** Deslocamento aplicado * fator na vista explodida, para as peças se afastarem de forma legível
   * (como a foto do kit de restauração). Zero na vista montada. */
  explode: [number, number, number]
  /** Sobrescreve a cor padrão do chassi (aço preto-fosco). */
  color?: string
}

// Aço preto-acetinado do chassi rolante montado (foto de referência). Trocável num só lugar.
export const CHASSIS_COLOR = '#242424'
export const CHASSIS_METALNESS = 0.55
export const CHASSIS_ROUGHNESS = 0.5

export const chassisParts: ChassisPart[] = [
  // Assoalhos planos, um de cada lado do túnel (borda interna ~0.10, externa ~0.64).
  {
    id: 'floor-pan-left',
    label: 'Assoalho esquerdo',
    kind: 'box',
    size: [0.54, 0.05, 2.6],
    position: [-0.37, 0.19, -0.05],
    explode: [-0.55, 0.1, 0],
  },
  {
    id: 'floor-pan-right',
    label: 'Assoalho direito',
    kind: 'box',
    size: [0.54, 0.05, 2.6],
    position: [0.37, 0.19, -0.05],
    explode: [0.55, 0.1, 0],
  },
  // Espinha dorsal: túnel central, mais alto que os assoalhos, correndo quase toda a plataforma.
  {
    id: 'central-tunnel',
    label: 'Túnel central',
    kind: 'box',
    size: [0.2, 0.22, 2.8],
    position: [0, 0.28, -0.05],
    explode: [0, 0.55, 0],
  },
  // Chapéu de napoleão: cabeçote/forquilha dianteira do túnel, à frente do eixo dianteiro.
  {
    id: 'napoleon-hat',
    label: 'Chapéu de napoleão',
    kind: 'box',
    size: [0.5, 0.18, 0.52],
    position: [0, 0.25, 1.4],
    explode: [0, 0.15, 0.85],
  },
  // Viga de eixo dianteira (tubo transversal) ancorada no chapéu de napoleão.
  {
    id: 'front-axle-beam',
    label: 'Viga dianteira',
    kind: 'tube',
    size: [0.05, 1.42, 0],
    position: [0, 0.31, 1.24],
    explode: [0, 0.05, 1.15],
  },
  // Travessa central que amarra os dois assoalhos ao túnel.
  {
    id: 'mid-crossmember',
    label: 'Travessa central',
    kind: 'box',
    size: [1.28, 0.08, 0.12],
    position: [0, 0.17, -0.05],
    explode: [0, -0.45, 0],
  },
  // Travessa traseira, sob o eixo traseiro / cabeçote do motor.
  {
    id: 'rear-crossmember',
    label: 'Travessa traseira',
    kind: 'box',
    size: [1.34, 0.14, 0.16],
    position: [0, 0.26, -1.24],
    explode: [0, 0.1, -0.9],
  },
]
