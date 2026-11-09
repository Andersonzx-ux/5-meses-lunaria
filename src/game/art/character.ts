import Phaser from 'phaser';
import { fillCircle, fillEllipse, fillPolygon, fillRect, fillRoundRect, fillStar4, type Ctx } from './canvas';

/**
 * Personagens (jogador e NPCs), desenhados por código em folhas de quadros.
 * A aparência de cada um é definida por um `CharacterLook` editável.
 */
export const FRAME_W = 48;
export const FRAME_H = 64;
/** Linha (em px, dentro do quadro) onde ficam os pés — usada como origem do sprite. */
export const FEET_Y = 60;

export type Facing = 'down' | 'up' | 'side';
const FACINGS: readonly Facing[] = ['down', 'up', 'side'];
/** 0–3: ciclo de caminhada; 4–5: respiração parado. */
const FRAMES_PER_ROW = 6;

export type HairStyle = 'long' | 'short' | 'bun' | 'curly' | 'curlyShort';

export interface CharacterLook {
  skin: string;
  hair: string;
  hairLight: string;
  hairStyle: HairStyle;
  /** Parte de cima (casaco, camisa ou vestido). */
  coat: string;
  coatDark: string;
  /** Parte de baixo. `dress` usa as cores de `coat` na saia. Padrão: calça escura. */
  bottom?: { kind: 'pants' | 'shorts' | 'dress'; color: string };
  /** Cachecol [cor, sombra]; `null` = sem cachecol. */
  scarf: readonly [string, string] | null;
  eyes?: string;
  shoes?: string;
  belt?: string;
  /** Manga curta (braços com pele à mostra) e gola em V. */
  shortSleeves?: boolean;
  apron?: string;
  cap?: string;
  glasses?: boolean;
  /** Grampo de estrela de quatro pontas no cabelo. */
  starPin?: boolean;
}

const COMMON = {
  blush: 'rgba(232, 138, 168, 0.55)',
  pants: '#2b2a4a',
  shoes: '#1e1830',
  eyes: '#2b2238',
  star: '#f3d58a',
} as const;

/** Larissa: cabelo preto cacheado médio, olhos castanho-escuros, vestido vermelho-escuro. */
export const LARISSA_LOOK: CharacterLook = {
  skin: '#f3d6c4',
  // Preto com um brilho frio nos cachos, para não sumir contra o céu noturno.
  hair: '#141019',
  hairLight: '#3b3347',
  hairStyle: 'curly',
  coat: '#8e2433',
  coatDark: '#6b1a26',
  bottom: { kind: 'dress', color: '#8e2433' },
  scarf: null,
  eyes: '#2a170f',
  shoes: '#141018',
  belt: '#141018',
  shortSleeves: true,
  starPin: true,
};

/** Larissa no dia do pedido: short bege e camisa marrom. */
export const LARISSA_PROPOSAL_LOOK: CharacterLook = {
  ...LARISSA_LOOK,
  coat: '#6b4632',
  coatDark: '#523424',
  bottom: { kind: 'shorts', color: '#d8c3a0' },
  belt: undefined,
};

/** Anderson: cabelo cacheado, pele parda clara, todo de preto (camisa e short). */
export const ANDERSON_LOOK: CharacterLook = {
  skin: '#dba985',
  hair: '#2a1d1a',
  hairLight: '#45302a',
  hairStyle: 'curlyShort',
  coat: '#25222c',
  coatDark: '#18161d',
  bottom: { kind: 'shorts', color: '#1d1b22' },
  scarf: null,
  eyes: '#4a2e22',
  shoes: '#101014',
  shortSleeves: true,
};

/** Anderson no dia do pedido: calça e camisa pretas. */
export const ANDERSON_PROPOSAL_LOOK: CharacterLook = {
  ...ANDERSON_LOOK,
  bottom: { kind: 'pants', color: '#1d1b22' },
};

export const PLAYER_LOOK = LARISSA_LOOK;
export const PLAYER_TEXTURE = 'character';

export const frameName = (facing: Facing, index: number): string => `${facing}-${index}`;
export const walkAnim = (texture: string, facing: Facing): string => `${texture}:walk-${facing}`;
export const idleAnim = (texture: string, facing: Facing): string => `${texture}:idle-${facing}`;

interface Pose {
  /** Deslocamento vertical do corpo (balanço ao andar / respirar). */
  bob: number;
  /** -1, 0 ou 1: qual perna está à frente. */
  stride: number;
}

