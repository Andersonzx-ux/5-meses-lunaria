import Phaser from 'phaser';
import { TEX } from '../art/textures';
import { COLORS } from '../constants';
import { prefersReducedMotion } from '../systems/DialogueSystem';
import { UI_FONT, createButton, type Button } from './Button';
import { viewSize } from './layout';

const INK = '#3a2233';
const PAPER = 0xf6ecd9;
const MAX_FONT = 21;
const MIN_FONT = 14;

/**
 * Carta em papel, página por página. Toque em "›"/"‹", setas ou Espaço/Enter.
 * A fonte diminui (até um limite) para cada página caber em telas pequenas.
 */
export class LetterPanel {
  private root?: Phaser.GameObjects.Container;
  private page = 0;
  private resolve?: () => void;
  private nextButton?: Button;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly pages: readonly string[],
    private readonly signature: string,
  ) {}

  isOpen(): boolean {
    return this.root !== undefined;
  }

  /** Abre na primeira página; resolve quando a última for concluída. */
  open(): Promise<void> {
    this.page = 0;
    this.build(!prefersReducedMotion());
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  next(): void {
    if (!this.root) return;
    if (this.page < this.pages.length - 1) {
      this.page++;
      this.rebuild();
      return;
    }
    const done = this.resolve;
    this.resolve = undefined;
    this.close();
    done?.();
  }

  prev(): void {
    if (!this.root || this.page === 0) return;
    this.page--;
    this.rebuild();
  }

  /** Reconstrói no tamanho atual (ao girar a tela). */
  layout(): void {
    if (this.root) this.rebuild();
  }

  private rebuild(): void {
    this.root?.destroy();
    this.root = undefined;
    this.build(false);
  }

  private close(): void {
    const root = this.root;
    this.root = undefined;
    if (!root) return;
    if (prefersReducedMotion()) root.destroy();
    else this.scene.tweens.add({ targets: root, alpha: 0, duration: 300, onComplete: () => root.destroy() });
  }

  private build(animate: boolean): void {
    const scene = this.scene;
    const { w, h } = viewSize(scene);
    const cardW = Math.min(560, w - 32);
    const cardH = Math.min(560, h - 40);
    const x = Math.round((w - cardW) / 2);
    const y = Math.round((h - cardH) / 2);
    const cx = w / 2;
    const last = this.page === this.pages.length - 1;

    const dim = scene.add.rectangle(0, 0, w, h, COLORS.navy, 0.72).setOrigin(0).setInteractive();
    const card = scene.add.graphics();
    card.fillStyle(0x000000, 0.25);
    card.fillRoundedRect(x + 6, y + 8, cardW, cardH, 16);
    card.fillStyle(PAPER, 1);
    card.fillRoundedRect(x, y, cardW, cardH, 16);
    card.lineStyle(2, COLORS.gold, 1);
    card.strokeRoundedRect(x + 8, y + 8, cardW - 16, cardH - 16, 12);
    const seal = scene.add.image(cx, y + 30, TEX.star).setTint(0xc42a3f).setScale(0.32);

    // Área do texto: entre o selo e os botões.
    const textTop = y + 56;
    const textBottom = y + cardH - (last ? 104 : 74);
    const text = scene.add.text(x + 28, textTop, this.pages[this.page] ?? '', {
      fontFamily: UI_FONT,
      fontSize: `${MAX_FONT}px`,
      fontStyle: 'italic',
      color: INK,
      lineSpacing: 7,
      wordWrap: { width: cardW - 56, useAdvancedWrap: true },
    });
    for (let size = MAX_FONT; size > MIN_FONT && text.height > textBottom - textTop; size--) {
      text.setFontSize(size);
    }

    const parts: Phaser.GameObjects.GameObject[] = [dim, card, seal, text];
    if (last) {
      parts.push(
        scene.add
          .text(x + cardW - 30, y + cardH - 92, this.signature, { fontFamily: UI_FONT, fontSize: '20px', fontStyle: 'italic', color: '#8e2433' })
          .setOrigin(1, 0.5),
      );
    }

    parts.push(
      scene.add
        .text(cx, y + cardH - 40, `${this.page + 1} / ${this.pages.length}`, { fontFamily: UI_FONT, fontSize: '15px', color: '#8a6a7a' })
        .setOrigin(0.5),
    );
    if (this.page > 0) {
      parts.push(
        createButton(scene, { x: x + 64, y: y + cardH - 40, width: 84, height: 44, label: '‹', fontSize: 30, onClick: () => this.prev() })
          .container,
      );
    }
    this.nextButton = createButton(scene, {
      x: x + cardW - (last ? 92 : 64),
      y: y + cardH - 40,
      width: last ? 140 : 84,
      height: 44,
      label: last ? 'Continuar' : '›',
      fontSize: last ? 20 : 30,
      primary: true,
      onClick: () => this.next(),
    });
    this.nextButton.setFocused(true);
    parts.push(this.nextButton.container);

    const root = scene.add.container(0, 0, parts).setDepth(300);
    this.root = root;
    if (animate) {
      root.setAlpha(0);
      scene.tweens.add({ targets: root, alpha: 1, duration: 600 });
    }
  }
}
