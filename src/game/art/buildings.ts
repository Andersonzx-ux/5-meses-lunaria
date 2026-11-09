import Phaser from 'phaser';
import { LOCATIONS, isBuilding, type BuildingId } from '../data/locations';
import {
  canvasTexture,
  fillCircle,
  fillCrescent,
  fillEllipse,
  fillPolygon,
  fillRect,
  fillRoundRect,
  fillStar4,
  fitText,
  litWindow,
  plaque,
  type Ctx,
} from './canvas';

/**
 * Arte dos prédios. Cada função desenha no espaço da textura (0..w, 0..h), com a
 * base da fachada (porta) em y = h.
 */
type BuildingDrawer = (ctx: Ctx, w: number, h: number, name: string) => void;

/** Sombra rente à base, com a largura das paredes (`inset` = recuo lateral). */
function baseShadow(ctx: Ctx, w: number, h: number, inset: number): void {
  fillEllipse(ctx, w / 2, h - 3, w / 2 - inset + 4, 5, 'rgba(4, 6, 20, 0.4)');
}

function glowing(ctx: Ctx, color: string, blur: number, draw: () => void): void {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  draw();
  ctx.restore();
}

function door(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, lit: boolean): void {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = '#21182c';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 3, y + h);
  ctx.lineTo(x + 3, y + r);
  ctx.arc(x + r, y + r, r - 3, Math.PI, 0);
  ctx.lineTo(x + w - 3, y + h);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  if (lit) litWindow(ctx, x + w / 2 - 9, y + 10, 18, 22, '#21182c', true);
  fillCircle(ctx, x + w - 9, y + h * 0.62, 2.5, '#f3d58a');
}

const drawCafeteria: BuildingDrawer = (ctx, w, h, name) => {
  baseShadow(ctx, w, h, 20);
  fillRect(ctx, 20, 80, w - 40, h - 84, '#d8c0c8');
  fillRect(ctx, 20, 80, 10, h - 84, 'rgba(0,0,0,0.08)');
  fillRect(ctx, 16, h - 16, w - 32, 12, '#8a6378');

  // Telhado mansarda e lua crescente.
  fillPolygon(ctx, [[8, 84], [w - 8, 84], [w - 30, 42], [30, 42]], '#6b3a5a');
  fillRect(ctx, 4, 78, w - 8, 10, '#55304a');
  glowing(ctx, '#f3d58a', 18, () => fillCrescent(ctx, w / 2, 34, 22, '#f3d58a'));

  plaque(ctx, name, w / 2, 102, 176, 24, '#3b2440', '#f3d58a', '#f3d58a');

  // Toldo listrado com borda ondulada.
  const stripe = 20;
  for (let x = 24, i = 0; x < w - 24; x += stripe, i++) {
    const color = i % 2 === 0 ? '#e9a3b8' : '#f6ead8';
    fillRect(ctx, x, 120, stripe, 20, color);
    fillCircle(ctx, x + stripe / 2, 140, stripe / 2, color);
  }
  for (let x = 30; x < w - 24; x += 18) fillCircle(ctx, x, 118, 2, '#f3d58a');

  litWindow(ctx, 36, 156, 66, 50, '#55304a');
  litWindow(ctx, w - 102, 156, 66, 50, '#55304a');
  // Xícaras na vitrine.
  for (const cx of [56, 82, w - 82, w - 56]) {
    fillRoundRect(ctx, cx - 6, 190, 12, 9, 3, '#6b3a5a');
    fillRect(ctx, cx - 1, 182, 2, 6, 'rgba(255,255,255,0.5)');
  }
  door(ctx, w / 2 - 22, h - 74, 44, 70, '#5a3550', true);
  fillCircle(ctx, w / 2 - 34, h - 22, 9, '#2f6a5a');
  fillCircle(ctx, w / 2 + 34, h - 22, 9, '#2f6a5a');
  fillCircle(ctx, w / 2 - 34, h - 26, 3, '#f2b6c8');
  fillCircle(ctx, w / 2 + 34, h - 26, 3, '#fbf1dc');
};

