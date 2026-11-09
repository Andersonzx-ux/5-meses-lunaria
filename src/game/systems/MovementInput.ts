import Phaser from 'phaser';

/**
 * Lê a intenção de movimento do jogador como um vetor de direção (comprimento
 * até 1). O teclado (setas e WASD) tem prioridade; sem teclas pressionadas,
 * vale o joystick de toque (`touchSource`).
 *
 * O teclado é lido por consulta de estado (`isDown`) a cada quadro, que não
 * sofre do problema de eventos repetidos descrito em `keyboard.ts`.
 */
export class MovementInput {
  private readonly keys: Array<{ key: Phaser.Input.Keyboard.Key; x: number; y: number }> = [];
  private readonly vector = new Phaser.Math.Vector2();

  constructor(
    scene: Phaser.Scene,
    private readonly touchSource?: () => Phaser.Math.Vector2,
  ) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) return;
    const K = Phaser.Input.Keyboard.KeyCodes;
    const bindings: Array<[number, number, number]> = [
      [K.LEFT, -1, 0],
      [K.A, -1, 0],
      [K.RIGHT, 1, 0],
      [K.D, 1, 0],
      [K.UP, 0, -1],
      [K.W, 0, -1],
      [K.DOWN, 0, 1],
      [K.S, 0, 1],
    ];
    for (const [code, x, y] of bindings) {
      this.keys.push({ key: keyboard.addKey(code), x, y });
    }
  }

  /** Direção atual. Comprimento 0 (parado) ou até 1. */
  read(): Phaser.Math.Vector2 {
    let x = 0;
    let y = 0;
    for (const k of this.keys) {
      if (!k.key.isDown) continue;
      x += k.x;
      y += k.y;
    }
    this.vector.set(Phaser.Math.Clamp(x, -1, 1), Phaser.Math.Clamp(y, -1, 1));
    if (this.vector.lengthSq() === 0 && this.touchSource) this.vector.copy(this.touchSource());
    if (this.vector.lengthSq() > 1) this.vector.normalize();
    return this.vector;
  }
}
