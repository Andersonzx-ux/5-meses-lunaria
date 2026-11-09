import Phaser from 'phaser';
import { COLORS } from '../constants';
import { UI_FONT } from '../ui/Button';

export interface Interactable {
  id: string;
  x: number;
  y: number;
  /** Altura (y no mundo) onde o balão aparece. */
  promptY: number;
  label: string;
  isEnabled: () => boolean;
  run: () => Promise<void>;
}

const PROMPT_DEPTH = 7000;

/**
 * Detecta o ponto interativo mais próximo do personagem e mostra um balão
 * tocável sobre ele. O balão funciona por toque/clique e pelas teclas de ação
 * (encaminhadas via `trigger`), então nada depende só do teclado.
 */
export class InteractionSystem {
  private readonly prompt: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly text: Phaser.GameObjects.Text;
  private readonly keyHint: Phaser.GameObjects.Container;
  private readonly hit: Phaser.GameObjects.Zone;
  private readonly showKeyHint: boolean;
  private current?: Interactable;
  private running = false;
  private bob?: Phaser.Tweens.Tween;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly targets: readonly Interactable[],
    private readonly radius: number,
  ) {
    // Em telas de toque não faz sentido mostrar a tecla "E".
    this.showKeyHint = !scene.sys.game.device.input.touch;

    this.bg = scene.add.graphics();
    this.text = scene.add
      .text(0, 0, '', { fontFamily: UI_FONT, fontSize: '17px', color: '#0b1030' })
      .setOrigin(0.5);
    const keyBg = scene.add.graphics();
    keyBg.fillStyle(COLORS.navy, 1);
    keyBg.fillRoundedRect(-11, -11, 22, 22, 6);
    const keyText = scene.add.text(0, 0, 'E', { fontFamily: UI_FONT, fontSize: '14px', color: '#fbf1dc' }).setOrigin(0.5);
    this.keyHint = scene.add.container(0, 0, [keyBg, keyText]);
    this.hit = scene.add.zone(0, 0, 10, 10).setInteractive({ useHandCursor: true });
    this.hit.on('pointerdown', () => this.trigger());

    this.prompt = scene.add.container(0, 0, [this.bg, this.text, this.keyHint, this.hit]);
    this.prompt.setDepth(PROMPT_DEPTH).setVisible(false);
  }

  /** Rótulo do alvo atual (ex.: "Conversar"), ou `null` se não houver nada por perto. */
  currentLabel(): string | null {
    return this.current?.label ?? null;
  }

  /** Executando um roteiro (diálogo, descoberta…). */
  isRunning(): boolean {
    return this.running;
  }

  /** Chamado a cada quadro com a posição dos pés do personagem. */
  update(x: number, y: number, allowed: boolean): void {
    const next = allowed && !this.running ? this.nearest(x, y) : undefined;
    if (next === this.current) return;
    this.current = next;
    if (next) this.showPrompt(next);
    else this.hidePrompt();
  }

  /** Interage com o alvo atual (tecla de ação ou toque no balão). */
  trigger(): void {
    const target = this.current;
    if (!target || this.running) return;
    this.running = true;
    this.hidePrompt();
    this.current = undefined;
    target
      .run()
      .catch((error: unknown) => console.error('Falha ao executar interação', target.id, error))
      .finally(() => {
        this.running = false;
      });
  }

  private nearest(x: number, y: number): Interactable | undefined {
    let best: Interactable | undefined;
    let bestDist = this.radius;
    for (const t of this.targets) {
      const d = Math.hypot(t.x - x, t.y - y);
      if (d <= bestDist && t.isEnabled()) {
        best = t;
        bestDist = d;
      }
    }
    return best;
  }

  private showPrompt(target: Interactable): void {
    this.text.setText(target.label);
    const pad = 18;
    const hintW = this.showKeyHint ? 30 : 0;
    const w = Math.max(this.text.width + pad * 2 + hintW, 88);
    const h = 40;
    this.bg.clear();
    this.bg.fillStyle(COLORS.cream, 0.96);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    this.bg.lineStyle(2, COLORS.gold, 1);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    this.bg.fillStyle(COLORS.cream, 0.96);
    this.bg.fillTriangle(-8, h / 2 - 1, 8, h / 2 - 1, 0, h / 2 + 9);
    this.text.setX(this.showKeyHint ? hintW / 2 - 4 : 0);
    this.keyHint.setVisible(this.showKeyHint).setX(-w / 2 + 22);
    // Área de toque maior que o desenho, para dedos (setSize também ajusta a área de entrada).
    this.hit.setSize(w + 16, h + 20);

    this.bob?.remove();
    this.prompt.setPosition(target.x, target.promptY).setVisible(true).setScale(0.6).setAlpha(0);
    this.scene.tweens.add({ targets: this.prompt, scale: 1, alpha: 1, duration: 160, ease: 'Back.easeOut' });
    this.bob = this.scene.tweens.add({
      targets: this.prompt,
      y: target.promptY - 5,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private hidePrompt(): void {
    this.bob?.remove();
    this.bob = undefined;
    this.prompt.setVisible(false);
  }
}