function poseFor(index: number): Pose {
  switch (index) {
    case 0:
      return { bob: -1, stride: 1 };
    case 2:
      return { bob: -1, stride: -1 };
    case 5:
      return { bob: 1, stride: 0 };
    default:
      return { bob: 0, stride: 0 };
  }
}

const isCurly = (look: CharacterLook): boolean => look.hairStyle === 'curly' || look.hairStyle === 'curlyShort';

/** Cachos: vários círculos sobrepostos, com pontos de brilho. */
function curls(ctx: Ctx, look: CharacterLook, points: ReadonlyArray<readonly [number, number]>, r: number): void {
  for (const [x, y] of points) fillCircle(ctx, x, y, r, look.hair);
  points.forEach(([x, y], i) => {
    if (i % 3 === 0) fillCircle(ctx, x - r * 0.3, y - r * 0.35, r * 0.35, look.hairLight);
  });
}

/** Pontos ao longo de um arco (graus, sentido horário a partir da direita). */
function arcPoints(cx: number, cy: number, radius: number, from: number, to: number, count: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < count; i++) {
    const a = ((from + ((to - from) * i) / (count - 1)) * Math.PI) / 180;
    pts.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
  }
  return pts;
}

/** Cachos laterais que descem do topo da cabeça até `bottom`. */
function sideCurls(cx: number, y: number, bottom: number, spread: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let yy = 16 + y, i = 0; yy <= bottom + y; yy += 5, i++) {
    const wobble = i % 2 === 0 ? 0 : 1.5;
    pts.push([cx - spread - wobble, yy], [cx + spread + wobble, yy]);
  }
  return pts;
}

function drawCap(ctx: Ctx, look: CharacterLook, cx: number, y: number): void {
  if (!look.cap) return;
  ctx.beginPath();
  ctx.arc(cx, 13 + y, 11, Math.PI, Math.PI * 2);
  ctx.fillStyle = look.cap;
  ctx.fill();
  fillRoundRect(ctx, cx - 13, 11 + y, 26, 4, 2, look.cap);
}

/** Pernas e parte de baixo, vistas de frente/costas. */
function drawLegsFront(ctx: Ctx, look: CharacterLook, stride: number): void {
  const cx = 24;
  const kind = look.bottom?.kind ?? 'pants';
  const color = look.bottom?.color ?? COMMON.pants;
  const shoes = look.shoes ?? COMMON.shoes;
  const leftLen = 12 + (stride > 0 ? 1 : stride < 0 ? -1 : 0);
  const rightLen = 12 + (stride < 0 ? 1 : stride > 0 ? -1 : 0);
  const legW = kind === 'dress' ? 4 : 5;
  const lx = kind === 'dress' ? cx - 6 : cx - 7;
  const rx = cx + 2;
  const legColor = kind === 'pants' ? color : look.skin;
  fillRect(ctx, lx, 46, legW, leftLen, legColor);
  fillRect(ctx, rx, 46, legW, rightLen, legColor);
  if (kind === 'shorts') {
    fillRect(ctx, cx - 8, 45, 7, 6, color);
    fillRect(ctx, cx + 1, 45, 7, 6, color);
  }
  fillRoundRect(ctx, lx - 1, 45 + leftLen, legW + 2, 4, 2, shoes);
  fillRoundRect(ctx, rx - 1, 45 + rightLen, legW + 2, 4, 2, shoes);
}

