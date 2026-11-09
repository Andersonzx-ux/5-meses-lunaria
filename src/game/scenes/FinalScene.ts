import Phaser from 'phaser';
import { FEET_Y, FRAME_H, frameName, idleAnim } from '../art/character';
import { FINALE_TEX } from '../art/finale';
import { LAMP_LIGHT_OFFSET, TEX, buildingTextureKey } from '../art/textures';
import { COLORS } from '../constants';
import { DIALOGUES } from '../data/dialogues';
import { FINALE, LETTER_PAGES, LETTER_SIGNATURE } from '../data/letter';
import { DialogueSystem, prefersReducedMotion } from '../systems/DialogueSystem';
import { ProgressSystem } from '../systems/ProgressSystem';
import { bindKeys } from '../systems/keyboard';
import { UI_FONT, createButton, type Button } from '../ui/Button';
import { LetterPanel } from '../ui/LetterPanel';
import { createSoundButton } from '../ui/SoundButton';
import { onResize, viewSize } from '../ui/layout';
import { seededRandom } from '../utils/random';
import { SCENE_KEYS } from './BootScene';
import { ANDERSON_PROPOSAL_TEXTURE, LARISSA_PROPOSAL_TEXTURE } from './PreloadScene';

type Phase = 'proposal' | 'choice' | 'yes' | 'letter' | 'end';

interface Stage {
  objects: Phaser.GameObjects.GameObject[];
  larissa: Phaser.GameObjects.Sprite;
  anderson: Phaser.GameObjects.Sprite;
  rings: Phaser.GameObjects.Image;
  ringsGlow: Phaser.GameObjects.Image;
  bigStar: Phaser.GameObjects.Image;
  bigGlow: Phaser.GameObjects.Image;
  petals: Phaser.GameObjects.Particles.ParticleEmitter;
  /** Altura dos pés dos personagens e escala deles. */
  floorY: number;
  s: number;
  /** Altura da janela redonda da casa, de onde nasce a estrela. */
  windowY: number;
}

/**
 * A cena do pedido, na varanda da Casa do Futuro, em 12/06/2026:
 * o pedido (texto do Anderson) → "Sim" → a carta → a mensagem final.
 */
export class FinalScene extends Phaser.Scene {
  private phase: Phase = 'proposal';
  private stage?: Stage;
  private dialogue?: DialogueSystem;
  private letter?: LetterPanel;
  private choice?: Button;
  private endOverlay?: Phaser.GameObjects.Container;
  private endButtons: Button[] = [];
  private endFocus = 0;
  private leaving = false;

  constructor() {
    super(SCENE_KEYS.final);
  }

  create(): void {
    this.phase = 'proposal';
    this.choice = undefined;
    this.endOverlay = undefined;
    this.endButtons = [];
    this.leaving = false;

    this.buildStage();
    this.dialogue = new DialogueSystem(this);
    this.letter = new LetterPanel(this, LETTER_PAGES, LETTER_SIGNATURE);
    const sound = createSoundButton(this, this.scale.width - 38, 38).setDepth(400);

    const act = (event: KeyboardEvent): void => {
      if (!event.repeat) this.handleAction();
    };
    bindKeys(this, {
      Enter: act,
      ' ': act,
      e: act,
      E: act,
      ArrowRight: () => this.letter?.next(),
      ArrowLeft: () => this.letter?.prev(),
      ArrowUp: () => this.moveEndFocus(-1),
      ArrowDown: () => this.moveEndFocus(1),
    });

    onResize(this, () => {
      this.buildStage();
      sound.setX(this.scale.width - 38);
      this.dialogue?.layout();
      this.letter?.layout();
      if (this.choice) this.showChoice();
      if (this.endOverlay) this.showEnd(false);
    });

    this.cameras.main.fadeIn(1400, 255, 240, 220);
    this.time.delayedCall(1500, () => void this.play());
  }

  // ---------- Roteiro ----------

  private async play(): Promise<void> {
    if (!this.dialogue || !this.letter) return;
    await this.dialogue.play(DIALOGUES.proposal);
    this.phase = 'choice';
    this.showChoice();
  }

  private async sayYes(): Promise<void> {
    if (this.phase !== 'choice' || !this.dialogue || !this.letter) return;
    this.phase = 'yes';
    this.choice?.container.destroy();
    this.choice = undefined;
    this.celebrate();
    ProgressSystem.markFinished();

    await this.wait(2600);
    await this.dialogue.play(DIALOGUES.proposalYes);
    await this.wait(400);
    await this.readLetter();
  }

