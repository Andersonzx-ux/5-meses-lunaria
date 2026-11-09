import Phaser from 'phaser';
import { TEX } from '../art/textures';
import { CREDITS } from '../data/credits';
import { COLORS } from '../constants';
import { SaveSystem } from '../systems/SaveSystem';
import { ProgressSystem } from '../systems/ProgressSystem';
import { bindKeys } from '../systems/keyboard';
import { seededRandom } from '../utils/random';
import { createButton, UI_FONT, type Button } from '../ui/Button';
import { onResize } from '../ui/layout';
import { createSoundButton } from '../ui/SoundButton';
import { SCENE_KEYS } from './BootScene';

const STAR_TEXTURE = TEX.star;
const FONT = UI_FONT;
const DEPTH_MODAL = 100;

type MenuButton = Button;

export class MenuScene extends Phaser.Scene {
  private focusList: MenuButton[] = [];
  private focusIndex = 0;
  private modal?: Phaser.GameObjects.Container;
  private mainButtons: MenuButton[] = [];
  private busy = false;

  constructor() {
    super(SCENE_KEYS.menu);
  }

  create(): void {
    this.focusList = [];
    this.focusIndex = 0;
    this.modal = undefined;
    this.busy = false;

    this.cameras.main.fadeIn(600, 11, 16, 48);
    this.drawSky();
    this.drawSkyline();
    this.createParticles();
    this.createTitle();
    this.createButtons();
    this.createCreditsLink();
    this.setupKeyboard();
    createSoundButton(this, this.scale.width - 38, 38);
    // Ao girar a tela, redesenha o menu no novo formato.
    onResize(this, () => {
      if (!this.busy) this.scene.restart();
    });
  }

  /** Centro vertical do conteúdo (título e botões). */
  private get centerY(): number {
    return Math.round(this.scale.height / 2);
  }

  // ---------- Cenário ----------

  private drawSky(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0b1030, 0x0b1030, 0x3a2a73, 0x3a2a73, 1);
    g.fillRect(0, 0, this.scale.width, this.scale.height);

    // Lua com brilho suave (em pé, bem acima do título).
    const portrait = this.scale.height > this.scale.width;
    const moonX = Math.round(this.scale.width * (portrait ? 0.76 : 0.8));
    const moonY = Math.max(90, this.centerY - (portrait ? 330 : 160));
    for (let i = 4; i >= 1; i--) {
      this.add.circle(moonX, moonY, 38 + i * 14, COLORS.cream, 0.04);
    }
    this.add.circle(moonX, moonY, 38, COLORS.cream, 1);
    this.add.circle(moonX - 12, moonY - 8, 6, 0xe6d6b4, 0.7);
    this.add.circle(moonX + 14, moonY + 10, 9, 0xe6d6b4, 0.55);

