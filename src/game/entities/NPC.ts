import Phaser from 'phaser';
import { FEET_Y, FRAME_H, facingToward, frameName, idleAnim, type Facing } from '../art/character';
import type { NPCData } from '../data/interactions';

export const npcTextureKey = (id: string): string => `npc-${id}`;

/** Morador de Lunária: fica parado no seu canto e se vira para quem conversa com ele. */
export class NPC extends Phaser.GameObjects.Sprite {
  /** Dados do NPC (`data` já é usado pelo Phaser nos objetos de jogo). */
  readonly info: NPCData;

  constructor(scene: Phaser.Scene, info: NPCData) {
    super(scene, info.x, info.y, npcTextureKey(info.id), frameName(info.facing, 4));
    this.info = info;
    scene.add.existing(this);
    this.setOrigin(0.5, FEET_Y / FRAME_H);
    this.setDepth(info.y);
    this.face(info.facing, false);
    // Começa a respiração em momentos diferentes para os NPCs não ficarem sincronizados.
    this.anims.setProgress(Math.random());
  }

  /** Vira na direção de um ponto (ex.: o jogador). */
  lookAt(x: number, y: number): void {
    const { facing, flip } = facingToward(this.x, this.y, x, y);
    this.face(facing, flip);
  }

  /** Volta à pose original. */
  rest(): void {
    this.face(this.info.facing, false);
  }

  private face(facing: Facing, flip: boolean): void {
    this.setFlipX(flip);
    this.play(idleAnim(npcTextureKey(this.info.id), facing), true);
  }
}
