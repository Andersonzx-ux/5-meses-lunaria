import Phaser from 'phaser';
import { TEX } from '../art/textures';
import { COLORS } from '../constants';
import { DISCOVERIES, type DiscoveryData } from '../data/discoveries';
import { LOCATIONS } from '../data/locations';
import { prefersReducedMotion } from '../systems/DialogueSystem';
import { DiscoverySystem } from '../systems/DiscoverySystem';
import { ProgressSystem } from '../systems/ProgressSystem';
import { UI_FONT, createButton } from './Button';
import { viewSize } from './layout';

const HINT = 'Toque numa lembrança para reler a mensagem.';
const EMPTY = 'Explore a cidade: as lembranças aparecem aqui.';
/** Quantidade de linhas vem dos dados: acrescentar lugares ou lembranças não quebra o layout. */
const PLACE_ROWS = LOCATIONS.length;
const MEMORY_ROWS = DISCOVERIES.length;
const SIDE_BY_SIDE_ROWS = Math.max(PLACE_ROWS, MEMORY_ROWS);

interface Row {
  discovery: DiscoveryData;
  highlight: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  w: number;
}

interface Column {
  x: number;
  top: number;
  w: number;
}

/**
 * Diário: locais visitados e lembranças encontradas, com as mensagens para
 * reler. Deitado, as listas ficam lado a lado; em pé, uma embaixo da outra.
 */
export class JournalPanel {
  private root?: Phaser.GameObjects.Container;
  private message?: Phaser.GameObjects.Text;
  private rows: Row[] = [];
  private selected = -1;
  private rowH = 34;

  constructor(private readonly scene: Phaser.Scene) {}

  isOpen(): boolean {
    return this.root !== undefined;
  }

  open(): void {
    if (this.root) return;
    this.build(-1, !prefersReducedMotion());
  }

  /** Ao girar a tela com o diário aberto, reconstrói mantendo a lembrança selecionada. */
  layout(): void {
    if (!this.root) return;
    const selected = this.selected;
    this.root.destroy();
    this.root = undefined;
    this.build(selected, false);
  }

  close(): void {
    const root = this.root;
    if (!root) return;
    this.root = undefined;
    this.message = undefined;
    this.rows = [];
    if (prefersReducedMotion()) root.destroy();
    else this.scene.tweens.add({ targets: root, alpha: 0, duration: 160, onComplete: () => root.destroy() });
  }

  /** Navegação por teclado entre as lembranças encontradas. */
  moveSelection(delta: number): void {
    if (this.rows.length === 0) return;
    const next =
      this.selected < 0 ? (delta > 0 ? 0 : this.rows.length - 1) : (this.selected + delta + this.rows.length) % this.rows.length;
    this.select(next);
  }