function drawFront(ctx: Ctx, look: CharacterLook, { bob, stride }: Pose, back: boolean): void {
  const cx = 24;
  const kind = look.bottom?.kind ?? 'pants';
  drawLegsFront(ctx, look, stride);

  const y = bob;
  // Cabelo cacheado de costas cobre a nuca e desce até os ombros.
  if (back && look.hairStyle === 'curly') curls(ctx, look, sideCurls(cx, y, 34, 9), 5);

  // Braços balançando em oposição às pernas (pele à mostra com manga curta).
  const arm = look.shortSleeves ? look.skin : look.coatDark;
  fillRoundRect(ctx, cx - 14, 32 + y - stride, 5, 13, 2, arm);
  fillRoundRect(ctx, cx + 9, 32 + y + stride, 5, 13, 2, arm);
  if (look.shortSleeves) {
    fillRoundRect(ctx, cx - 14, 31 + y - stride, 5, 5, 2, look.coatDark);
    fillRoundRect(ctx, cx + 9, 31 + y + stride, 5, 5, 2, look.coatDark);
  }
  fillCircle(ctx, cx - 11.5, 45 + y - stride, 2.4, look.skin);
  fillCircle(ctx, cx + 11.5, 45 + y + stride, 2.4, look.skin);

  // Tronco.
  fillRoundRect(ctx, cx - 10, 30 + y, 20, 19, 5, look.coat);
  if (kind === 'dress') {
    // Saia rodada.
    fillPolygon(ctx, [[cx - 9, 40 + y], [cx + 9, 40 + y], [cx + 13, 52], [cx - 13, 52]], look.coat);
    fillRect(ctx, cx - 13, 50, 26, 2, look.coatDark);
    if (look.belt) fillRect(ctx, cx - 9, 39 + y, 18, 2, look.belt);
  } else {
    fillRect(ctx, cx - 10, 44 + y, 20, 3, look.coatDark);
  }
  if (!back) {
    if (look.apron) {
      fillRoundRect(ctx, cx - 7, 35 + y, 14, 13, 2, look.apron);
      fillRect(ctx, cx - 7, 35 + y, 14, 1.5, 'rgba(0,0,0,0.12)');
    } else if (!look.shortSleeves) {
      fillRect(ctx, cx - 0.5, 34 + y, 1, 11, look.coatDark);
      fillCircle(ctx, cx + 3, 38 + y, 1, look.coatDark);
      fillCircle(ctx, cx + 3, 42 + y, 1, look.coatDark);
    }
  } else if (look.apron) {
    fillRect(ctx, cx - 7, 37 + y, 14, 2, look.apron);
  }
  // Gola / cachecol.
  if (look.scarf) {
    fillRoundRect(ctx, cx - 9, 28 + y, 18, 6, 3, look.scarf[0]);
    fillRoundRect(ctx, back ? cx - 6 : cx + 3, 31 + y, 5, 10, 2, look.scarf[1]);
  } else if (!back && look.shortSleeves) {
    fillPolygon(ctx, [[cx - 4, 30 + y], [cx + 4, 30 + y], [cx, 34 + y]], look.skin);
  } else {
    fillRoundRect(ctx, cx - 7, 28 + y, 14, 4, 2, look.coatDark);
  }

  drawHeadFront(ctx, look, cx, y, back);
  drawCap(ctx, look, cx, y);
  if (look.starPin) fillStar4(ctx, cx + 9, 10 + y, 4, COMMON.star);
}

function drawHeadFront(ctx: Ctx, look: CharacterLook, cx: number, y: number, back: boolean): void {
  const style = look.hairStyle;
  if (back) {
    if (isCurly(look)) {
      fillCircle(ctx, cx, 18 + y, 12, look.hair);
      curls(ctx, look, arcPoints(cx, 18 + y, 11, 160, 380, 9), style === 'curly' ? 5 : 4.5);
      curls(ctx, look, [[cx - 5, 22 + y], [cx + 5, 22 + y], [cx, 25 + y]], 5);
      return;
    }
    fillCircle(ctx, cx, 18 + y, 12, look.hair);
    fillRoundRect(ctx, cx - 12, 16 + y, 24, style === 'long' ? 16 : 10, 6, look.hair);
    fillEllipse(ctx, cx - 4, 11 + y, 5, 3, look.hairLight);
    if (style === 'bun') fillCircle(ctx, cx, 5 + y, 6, look.hair);
    return;
  }

  if (style === 'long') fillRoundRect(ctx, cx - 12, 14 + y, 24, 18, 7, look.hair);
  if (style === 'curly') curls(ctx, look, sideCurls(cx, y, 32, 11), 4.5);
  fillCircle(ctx, cx, 19 + y, 11, look.skin);

  if (isCurly(look)) {
    // Volume de cachos no alto da cabeça.
    curls(ctx, look, arcPoints(cx, 17 + y, 11, 180, 360, 9), style === 'curly' ? 4.8 : 4.4);
    curls(ctx, look, [[cx - 6, 8 + y], [cx, 6 + y], [cx + 6, 8 + y]], 4.5);
    if (style === 'curlyShort') curls(ctx, look, [[cx - 11, 19 + y], [cx + 11, 19 + y]], 3.5);
  } else {
    ctx.beginPath();
    ctx.arc(cx, 17 + y, 12, Math.PI, Math.PI * 2);
    ctx.fillStyle = look.hair;
    ctx.fill();
    if (style !== 'long') {
      fillRoundRect(ctx, cx - 12, 15 + y, 4, 7, 2, look.hair);
      fillRoundRect(ctx, cx + 8, 15 + y, 4, 7, 2, look.hair);
    }
    fillEllipse(ctx, cx - 5, 11 + y, 4, 2.5, look.hairLight);
    if (style === 'bun') fillCircle(ctx, cx, 5 + y, 6, look.hair);
  }

  // Rosto.
  const eyes = look.eyes ?? COMMON.eyes;
  fillEllipse(ctx, cx - 4.5, 21 + y, 1.6, 2.2, eyes);
  fillEllipse(ctx, cx + 4.5, 21 + y, 1.6, 2.2, eyes);
  fillCircle(ctx, cx - 4, 20.2 + y, 0.6, '#ffffff');
  fillCircle(ctx, cx + 5, 20.2 + y, 0.6, '#ffffff');
  if (look.glasses) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#3a2a3e';
    for (const ex of [cx - 4.5, cx + 4.5]) {
      ctx.beginPath();
      ctx.arc(ex, 21 + y, 3.4, 0, Math.PI * 2);
      ctx.stroke();
    }
    fillRect(ctx, cx - 1.2, 20.5 + y, 2.4, 0.8, '#3a2a3e');
  }
  fillEllipse(ctx, cx - 7.5, 25 + y, 2.4, 1.5, COMMON.blush);
  fillEllipse(ctx, cx + 7.5, 25 + y, 2.4, 1.5, COMMON.blush);
  fillRect(ctx, cx - 1.5, 26 + y, 3, 1, '#c98a8a');
}