const drawCinema: BuildingDrawer = (ctx, w, h, name) => {
  baseShadow(ctx, w, h, 20);
  fillRect(ctx, 20, 70, w - 40, h - 74, '#3a2d6b');
  fillRect(ctx, 20, 70, 20, h - 74, '#4a3b85');
  fillRect(ctx, w - 40, 70, 20, h - 74, '#4a3b85');
  // Topo escalonado art déco.
  fillRect(ctx, 60, 46, w - 120, 28, '#43357a');
  fillRect(ctx, 100, 26, w - 200, 24, '#4d3e8a');
  glowing(ctx, '#f3d58a', 20, () => fillStar4(ctx, w / 2, 15, 15, '#f3d58a'));
  fillStar4(ctx, w / 2, 15, 6, '#fff6dc');

  // Letreiro com lâmpadas.
  fillRect(ctx, 34, 90, w - 68, 50, '#f3d58a');
  fillRect(ctx, 38, 94, w - 76, 42, '#1d1640');
  for (let x = 42, i = 0; x <= w - 42; x += 13, i++) {
    const c = i % 2 === 0 ? '#fff6dc' : '#f3d58a';
    fillCircle(ctx, x, 92, 2.2, c);
    fillCircle(ctx, x, 138, 2.2, c);
  }
  glowing(ctx, '#f2b6c8', 10, () => fitText(ctx, name.toUpperCase(), w / 2, 116, w - 100, 18, '#fbf1dc'));
  fillRect(ctx, 28, 142, w - 56, 8, '#c9a85e');

  // Cartazes.
  for (const [x, color] of [[46, '#b9a6e8'], [w - 92, '#f2b6c8']] as const) {
    fillRect(ctx, x, 162, 46, 64, '#f3d58a');
    fillRect(ctx, x + 3, 165, 40, 58, color);
    fillStar4(ctx, x + 23, 186, 10, '#fbf1dc');
    fillRect(ctx, x + 9, 206, 28, 3, '#3a2d6b');
    fillRect(ctx, x + 13, 212, 20, 3, '#3a2d6b');
  }
  // Portas duplas de vidro.
  fillRect(ctx, w / 2 - 42, h - 92, 84, 88, '#2a2050');
  litWindow(ctx, w / 2 - 38, h - 88, 36, 84, '#2a2050');
  litWindow(ctx, w / 2 + 2, h - 88, 36, 84, '#2a2050');
  fillRect(ctx, 14, h - 10, w - 28, 8, '#2a2050');
};

const drawFloricultura: BuildingDrawer = (ctx, w, h, name) => {
  baseShadow(ctx, w, h, 20);
  fillRect(ctx, 20, 84, w - 40, h - 88, '#8f7bb8');
  fillRect(ctx, 20, 84, 10, h - 88, 'rgba(0,0,0,0.08)');
  fillPolygon(ctx, [[6, 90], [w - 6, 90], [w / 2, 18]], '#24485a');
  fillPolygon(ctx, [[6, 90], [w - 6, 90], [w - 14, 84], [14, 84]], '#1b3644');
  litWindow(ctx, w / 2 - 14, 46, 28, 28, '#1b3644', true);

  plaque(ctx, name, w / 2, 106, 196, 22, '#2d5a55', '#fbf1dc', '#f3d58a');

  // Vitrine com flores.
  litWindow(ctx, 32, 126, 100, 66, '#2d5a55');
  const colors = ['#e88aa8', '#f3d58a', '#b9a6e8', '#fbf1dc', '#f2b6c8'];
  for (let i = 0; i < 8; i++) {
    const x = 42 + i * 11;
    fillRect(ctx, x, 172, 2, 16, '#2f6a5a');
    fillCircle(ctx, x + 1, 170, 4, colors[i % colors.length] ?? '#e88aa8');
  }
  fillRect(ctx, 28, 192, 108, 12, '#5a3d4f');
  for (let i = 0; i < 14; i++) {
    fillCircle(ctx, 34 + i * 7.5, 189, 3, colors[(i + 2) % colors.length] ?? '#f3d58a');
  }
  door(ctx, w - 102, h - 82, 46, 78, '#2d5a55', true);
  litWindow(ctx, w - 48, 128, 24, 40, '#2d5a55');

  // Trepadeira na lateral.
  for (let y = 96; y < h - 10; y += 9) {
    fillCircle(ctx, 24 + Math.sin(y / 9) * 3, y, 4, '#2f6a5a');
    if (y % 27 === 0) fillCircle(ctx, 24 + Math.sin(y / 9) * 3, y, 2, '#f2b6c8');
  }
  // Vasos.
  for (const x of [w - 116, w - 40]) {
    fillRoundRect(ctx, x - 9, h - 22, 18, 18, 3, '#8a5a4f');
    fillCircle(ctx, x, h - 28, 10, '#2f6a5a');
    fillCircle(ctx, x - 4, h - 32, 3, '#f3d58a');
    fillCircle(ctx, x + 4, h - 30, 3, '#e88aa8');
  }
};

