import Phaser from 'phaser';
import { COLORS } from '../constants';
import { MUSIC_CHANGED, MusicSystem } from '../systems/MusicSystem';
import { bindKeys } from '../systems/keyboard';
import { UI_FONT } from './Button';

const SIZE = 44;

/**
 * Botão redondo ♪ que liga/desliga a trilha (também pela tecla M).
 * O estado é compartilhado entre todas as telas e fica salvo.
 */
export function createSoundButton(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const bg = scene.add.graphics();
  const note = scene.add.text(0, 1, '♪', { fontFamily: UI_FONT, fontSize: '24px', color: '#fbf1dc' }).setOrigin(0.5);
  const slash = scene.add.graphics();
  // Área de toque maior que o desenho, para dedos.
  const zone = scene.add.zone(0, 0, SIZE + 16, SIZE + 16).setInteractive({ useHandCursor: true });
  const container = scene.add.container(x, y, [bg, note, slash, zone]).setDepth(60);

  let hovered = false;
  const draw = (): void => {
    const muted = MusicSystem.isMuted();
    bg.clear();
    bg.fillStyle(COLORS.navy, hovered ? 0.9 : 0.7);
    bg.fillCircle(0, 0, SIZE / 2);
    bg.lineStyle(2, hovered ? COLORS.cream : COLORS.lilac, 0.9);
    bg.strokeCircle(0, 0, SIZE / 2);
    note.setAlpha(muted ? 0.45 : 1);
    slash.clear();
    if (muted) {
      slash.lineStyle(3, COLORS.rose, 1);
      slash.lineBetween(-11, -11, 11, 11);
    }
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
  zone.on('pointerdown', () => MusicSystem.toggle());

  MusicSystem.on(MUSIC_CHANGED, draw);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => MusicSystem.off(MUSIC_CHANGED, draw));
  bindKeys(scene, { m: () => MusicSystem.toggle(), M: () => MusicSystem.toggle() });
  return container;
}
