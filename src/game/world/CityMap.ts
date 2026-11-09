import Phaser from 'phaser';
import { LAMP_LIGHT_OFFSET, TEX, buildingTextureKey, signTextureKey } from '../art/textures';
import { COLORS } from '../constants';
import {
  BENCHES,
  FLOWER_BEDS,
  LAMPS,
  PLAZA_TREES,
  POND,
  SIGNS,
  STREETS,
  STRING_LIGHTS,
  WORLD,
  type Rect,
} from '../data/cityLayout';
import { LOCATIONS, getPlaza, isBuilding, type BuildingLocation } from '../data/locations';
import { NPCS, SPOTS } from '../data/interactions';
import { seededRandom } from '../utils/random';

/** Camadas fixas. Objetos "em pé" usam a própria coordenada y como profundidade. */
export const DEPTH = {
  ground: -100,
  curb: -95,
  street: -90,
  plaza: -85,
  groundDecor: -80,
  groundLight: -75,
  overhead: 5000,
  ambient: 6000,
} as const;

export interface CityMap {
  /** Todos os obstáculos sólidos da cidade (corpos estáticos invisíveis). */
  obstacles: Phaser.Physics.Arcade.StaticGroup;
}

type Obstacles = Phaser.Physics.Arcade.StaticGroup;

function addBlock(scene: Phaser.Scene, obstacles: Obstacles, cx: number, cy: number, w: number, h: number): void {
  obstacles.add(scene.add.zone(cx, cy, w, h));
}

