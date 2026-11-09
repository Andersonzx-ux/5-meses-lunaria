import Phaser from 'phaser';
import { POND, SIGNS } from '../data/cityLayout';
import type { BuildingId } from '../data/locations';
import { seededRandom } from '../utils/random';
import { generateBuildingTextures } from './buildings';
import {
  canvasTexture,
  fillCircle,
  fillEllipse,
  fillRect,
  fillRoundRect,
  fillStar4,
  plaque,
  type Ctx,
} from './canvas';

/** Chaves de todas as texturas geradas por código. */
export const TEX = {
  star: 'star4',
  glow: 'glow',
  grass: 'grass',
  cobble: 'cobble',
  tree: 'tree',
  treeBlossom: 'tree-blossom',
  lamp: 'lamp',
  bench: 'bench',
  flowers: 'flowers',
  fountain: 'fountain',
  pond: 'pond',
  plaza: 'plaza',
} as const;

export const signTextureKey = (index: number): string => `sign-${index}`;
export const buildingTextureKey = (id: BuildingId): string => `building-${id}`;

/** Altura da luz do poste em relação à base (para posicionar o brilho). */
export const LAMP_LIGHT_OFFSET = 73;

function shadow(ctx: Ctx, cx: number, cy: number, rx: number, ry: number): void {
  fillEllipse(ctx, cx, cy, rx, ry, 'rgba(4, 6, 20, 0.38)');
}

function drawStar(ctx: Ctx): void {
  fillStar4(ctx, 32, 32, 32, '#ffffff', 0.24);
}

function drawGlow(ctx: Ctx): void {
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
}

function drawGrass(ctx: Ctx): void {
  fillRect(ctx, 0, 0, 64, 64, '#18293f');
  const rand = seededRandom(3);
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(rand() * 62);
    const y = Math.floor(rand() * 60);
    fillRect(ctx, x, y, 2, 3 + Math.floor(rand() * 3), rand() > 0.5 ? '#1f3753' : '#132136');
  }
  for (let i = 0; i < 3; i++) {
    fillRect(ctx, 4 + Math.floor(rand() * 56), 4 + Math.floor(rand() * 56), 2, 2, i === 0 ? '#c995c8' : '#5d5a9a');
  }
}

function drawCobble(ctx: Ctx): void {
  fillRect(ctx, 0, 0, 64, 64, '#2b2948');
  const rand = seededRandom(11);
  for (let row = 0; row < 4; row++) {
    const y = row * 16;
    const offset = row % 2 === 0 ? 0 : 16;
    for (let i = -1; i < 3; i++) {
      const x = i * 32 + offset;
      const tone = rand() > 0.5 ? '#45426d' : '#4c4977';
      fillRoundRect(ctx, x + 2, y + 2, 28, 12, 4, tone);
      fillRect(ctx, x + 5, y + 3, 22, 2, 'rgba(255,255,255,0.06)');
    }
  }
}

function drawTree(ctx: Ctx, palette: readonly [string, string, string, string]): void {
  const [dark, mid, light, sparkle] = palette;
  shadow(ctx, 56, 132, 36, 8);
  fillRect(ctx, 50, 96, 12, 38, '#3a2a3e');
  fillRect(ctx, 50, 96, 4, 38, '#4a3650');
  fillCircle(ctx, 56, 72, 40, dark);
  fillCircle(ctx, 32, 86, 25, dark);
  fillCircle(ctx, 80, 86, 25, dark);
  fillCircle(ctx, 56, 52, 32, mid);
  fillCircle(ctx, 38, 70, 20, mid);
  fillCircle(ctx, 76, 72, 20, mid);
  fillCircle(ctx, 46, 40, 15, light);
  fillCircle(ctx, 70, 56, 9, light);
  const rand = seededRandom(palette.length + dark.length);
  for (let i = 0; i < 6; i++) {
    fillCircle(ctx, 24 + rand() * 64, 26 + rand() * 70, 1.6, sparkle);
  }
}

