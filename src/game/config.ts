import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { CityScene } from './scenes/CityScene';
import { HUDScene } from './scenes/HUDScene';
import { FinalScene } from './scenes/FinalScene';
import { COLORS, type GameSize } from './constants';

/** Em desenvolvimento, `?debug` na URL mostra os corpos de colisão. */
const DEBUG_PHYSICS = import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug');

export function createGameConfig(parent: string, size: GameSize): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: size.width,
    height: size.height,
    backgroundColor: COLORS.navy,
    // Até três dedos ao mesmo tempo (andar com o joystick e tocar em botões). O toque fica
    // sempre ligado: se o aparelho não se anunciar como touch ao abrir (ex.: modo celular do
    // DevTools ligado depois), os toques ainda chegam como toques, e não como cliques de mouse.
    input: { activePointers: 3, touch: true },
    // O som do Phaser fica desligado: a trilha toca por um <audio> próprio (ver MusicSystem),
    // e assim o Phaser não cria um AudioContext que o celular bloqueia (e avisa).
    audio: { noAudio: true },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      roundPixels: true,
    },
    fps: {
      // Após abrir o jogo ou voltar à aba, o Phaser limita o delta a 1/60 s por
      // `panicMax` quadros (padrão 120). Abaixo de 60 fps isso deixava o jogo em
      // câmera lenta por segundos (medido: 33 px/s em vez de 170 a 12 fps).
      // Deltas absurdos continuam descartados pelo limite de `minFps`.
      panicMax: 20,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: DEBUG_PHYSICS,
      },
    },
    scene: [BootScene, PreloadScene, MenuScene, CityScene, HUDScene, FinalScene],
  };
}
