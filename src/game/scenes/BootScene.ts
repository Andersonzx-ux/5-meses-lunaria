import Phaser from 'phaser';

export const SCENE_KEYS = {
  boot: 'BootScene',
  preload: 'PreloadScene',
  menu: 'MenuScene',
  city: 'CityScene',
  hud: 'HUDScene',
  final: 'FinalScene',
} as const;

/** Primeira cena: inicializações mínimas e passagem para o carregamento. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boot);
  }

  create(): void {
    this.scene.start(SCENE_KEYS.preload);
  }
}
