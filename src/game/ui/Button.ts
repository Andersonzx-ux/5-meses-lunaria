import Phaser from 'phaser';
import { COLORS } from '../constants';

export const UI_FONT = 'Georgia, "Times New Roman", serif';

export interface ButtonOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  onClick: () => void;
  /** Botão dourado de destaque (ação principal). */
  primary?: boolean;
  fontSize?: number;
}

export interface Button {
  container: Phaser.GameObjects.Container;
  /** Destaque de foco para navegação por teclado. */
  setFocused: (focused: boolean) => void;
  activate: () => void;
}

/** Botão arredondado, tocável, com estados de foco e hover. */
export function createButton(scene: Phaser.Scene, options: ButtonOptions): Button {
  const { x, y, width, height, label, onClick, primary = false, fontSize = 24 } = options;
  const bg = scene.add.graphics();
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: UI_FONT,
      fontSize: `${fontSize}px`,
      color: primary ? '#0b1030' : '#fbf1dc',
    })
    .setOrigin(0.5);
  // Área de toque um pouco maior que o desenho (dedos em telas pequenas).
  const zone = scene.add.zone(0, 0, width + 12, height + 16).setInteractive({ useHandCursor: true });
  const container = scene.add.container(x, y, [bg, text, zone]);

  let focused = false;
  let hovered = false;
  const draw = (): void => {
    const lit = focused || hovered;
    bg.clear();
    bg.fillStyle(primary ? COLORS.gold : COLORS.navy, primary ? (lit ? 1 : 0.9) : lit ? 0.85 : 0.6);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    bg.lineStyle(2, lit ? COLORS.cream : primary ? COLORS.gold : COLORS.lilac, lit ? 1 : 0.8);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
    container.setScale(lit ? 1.03 : 1);
  };
  draw();

  zone.on('pointerover', () => {
    hovered = true;
    draw();
  });
  zone.on('pointerout', () => {
    hovered = false;
    draw();
  });
  zone.on('pointerdown', onClick);

  return {
    container,
    setFocused: (value) => {
      focused = value;
      draw();
    },
    activate: onClick,
  };
}
