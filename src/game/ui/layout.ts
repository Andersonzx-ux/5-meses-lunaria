import Phaser from 'phaser';

export interface ViewSize {
  w: number;
  h: number;
  portrait: boolean;
}

/** Tamanho lógico atual do jogo (muda ao girar o celular). */
export function viewSize(scene: Phaser.Scene): ViewSize {
  const w = scene.scale.width;
  const h = scene.scale.height;
  return { w, h, portrait: h > w };
}

/** Chama `callback` sempre que o tamanho do jogo mudar, enquanto a cena estiver ativa. */
export function onResize(scene: Phaser.Scene, callback: (size: ViewSize) => void): void {
  const handler = (): void => callback(viewSize(scene));
  scene.scale.on(Phaser.Scale.Events.RESIZE, handler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, handler));
}