function expand(r: Rect, m: number): Rect {
  return { x: r.x - m, y: r.y - m, w: r.w + m * 2, h: r.h + m * 2 };
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function rectHitsCircle(r: Rect, cx: number, cy: number, radius: number): boolean {
  const nx = Phaser.Math.Clamp(cx, r.x, r.x + r.w);
  const ny = Phaser.Math.Clamp(cy, r.y, r.y + r.h);
  return Math.hypot(cx - nx, cy - ny) < radius;
}

function buildingRect(b: BuildingLocation): Rect {
  return { x: b.x - b.width / 2, y: b.y - b.height, w: b.width, h: b.height };
}

/** Caminho da porta de um prédio até a rua mais próxima abaixo dela. */
function doorPath(b: BuildingLocation): Rect | null {
  const below = STREETS.filter((s) => s.y >= b.y - 1 && b.x >= s.x && b.x <= s.x + s.w);
  const top = Math.min(...below.map((s) => s.y));
  if (!Number.isFinite(top) || top <= b.y) return null;
  return { x: b.x - 30, y: b.y - 6, w: 60, h: top - b.y + 10 };
}

function drawGround(scene: Phaser.Scene): void {
  scene.add.tileSprite(0, 0, WORLD.width, WORLD.height, TEX.grass).setOrigin(0).setDepth(DEPTH.ground);

  const paths: Rect[] = [...STREETS];
  for (const loc of LOCATIONS) {
    if (!isBuilding(loc)) continue;
    const path = doorPath(loc);
    if (path) paths.push(path);
  }

  const curb = scene.add.graphics().setDepth(DEPTH.curb);
  curb.fillStyle(0x4f4877, 1);
  for (const p of paths) {
    const e = expand(p, 4);
    curb.fillRect(e.x, e.y, e.w, e.h);
  }
  for (const p of paths) {
    scene.add.tileSprite(p.x, p.y, p.w, p.h, TEX.cobble).setOrigin(0).setDepth(DEPTH.street);
  }

  const plaza = getPlaza();
  scene.add.image(plaza.x, plaza.y, TEX.plaza).setDepth(DEPTH.plaza);
}

function placeBuildings(scene: Phaser.Scene, obstacles: Obstacles): void {
  for (const loc of LOCATIONS) {
    if (!isBuilding(loc)) continue;
    scene.add.image(loc.x, loc.y, buildingTextureKey(loc.id)).setOrigin(0.5, 1).setDepth(loc.y);
    const { width, height } = loc.collider;
    addBlock(scene, obstacles, loc.x, loc.y - 2 - height / 2, width, height);
  }

  // Brilho suave na janela redonda da Casa do Futuro.
  const casa = LOCATIONS.find((l) => l.id === 'casa');
  if (casa && isBuilding(casa)) {
    const glow = scene.add
      .image(casa.x, casa.y - casa.height + 86, TEX.glow)
      .setTint(COLORS.gold)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.55)
      .setScale(1.1)
      .setDepth(casa.y + 1);
    scene.tweens.add({ targets: glow, alpha: 0.85, scale: 1.35, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}

function placePlazaCenter(scene: Phaser.Scene, obstacles: Obstacles): void {
  const plaza = getPlaza();
  const base = plaza.y + 34;
  scene.add.image(plaza.x, base, TEX.fountain).setOrigin(0.5, 1).setDepth(base);
  addBlock(scene, obstacles, plaza.x, plaza.y, 176, 56);

  const starGlow = scene.add
    .image(plaza.x, base - 118, TEX.glow)
    .setTint(COLORS.gold)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setAlpha(0.5)
    .setScale(0.7)
    .setDepth(base + 1);
  scene.tweens.add({ targets: starGlow, alpha: 0.9, scale: 0.9, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  // Gotas subindo da fonte.
  scene.add
    .particles(plaza.x, base - 92, TEX.glow, {
      lifespan: 900,
      speedY: { min: -40, max: -20 },
      speedX: { min: -24, max: 24 },
      gravityY: 70,
      scale: { start: 0.05, end: 0.01 },
      alpha: { start: 0.8, end: 0 },
      tint: [0x9fb8ff, COLORS.cream],
      blendMode: Phaser.BlendModes.ADD,
      frequency: 90,
    })
    .setDepth(base + 2);
}

function placePond(scene: Phaser.Scene, obstacles: Obstacles): void {
  scene.add.image(POND.x, POND.y, TEX.pond).setDepth(DEPTH.plaza);
  // Elipse aproximada por dois retângulos sobrepostos.
  addBlock(scene, obstacles, POND.x, POND.y, POND.rx * 1.8, POND.ry * 1.3);
  addBlock(scene, obstacles, POND.x, POND.y, POND.rx * 1.2, POND.ry * 1.85);
}

function placeLamps(scene: Phaser.Scene, obstacles: Obstacles): void {
  const rand = seededRandom(31);
  for (const lamp of LAMPS) {
    scene.add.image(lamp.x, lamp.y, TEX.lamp).setOrigin(0.5, 1).setDepth(lamp.y);
    addBlock(scene, obstacles, lamp.x, lamp.y - 4, 12, 8);

    scene.add
      .image(lamp.x, lamp.y - 4, TEX.glow)
      .setTint(COLORS.gold)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.16)
      .setScale(1.8, 0.8)
      .setDepth(DEPTH.groundLight);

    const head = scene.add
      .image(lamp.x, lamp.y - LAMP_LIGHT_OFFSET, TEX.glow)
      .setTint(COLORS.gold)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.5)
      .setScale(0.9)
      .setDepth(lamp.y + 1);
    scene.tweens.add({
      targets: head,
      alpha: 0.38,
      duration: 900 + rand() * 1400,
      delay: rand() * 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}

function placeSmallProps(scene: Phaser.Scene, obstacles: Obstacles): void {
  for (const bench of BENCHES) {
    scene.add.image(bench.x, bench.y, TEX.bench).setOrigin(0.5, 1).setDepth(bench.y);
    addBlock(scene, obstacles, bench.x, bench.y - 8, 56, 14);
  }
  for (const bed of FLOWER_BEDS) {
    scene.add.image(bed.x, bed.y, TEX.flowers).setDepth(DEPTH.groundDecor);
  }
  SIGNS.forEach((sign, i) => {
    scene.add.image(sign.x, sign.y, signTextureKey(i)).setOrigin(0.5, 1).setDepth(sign.y);
    addBlock(scene, obstacles, sign.x, sign.y - 4, 12, 8);
  });
}

function addTree(
  scene: Phaser.Scene,
  obstacles: Obstacles,
  x: number,
  y: number,
  texture: string,
  scale: number,
  flip: boolean,
): void {
  scene.add.image(x, y, texture).setOrigin(0.5, 0.97).setScale(scale).setFlipX(flip).setDepth(y);
  addBlock(scene, obstacles, x, y - 4, 22 * scale, 12);
}

/** Espalha árvores na grama sem que tronco ou copa cubram ruas, prédios e outros elementos. */
function scatterTrees(scene: Phaser.Scene, obstacles: Obstacles): void {
  const plaza = getPlaza();
  const mustStayVisible: Rect[] = [
    ...STREETS,
    { x: POND.x - POND.rx, y: POND.y - POND.ry, w: POND.rx * 2, h: POND.ry * 2 },
    ...LAMPS.map((p) => ({ x: p.x - 14, y: p.y - 96, w: 28, h: 96 })),
    ...BENCHES.map((p) => ({ x: p.x - 32, y: p.y - 34, w: 64, h: 34 })),
    ...FLOWER_BEDS.map((p) => ({ x: p.x - 36, y: p.y - 18, w: 72, h: 36 })),
    ...SIGNS.map((p) => ({ x: p.x - 70, y: p.y - 92, w: 140, h: 92 })),
  ].map((r) => expand(r, 10));
  // Moradores e pontos de interação precisam ficar visíveis e acessíveis.
  for (const p of [...NPCS, ...SPOTS]) mustStayVisible.push({ x: p.x - 40, y: p.y - 80, w: 80, h: 110 });
  for (const loc of LOCATIONS) {
    if (!isBuilding(loc)) continue;
    mustStayVisible.push(expand(buildingRect(loc), 14));
    const path = doorPath(loc);
    if (path) mustStayVisible.push(expand(path, 10));
  }

  // Área ocupada por uma árvore (copa + tronco) a partir do ponto da base.
  const treeArea = (x: number, y: number): Rect => ({ x: x - 42, y: y - 118, w: 84, h: 124 });

  const placed: Array<{ x: number; y: number }> = [...PLAZA_TREES];
  const isFree = (x: number, y: number, minDist: number): boolean => {
    const area = treeArea(x, y);
    if (rectHitsCircle(area, plaza.x, plaza.y, plaza.radius + 10)) return false;
    if (mustStayVisible.some((r) => intersects(r, area))) return false;
    return placed.every((p) => Math.hypot(p.x - x, p.y - y) >= minDist);
  };

  const rand = seededRandom(2024);
  const candidates: Array<{ x: number; y: number; minDist: number }> = [];
  // Cinturão de árvores nas bordas do mundo.
  for (let x = 40; x < WORLD.width; x += 78) {
    candidates.push({ x: x + rand() * 30, y: 130 + rand() * 30, minDist: 60 });
    candidates.push({ x: x + rand() * 30, y: WORLD.height - 20 - rand() * 40, minDist: 60 });
  }
  for (let y = 200; y < WORLD.height; y += 78) {
    candidates.push({ x: 40 + rand() * 50, y: y + rand() * 30, minDist: 60 });
    candidates.push({ x: WORLD.width - 40 - rand() * 50, y: y + rand() * 30, minDist: 60 });
  }
  // Árvores soltas no interior.
  for (let i = 0; i < 700; i++) {
    candidates.push({ x: 60 + rand() * (WORLD.width - 120), y: 150 + rand() * (WORLD.height - 180), minDist: 110 });
  }

  for (const c of candidates) {
    if (!isFree(c.x, c.y, c.minDist)) continue;
    placed.push({ x: c.x, y: c.y });
    const texture = rand() < 0.16 ? TEX.treeBlossom : TEX.tree;
    addTree(scene, obstacles, c.x, c.y, texture, 0.85 + rand() * 0.3, rand() > 0.5);
  }
}

function placePlazaTrees(scene: Phaser.Scene, obstacles: Obstacles): void {
  PLAZA_TREES.forEach((t, i) => addTree(scene, obstacles, t.x, t.y, TEX.treeBlossom, 1, i % 2 === 1));

  const g = scene.add.graphics().setDepth(DEPTH.overhead);
  const bulbs: Phaser.GameObjects.Image[] = [];
  const colors = [COLORS.gold, COLORS.rose, COLORS.cream, COLORS.lilac];
  for (const [a, b] of STRING_LIGHTS) {
    const from = PLAZA_TREES[a];
    const to = PLAZA_TREES[b];
    if (!from || !to) continue;
    const p0 = new Phaser.Math.Vector2(from.x, from.y - 92);
    const p2 = new Phaser.Math.Vector2(to.x, to.y - 92);
    const p1 = new Phaser.Math.Vector2((p0.x + p2.x) / 2, (p0.y + p2.y) / 2 + 34);
    const curve = new Phaser.Curves.QuadraticBezier(p0, p1, p2);
    g.lineStyle(1.5, 0xd9c9f5, 0.45);
    curve.draw(g, 32);
    curve.getPoints(14).forEach((p, i, all) => {
      if (i === 0 || i === all.length - 1) return;
      const color = colors[i % colors.length] ?? COLORS.gold;
      g.fillStyle(color, 1);
      g.fillCircle(p.x, p.y + 2, 2.6);
      bulbs.push(
        scene.add
          .image(p.x, p.y + 2, TEX.glow)
          .setTint(color)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setScale(0.16)
          .setAlpha(0.7)
          .setDepth(DEPTH.overhead + 1),
      );
    });
  }
  scene.tweens.add({
    targets: bulbs,
    alpha: 0.25,
    duration: 1100,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
    delay: scene.tweens.stagger(140, {}),
  });
}

function addFireflies(scene: Phaser.Scene): void {
  scene.add
    .particles(0, 0, TEX.glow, {
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, 0, WORLD.width, WORLD.height), quantity: 1 },
      lifespan: 6000,
      speed: { min: 4, max: 14 },
      scale: { start: 0.09, end: 0.02 },
      alpha: { start: 0.85, end: 0 },
      tint: [COLORS.gold, COLORS.lilac, COLORS.rose],
      blendMode: Phaser.BlendModes.ADD,
      frequency: 110,
      maxAliveParticles: 70,
    })
    .setDepth(DEPTH.ambient);
}

/** Monta toda a cidade na cena e devolve os obstáculos para colisão. */
export function buildCity(scene: Phaser.Scene): CityMap {
  const obstacles = scene.physics.add.staticGroup();
  drawGround(scene);
  placeBuildings(scene, obstacles);
  placePlazaCenter(scene, obstacles);
  placePlazaTrees(scene, obstacles);
  placePond(scene, obstacles);
  placeLamps(scene, obstacles);
  placeSmallProps(scene, obstacles);
  scatterTrees(scene, obstacles);
  addFireflies(scene);
  return { obstacles };
}