function drawLamp(ctx: Ctx): void {
  shadow(ctx, 14, 93, 10, 3);
  fillRect(ctx, 8, 86, 12, 8, '#22203a');
  fillRect(ctx, 12, 30, 4, 58, '#2a2843');
  fillRect(ctx, 6, 30, 16, 3, '#2a2843');
  fillRect(ctx, 6, 13, 16, 19, '#2a2843');
  fillRect(ctx, 8, 15, 12, 15, '#ffe6a0');
  fillRect(ctx, 13, 15, 2, 15, '#f3c770');
  ctx.beginPath();
  ctx.moveTo(3, 14);
  ctx.lineTo(25, 14);
  ctx.lineTo(14, 4);
  ctx.closePath();
  ctx.fillStyle = '#2a2843';
  ctx.fill();
  fillStar4(ctx, 14, 3, 3, '#f3d58a');
}

function drawBench(ctx: Ctx): void {
  shadow(ctx, 32, 31, 30, 4);
  fillRect(ctx, 8, 18, 4, 14, '#2a2236');
  fillRect(ctx, 52, 18, 4, 14, '#2a2236');
  fillRoundRect(ctx, 2, 16, 60, 7, 2, '#6b4a5e');
  fillRoundRect(ctx, 4, 2, 56, 5, 2, '#6b4a5e');
  fillRoundRect(ctx, 4, 9, 56, 5, 2, '#5a3d4f');
  fillRect(ctx, 8, 6, 3, 12, '#2a2236');
  fillRect(ctx, 53, 6, 3, 12, '#2a2236');
}

function drawFlowers(ctx: Ctx): void {
  fillEllipse(ctx, 36, 22, 34, 12, '#2a2236');
  fillEllipse(ctx, 36, 21, 30, 9, '#1f3a3f');
  const colors = ['#f2b6c8', '#b9a6e8', '#f3d58a', '#fbf1dc', '#e88aa8'];
  const rand = seededRandom(5);
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand());
    const x = 36 + Math.cos(a) * 27 * d;
    const y = 20 + Math.sin(a) * 8 * d;
    fillCircle(ctx, x, y - 3, 1.8, '#2f6a5a');
    fillCircle(ctx, x, y - 5, 2.4, colors[i % colors.length] ?? '#f2b6c8');
  }
}