    // Estrelas piscando (mesma densidade em qualquer tamanho de tela).
    const rand = seededRandom(7);
    const starCount = Math.round((this.scale.width * this.scale.height) / 7400);
    for (let i = 0; i < starCount; i++) {
      const x = rand() * this.scale.width;
      const y = rand() * this.scale.height * 0.6;
      const size = 1 + rand() * 1.8;
      const star = this.add.circle(x, y, size, COLORS.cream, 0.4 + rand() * 0.5);
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: 1200 + rand() * 2200,
        delay: rand() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Algumas estrelas de quatro pontas, discretas (posições relativas à tela).
    const W = this.scale.width;
    const cy = this.centerY;
    const fourPoint: Array<[number, number, number]> = [
      [W * 0.146, cy - 180, 0.32],
      [W * 0.24, cy - 15, 0.22],
      [W * 0.896, cy - 40, 0.26],
    ];
    for (const [x, y, scale] of fourPoint) {
      const s = this.add.image(x, y, STAR_TEXTURE).setTint(COLORS.gold).setScale(scale);
      this.tweens.add({
        targets: s,
        alpha: 0.35,
        scale: scale * 0.75,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private drawSkyline(): void {
    const rand = seededRandom(21);
    const g = this.add.graphics();
    const windows: Array<[number, number]> = [];
    let x = -10;
    while (x < this.scale.width) {
      const w = 50 + Math.floor(rand() * 50);
      const h = 60 + Math.floor(rand() * 110);
      const top = this.scale.height - h;
      g.fillStyle(0x080b26, 1);
      g.fillRect(x, top, w, h);
      // Telhado em ponta em alguns prédios.
      if (rand() > 0.55) {
        g.fillTriangle(x - 4, top, x + w + 4, top, x + w / 2, top - 26);
      }
      for (let wx = x + 9; wx < x + w - 10; wx += 16) {
        for (let wy = top + 12; wy < this.scale.height - 14; wy += 20) {
          // Nenhuma janela acesa atrás do link "créditos".
          const behindCredits = Math.abs(wx - this.scale.width / 2) < 70 && wy > this.scale.height - 48;
          if (rand() > 0.62 && !behindCredits) windows.push([wx, wy]);
        }
      }
      x += w + 2;
    }

    for (const [wx, wy] of windows) {
      const win = this.add.rectangle(wx, wy, 6, 9, COLORS.gold, 0.85);
      if (rand() > 0.7) {
        this.tweens.add({
          targets: win,
          alpha: 0.35,
          duration: 1500 + rand() * 2500,
          delay: rand() * 3000,
          yoyo: true,
          repeat: -1,
        });
      }
    }
  }

  private createParticles(): void {
    this.add.particles(0, this.scale.height, STAR_TEXTURE, {
      x: { min: 0, max: this.scale.width },
      lifespan: 7000,
      speedY: { min: -34, max: -14 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.14, end: 0 },
      alpha: { start: 0.85, end: 0 },
      frequency: 650,
      tint: [COLORS.gold, COLORS.rose, COLORS.lilac],
    });
  }

  // ---------- Título ----------

  private createTitle(): void {
    const cx = this.scale.width / 2;
    const cy = this.centerY;
    const star = this.add.image(cx, cy - 200, STAR_TEXTURE).setTint(COLORS.gold).setScale(0.5);
    this.tweens.add({
      targets: star,
      scale: 0.62,
      alpha: 0.75,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const title = this.add
      .text(cx, cy - 130, 'Lunária', {
        fontFamily: FONT,
        fontSize: '84px',
        color: '#fbf1dc',
        // Espaço para o brilho não ser cortado nas bordas do texto.
        padding: { x: 32, y: 32 },
      })
      .setOrigin(0.5)
      .setShadow(0, 0, '#f3d58a', 24, false, true)
      .setAlpha(0);

    const subtitle = this.add
      .text(cx, cy - 65, 'A cidade onde mora o nosso amor', {
        fontFamily: FONT,
        fontSize: '22px',
        fontStyle: 'italic',
        color: '#d9c9f5',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({ targets: [title, subtitle], alpha: 1, duration: 1200, delay: 300 });
  }

  // ---------- Botões ----------

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    action: () => void,
    primary: boolean,
  ): Button {
    return createButton(this, {
      x,
      y,
      width,
      height,
      label: text,
      primary,
      onClick: () => {
        if (!this.busy) action();
      },
    });
  }

  private createButtons(): void {
    const cx = this.scale.width / 2;
    const cy = this.centerY;
    const hasProgress = SaveSystem.hasProgress();
    const w = 300;
    const h = 56;

    if (hasProgress) {
      this.mainButtons = [
        this.createButton(cx, cy + 40, w, h, 'Continuar', () => this.enterCity(false), true),
        this.createButton(cx, cy + 110, w, h, 'Nova jornada', () => this.confirmNewGame(), false),
      ];
    } else {
      this.mainButtons = [this.createButton(cx, cy + 60, w, h, 'Iniciar', () => this.enterCity(true), true)];
    }

    this.mainButtons.forEach((b, i) => {
      b.container.setAlpha(0);
      this.tweens.add({ targets: b.container, alpha: 1, duration: 700, delay: 900 + i * 150 });
    });
    this.setFocusList(this.mainButtons);
  }

  private createCreditsLink(): void {
    const link = this.add
      .text(this.scale.width / 2, this.scale.height - 22, 'créditos', {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#b9a6e8',
        padding: { x: 24, y: 12 },
        // Contorno escuro: continua legível sobre as janelas acesas da silhueta.
        stroke: '#080b26',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0.7)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    link.on('pointerover', () => link.setAlpha(1));
    link.on('pointerout', () => link.setAlpha(0.7));
    link.on('pointerdown', () => {
      if (!this.busy && !this.modal) this.showCredits();
    });
  }

  // ---------- Foco / teclado ----------

  private setFocusList(list: MenuButton[]): void {
    this.focusList.forEach((b) => b.setFocused(false));
    this.focusList = list;
    this.focusIndex = 0;
    this.focusList[0]?.setFocused(true);
  }

  private moveFocus(delta: number): void {
    if (this.focusList.length === 0) return;
    this.focusList[this.focusIndex]?.setFocused(false);
    this.focusIndex = (this.focusIndex + delta + this.focusList.length) % this.focusList.length;
    this.focusList[this.focusIndex]?.setFocused(true);
  }

  private setupKeyboard(): void {
    const prev = (): void => this.moveFocus(-1);
    const next = (): void => this.moveFocus(1);
    const activate = (event: KeyboardEvent): void => {
      if (!event.repeat) this.activateFocused();
    };
    bindKeys(this, {
      ArrowUp: prev,
      ArrowLeft: prev,
      ArrowDown: next,
      ArrowRight: next,
      Enter: activate,
      ' ': activate,
      Escape: () => this.closeModal(),
    });
  }

  private activateFocused(): void {
    if (this.busy) return;
    this.focusList[this.focusIndex]?.activate();
  }

  // ---------- Ações ----------

  private enterCity(isNewGame: boolean): void {
    if (this.busy) return;
    this.busy = true;
    ProgressSystem.begin(isNewGame);

    this.cameras.main.fadeOut(500, 11, 16, 48);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENE_KEYS.city);
    });
  }

  private confirmNewGame(): void {
    this.openModal(
      'Começar uma nova jornada?',
      ['O progresso salvo será apagado', 'e a história recomeçará do início.'],
      (centerX, y, panelW) => {
        // Dois botões lado a lado, cabendo na largura do painel.
        const w = Math.min(210, (panelW - 60) / 2);
        const gap = w / 2 + 10;
        return [
          this.createButton(centerX - gap, y, w, 50, 'Voltar', () => this.closeModal(), false),
          this.createButton(centerX + gap, y, w, 50, 'Recomeçar', () => {
            this.closeModal();
            this.enterCity(true);
          }, true),
        ];
      },
    );
  }

  private showCredits(): void {
    this.openModal(CREDITS.title, [...CREDITS.lines], (centerX, y) => [
      this.createButton(centerX, y, 200, 50, 'Fechar', () => this.closeModal(), true),
    ]);
  }

  // ---------- Janela modal ----------

  private openModal(
    title: string,
    lines: string[],
    makeButtons: (centerX: number, y: number, panelW: number) => MenuButton[],
  ): void {
    if (this.modal) return;
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const panelW = Math.min(620, this.scale.width - 32);
    const bodyHeight = lines.length * 28;
    const panelH = 150 + bodyHeight + 60;
    const top = cy - panelH / 2;

    // O fundo escuro também captura os toques, bloqueando o menu atrás.
    const dim = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, COLORS.navy, 0.78)
      .setOrigin(0)
      .setInteractive();

    const panel = this.add.graphics();
    panel.fillStyle(0x151a45, 0.98);
    panel.fillRoundedRect(cx - panelW / 2, top, panelW, panelH, 20);
    panel.lineStyle(2, COLORS.gold, 0.8);
    panel.strokeRoundedRect(cx - panelW / 2, top, panelW, panelH, 20);

    const star = this.add.image(cx, top + 34, STAR_TEXTURE).setTint(COLORS.gold).setScale(0.28);
    const heading = this.add
      .text(cx, top + 72, title, { fontFamily: FONT, fontSize: '30px', color: '#fbf1dc' })
      .setOrigin(0.5);
    const body = this.add
      .text(cx, top + 108 + bodyHeight / 2, lines.join('\n'), {
        fontFamily: FONT,
        fontSize: '19px',
        color: '#d9c9f5',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    const buttons = makeButtons(cx, top + panelH - 48, panelW);
    const container = this.add.container(0, 0, [
      dim,
      panel,
      star,
      heading,
      body,
      ...buttons.map((b) => b.container),
    ]);
    container.setDepth(DEPTH_MODAL).setAlpha(0);
    this.tweens.add({ targets: container, alpha: 1, duration: 220 });

    this.modal = container;
    this.setFocusList(buttons);
    // Em confirmações, o foco inicial fica no botão seguro ("Voltar").
  }

  private closeModal(): void {
    if (!this.modal) return;
    const modal = this.modal;
    this.modal = undefined;
    this.setFocusList(this.mainButtons);
    this.tweens.add({
      targets: modal,
      alpha: 0,
      duration: 160,
      onComplete: () => modal.destroy(),
    });
  }
}