function drawSide(ctx: Ctx, look: CharacterLook, { bob, stride }: Pose): void {
  // Desenhado olhando para a esquerda; a direita é o espelho.
  const cx = 24;
  const swing = stride * 4;
  const kind = look.bottom?.kind ?? 'pants';
  const color = look.bottom?.color ?? COMMON.pants;
  const shoes = look.shoes ?? COMMON.shoes;
  const legColor = kind === 'pants' ? color : look.skin;
  const backLeg = kind === 'pants' ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.12)';
  // Pernas: uma à frente, outra atrás.
  fillRect(ctx, cx - 1 + swing, 46, 5, 12, legColor);
  fillRect(ctx, cx - 1 + swing, 46, 5, 12, backLeg);
  fillRect(ctx, cx - 3 - swing, 46, 5, 12, legColor);
  if (kind === 'shorts') fillRect(ctx, cx - 5, 45, 11, 6, color);
  fillRoundRect(ctx, cx - 4 + swing, 56, 8, 4, 2, shoes);
  fillRoundRect(ctx, cx - 6 - swing, 56, 8, 4, 2, shoes);

  const y = bob;
  const arm = look.shortSleeves ? look.skin : look.coatDark;
  // Braço de trás.
  fillRoundRect(ctx, cx - 1 + swing * 0.6, 32 + y, 5, 12, 2, arm);
  // Corpo.
  fillRoundRect(ctx, cx - 7, 30 + y, 15, 19, 5, look.coat);
  if (kind === 'dress') {
    fillPolygon(ctx, [[cx - 7, 40 + y], [cx + 8, 40 + y], [cx + 11, 52], [cx - 10, 52]], look.coat);
    fillRect(ctx, cx - 10, 50, 21, 2, look.coatDark);
    if (look.belt) fillRect(ctx, cx - 7, 39 + y, 15, 2, look.belt);
  } else {
    fillRect(ctx, cx - 7, 44 + y, 15, 3, look.coatDark);
  }
  if (look.apron) fillRoundRect(ctx, cx - 8, 35 + y, 6, 13, 2, look.apron);
  // Braço da frente.
  fillRoundRect(ctx, cx - 3 - swing * 0.6, 32 + y, 5, 13, 2, arm);
  if (look.shortSleeves) fillRoundRect(ctx, cx - 3 - swing * 0.6, 31 + y, 5, 5, 2, look.coatDark);
  fillCircle(ctx, cx - 0.5 - swing * 0.6, 45 + y, 2.4, look.skin);
  // Cachecol com a ponta esvoaçando para trás.
  if (look.scarf) {
    fillRoundRect(ctx, cx - 7, 28 + y, 15, 6, 3, look.scarf[0]);
    fillRoundRect(ctx, cx + 5, 30 + y, 8, 4, 2, look.scarf[1]);
  }

  // Cabeça.
  if (look.hairStyle === 'curly') curls(ctx, look, [[cx + 6, 20 + y], [cx + 8, 25 + y], [cx + 6, 30 + y], [cx + 3, 33 + y]], 4.5);
  fillCircle(ctx, cx - 1, 19 + y, 11, look.skin);
  if (isCurly(look)) {
    curls(ctx, look, arcPoints(cx, 17 + y, 11, 190, 420, 9), look.hairStyle === 'curly' ? 4.8 : 4.4);
    curls(ctx, look, [[cx - 2, 7 + y], [cx + 4, 7 + y], [cx + 8, 12 + y]], 4.5);
  } else {
    ctx.beginPath();
    ctx.arc(cx, 18 + y, 12, Math.PI * 1.05, Math.PI * 2.35);
    ctx.closePath();
    ctx.fillStyle = look.hair;
    ctx.fill();
    fillRoundRect(ctx, cx + 2, 16 + y, 10, look.hairStyle === 'long' ? 17 : 9, 5, look.hair);
    fillEllipse(ctx, cx + 1, 11 + y, 4, 2.5, look.hairLight);
    if (look.hairStyle === 'bun') fillCircle(ctx, cx + 4, 6 + y, 6, look.hair);
  }
  fillEllipse(ctx, cx - 6, 21 + y, 1.6, 2.2, look.eyes ?? COMMON.eyes);
  fillCircle(ctx, cx - 5.6, 20.2 + y, 0.6, '#ffffff');
  if (look.glasses) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#3a2a3e';
    ctx.beginPath();
    ctx.arc(cx - 6, 21 + y, 3.4, 0, Math.PI * 2);
    ctx.stroke();
    fillRect(ctx, cx - 3, 20.5 + y, 6, 0.8, '#3a2a3e');
  }
  fillEllipse(ctx, cx - 7, 25 + y, 2.2, 1.4, COMMON.blush);
  drawCap(ctx, look, cx - 1, y);
  if (look.starPin) fillStar4(ctx, cx + 7, 10 + y, 4, COMMON.star);
}

