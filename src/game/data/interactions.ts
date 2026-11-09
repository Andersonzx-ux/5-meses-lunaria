import type { CharacterLook, Facing } from '../art/character';
import type { DialogueId } from './dialogues';
import type { DiscoveryId } from './discoveries';

/**
 * O que acontece ao interagir com algo ligado a uma lembrança:
 * - lembrança ainda não liberada (capítulo anterior pendente): `early` + pista;
 * - com `discovery`: `lines` → revelação → `after`; depois de encontrada, `repeat`;
 * - com `topic` (o morador fala da lembrança, mas não a entrega): `lines` na
 *   primeira conversa, `repeat` nas seguintes e `done` depois de encontrada.
 * Sem lembrança (portas): só `lines`.
 */
export interface Script {
  lines: DialogueId;
  discovery?: DiscoveryId;
  topic?: DiscoveryId;
  early?: DialogueId;
  after?: DialogueId;
  repeat?: DialogueId;
  done?: DialogueId;
}

export interface NPCData {
  id: string;
  name: string;
  /** Posição dos pés no mundo. */
  x: number;
  y: number;
  facing: Facing;
  look: CharacterLook;
  script: Script;
}

export interface SpotData {
  id: string;
  /** Texto do balão de interação. */
  label: string;
  x: number;
  y: number;
  /** Mostra um brilho de estrela no chão enquanto houver algo a descobrir. */
  sparkle?: boolean;
  /** Comportamento especial tratado em código (ex.: a porta da Casa do Futuro). */
  special?: 'casa';
  script?: Script;
}

/** Distância (px) entre os pés do personagem e o ponto para poder interagir. */
export const INTERACT_RADIUS = 58;

export const NPCS: readonly NPCData[] = [
  {
    id: 'aurora',
    name: 'Dona Aurora',
    x: 470,
    y: 668,
    facing: 'down',
    look: {
      skin: '#e8c3a8',
      hair: '#b9b3c9',
      hairLight: '#d8d3e6',
      hairStyle: 'bun',
      coat: '#8a6378',
      coatDark: '#6b4a5e',
      scarf: null,
      apron: '#f6ead8',
    },
    script: { lines: 'auroraFirst', discovery: 'primeiro-beijo', early: 'auroraEarly', after: 'auroraAfter', repeat: 'auroraAfter' },
  },
  {
    id: 'estelino',
    name: 'Seu Estelino',
    x: 1690,
    y: 668,
    facing: 'down',
    look: {
      skin: '#d9a988',
      hair: '#2b2238',
      hairLight: '#463a58',
      hairStyle: 'short',
      coat: '#7a3a5a',
      coatDark: '#5c2a44',
      scarf: ['#f3d58a', '#c9a85e'],
      cap: '#c94f6d',
    },
    script: {
      lines: 'estelinoFirst',
      topic: 'ingresso-pulseira',
      early: 'estelinoEarly',
      repeat: 'estelinoRepeat',
      done: 'estelinoDone',
    },
  },
  {
    id: 'bento',
    name: 'Seu Bento',
    x: 1440,
    y: 668,
    facing: 'down',
    look: {
      skin: '#e2b392',
      hair: '#a9a3b8',
      hairLight: '#cfc9dc',
      hairStyle: 'short',
      coat: '#c9a86b',
      coatDark: '#a3864f',
      scarf: null,
      apron: '#3f7a5a',
    },
    script: {
      lines: 'bentoFirst',
      discovery: 'monster-manga',
      early: 'bentoEarly',
      after: 'bentoAfter',
      repeat: 'bentoAfter',
    },
  },
  {
    id: 'flora',
    name: 'Flora',
    x: 470,
    y: 1368,
    facing: 'down',
    look: {
      skin: '#f1d3bf',
      hair: '#e88aa8',
      hairLight: '#f2b6c8',
      hairStyle: 'short',
      coat: '#4f8a7a',
      coatDark: '#3a6a5e',
      scarf: null,
      apron: '#e9d8b4',
    },
    script: { lines: 'floraFirst', discovery: 'rosa', early: 'floraEarly', after: 'floraAfter', repeat: 'floraAfter' },
  },
  {
    id: 'pagina',
    name: 'Dona Página',
    x: 1960,
    y: 1368,
    facing: 'down',
    look: {
      skin: '#c99a7a',
      hair: '#ece6f5',
      hairLight: '#ffffff',
      hairStyle: 'bun',
      coat: '#5d5b85',
      coatDark: '#47456b',
      scarf: ['#f3d58a', '#c9a85e'],
      glasses: true,
    },
    script: {
      lines: 'paginaFirst',
      topic: 'perfil-voltou',
      early: 'paginaEarly',
      repeat: 'paginaRepeat',
      done: 'paginaDone',
    },
  },
  {
    id: 'theo',
    name: 'Theo',
    x: 1290,
    y: 1050,
    facing: 'down',
    look: {
      skin: '#b8845f',
      hair: '#3a2a3e',
      hairLight: '#5a4458',
      hairStyle: 'short',
      coat: '#3a4a7a',
      coatDark: '#2a375e',
      scarf: ['#f3d58a', '#c9a85e'],
      cap: '#2a2843',
    },
    script: { lines: 'theoFirst', topic: 'olhar-na-rua', repeat: 'theoRepeat', done: 'theoDone' },
  },
];

export const SPOTS: readonly SpotData[] = [
  // Portas dos prédios.
  { id: 'cafeteria-door', label: 'Espiar', x: 560, y: 604, script: { lines: 'cafeteriaDoor' } },
  { id: 'cinema-door', label: 'Espiar', x: 1840, y: 604, script: { lines: 'cinemaDoor' } },
  { id: 'emporio-door', label: 'Espiar', x: 1500, y: 604, script: { lines: 'emporioDoor' } },
  { id: 'floricultura-door', label: 'Espiar', x: 611, y: 1304, script: { lines: 'floriculturaDoor' } },
  { id: 'biblioteca-door', label: 'Espiar', x: 1840, y: 1304, script: { lines: 'bibliotecaDoor' } },
  { id: 'casa-door', label: 'Abrir a porta', x: 1200, y: 364, special: 'casa' },
  // Lembranças espalhadas pela cidade (só aparecem quando chega o capítulo delas).
  {
    id: 'cinema-poster',
    label: 'Ver o cartaz',
    x: 1759,
    y: 604,
    sparkle: true,
    script: { lines: 'cinemaPoster', discovery: 'ingresso-pulseira', repeat: 'cinemaPosterAfter' },
  },
  {
    id: 'book',
    label: 'Pegar o livro',
    x: 1915,
    y: 1005,
    sparkle: true,
    script: { lines: 'bookSpot', discovery: 'perfil-voltou' },
  },
  {
    id: 'fountain',
    label: 'Fazer um pedido',
    x: 1200,
    y: 1000,
    sparkle: true,
    script: { lines: 'fountainWish', discovery: 'olhar-na-rua', repeat: 'fountainAfter' },
  },
  {
    id: 'lake',
    label: 'Olhar o lago',
    x: 900,
    y: 1590,
    sparkle: true,
    script: { lines: 'lakeSpot', discovery: 'seiscentas-fotos' },
  },
];