const drawBiblioteca: BuildingDrawer = (ctx, w, h, name) => {
  baseShadow(ctx, w, h, 20);
  fillRect(ctx, 20, h - 14, w - 40, 10, '#535179');
  fillRect(ctx, 30, h - 24, w - 60, 10, '#5d5b85');
  fillRect(ctx, 30, 104, w - 60, h - 128, '#6c6a93');

  fillPolygon(ctx, [[16, 108], [w - 16, 108], [w / 2, 34]], '#57557d');
  fillRect(ctx, 16, 100, w - 32, 10, '#7f7caa');
  fillCircle(ctx, w / 2, 78, 16, '#3f3d63');
  glowing(ctx, '#f3d58a', 14, () => fillCircle(ctx, w / 2, 78, 13, '#f0c47e'));
  fillStar4(ctx, w / 2, 78, 10, '#fff6dc');

  plaque(ctx, name, w / 2, 122, 204, 20, '#3f3d63', '#f3d58a', '#7f7caa');

  // Janelas em arco entre as colunas.
  litWindow(ctx, 66, 150, 30, 54, '#3f3d63', true);
  litWindow(ctx, w - 96, 150, 30, 54, '#3f3d63', true);
  // Colunas.
  for (const x of [44, 104, w - 120, w - 60]) {
    fillRect(ctx, x, 136, 16, h - 160, '#a9a6c9');
    fillRect(ctx, x, 136, 5, h - 160, '#c3c0e0');
    fillRect(ctx, x - 3, 132, 22, 6, '#c3c0e0');
    fillRect(ctx, x - 3, h - 28, 22, 5, '#8f8cb5');
  }
  door(ctx, w / 2 - 24, h - 104, 48, 80, '#4a3247', false);
  fillRect(ctx, w / 2 - 1, h - 80, 2, 56, '#21182c');
};

const drawCasa: BuildingDrawer = (ctx, w, h, name) => {
  baseShadow(ctx, w, h, 40);
  fillRect(ctx, 210, 46, 24, 54, '#8c4864');
  fillRect(ctx, 206, 42, 32, 8, '#6f3550');
  fillRect(ctx, 40, 120, w - 80, h - 124, '#efe1cf');
  fillRect(ctx, 40, 120, 12, h - 124, 'rgba(0,0,0,0.07)');

  fillPolygon(ctx, [[18, 130], [w - 18, 130], [w / 2, 22]], '#b0607e');
  fillPolygon(ctx, [[18, 130], [w - 18, 130], [w - 26, 122], [26, 122]], '#8c4864');
  // Janela redonda com a estrela — o coração da casa.
  fillCircle(ctx, w / 2, 86, 23, '#8c4864');
  glowing(ctx, '#f3d58a', 24, () => fillCircle(ctx, w / 2, 86, 19, '#f6cf86'));
  glowing(ctx, '#fff6dc', 10, () => fillStar4(ctx, w / 2, 86, 15, '#fff6dc'));

  plaque(ctx, name, w / 2, 142, 128, 18, '#6b4a7a', '#fbf1dc', '#f3d58a');

  for (const x of [62, w - 114]) {
    litWindow(ctx, x, 160, 52, 46, '#8c4864');
    fillPolygon(ctx, [[x + 3, 163], [x + 16, 163], [x + 3, 196]], '#f2b6c8');
    fillPolygon(ctx, [[x + 49, 163], [x + 36, 163], [x + 49, 196]], '#f2b6c8');
    fillRect(ctx, x - 4, 206, 60, 9, '#8a5a4f');
    for (let i = 0; i < 7; i++) fillCircle(ctx, x + 2 + i * 8, 204, 3.2, i % 2 ? '#e88aa8' : '#fbf1dc');
  }
  fillRect(ctx, w / 2 - 34, 158, 68, 8, '#8c4864');
  door(ctx, w / 2 - 22, h - 88, 44, 84, '#6b4a7a', false);
  fillStar4(ctx, w / 2, h - 58, 8, '#f3d58a');
  for (const x of [w / 2 - 34, w / 2 + 34]) {
    glowing(ctx, '#f3d58a', 12, () => fillCircle(ctx, x, h - 60, 5, '#ffe6a0'));
    fillRect(ctx, x - 1, h - 54, 2, 10, '#6f3550');
  }
  fillRect(ctx, w / 2 - 40, h - 8, 80, 6, '#cdbba6');
};

