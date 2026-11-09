import Phaser from 'phaser';
import './styles/main.css';
import { createGameConfig } from './game/config';
import { computeGameSize } from './game/constants';
import { MusicSystem } from './game/systems/MusicSystem';

declare global {
  interface Window {
    /** Disponível apenas em desenvolvimento, para inspeção e testes automatizados. */
    __lunaria?: Phaser.Game;
  }
}

const PARENT_ID = 'game';
const parent = document.getElementById(PARENT_ID);
if (!parent) throw new Error(`Elemento #${PARENT_ID} não encontrado.`);

const sizeForScreen = () => computeGameSize(parent.clientWidth, parent.clientHeight);
const game = new Phaser.Game(createGameConfig(PARENT_ID, sizeForScreen()));
// A trilha começa no primeiro toque/clique/tecla (exigência dos navegadores).
MusicSystem.init();

// Ao girar o celular ou redimensionar a janela, a área do jogo acompanha o novo formato.
let resizeTimer: number | undefined;
const onScreenChange = (): void => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    const size = sizeForScreen();
    if (size.width !== game.scale.width || size.height !== game.scale.height) {
      game.scale.setGameSize(size.width, size.height);
    }
    game.scale.refresh();
  }, 120);
};
window.addEventListener('resize', onScreenChange);
window.addEventListener('orientationchange', onScreenChange);
window.visualViewport?.addEventListener('resize', onScreenChange);

// Safari ignora `user-scalable=no`: impede o zoom por gesto de pinça no jogo.
document.addEventListener('gesturestart', (event) => event.preventDefault());

if (import.meta.env.DEV) {
  window.__lunaria = game;
}