  private async readLetter(): Promise<void> {
    if (!this.letter) return;
    this.phase = 'letter';
    this.endOverlay?.destroy();
    this.endOverlay = undefined;
    this.endButtons = [];
    await this.letter.open();
    this.phase = 'end';
    this.showEnd(true);
  }

  private handleAction(): void {
    if (this.dialogue?.isOpen()) this.dialogue.advance();
    else if (this.phase === 'choice') void this.sayYes();
    else if (this.letter?.isOpen()) this.letter.next();
    else if (this.phase === 'end') this.endButtons[this.endFocus]?.activate();
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  // ---------- "Sim" ----------

  private showChoice(): void {
    this.choice?.container.destroy();
    const { w, h, portrait } = viewSize(this);
    const button = createButton(this, {
      x: w / 2,
      y: h - (portrait ? 140 : 96),
      width: 220,
      height: 64,
      label: 'Sim',
      fontSize: 30,
      primary: true,
      onClick: () => void this.sayYes(),
    });
    button.setFocused(true);
    button.container.setDepth(120);
    this.choice = button;
    if (!prefersReducedMotion()) {
      this.tweens.add({ targets: button.container, scale: 1.08, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // A caixinha das alianças aparece entre os dois enquanto ela decide.
    this.stage?.rings.setVisible(true);
    this.stage?.ringsGlow.setVisible(true);
  }

  private celebrate(): void {
    const stage = this.stage;
    if (!stage) return;
    const { s } = stage;
    const cx = this.scale.width / 2;
    const starY = stage.bigStar.y;

    // Os dois se aproximam.
    this.tweens.add({ targets: stage.larissa, x: cx - 17 * s, duration: 1200, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: stage.anderson, x: cx + 17 * s, duration: 1200, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: [stage.rings, stage.ringsGlow], y: stage.windowY, alpha: 0, duration: 1200 });

    // A estrela de quatro pontas nasce na janela redonda da casa e sobe para o céu.
    const starScale = stage.bigStar.scale;
    const glowScale = stage.bigGlow.scale;
    stage.bigStar.setVisible(true).setScale(0).setAngle(-90).setY(stage.windowY);
    stage.bigGlow.setVisible(true).setScale(0).setY(stage.windowY);
    this.tweens.add({ targets: stage.bigStar, scale: starScale, angle: 0, y: starY, duration: 2000, ease: 'Back.easeOut' });
    this.tweens.add({ targets: stage.bigGlow, scale: glowScale, y: starY, duration: 2200, ease: 'Sine.easeOut' });

    const burst = this.add.particles(cx, starY, TEX.star, {
      speed: { min: 80, max: 320 },
      lifespan: 1800,
      scale: { start: 0.22, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: 0, max: 180 },
      tint: [COLORS.gold, COLORS.rose, COLORS.cream, 0xc42a3f],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    burst.setDepth(60);
    burst.explode(70);
    stage.objects.push(burst);
    stage.petals.setFrequency(60);
  }

  // ---------- Final ----------

  private showEnd(animate: boolean): void {
    this.endOverlay?.destroy();
    const { w, h } = viewSize(this);
    const cx = w / 2;
    const cy = h / 2;
    const dim = this.add.rectangle(0, 0, w, h, COLORS.navy, 0.72).setOrigin(0);
    // Menos pétalas enquanto a mensagem final está na tela, para não atrapalhar a leitura.
    this.stage?.petals.setFrequency(220);
    const star = this.add.image(cx, cy - 150, TEX.star).setTint(COLORS.gold).setScale(0.9);
    const glow = this.add.image(cx, cy - 150, TEX.glow).setTint(COLORS.gold).setBlendMode(Phaser.BlendModes.ADD).setScale(2.2).setAlpha(0.7);
    const names = this.add
      .text(cx, cy - 70, FINALE.names, { fontFamily: UI_FONT, fontSize: w < 520 ? '38px' : '50px', color: '#fbf1dc', padding: { x: 20, y: 20 } })
      .setOrigin(0.5)
      .setShadow(0, 0, '#f3d58a', 20, false, true);
    const since = this.add
      .text(cx, cy - 14, FINALE.since, { fontFamily: UI_FONT, fontSize: '19px', fontStyle: 'italic', color: '#f2b6c8' })
      .setOrigin(0.5);
    const closing = this.add
      .text(cx, cy + 30, FINALE.closing, {
        fontFamily: UI_FONT,
        fontSize: '18px',
        color: '#d9c9f5',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: Math.min(560, w - 48), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);

    const buttonsY = Math.min(h - 50, cy + 30 + closing.height + 50);
    const twoRows = w < 520;
    const reread = createButton(this, {
      x: twoRows ? cx : cx - 125,
      y: buttonsY,
      width: 230,
      height: 50,
      label: 'Reler a carta',
      fontSize: 20,
      onClick: () => void this.readLetter(),
    });
    const back = createButton(this, {
      x: twoRows ? cx : cx + 125,
      y: twoRows ? Math.min(h - 40, buttonsY + 64) : buttonsY,
      width: 230,
      height: 50,
      label: 'Voltar a Lunária',
      fontSize: 20,
      primary: true,
      onClick: () => this.backToCity(),
    });
    this.endButtons = [back, reread];
    this.endFocus = 0;
    back.setFocused(true);

    const overlay = this.add.container(0, 0, [dim, glow, star, names, since, closing, reread.container, back.container]).setDepth(250);
    this.endOverlay = overlay;
    this.tweens.add({ targets: glow, alpha: 0.4, scale: 2.6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (animate && !prefersReducedMotion()) {
      overlay.setAlpha(0);
      this.tweens.add({ targets: overlay, alpha: 1, duration: 1400 });
    }
  }

  private moveEndFocus(delta: number): void {
    if (this.phase !== 'end' || this.endButtons.length === 0) return;
    this.endButtons[this.endFocus]?.setFocused(false);
    this.endFocus = (this.endFocus + delta + this.endButtons.length) % this.endButtons.length;
    this.endButtons[this.endFocus]?.setFocused(true);
  }

  private backToCity(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(900, 11, 16, 48);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(SCENE_KEYS.city));
  }

  // ---------- Cenário ----------

  /** Monta (ou remonta, ao girar a tela) o céu, a casa, os dois e os detalhes. */
  private buildStage(): void {
    const previous = this.stage;
    if (previous) {
      this.tweens.killTweensOf(previous.objects);
      previous.objects.forEach((o) => o.destroy());
    }

    const { w, h, portrait } = viewSize(this);
    const cx = w / 2;
    const boxH = portrait ? 236 : 148;
    const floorY = h - boxH - 34;
    // Casa ao fundo; os personagens não ficam maiores que a porta dela.
    const hs = Math.min((w * 0.9) / 300, (floorY - 60) / 260, 2.4);
    const s = Math.min(Phaser.Math.Clamp(h / 380, 1.3, 2.3), hs * 1.2);
    const objects: Phaser.GameObjects.GameObject[] = [];
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      objects.push(o);
      return o;
    };

    // Céu.
    const sky = add(this.add.graphics());
    sky.fillGradientStyle(0x0b1030, 0x0b1030, 0x4a2a6a, 0x4a2a6a, 1);
    sky.fillRect(0, 0, w, h);
    const rand = seededRandom(1206);
    const starCount = Math.round((w * floorY) / 2600);
    for (let i = 0; i < starCount; i++) {
      const star = add(this.add.circle(rand() * w, rand() * floorY * 0.9, 0.8 + rand() * 1.6, COLORS.cream, 0.5 + rand() * 0.5));
      this.tweens.add({ targets: star, alpha: 0.12, duration: 900 + rand() * 2000, delay: rand() * 2000, yoyo: true, repeat: -1 });
    }
    const moonX = w * 0.82;
    const moonY = Math.max(70, floorY * 0.16);
    for (let i = 4; i >= 1; i--) add(this.add.circle(moonX, moonY, 30 + i * 12, COLORS.cream, 0.05));
    add(this.add.circle(moonX, moonY, 30, COLORS.cream, 1));

    // Casa do Futuro ao fundo.
    add(this.add.image(cx, floorY - 6, buildingTextureKey('casa')).setOrigin(0.5, 1).setScale(hs));
    const windowGlow = add(
      this.add
        .image(cx, floorY - 6 - (260 - 86) * hs, TEX.glow)
        .setTint(COLORS.gold)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(1.3 * hs)
        .setAlpha(0.6),
    );
    this.tweens.add({ targets: windowGlow, alpha: 0.9, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Chão: grama e o caminho de pedra.
    add(this.add.tileSprite(0, floorY - 14, w, h - floorY + 14, TEX.grass).setOrigin(0));
    add(this.add.tileSprite(cx - 70 * s, floorY - 14, 140 * s, h - floorY + 14, TEX.cobble).setOrigin(0));

    // Lampiões dos dois lados da casa.
    const lampOffset = Math.min(150 * hs + 14, cx - 20);
    for (const lx of [cx - lampOffset, cx + lampOffset]) {
      add(this.add.image(lx, floorY, TEX.lamp).setOrigin(0.5, 1).setScale(s * 0.9));
      const glow = add(
        this.add
          .image(lx, floorY - LAMP_LIGHT_OFFSET * s * 0.9, TEX.glow)
          .setTint(COLORS.gold)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setScale(0.9 * s)
          .setAlpha(0.55),
      );
      this.tweens.add({ targets: glow, alpha: 0.4, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Presentes, chocolate e as rosas.
    add(this.add.image(cx - 72 * s, floorY + 2, FINALE_TEX.gift).setOrigin(0.5, 1).setScale(s * 0.6));
    add(this.add.image(cx - 96 * s, floorY + 4, FINALE_TEX.giftSmall).setOrigin(0.5, 1).setScale(s * 0.6));
    add(this.add.image(cx + 76 * s, floorY + 3, FINALE_TEX.chocolate).setOrigin(0.5, 1).setScale(s * 0.55));

    // Os dois, frente a frente (as roupas do dia do pedido).
    const settled = this.phase !== 'proposal' && this.phase !== 'choice';
    const gap = settled ? 17 : 26;
    const larissa = add(this.makeCharacter(LARISSA_PROPOSAL_TEXTURE, cx - gap * s, floorY, s, true));
    const anderson = add(this.makeCharacter(ANDERSON_PROPOSAL_TEXTURE, cx + gap * s, floorY, s, false));
    // Ele segura as rosas.
    add(this.add.image(anderson.x - 13 * s, floorY - 22 * s, FINALE_TEX.bouquet).setOrigin(0.5, 1).setScale(s * 0.42).setAngle(-12));

    // Caixinha das alianças (aparece na hora da pergunta), flutuando entre os dois.
    const ringsY = floorY - 34 * s;
    const ringsGlow = add(
      this.add.image(cx, ringsY, TEX.glow).setTint(COLORS.gold).setBlendMode(Phaser.BlendModes.ADD).setScale(0.9 * s).setAlpha(0.6),
    );
    const rings = add(this.add.image(cx, ringsY, FINALE_TEX.rings).setScale(s * 0.5)).setDepth(12);
    ringsGlow.setDepth(11);
    const showRings = this.phase === 'choice';
    rings.setVisible(showRings);
    ringsGlow.setVisible(showRings);
    this.tweens.add({ targets: [rings, ringsGlow], y: ringsY - 6, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // A grande estrela (depois do "sim"), no céu acima do telhado.
    const starScale = Math.min(s, 1.6);
    const roofPeak = floorY - 6 - (260 - 22) * hs;
    const starY = Math.max(36 + 32 * starScale, roofPeak - 60);
    const bigGlow = add(
      this.add.image(cx, starY, TEX.glow).setTint(COLORS.gold).setBlendMode(Phaser.BlendModes.ADD).setScale(3 * starScale).setAlpha(0.8),
    );
    const bigStar = add(this.add.image(cx, starY, TEX.star).setTint(COLORS.gold).setScale(1.3 * starScale));
    bigStar.setVisible(settled);
    bigGlow.setVisible(settled);
    this.tweens.add({ targets: bigGlow, alpha: 0.5, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Pétalas de rosa caindo e estrelinhas subindo.
    const petals = add(
      this.add.particles(0, -16, FINALE_TEX.petal, {
        x: { min: 0, max: w },
        lifespan: Math.round((h / 45) * 1000),
        speedY: { min: 35, max: 65 },
        speedX: { min: -25, max: 25 },
        rotate: { start: 0, end: 360 },
        scale: { min: 0.8, max: 1.4 },
        alpha: { start: 1, end: 0.6 },
        frequency: settled ? 60 : 380,
      }),
    ).setDepth(70);
    add(
      this.add.particles(0, floorY, TEX.star, {
        x: { min: 0, max: w },
        lifespan: 5000,
        speedY: { min: -40, max: -18 },
        scale: { start: 0.12, end: 0 },
        alpha: { start: 0.9, end: 0 },
        tint: [COLORS.gold, COLORS.rose, COLORS.lilac],
        blendMode: Phaser.BlendModes.ADD,
        frequency: 260,
      }),
    ).setDepth(65);

    this.stage = { objects, larissa, anderson, rings, ringsGlow, bigStar, bigGlow, petals, floorY, s, windowY: floorY - 6 - (260 - 86) * hs };
  }

  private makeCharacter(texture: string, x: number, y: number, s: number, faceRight: boolean): Phaser.GameObjects.Sprite {
    const sprite = this.add.sprite(x, y, texture, frameName('side', 4)).setOrigin(0.5, FEET_Y / FRAME_H).setScale(s);
    // Os quadros de lado olham para a esquerda; espelhar faz olhar para a direita.
    sprite.setFlipX(faceRight).setDepth(10);
    sprite.play(idleAnim(texture, 'side'));
    return sprite;
  }
}
