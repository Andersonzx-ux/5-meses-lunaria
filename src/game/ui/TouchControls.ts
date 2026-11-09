import Phaser from 'phaser';
import { TEX } from '../art/textures';
import { COLORS } from '../constants';
import { UI_FONT } from './Button';
import { viewSize } from './layout';

const JOY_R = 64;
const KNOB_R = 28;
const DEAD_ZONE = 0.18;
const ACTION_R = 50;
/** Faixa do topo reservada para o menu e o contador. */
const TOP_RESERVED = 90;
/** Opacidade em repouso: bem visíveis mesmo com o brilho do celular baixo. */
const REST_ALPHA = 0.85;
const IDLE_ACTION_ALPHA = 0.7;

export interface TouchControlsOptions {
  /** Botão de ação tocado. */
  onAction: () => void;
  /** Se o joystick pode começar agora (ex.: falso com diálogo aberto). */
  canStart: () => boolean;
}

/**
 * Controles para tela de toque: joystick analógico que aparece onde o polegar
 * toca na metade esquerda da tela, e botão de ação à direita. Só aparecem em
 * aparelhos com toque (ou depois do primeiro toque).
 */
export class TouchControls {
  private readonly vector = new Phaser.Math.Vector2();
  private readonly joystick: Phaser.GameObjects.Container;
  private readonly knob: Phaser.GameObjects.Graphics;
  private readonly action: Phaser.GameObjects.Container;
  private readonly actionLabel: Phaser.GameObjects.Text;
  private pointerId: number | null = null;
  private rest = { x: 0, y: 0 };
  private enabled = false;
  private hidden = false;
  private hasAction = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: TouchControlsOptions,
  ) {
    const base = scene.add.graphics();
    base.fillStyle(COLORS.navy, 0.6);
    base.fillCircle(0, 0, JOY_R);
    base.lineStyle(3, COLORS.cream, 0.85);
    base.strokeCircle(0, 0, JOY_R);
    this.knob = scene.add.graphics();
    this.knob.fillStyle(COLORS.gold, 0.95);
    this.knob.fillCircle(0, 0, KNOB_R);
    this.knob.lineStyle(2, COLORS.cream, 1);
    this.knob.strokeCircle(0, 0, KNOB_R);
    this.joystick = scene.add.container(0, 0, [base, this.knob]).setDepth(40).setAlpha(REST_ALPHA);

    const ring = scene.add.graphics();
    ring.fillStyle(COLORS.gold, 0.9);
    ring.fillCircle(0, 0, ACTION_R);
    ring.lineStyle(3, COLORS.cream, 0.95);
    ring.strokeCircle(0, 0, ACTION_R);
    const icon = scene.add.image(0, -10, TEX.star).setTint(COLORS.navy).setScale(0.34);
    this.actionLabel = scene.add
      .text(0, 22, '', { fontFamily: UI_FONT, fontSize: '13px', color: '#0b1030', align: 'center' })
      .setOrigin(0.5);
    const zone = scene.add.zone(0, 0, ACTION_R * 2 + 24, ACTION_R * 2 + 24).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.options.onAction());
    this.action = scene.add.container(0, 0, [ring, icon, this.actionLabel, zone]).setDepth(40);

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);

    this.layout();
    this.setupDetection();
  }

  /**
   * Mostra os controles em telas de toque. Além do que o Phaser detecta ao abrir,
   * considera a tela de dedo (`pointer: coarse`, inclusive se mudar depois) e
   * qualquer toque real recebido pela página.
   */
  private setupDetection(): void {
    const coarse = window.matchMedia?.('(pointer: coarse)');
    this.setEnabled(this.scene.sys.game.device.input.touch || (coarse?.matches ?? false));

    const onNativeTouch = (): void => {
      if (!this.enabled) this.setEnabled(true);
    };
    const onPointerChange = (event: MediaQueryListEvent): void => {
      if (event.matches && !this.enabled) this.setEnabled(true);
    };
    window.addEventListener('touchstart', onNativeTouch, { capture: true, passive: true });
    coarse?.addEventListener('change', onPointerChange);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('touchstart', onNativeTouch, { capture: true });
      coarse?.removeEventListener('change', onPointerChange);
    });
  }

  /** Direção atual do joystick (comprimento 0 a 1). */
  read(): Phaser.Math.Vector2 {
    return this.vector;
  }

  /** Reposiciona para o tamanho atual da tela. */
  layout(): void {
    const { w, h } = viewSize(this.scene);
    this.rest = { x: 24 + JOY_R, y: h - 24 - JOY_R };
    if (this.pointerId === null) this.joystick.setPosition(this.rest.x, this.rest.y);
    this.action.setPosition(w - 30 - ACTION_R, h - 34 - ACTION_R);
  }

  /** O que o botão de ação vai fazer agora (ex.: "Conversar"), ou `null` se nada. */
  setActionLabel(label: string | null): void {
    this.hasAction = label !== null;
    if (this.actionLabel.text !== (label ?? '')) this.actionLabel.setText(label ?? '');
    this.action.setAlpha(this.hasAction ? 1 : IDLE_ACTION_ALPHA);
  }

  /** Esconde tudo enquanto um diálogo, revelação ou o diário estiver aberto. */
  setHidden(hidden: boolean): void {
    if (hidden === this.hidden) return;
    this.hidden = hidden;
    if (hidden) this.release();
    this.refreshVisibility();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.refreshVisibility();
  }

  private refreshVisibility(): void {
    const show = this.enabled && !this.hidden;
    this.joystick.setVisible(show);
    this.action.setVisible(show);
  }

  private onDown(pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    if (!pointer.wasTouch) return;
    // Primeiro toque num aparelho que não se anunciou como touch: mostra os controles.
    if (!this.enabled) this.setEnabled(true);
    if (this.pointerId !== null || this.hidden || over.length > 0 || !this.options.canStart()) return;
    const { w, h } = viewSize(this.scene);
    if (pointer.x > w * 0.5 || pointer.y < TOP_RESERVED) return;

    this.pointerId = pointer.id;
    // A base aparece sob o polegar, sem sair da tela.
    const x = Phaser.Math.Clamp(pointer.x, JOY_R + 8, w - JOY_R - 8);
    const y = Phaser.Math.Clamp(pointer.y, TOP_RESERVED + JOY_R, h - JOY_R - 8);
    this.joystick.setPosition(x, y).setAlpha(1);
    this.updateKnob(pointer);
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.pointerId) this.updateKnob(pointer);
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.pointerId) this.release();
  }

  private updateKnob(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - this.joystick.x;
    const dy = pointer.y - this.joystick.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, JOY_R);
    const nx = dist > 0 ? dx / dist : 0;
    const ny = dist > 0 ? dy / dist : 0;
    this.knob.setPosition(nx * clamped, ny * clamped);
    // Zona morta no centro; depois disso a velocidade cresce até 1 na borda.
    const strength = clamped / JOY_R;
    const scaled = strength < DEAD_ZONE ? 0 : (strength - DEAD_ZONE) / (1 - DEAD_ZONE);
    this.vector.set(nx * scaled, ny * scaled);
  }

  private release(): void {
    this.pointerId = null;
    this.vector.set(0, 0);
    this.knob.setPosition(0, 0);
    this.joystick.setPosition(this.rest.x, this.rest.y).setAlpha(REST_ALPHA);
  }
}
