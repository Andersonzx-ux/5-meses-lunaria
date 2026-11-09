import Phaser from 'phaser';
import { TEX } from '../art/textures';
import { COLORS } from '../constants';
import type { DialogueLine } from '../data/dialogues';
import type { DiscoveryData } from '../data/discoveries';
import { DialogueSystem, prefersReducedMotion } from '../systems/DialogueSystem';
import { DISCOVERY_FOUND, DiscoverySystem } from '../systems/DiscoverySystem';
import { PROGRESS_EVENTS, ProgressSystem } from '../systems/ProgressSystem';
import { bindKeys } from '../systems/keyboard';
import { UI_FONT, createButton } from '../ui/Button';
import { DiscoveryReveal } from '../ui/DiscoveryReveal';
import { JournalPanel } from '../ui/JournalPanel';
import { createSoundButton } from '../ui/SoundButton';
import { TouchControls } from '../ui/TouchControls';
import { onResize } from '../ui/layout';
import { SCENE_KEYS } from './BootScene';

const COUNTER_W = 112;
const NO_MOVEMENT = new Phaser.Math.Vector2(0, 0);

/**
 * Interface sobreposta à cidade, numa cena própria para não ser afetada pela
 * câmera do mundo: menu, contador/diário, nome dos locais, diálogos, revelações
 * e controles de toque.
 */
export class HUDScene extends Phaser.Scene {
  private leaving = false;
  private dialogue?: DialogueSystem;
  private reveal?: DiscoveryReveal;
  private journal?: JournalPanel;
  private touch?: TouchControls;
  private counterText?: Phaser.GameObjects.Text;
  private counter?: Phaser.GameObjects.Container;
  private banner?: Phaser.GameObjects.Container;
  /** Ação no mundo (interagir com o que está perto), definida pela cidade. */
  private worldAction?: () => void;

  constructor() {
    super(SCENE_KEYS.hud);
  }

  create(): void {
    this.leaving = false;
    createButton(this, {
      x: 16 + 52,
      y: 16 + 22,
      width: 104,
      height: 44,
      label: '‹ Menu',
      fontSize: 20,
      onClick: () => this.backToMenu(),
    });
    createSoundButton(this, 16 + 104 + 14 + 22, 16 + 22);
    this.createCounter();
    this.dialogue = new DialogueSystem(this);
    this.reveal = new DiscoveryReveal(this);
    this.journal = new JournalPanel(this);
    this.touch = new TouchControls(this, {
      onAction: () => this.handleTouchAction(),
      canStart: () => !this.isBusy(),
    });

    onResize(this, () => {
      this.counter?.setX(this.scale.width - 16);
      this.banner?.setX(this.scale.width / 2);
      this.dialogue?.layout();
      this.reveal?.layout();
      this.journal?.layout();
      this.touch?.layout();
    });

    // As cenas atualizam de cima para baixo (a HUD antes da cidade); sincronizar
    // depois de todas evita os controles aparecerem por um quadro sobre um diálogo
    // que a cidade acabou de abrir.
    const syncControls = (): void => this.touch?.setHidden(this.isBusy());
    this.game.events.on(Phaser.Core.Events.POST_STEP, syncControls);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(Phaser.Core.Events.POST_STEP, syncControls));

    const action = (event: KeyboardEvent): void => {
      if (!event.repeat) this.handleAction();
    };
    const toggleJournal = (): void => {
      if (this.journal?.isOpen()) this.journal.close();
      else this.openJournal();
    };
    bindKeys(this, {
      Escape: () => {
        if (this.journal?.isOpen()) this.journal.close();
        else if (!this.isBusy()) this.backToMenu();
      },
      Enter: action,
      ' ': action,
      e: action,
      E: action,
      j: toggleJournal,
      J: toggleJournal,
      ArrowUp: () => this.journal?.moveSelection(-1),
      ArrowDown: () => this.journal?.moveSelection(1),
    });