function drawFountain(ctx: Ctx): void {
  shadow(ctx, 100, 128, 96, 18);
  fillEllipse(ctx, 100, 112, 94, 34, '#4f4c78');
  fillEllipse(ctx, 100, 106, 94, 34, '#6d6a96');
  fillEllipse(ctx, 100, 104, 82, 27, '#2c467f');
  const water = ctx.createLinearGradient(0, 80, 0, 130);
  water.addColorStop(0, '#5a7fd0');
  water.addColorStop(1, '#2f4a8a');
  fillEllipse(ctx, 100, 105, 78, 24, '#3d5fa8');
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.ellipse(100, 106, 74, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  fillEllipse(ctx, 70, 100, 18, 3, 'rgba(255,255,255,0.25)');
  fillEllipse(ctx, 130, 112, 12, 2, 'rgba(255,255,255,0.2)');
  fillRect(ctx, 92, 46, 16, 60, '#8a87b5');
  fillRect(ctx, 92, 46, 5, 60, '#a3a0cc');
  fillEllipse(ctx, 100, 50, 32, 9, '#7b78a8');
  fillEllipse(ctx, 100, 47, 28, 6, '#5a7fd0');
  ctx.save();
  ctx.shadowColor = '#f3d58a';
  ctx.shadowBlur = 16;
  fillStar4(ctx, 100, 22, 18, '#f3d58a');
  ctx.restore();
  fillStar4(ctx, 100, 22, 8, '#fff6dc');
}

function drawPond(ctx: Ctx): void {
  const cx = POND.rx + 10;
  const cy = POND.ry + 10;
  fillEllipse(ctx, cx, cy, POND.rx + 6, POND.ry + 6, '#3b3960');
  const water = ctx.createRadialGradient(cx, cy, 10, cx, cy, POND.rx);
  water.addColorStop(0, '#2c4a86');
  water.addColorStop(1, '#1a2c5c');
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.ellipse(cx, cy, POND.rx - 4, POND.ry - 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Reflexo da lua e das estrelas.
  fillEllipse(ctx, cx + 60, cy - 18, 26, 10, 'rgba(251,241,220,0.28)');
  fillEllipse(ctx, cx + 60, cy - 18, 14, 5, 'rgba(251,241,220,0.4)');
  const rand = seededRandom(19);
  for (let i = 0; i < 22; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * 0.85;
    fillCircle(ctx, cx + Math.cos(a) * (POND.rx - 10) * d, cy + Math.sin(a) * (POND.ry - 10) * d, 1.2, 'rgba(251,241,220,0.55)');
  }
  fillStar4(ctx, cx - 70, cy + 10, 7, 'rgba(243,213,138,0.55)');
  // Vitórias-régias.
  const pads: Array<[number, number, number]> = [
    [cx - 110, cy - 20, 13],
    [cx - 90, cy + 30, 10],
    [cx + 110, cy + 30, 12],
    [cx + 20, cy + 50, 9],
  ];
  for (const [px, py, r] of pads) {
    fillEllipse(ctx, px, py, r, r * 0.55, '#2f5d5a');
    fillEllipse(ctx, px + r * 0.4, py - r * 0.1, r * 0.35, r * 0.2, '#1a2c5c');
  }
  fillCircle(ctx, cx - 110, cy - 23, 3.5, '#f2b6c8');
  fillCircle(ctx, cx + 110, cy + 27, 3, '#fbf1dc');
}

function drawPlaza(ctx: Ctx, radius: number): void {
  const c = radius + 4;
  fillCircle(ctx, c, c, radius + 4, '#5a527e');
  fillCircle(ctx, c, c, radius, '#34325a');
  // Anéis de pedras.
  for (let r = radius - 14, i = 0; r > 40; r -= 24, i++) {
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.setLineDash([16, 4]);
    ctx.lineDashOffset = i * 7;
    ctx.lineWidth = 18;
    ctx.strokeStyle = i % 2 === 0 ? '#45426d' : '#3f3c66';
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Mosaico da estrela de quatro pontas no centro.
  fillStar4(ctx, c, c, radius * 0.62, 'rgba(243,213,138,0.12)', 0.18);
  ctx.beginPath();
  ctx.arc(c, c, radius - 2, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(243,213,138,0.35)';
  ctx.stroke();
}

function drawSign(ctx: Ctx, text: string): void {
  shadow(ctx, 70, 86, 18, 4);
  fillRect(ctx, 66, 30, 8, 58, '#3a2a3e');
  plaque(ctx, text, 70, 26, 128, 30, '#6b4a5e', '#fbf1dc', '#3a2a3e');
  fillStar4(ctx, 70, 6, 5, '#f3d58a');
}

/** Gera todas as texturas do jogo. Chamado uma vez, na PreloadScene. */
export function generateTextures(scene: Phaser.Scene, plazaRadius: number): void {
  canvasTexture(scene, TEX.star, 64, 64, drawStar);
  canvasTexture(scene, TEX.glow, 128, 128, drawGlow);
  canvasTexture(scene, TEX.grass, 64, 64, drawGrass);
  canvasTexture(scene, TEX.cobble, 64, 64, drawCobble);
  canvasTexture(scene, TEX.tree, 112, 140, (ctx) => drawTree(ctx, ['#173847', '#1f4a5a', '#2c6170', '#b9a6e8']));
  canvasTexture(scene, TEX.treeBlossom, 112, 140, (ctx) =>
    drawTree(ctx, ['#5e3b66', '#87527f', '#b97aa6', '#fbf1dc']),
  );
  canvasTexture(scene, TEX.lamp, 28, 96, drawLamp);
  canvasTexture(scene, TEX.bench, 64, 34, drawBench);
  canvasTexture(scene, TEX.flowers, 72, 36, drawFlowers);
  canvasTexture(scene, TEX.fountain, 200, 140, drawFountain);
  canvasTexture(scene, TEX.pond, POND.rx * 2 + 20, POND.ry * 2 + 20, drawPond);
  canvasTexture(scene, TEX.plaza, plazaRadius * 2 + 8, plazaRadius * 2 + 8, (ctx) => drawPlaza(ctx, plazaRadius));
  SIGNS.forEach((sign, i) => canvasTexture(scene, signTextureKey(i), 140, 92, (ctx) => drawSign(ctx, sign.text)));
  generateBuildingTextures(scene, buildingTextureKey);
}