const drawEmporio: BuildingDrawer = (ctx, w, h, name) => {
  baseShadow(ctx, w, h, 16);
  fillRect(ctx, 16, 70, w - 32, h - 74, '#3f6f6a');
  fillRect(ctx, 16, 70, 10, h - 74, 'rgba(0,0,0,0.1)');
  fillRect(ctx, 12, h - 12, w - 24, 8, '#2b4a47');

  // Telhado reto com o letreiro neon.
  fillRect(ctx, 12, 50, w - 24, 12, '#35605b');
  fillRect(ctx, 8, 60, w - 16, 14, '#2b4a47');
  fillRoundRect(ctx, w / 2 - 46, 22, 92, 26, 6, '#162a2f');
  glowing(ctx, '#7fe8ff', 12, () => fitText(ctx, 'GELADO', w / 2, 36, 80, 17, '#c8f8ff'));
  fillStar4(ctx, w / 2 + 52, 30, 5, '#f3d58a');

  plaque(ctx, name, w / 2, 90, 180, 22, '#1f3b39', '#f3d58a', '#f3d58a');

  // Toldo listrado.
  const stripe = 18;
  for (let x = 20, i = 0; x < w - 20; x += stripe, i++) {
    const color = i % 2 === 0 ? '#7fd1c3' : '#f6ead8';
    fillRect(ctx, x, 106, stripe, 16, color);
    fillCircle(ctx, x + stripe / 2, 122, stripe / 2, color);
  }

  // Geladeira na vitrine da esquerda, cheia de latinhas.
  const fx = 22;
  const fy = 136;
  const fw = 64;
  const fh = 62;
  fillRect(ctx, fx, fy, fw, fh, '#1f3b39');
  const cold = ctx.createLinearGradient(0, fy, 0, fy + fh);
  cold.addColorStop(0, '#effcff');
  cold.addColorStop(1, '#9fd8e6');
  ctx.fillStyle = cold;
  ctx.fillRect(fx + 3, fy + 3, fw - 6, fh - 6);
  const cans = ['#3fbf5a', '#f4f4f4', '#ffb02e', '#e04a5e', '#4a7fe0', '#3fbf5a'];
  for (let row = 0; row < 3; row++) {
    const y = fy + 8 + row * 18;
    fillRect(ctx, fx + 3, y + 12, fw - 6, 2, '#7fb5c2');
    for (let i = 0; i < 6; i++) fillRoundRect(ctx, fx + 7 + i * 9, y, 6, 11, 1.5, cans[(i + row) % cans.length] ?? '#3fbf5a');
  }

  // Porta de vidro no centro.
  door(ctx, w / 2 - 23, h - 82, 46, 78, '#1f3b39', true);

  // Vitrine da direita com sucos e refrigerantes.
  litWindow(ctx, w - 86, 136, 64, 50, '#1f3b39');
  const bottles = ['#ffb02e', '#e04a5e', '#7fd1c3', '#f2b6c8'];
  bottles.forEach((c, i) => {
    const bx = w - 78 + i * 13;
    fillRoundRect(ctx, bx, 166, 8, 16, 2, c);
    fillRect(ctx, bx + 2, 161, 4, 6, c);
  });

  // Engradado de garrafas ao lado da porta.
  fillRect(ctx, w / 2 + 30, h - 30, 30, 22, '#8a5a3f');
  fillRect(ctx, w / 2 + 30, h - 22, 30, 2, '#6b4430');
  for (let i = 0; i < 4; i++) fillRoundRect(ctx, w / 2 + 33 + i * 7, h - 40, 5, 12, 2, i % 2 ? '#3fbf5a' : '#ffb02e');
};

const DRAWERS: Record<BuildingId, BuildingDrawer> = {
  cafeteria: drawCafeteria,
  cinema: drawCinema,
  emporio: drawEmporio,
  floricultura: drawFloricultura,
  biblioteca: drawBiblioteca,
  casa: drawCasa,
};

export function generateBuildingTextures(scene: Phaser.Scene, keyFor: (id: BuildingId) => string): void {
  for (const location of LOCATIONS) {
    if (!isBuilding(location)) continue;
    const drawer = DRAWERS[location.id];
    canvasTexture(scene, keyFor(location.id), location.width, location.height, (ctx) =>
      drawer(ctx, location.width, location.height, location.name),
    );
  }
}
