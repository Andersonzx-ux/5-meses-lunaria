import Phaser from 'phaser';
import { TEX } from '../art/textures';
import { COLORS } from '../constants';
import type { DiscoveryData } from '../data/discoveries';
import { prefersReducedMotion } from '../systems/DialogueSystem';
import { UI_FONT, createButton } from './Button';
import { viewSize } from './layout';

/** Tempo mínimo antes de poder fechar, para o cartão não sumir num toque acidental. */
const MIN_VISIBLE_MS = 700;

/** Cartão animado que apresenta uma lembrança. */
export class DiscoveryReveal {
  private root?: Phaser.GameObjects.Container;
  private current?: DiscoveryData;
  private shownAt = 0;
  private resolve?: () => void;

  constructor(private readonly scene: Phaser.Scene) {}

  isOpen(): boolean {
    return this.root !== undefined;
  }

  show(discovery: DiscoveryData): Promise<void> {
    if (this.root) throw new Error('Já existe uma descoberta sendo exibida.');
    this.current = discovery;
    this.shownAt = this.scene.time.now;
    this.build(discovery, !prefersReducedMotion());
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  /** Ao girar a tela com o cartão aberto, reconstrói no novo tamanho (sem repetir a animação). */
  layout(): void {
    if (!this.root || !this.current) return;
    this.destroyRoot(this.root);
    this.build(this.current, false);
  }

  /** Fecha o cartão (botão, toque ou Espaço/Enter/E). */
  close(): void {
    const root = this.root;
    if (!root || this.scene.time.now - this.shownAt < MIN_VISIBLE_MS) return;
    this.root = undefined;
    this.current = undefined;
    const done = this.resolve;
    this.resolve = undefined;
    if (prefersReducedMotion()) this.destroyRoot(root);
    else this.scene.tweens.add({ targets: root, alpha: 0, duration: 220, onComplete: () => this.destroyRoot(root) });
    done?.();
  }

  private destroyRoot(root: Phaser.GameObjects.Container): void {
    // O brilho tem animação infinita: encerra as animações antes de destruir.
    this.scene.tweens.killTweensOf(root.list);
    root.destroy();
  }

  private build(discovery: DiscoveryData, animate: boolean): void {
    const scene = this.scene;
    const { w, h } = viewSize(scene);
    const cx = w / 2;
    const cy = h / 2;

    const dim = scene.add.rectangle(0, 0, w, h, COLORS.navy, 0.8).setOrigin(0).setInteractive();

    const panelW = Math.min(600, w - 32);
    const textW = panelW - (panelW < 500 ? 48 : 90);
    const message = scene.add
      .text(cx, 0, discovery.message, {
        fontFamily: UI_FONT,
        fontSize: '20px',
        fontStyle: 'italic',
        color: '#f2d9e4',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: textW, useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);
    // Altura do painel acompanha o tamanho da mensagem.
    const panelH = Math.max(340, 150 + message.height + 110);
    const top = cy - panelH / 2 + 20;
    message.setY(top + 140);

    const panel = scene.add.graphics();
    panel.fillStyle(0x151a45, 0.97);
    panel.fillRoundedRect(cx - panelW / 2, top, panelW, panelH, 22);
    panel.lineStyle(2, COLORS.gold, 0.9);
    panel.strokeRoundedRect(cx - panelW / 2, top, panelW, panelH, 22);

    const starY = top + 6;
    const glow = scene.add
      .image(cx, starY, TEX.glow)
      .setTint(COLORS.gold)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.6)
      .setAlpha(0.8);
    const star = scene.add.image(cx, starY, TEX.star).setTint(COLORS.gold).setScale(1.1);
    const core = scene.add.image(cx, starY, TEX.star).setTint(COLORS.cream).setScale(0.45);

    const caption = scene.add
      .text(cx, top + 70, discovery.required ? 'NOVA LEMBRANÇA' : 'SEGREDO ENCONTRADO', {
        fontFamily: UI_FONT,
        fontSize: '15px',
        color: '#b9a6e8',
        letterSpacing: 4,
      })
      .setOrigin(0.5);
    const title = scene.add
      .text(cx, top + 104, discovery.title, {
        fontFamily: UI_FONT,
        fontSize: panelW < 500 ? '24px' : '30px',
        color: '#fbf1dc',
        align: 'center',
        wordWrap: { width: panelW - 40, useAdvancedWrap: true },
      })
      .setOrigin(0.5);

    const button = createButton(scene, {
      x: cx,
      y: top + panelH - 44,
      width: Math.min(280, panelW - 40),
      height: 52,
      label: 'Guardar no coração',
      primary: true,
      fontSize: 22,
      onClick: () => this.close(),
    });
    button.setFocused(true);

    const root = scene.add.container(0, 0, [dim, panel, caption, title, message, button.container, glow, star, core]);
    root.setDepth(200);
    this.root = root;
    scene.tweens.add({ targets: glow, alpha: 0.45, scale: 2, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (!animate) return;

    root.setAlpha(0);
    scene.tweens.add({ targets: root, alpha: 1, duration: 260 });
    star.setScale(0).setAngle(-90);
    core.setScale(0);
    scene.tweens.add({ targets: star, scale: 1.1, angle: 0, duration: 700, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: core, scale: 0.45, duration: 700, delay: 120, ease: 'Back.easeOut' });
    for (const t of [caption, title, message, button.container]) t.setAlpha(0);
    scene.tweens.add({ targets: [caption, title], alpha: 1, duration: 400, delay: 350 });
    scene.tweens.add({ targets: [message, button.container], alpha: 1, duration: 500, delay: 650 });

    const burst = scene.add.particles(cx, starY, TEX.star, {
      speed: { min: 90, max: 260 },
      lifespan: 1100,
      scale: { start: 0.18, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: 0, max: 180 },
      tint: [COLORS.gold, COLORS.rose, COLORS.cream, COLORS.lilac],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    root.add(burst);
    burst.explode(36);
  }
}
