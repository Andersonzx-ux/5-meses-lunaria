import Phaser from 'phaser';
import { canvasTexture, fillCircle, fillEllipse, fillRect, fillRoundRect, fillStar4, type Ctx } from './canvas';

/** Texturas da cena do pedido (12/06/2026): rosas, chocolate, presentes e alianças. */
export const FINALE_TEX = {
  bouquet: 'finale-bouquet',
  chocolate: 'finale-chocolate',
  gift: 'finale-gift',
  giftSmall: 'finale-gift-small',
  rings: 'finale-rings',
  petal: 'finale-petal',
} as const;

function heartPath(ctx: Ctx, cx: number, cy: number, size: number): void {
  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.6, cy - s * 0.2, cx - s * 0.6, cy - s * 1.3, cx, cy - s * 0.45);
  ctx.bezierCurveTo(cx + s * 0.6, cy - s * 1.3, cx + s * 1.6, cy - s * 0.2, cx, cy + s * 0.9);
  ctx.closePath();
}

function drawRose(ctx: Ctx, x: number, y: number, r: number): void {
  fillCircle(ctx, x, y, r, '#a3182c');
  fillCircle(ctx, x - r * 0.2, y - r * 0.15, r * 0.7, '#c42a3f');
  ctx.beginPath();
  ctx.arc(x, y, r * 0.45, 0.4, Math.PI * 1.6);
  ctx.strokeStyle = '#7d1020';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  fillCircle(ctx, x + r * 0.15, y - r * 0.1, r * 0.22, '#e04a5e');
}

function drawBouquet(ctx: Ctx): void {
  // Papel de embrulho.
  ctx.beginPath();
  ctx.moveTo(10, 26);
  ctx.lineTo(54, 26);
  ctx.lineTo(36, 78);
  ctx.lineTo(28, 78);
  ctx.closePath();
  ctx.fillStyle = '#f2e6d4';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, 26);
  ctx.lineTo(32, 78);
  ctx.lineTo(46, 26);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fill();
  // Folhas e rosas.
  for (const [x, y] of [[14, 24], [50, 22], [22, 12], [44, 10]] as const) fillEllipse(ctx, x, y, 7, 4, '#2f6a4a');
  for (const [x, y, r] of [[20, 20, 8], [32, 14, 9], [44, 20, 8], [26, 28, 7], [39, 28, 7], [32, 23, 7]] as const) drawRose(ctx, x, y, r);
  // Laço.
  fillEllipse(ctx, 26, 60, 6, 3.5, '#c42a3f');
  fillEllipse(ctx, 38, 60, 6, 3.5, '#c42a3f');
  fillCircle(ctx, 32, 60, 3, '#a3182c');
}

function drawChocolate(ctx: Ctx): void {
  fillEllipse(ctx, 32, 52, 26, 6, 'rgba(4,6,20,0.35)');
  heartPath(ctx, 32, 30, 50);
  ctx.fillStyle = '#7d1020';
  ctx.fill();
  heartPath(ctx, 32, 27, 44);
  ctx.fillStyle = '#c42a3f';
  ctx.fill();
  heartPath(ctx, 32, 27, 30);
  ctx.fillStyle = '#5a2e22';
  ctx.fill();
  for (const [x, y] of [[26, 22], [38, 22], [32, 30]] as const) {
    fillCircle(ctx, x, y, 4, '#7a4632');
    fillCircle(ctx, x - 1, y - 1, 1.4, '#a8705a');
  }
}

function drawGift(ctx: Ctx, w: number, h: number, box: string, ribbon: string): void {
  fillEllipse(ctx, w / 2, h - 3, w / 2 - 2, 4, 'rgba(4,6,20,0.35)');
  fillRect(ctx, 4, 16, w - 8, h - 20, box);
  fillRect(ctx, 2, 10, w - 4, 9, box);
  fillRect(ctx, 2, 17, w - 4, 2, 'rgba(0,0,0,0.15)');
  fillRect(ctx, w / 2 - 3, 10, 6, h - 14, ribbon);
  fillEllipse(ctx, w / 2 - 7, 8, 7, 4, ribbon);
  fillEllipse(ctx, w / 2 + 7, 8, 7, 4, ribbon);
  fillCircle(ctx, w / 2, 9, 3, ribbon);
}

function drawRings(ctx: Ctx): void {
  fillEllipse(ctx, 32, 44, 22, 5, 'rgba(4,6,20,0.35)');
  // Caixinha aberta.
  fillRoundRect(ctx, 12, 8, 40, 16, 4, '#5a1a2a');
  fillRoundRect(ctx, 14, 10, 36, 12, 3, '#f2e6d4');
  fillRoundRect(ctx, 10, 24, 44, 18, 4, '#7d1020');
  fillRoundRect(ctx, 14, 25, 36, 8, 3, '#3a0f1a');
  // Alianças douradas.
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f3d58a';
  for (const x of [26, 38]) {
    ctx.beginPath();
    ctx.ellipse(x, 26, 6, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  fillStar4(ctx, 44, 16, 4, '#fff6dc');
}

function drawPetal(ctx: Ctx): void {
  fillEllipse(ctx, 8, 6, 7, 4, '#c42a3f');
  fillEllipse(ctx, 7, 5, 4, 2, '#e04a5e');
}

export function generateFinaleTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, FINALE_TEX.bouquet, 64, 82, drawBouquet);
  canvasTexture(scene, FINALE_TEX.chocolate, 64, 60, drawChocolate);
  canvasTexture(scene, FINALE_TEX.gift, 48, 48, (ctx) => drawGift(ctx, 48, 48, '#141018', '#c42a3f'));
  canvasTexture(scene, FINALE_TEX.giftSmall, 36, 36, (ctx) => drawGift(ctx, 36, 36, '#8e2433', '#f3d58a'));
  canvasTexture(scene, FINALE_TEX.rings, 64, 50, drawRings);
  canvasTexture(scene, FINALE_TEX.petal, 16, 12, drawPetal);
}