    const onFound = (): void => this.updateCounter(true);
    const onSaveFailed = (): void => this.showSaveWarning();
    DiscoverySystem.on(DISCOVERY_FOUND, onFound);
    ProgressSystem.on(PROGRESS_EVENTS.saveFailed, onSaveFailed);
    if (!ProgressSystem.storageWorking()) this.showSaveWarning();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      DiscoverySystem.off(DISCOVERY_FOUND, onFound);
      ProgressSystem.off(PROGRESS_EVENTS.saveFailed, onSaveFailed);
      // A instância da cena sobrevive; solta as referências aos objetos destruídos.
      this.dialogue = undefined;
      this.reveal = undefined;
      this.journal = undefined;
      this.touch = undefined;
      this.counter = undefined;
      this.counterText = undefined;
      this.banner = undefined;
    });
  }

  /** Direção do joystick de toque (zero se não houver toque). */
  touchVector(): Phaser.Math.Vector2 {
    return this.touch?.read() ?? NO_MOVEMENT;
  }

  /** A cidade informa o que o botão de ação faz agora (ou `null`). */
  setActionLabel(label: string | null): void {
    this.touch?.setActionLabel(label);
  }

  /** A cidade registra a ação de interagir com o mundo (ou remove ao sair). */
  setWorldAction(action: (() => void) | undefined): void {
    this.worldAction = action;
  }

  /** Botão de ação: avança diálogos/fecha painéis; senão, interage com o que está perto. */
  private handleTouchAction(): void {
    if (this.isBusy()) this.handleAction();
    else this.worldAction?.();
  }

  /** A interface desta execução já foi criada. */
  isReady(): boolean {
    return this.dialogue !== undefined;
  }

  /** Há diálogo, revelação ou diário na tela (o personagem não deve andar). */
  isBusy(): boolean {
    return (this.dialogue?.isBusy() ?? false) || (this.reveal?.isOpen() ?? false) || (this.journal?.isOpen() ?? false);
  }

  /** Mostra uma sequência de falas (veja `DialogueSystem.play` sobre `avoidScreenY`). */
  say(lines: readonly DialogueLine[], avoidScreenY?: number): Promise<void> {
    if (!this.dialogue) return Promise.reject(new Error('A interface ainda não foi criada.'));
    return this.dialogue.play(lines, avoidScreenY);
  }

  /** Apresenta uma descoberta com animação. */
  revealDiscovery(discovery: DiscoveryData): Promise<void> {
    if (!this.reveal) return Promise.reject(new Error('A interface ainda não foi criada.'));
    return this.reveal.show(discovery);
  }

  /** Faixa com o nome do local ao chegar nele. */
  showLocation(name: string, firstVisit: boolean): void {
    this.banner?.destroy();
    const title = this.add
      .text(0, firstVisit ? -8 : 0, name, { fontFamily: UI_FONT, fontSize: '24px', color: '#fbf1dc' })
      .setOrigin(0.5);
    const parts: Phaser.GameObjects.GameObject[] = [];
    const w = title.width + 110;
    const h = firstVisit ? 64 : 48;
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.navy, 0.85);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    bg.lineStyle(2, COLORS.gold, 0.85);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    parts.push(
      bg,
      this.add.image(-w / 2 + 28, 0, TEX.star).setTint(COLORS.gold).setScale(0.24),
      this.add.image(w / 2 - 28, 0, TEX.star).setTint(COLORS.gold).setScale(0.24),
      title,
    );
    if (firstVisit) {
      parts.push(
        this.add
          .text(0, 18, 'NOVO LUGAR', { fontFamily: UI_FONT, fontSize: '12px', color: '#b9a6e8', letterSpacing: 3 })
          .setOrigin(0.5),
      );
    }
    const banner = this.add.container(this.scale.width / 2, 48, parts).setDepth(50);
    this.banner = banner;

    const hold = firstVisit ? 2600 : 1800;
    if (prefersReducedMotion()) {
      this.time.delayedCall(hold, () => banner.destroy());
      return;
    }
    banner.setAlpha(0).setY(36);
    this.tweens.chain({
      targets: banner,
      tweens: [
        { alpha: 1, y: 48, duration: 350, ease: 'Cubic.easeOut' },
        { alpha: 0, duration: 450, delay: hold },
      ],
      onComplete: () => banner.destroy(),
    });
  }

  private openJournal(): void {
    if (!this.journal || this.journal.isOpen()) return;
    // Não abre por cima de um diálogo ou de uma revelação.
    if (this.dialogue?.isBusy() || this.reveal?.isOpen()) return;
    this.journal.open();
  }

  private handleAction(): void {
    if (this.journal?.isOpen()) this.journal.close();
    else if (this.reveal?.isOpen()) this.reveal.close();
    else if (this.dialogue?.isOpen()) this.dialogue.advance();
  }

  private showSaveWarning(): void {
    const text = this.add
      .text(this.scale.width / 2, 110, 'Este navegador não permitiu salvar. Dá pra jogar, mas o progresso não vai ficar guardado.', {
        fontFamily: UI_FONT,
        fontSize: '16px',
        color: '#0b1030',
        backgroundColor: '#f2b6c8',
        padding: { x: 14, y: 8 },
        align: 'center',
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5, 0)
      .setDepth(60);
    this.time.delayedCall(7000, () => text.destroy());
  }

  private createCounter(): void {
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.navy, 0.7);
    bg.fillRoundedRect(-COUNTER_W, 0, COUNTER_W, 44, 22);
    bg.lineStyle(2, COLORS.gold, 0.8);
    bg.strokeRoundedRect(-COUNTER_W, 0, COUNTER_W, 44, 22);
    const star = this.add.image(-90, 22, TEX.star).setTint(COLORS.gold).setScale(0.34);
    this.counterText = this.add
      .text(-46, 22, '', { fontFamily: UI_FONT, fontSize: '22px', color: '#fbf1dc' })
      .setOrigin(0.5);
    const caption = this.add
      .text(-COUNTER_W / 2, 56, 'diário', { fontFamily: UI_FONT, fontSize: '13px', color: '#b9a6e8' })
      .setOrigin(0.5);
    // Tocar no contador abre o diário.
    const zone = this.add
      .zone(-COUNTER_W - 6, -6, COUNTER_W + 12, 72)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.openJournal());
    this.counter = this.add.container(this.scale.width - 16, 16, [bg, star, this.counterText, caption, zone]);
    this.tweens.add({ targets: star, angle: 360, duration: 12000, repeat: -1 });
    this.updateCounter(false);
  }

  private updateCounter(animate: boolean): void {
    this.counterText?.setText(`${DiscoverySystem.requiredFound()}/${DiscoverySystem.requiredTotal()}`);
    if (animate && this.counter) {
      this.tweens.add({ targets: this.counter, scale: 1.18, duration: 180, yoyo: true, ease: 'Sine.easeOut' });
    }
  }

  private backToMenu(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.stop(SCENE_KEYS.city);
    this.scene.start(SCENE_KEYS.menu);
  }
}
