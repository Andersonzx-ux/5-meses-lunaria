/**
 * Layout fixo da cidade: ruas, postes, bancos e demais elementos.
 * As árvores são distribuídas automaticamente (de forma determinística) nos
 * espaços livres de grama — ver `world/CityMap.ts`.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export const WORLD = { width: 2400, height: 1800 } as const;

/** Onde o personagem começa: na entrada sul da avenida, olhando para a cidade. */
export const PLAYER_SPAWN: Point = { x: 1200, y: 1660 };

/** Ruas de paralelepípedo. */
export const STREETS: readonly Rect[] = [
  { x: 260, y: 620, w: 1880, h: 80 }, // rua de cima
  { x: 260, y: 1320, w: 1880, h: 80 }, // rua de baixo
  { x: 1160, y: 360, w: 80, h: 1380 }, // avenida central (Casa do Futuro → sul)
  { x: 260, y: 620, w: 80, h: 780 }, // rua oeste
  { x: 2060, y: 620, w: 80, h: 780 }, // rua leste
];

export const PLAZA_TREES: readonly Point[] = [
  { x: 1040, y: 830 },
  { x: 1360, y: 830 },
  { x: 1040, y: 1110 },
  { x: 1360, y: 1110 },
];

/** Varais de luzes entre pares de árvores da praça (índices de PLAZA_TREES). */
export const STRING_LIGHTS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [2, 3],
  [0, 3],
  [1, 2],
];

export const LAMPS: readonly Point[] = [
  // Rua de cima (calçada sul)
  { x: 420, y: 724 },
  { x: 800, y: 724 },
  { x: 1000, y: 724 },
  { x: 1400, y: 724 },
  { x: 1600, y: 724 },
  { x: 1980, y: 724 },
  // Rua de baixo (calçada sul)
  { x: 420, y: 1424 },
  { x: 800, y: 1424 },
  { x: 1000, y: 1424 },
  { x: 1400, y: 1424 },
  { x: 1600, y: 1424 },
  { x: 1980, y: 1424 },
  // Caminho iluminado até a Casa do Futuro
  { x: 1140, y: 440 },
  { x: 1260, y: 440 },
  { x: 1140, y: 540 },
  { x: 1260, y: 540 },
  // Praça
  { x: 1050, y: 975 },
  { x: 1350, y: 975 },
  // Avenida sul
  { x: 1140, y: 1540 },
  { x: 1260, y: 1540 },
];

export const BENCHES: readonly Point[] = [
  { x: 1090, y: 1160 },
  { x: 1310, y: 1160 },
  { x: 1090, y: 770 },
  { x: 1310, y: 770 },
];

export const FLOWER_BEDS: readonly Point[] = [
  { x: 390, y: 1250 },
  { x: 730, y: 1250 },
  { x: 380, y: 1170 },
  { x: 740, y: 1170 },
  { x: 1080, y: 400 },
  { x: 1320, y: 400 },
  { x: 1010, y: 330 },
  { x: 1390, y: 330 },
];

export const POND = { x: 700, y: 1590, rx: 190, ry: 90 } as const;

export const SIGNS: ReadonlyArray<{ x: number; y: number; text: string }> = [
  { x: 1300, y: 725, text: 'Praça das Luzes' },
];
