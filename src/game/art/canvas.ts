import Phaser from 'phaser';

export type Ctx = CanvasRenderingContext2D;

export const ART_FONT = 'Georgia, "Times New Roman", serif';

/** Cria uma textura desenhada com Canvas 2D (uma única vez por chave). */
export function canvasTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (ctx: Ctx) => void,
): void {
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) throw new Error(`Não foi possível criar a textura "${key}".`);
  draw(texture.getContext());
  texture.refresh();
}

export function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function fillRoundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: string): void {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

export function fillRect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

export function fillCircle(ctx: Ctx, x: number, y: number, r: number, color: string): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

export function fillEllipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

export function fillPolygon(ctx: Ctx, points: Array<[number, number]>, color: string): void {
  const [first, ...rest] = points;
  if (!first) return;
  ctx.beginPath();
  ctx.moveTo(first[0], first[1]);
  for (const [px, py] of rest) ctx.lineTo(px, py);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** A estrela de quatro pontas — símbolo recorrente de Lunária. */
export function fillStar4(ctx: Ctx, cx: number, cy: number, r: number, color: string, innerRatio = 0.24): void {
  const i = r * innerRatio;
  fillPolygon(
    ctx,
    [
      [cx, cy - r],
      [cx + i, cy - i],
      [cx + r, cy],
      [cx + i, cy + i],
      [cx, cy + r],
      [cx - i, cy + i],
      [cx - r, cy],
      [cx - i, cy - i],
    ],
    color,
  );
}

/** Lua crescente desenhada num canvas auxiliar (o recorte não afeta o que está atrás). */
export function fillCrescent(ctx: Ctx, cx: number, cy: number, r: number, color: string): void {
  const size = Math.ceil(r * 2 + 4);
  const temp = document.createElement('canvas');
  temp.width = size;
  temp.height = size;
  const t = temp.getContext('2d');
  if (!t) return;
  fillCircle(t, size / 2, size / 2, r, color);
  t.globalCompositeOperation = 'destination-out';
  fillCircle(t, size / 2 + r * 0.45, size / 2 - r * 0.3, r * 0.85, '#000');
  ctx.drawImage(temp, cx - size / 2, cy - size / 2);
}

/** Escreve um texto centralizado, reduzindo a fonte até caber na largura. */
export function fitText(
  ctx: Ctx,
  text: string,
  cx: number,
  cy: number,
  maxWidth: number,
  maxSize: number,
  color: string,
  weight = '600',
): void {
  let size = maxSize;
  ctx.font = `${weight} ${size}px ${ART_FONT}`;
  while (ctx.measureText(text).width > maxWidth && size > 8) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${ART_FONT}`;
  }
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
}

/** Placa com borda e texto. */
export function plaque(
  ctx: Ctx,
  text: string,
  cx: number,
  cy: number,
  w: number,
  h: number,
  bg: string,
  fg: string,
  border: string,
): void {
  fillRoundRect(ctx, cx - w / 2 - 2, cy - h / 2 - 2, w + 4, h + 4, 6, border);
  fillRoundRect(ctx, cx - w / 2, cy - h / 2, w, h, 5, bg);
  fitText(ctx, text, cx, cy + 1, w - 14, h - 6, fg);
}

/** Janela iluminada por dentro (luz quente). */
export function litWindow(ctx: Ctx, x: number, y: number, w: number, h: number, frame: string, arched = false): void {
  const pathWindow = (inset: number): void => {
    const ix = x + inset;
    const iy = y + inset;
    const iw = w - inset * 2;
    const ih = h - inset * 2;
    ctx.beginPath();
    if (arched) {
      const r = iw / 2;
      ctx.moveTo(ix, iy + ih);
      ctx.lineTo(ix, iy + r);
      ctx.arc(ix + r, iy + r, r, Math.PI, 0);
      ctx.lineTo(ix + iw, iy + ih);
      ctx.closePath();
    } else {
      ctx.rect(ix, iy, iw, ih);
    }
  };

  pathWindow(0);
  ctx.fillStyle = frame;
  ctx.fill();

  const light = ctx.createLinearGradient(0, y, 0, y + h);
  light.addColorStop(0, '#fff0bd');
  light.addColorStop(1, '#f0b46a');
  pathWindow(3);
  ctx.fillStyle = light;
  ctx.fill();

  // Caixilhos.
  ctx.fillStyle = frame;
  ctx.fillRect(x + w / 2 - 1.5, y + 3, 3, h - 6);
  ctx.fillRect(x + 3, y + h * (arched ? 0.6 : 0.5) - 1.5, w - 6, 3);
}
