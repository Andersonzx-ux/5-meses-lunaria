import Phaser from 'phaser';
import { FEET_Y, FRAME_H, FRAME_W, PLAYER_TEXTURE, frameName, idleAnim, walkAnim, type Facing } from '../art/character';

/** Velocidade de caminhada em px/s. */
export const PLAYER_SPEED = 170;

/** Corpo de colisão: só os pés, para o personagem passar à frente e atrás das coisas. */
const BODY_W = 18;
const BODY_H = 10;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private facing: Facing = 'up';
  private flipped = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PLAYER_TEXTURE, frameName('up', 4));
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, FEET_Y / FRAME_H);
    this.setBodySize(BODY_W, BODY_H);
    this.setOffset((FRAME_W - BODY_W) / 2, FEET_Y - BODY_H + 1);
    this.setCollideWorldBounds(true);
    this.play(idleAnim(PLAYER_TEXTURE, this.facing));
    this.setDepth(this.y);
  }

  getFacing(): Facing {
    return this.facing;
  }

  /** Aplica a direção desejada (vetor de comprimento ≤ 1). */
  move(direction: Phaser.Math.Vector2): void {
    this.setVelocity(direction.x * PLAYER_SPEED, direction.y * PLAYER_SPEED);

    const moving = direction.lengthSq() > 0.0001;
    if (moving) {
      // O eixo dominante define para onde o personagem olha.
      if (Math.abs(direction.x) > Math.abs(direction.y) + 0.01) {
        this.facing = 'side';
        this.flipped = direction.x > 0;
      } else {
        this.facing = direction.y < 0 ? 'up' : 'down';
      }
    }
    this.setFlipX(this.facing === 'side' && this.flipped);
    this.play(moving ? walkAnim(PLAYER_TEXTURE, this.facing) : idleAnim(PLAYER_TEXTURE, this.facing), true);
  }

  /** Profundidade pela posição dos pés: passa atrás do que está mais ao sul. */
  syncDepth(): void {
    this.setDepth(this.y);
  }
}
