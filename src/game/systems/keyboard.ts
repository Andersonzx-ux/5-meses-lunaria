import Phaser from 'phaser';

export type KeyHandler = (event: KeyboardEvent) => void;

/**
 * Registra atalhos de teclado (por `KeyboardEvent.key`) válidos enquanto a cena
 * estiver ativa.
 *
 * Usa o evento `keydown` do DOM em vez dos eventos `keydown-X` do Phaser: no
 * Phaser 3.90, teclas pressionadas dentro do mesmo frame fazem a fila interna ser
 * reprocessada e o mesmo evento ser emitido mais de uma vez (ex.: ↓ seguido de
 * Enter move o foco duas vezes). O evento do DOM dispara exatamente uma vez.
 *
 * Os listeners são removidos automaticamente quando a cena é encerrada.
 */
export function bindKeys(scene: Phaser.Scene, bindings: Record<string, KeyHandler>): void {
  const listener = (event: KeyboardEvent): void => {
    const handler = bindings[event.key];
    if (!handler) return;
    event.preventDefault();
    handler(event);
  };

  window.addEventListener('keydown', listener);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    window.removeEventListener('keydown', listener);
  });
}