  private build(selected: number, animate: boolean): void {
    const scene = this.scene;
    const { w, h, portrait } = viewSize(scene);
    this.rows = [];
    this.selected = -1;
    const parts: Phaser.GameObjects.GameObject[] = [];

    const panelW = portrait ? Math.min(500, w - 24) : Math.min(820, w - 40);
    const panelH = portrait ? Math.min(h - 40, 760) : Math.min(472, h - 24);
    const px = Math.round((w - panelW) / 2);
    const py = Math.round((h - panelH) / 2);
    const cx = w / 2;

    parts.push(scene.add.rectangle(0, 0, w, h, COLORS.navy, 0.8).setOrigin(0).setInteractive());
    const panel = scene.add.graphics();
    panel.fillStyle(0x151a45, 0.98);
    panel.fillRoundedRect(px, py, panelW, panelH, 22);
    panel.lineStyle(2, COLORS.gold, 0.9);
    panel.strokeRoundedRect(px, py, panelW, panelH, 22);
    parts.push(panel);

    parts.push(
      scene.add.text(cx, py + 38, 'Diário de Lunária', { fontFamily: UI_FONT, fontSize: '28px', color: '#fbf1dc' }).setOrigin(0.5),
      scene.add.image(cx - 140, py + 38, TEX.star).setTint(COLORS.gold).setScale(0.2),
      scene.add.image(cx + 140, py + 38, TEX.star).setTint(COLORS.gold).setScale(0.2),
    );

    // Espaço vertical: título (~80), mensagem (~90) e botão (~70) ficam fora das listas.
    const listsArea = panelH - 240;
    let places: Column;
    let memories: Column;
    if (portrait) {
      this.rowH = Math.max(26, Math.min(36, (listsArea - 70) / (PLACE_ROWS + MEMORY_ROWS)));
      const colW = panelW - 48;
      places = { x: px + 24, top: py + 112, w: colW };
      memories = { x: px + 24, top: places.top + this.rowH * PLACE_ROWS + 44, w: colW };
    } else {
      this.rowH = Math.max(26, Math.min(34, (listsArea - 30) / SIDE_BY_SIDE_ROWS));
      const colW = panelW / 2 - 60;
      places = { x: px + 40, top: py + 112, w: colW };
      memories = { x: px + panelW / 2 + 20, top: py + 112, w: colW };
      const divider = scene.add.graphics();
      divider.lineStyle(1, COLORS.lilac, 0.25);
      divider.lineBetween(cx, places.top - 30, cx, places.top + this.rowH * SIDE_BY_SIDE_ROWS);
      parts.push(divider);
    }

    parts.push(
      this.header(places, `Lugares  ${ProgressSystem.visitedCount()}/${LOCATIONS.length}`),
      this.header(memories, `Lembranças  ${DiscoverySystem.requiredFound()}/${DiscoverySystem.requiredTotal()}`),
    );

    LOCATIONS.forEach((location, i) => {
      const y = places.top + i * this.rowH;
      const done = ProgressSystem.hasVisited(location.id);
      parts.push(this.icon(places.x + 10, y, done));
      parts.push(
        scene.add
          .text(places.x + 30, y, location.name, { fontFamily: UI_FONT, fontSize: '18px', color: done ? '#fbf1dc' : '#7b76a8' })
          .setOrigin(0, 0.5),
      );
    });

    DISCOVERIES.forEach((discovery, i) => {
      const y = memories.top + i * this.rowH;
      const done = DiscoverySystem.has(discovery.id);
      if (done) {
        const highlight = scene.add.graphics();
        parts.push(highlight);
        const zone = scene.add
          .zone(memories.x - 10, y - this.rowH / 2, memories.w + 20, this.rowH)
          .setOrigin(0)
          .setInteractive({ useHandCursor: true });
        const rowIndex = this.rows.length;
        zone.on('pointerdown', () => this.select(rowIndex));
        parts.push(zone);
        this.rows.push({ discovery, highlight, x: memories.x - 10, y, w: memories.w + 20 });
      }
      parts.push(this.icon(memories.x + 10, y, done));
      const label = done
        ? discovery.title
        : DiscoverySystem.isAvailable(discovery.id)
          ? discovery.hint
          : discovery.required
            ? 'Uma lembrança ainda adormecida…'
            : 'Um segredo escondido…';
      parts.push(
        scene.add
          .text(memories.x + 30, y, label, {
            fontFamily: UI_FONT,
            fontSize: done ? '18px' : '15px',
            fontStyle: done ? 'normal' : 'italic',
            color: done ? '#fbf1dc' : '#8f89bd',
          })
          .setOrigin(0, 0.5),
      );
    });

    const listsBottom = portrait ? memories.top + this.rowH * MEMORY_ROWS : places.top + this.rowH * SIDE_BY_SIDE_ROWS;
    this.message = scene.add
      .text(cx, listsBottom + 12, this.rows.length ? HINT : EMPTY, {
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'italic',
        color: '#b9a6e8',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: panelW - 60, useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);
    parts.push(this.message);

    const close = createButton(scene, {
      x: cx,
      y: py + panelH - 34,
      width: 180,
      height: 48,
      label: 'Fechar',
      fontSize: 20,
      primary: true,
      onClick: () => this.close(),
    });
    parts.push(close.container);

    const root = scene.add.container(0, 0, parts).setDepth(150);
    this.root = root;
    if (selected >= 0) this.select(selected);
    if (animate) {
      root.setAlpha(0);
      scene.tweens.add({ targets: root, alpha: 1, duration: 200 });
    }
  }

  private select(index: number): void {
    const row = this.rows[index];
    if (!row || !this.message) return;
    this.selected = index;
    this.rows.forEach((r, i) => {
      r.highlight.clear();
      if (i !== index) return;
      r.highlight.fillStyle(COLORS.lilac, 0.18);
      r.highlight.fillRoundedRect(r.x, r.y - this.rowH / 2 + 2, r.w, this.rowH - 4, 10);
    });
    this.message.setColor('#f2d9e4').setText(row.discovery.message);
  }

  private header(column: Column, text: string): Phaser.GameObjects.Text {
    return this.scene.add
      .text(column.x, column.top - 34, text.toUpperCase(), { fontFamily: UI_FONT, fontSize: '14px', color: '#b9a6e8', letterSpacing: 3 })
      .setOrigin(0, 0.5);
  }

  private icon(x: number, y: number, done: boolean): Phaser.GameObjects.Image {
    return this.scene.add
      .image(x, y, TEX.star)
      .setTint(done ? COLORS.gold : 0x4a4677)
      .setScale(done ? 0.2 : 0.14);
  }
}