function drawFrame(ctx: Ctx, look: CharacterLook, facing: Facing, index: number): void {
  const pose = poseFor(index);
  fillEllipse(ctx, 24, FEET_Y, 11, 3.5, 'rgba(4, 6, 20, 0.4)');
  if (facing === 'side') drawSide(ctx, look, pose);
  else drawFront(ctx, look, pose, facing === 'up');
}

/** Gera a folha de quadros de um personagem e registra suas animações. */
export function createCharacterSheet(scene: Phaser.Scene, key: string, look: CharacterLook): void {
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, FRAME_W * FRAMES_PER_ROW, FRAME_H * FACINGS.length);
    if (!texture) throw new Error(`Não foi possível criar a textura do personagem "${key}".`);
    const ctx = texture.getContext();
    FACINGS.forEach((facing, row) => {
      for (let i = 0; i < FRAMES_PER_ROW; i++) {
        const x = i * FRAME_W;
        const y = row * FRAME_H;
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.rect(0, 0, FRAME_W, FRAME_H);
        ctx.clip();
        drawFrame(ctx, look, facing, i);
        ctx.restore();
        texture.add(frameName(facing, i), 0, x, y, FRAME_W, FRAME_H);
      }
    });
    texture.refresh();
  }

  for (const facing of FACINGS) {
    if (!scene.anims.exists(walkAnim(key, facing))) {
      scene.anims.create({
        key: walkAnim(key, facing),
        frames: [0, 1, 2, 3].map((i) => ({ key, frame: frameName(facing, i) })),
        frameRate: 9,
        repeat: -1,
      });
    }
    if (!scene.anims.exists(idleAnim(key, facing))) {
      scene.anims.create({
        key: idleAnim(key, facing),
        frames: [4, 5].map((i) => ({ key, frame: frameName(facing, i) })),
        frameRate: 1.6,
        repeat: -1,
      });
    }
  }
}

/** Direção para onde um personagem em (fromX, fromY) olha para ver (toX, toY). */
export function facingToward(fromX: number, fromY: number, toX: number, toY: number): { facing: Facing; flip: boolean } {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (Math.abs(dx) > Math.abs(dy)) return { facing: 'side', flip: dx > 0 };
  return { facing: dy < 0 ? 'up' : 'down', flip: false };
}
