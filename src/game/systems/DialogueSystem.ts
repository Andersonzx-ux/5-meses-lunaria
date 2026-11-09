import Phaser from 'phaser';
import { TEX } from '../art/textures';
import { COLORS } from '../constants';
import type { DialogueLine } from '../data/dialogues';
import { UI_FONT } from '../ui/Button';
import { viewSize } from '../ui/layout';

/** Caracteres por segundo do efeito de digitação. */
const TYPE_SPEED = 42;
/** Ignora toques logo após abrir, para o mesmo toque/tecla não pular a primeira fala. */
const OPEN_GUARD_MS = 180;
/** Altura da caixa quando ela abre no topo (abaixo do botão de menu e do contador). */
const TOP_Y = 88;
const NEXT_R = 26;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  portrait: boolean;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Caixa de diálogo: nome do personagem, texto com digitação opcional e botão
 * para avançar. Tocar na caixa, no botão ou usar Espaço/Enter/E avança; se o
 * texto ainda estiver sendo digitado, o primeiro avanço só completa a fala.
 * Com o celular em pé, a caixa fica mais alta e estreita.
 */
export class DialogueSystem {
  private readonly root: Phaser.GameObjects.Container;
  private readonly boxBg: Phaser.GameObjects.Graphics;
  private readonly corner: Phaser.GameObjects.Image;
  private readonly hit: Phaser.GameObjects.Zone;
  private readonly nameplate: Phaser.GameObjects.Container;
  private readonly nameBg: Phaser.GameObjects.Graphics;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private readonly nextButton: Phaser.GameObjects.Container;
  private box: Box = { x: 0, y: 0, w: 0, h: 0, portrait: false };

  private lines: readonly DialogueLine[] = [];
  private index = 0;
  private fullText = '';
  private shown = 0;
  private typing?: Phaser.Time.TimerEvent;
  private openedAt = 0;
  private resolve?: () => void;
  private open = false;
  private closedAt = -Infinity;
  private baseY = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.boxBg = scene.add.graphics();
    this.corner = scene.add.image(0, 0, TEX.star).setTint(COLORS.gold).setScale(0.16).setAlpha(0.7);

    // Toque em qualquer lugar da caixa avança.
    this.hit = scene.add.zone(0, 0, 10, 10).setOrigin(0).setInteractive({ useHandCursor: true });
    this.hit.on('pointerdown', () => this.advance());

    this.nameBg = scene.add.graphics();
    this.nameText = scene.add
      .text(0, 0, '', { fontFamily: UI_FONT, fontSize: '20px', fontStyle: 'bold', color: '#0b1030' })
      .setOrigin(0, 0.5);
    this.nameplate = scene.add.container(0, 0, [this.nameBg, this.nameText]);

    this.body = scene.add.text(0, 0, '', {
      fontFamily: UI_FONT,
      fontSize: '22px',
      color: '#fbf1dc',
      lineSpacing: 8,
      wordWrap: { width: 100, useAdvancedWrap: true },
    });

    const nextBg = scene.add.graphics();
    nextBg.fillStyle(COLORS.gold, 1);
    nextBg.fillCircle(0, 0, NEXT_R);
    nextBg.lineStyle(2, COLORS.cream, 0.9);
    nextBg.strokeCircle(0, 0, NEXT_R);
    const arrow = scene.add.text(2, -2, '›', { fontFamily: UI_FONT, fontSize: '40px', color: '#0b1030' }).setOrigin(0.5);
    // Área de toque maior que o botão desenhado.
    const nextZone = scene.add.zone(0, 0, NEXT_R * 2 + 20, NEXT_R * 2 + 20).setInteractive({ useHandCursor: true });
    nextZone.on('pointerdown', () => this.advance());
    this.nextButton = scene.add.container(0, 0, [nextBg, arrow, nextZone]);
    scene.tweens.add({ targets: arrow, x: 6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.root = scene.add.container(0, 0, [this.boxBg, this.corner, this.hit, this.body, this.nameplate, this.nextButton]);
    this.root.setDepth(100).setVisible(false);
    this.layout();
  }

  /** Recalcula a caixa para o tamanho atual da tela (chamado também ao girar). */
  layout(): void {
    const { w, h, portrait } = viewSize(this.scene);
    const bw = Math.min(880, w - 32);
    const bh = portrait ? 236 : 148;
    const box: Box = { x: Math.round((w - bw) / 2), y: h - bh - 20, w: bw, h: bh, portrait };
    this.box = box;

    const g = this.boxBg;
    g.clear();
    g.fillStyle(0x0d1238, 0.95);
    g.fillRoundedRect(box.x, box.y, box.w, box.h, 18);
    g.lineStyle(2, COLORS.gold, 0.85);
    g.strokeRoundedRect(box.x, box.y, box.w, box.h, 18);
    g.lineStyle(1, COLORS.lilac, 0.25);
    g.strokeRoundedRect(box.x + 6, box.y + 6, box.w - 12, box.h - 12, 14);
    this.corner.setPosition(box.x + box.w - 22, box.y + 20);
    this.hit.setPosition(box.x, box.y).setSize(box.w, box.h);
    this.nameplate.setPosition(box.x + 26, box.y);

    this.body.setPosition(box.x + (portrait ? 24 : 30), box.y + (portrait ? 30 : 32));
    this.body.setFontSize(portrait ? 20 : 22).setLineSpacing(portrait ? 6 : 8);
    // Em pé, o texto usa a largura toda e o botão fica embaixo; deitado, o botão fica ao lado.
    this.body.setWordWrapWidth(box.w - (portrait ? 48 : 150), true);
    this.nextButton.setPosition(box.x + box.w - 54, box.y + box.h - (portrait ? 44 : 50));

    if (this.open) {
      this.root.setY(this.baseY);
      // Re-quebra a fala atual na nova largura e mostra completa.
      const line = this.lines[this.index];
      if (line) {
        this.fullText = this.body.getWrappedText(line.text).join('\n');
        this.finishTyping();
      }
    }
  }

  isOpen(): boolean {
    return this.open;
  }

  /** Aberto, ou fechado há pouquíssimo tempo (evita reabrir com a mesma tecla). */
  isBusy(): boolean {
    return this.open || this.scene.time.now - this.closedAt < OPEN_GUARD_MS;
  }

  /**
   * Mostra as falas em sequência; resolve quando a última for dispensada.
   * `avoidScreenY`: ponto mais baixo (na tela) que não deve ser coberto, como
   * os pés da personagem. Se ele cair atrás da caixa, ela abre no topo da tela.
   */
  play(lines: readonly DialogueLine[], avoidScreenY?: number): Promise<void> {
    if (lines.length === 0) return Promise.resolve();
    if (this.open) throw new Error('Já existe um diálogo aberto.');
    this.lines = lines;
    this.index = 0;
    this.open = true;
    this.openedAt = this.scene.time.now;
    this.baseY = avoidScreenY !== undefined && avoidScreenY > this.box.y - 24 ? TOP_Y - this.box.y : 0;
    this.root.setVisible(true);

    if (prefersReducedMotion()) {
      this.root.setAlpha(1).setY(this.baseY);
    } else {
      this.root.setAlpha(0).setY(this.baseY + 24);
      this.scene.tweens.add({ targets: this.root, alpha: 1, y: this.baseY, duration: 220, ease: 'Cubic.easeOut' });
    }
    this.showLine();
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  /** Completa a digitação ou passa para a próxima fala. */
  advance(): void {
    if (!this.open || this.scene.time.now - this.openedAt < OPEN_GUARD_MS) return;
    if (this.shown < this.fullText.length) {
      this.finishTyping();
      return;
    }
    this.index++;
    if (this.index < this.lines.length) this.showLine();
    else this.close();
  }

  private showLine(): void {
    const line = this.lines[this.index];
    if (!line) return;
    const narration = line.speaker === '';

    this.nameplate.setVisible(!narration);
    if (!narration) {
      this.nameText.setText(line.speaker);
      const w = this.nameText.width + 32;
      this.nameBg.clear();
      this.nameBg.fillStyle(COLORS.lilac, 1);
      this.nameBg.fillRoundedRect(0, -18, w, 36, 18);
      this.nameBg.lineStyle(2, COLORS.cream, 0.9);
      this.nameBg.strokeRoundedRect(0, -18, w, 36, 18);
      this.nameText.setPosition(16, 0);
    }

    this.body.setFontStyle(narration ? 'italic' : 'normal');
    this.body.setColor(narration ? '#d9c9f5' : '#fbf1dc');
    // Quebra as linhas antes de digitar, para as palavras não pularem de linha.
    this.fullText = this.body.getWrappedText(line.text).join('\n');
    this.typing?.remove();

    if (prefersReducedMotion()) {
      this.finishTyping();
      return;
    }
    this.shown = 0;
    this.body.setText('');
    this.nextButton.setAlpha(0.35);
    this.typing = this.scene.time.addEvent({
      delay: 1000 / TYPE_SPEED,
      repeat: this.fullText.length - 1,
      callback: () => {
        this.shown++;
        this.body.setText(this.fullText.slice(0, this.shown));
        if (this.shown >= this.fullText.length) this.nextButton.setAlpha(1);
      },
    });
  }

  private finishTyping(): void {
    this.typing?.remove();
    this.typing = undefined;
    this.shown = this.fullText.length;
    this.body.setText(this.fullText);
    this.nextButton.setAlpha(1);
  }

  private close(): void {
    this.open = false;
    this.closedAt = this.scene.time.now;
    this.typing?.remove();
    const done = this.resolve;
    this.resolve = undefined;
    const hide = (): void => {
      this.root.setVisible(false);
    };
    if (prefersReducedMotion()) hide();
    else this.scene.tweens.add({ targets: this.root, alpha: 0, y: this.baseY + 16, duration: 160, onComplete: hide });
    done?.();
  }
}
