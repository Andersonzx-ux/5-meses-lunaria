import Phaser from 'phaser';
import {
  ANDERSON_PROPOSAL_LOOK,
  LARISSA_PROPOSAL_LOOK,
  PLAYER_LOOK,
  PLAYER_TEXTURE,
  createCharacterSheet,
} from '../art/character';
import { generateFinaleTextures } from '../art/finale';
import { generateTextures } from '../art/textures';
import { NPCS } from '../data/interactions';
import { getPlaza } from '../data/locations';
import { npcTextureKey } from '../entities/NPC';
import { SCENE_KEYS } from './BootScene';

export const LARISSA_PROPOSAL_TEXTURE = 'larissa-proposal';
export const ANDERSON_PROPOSAL_TEXTURE = 'anderson-proposal';

/** Gera as texturas desenhadas por código (o jogo não usa arquivos de imagem). */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.preload);
  }

  create(): void {
    generateTextures(this, getPlaza().radius);
    generateFinaleTextures(this);
    createCharacterSheet(this, PLAYER_TEXTURE, PLAYER_LOOK);
    createCharacterSheet(this, LARISSA_PROPOSAL_TEXTURE, LARISSA_PROPOSAL_LOOK);
    createCharacterSheet(this, ANDERSON_PROPOSAL_TEXTURE, ANDERSON_PROPOSAL_LOOK);
    for (const npc of NPCS) createCharacterSheet(this, npcTextureKey(npc.id), npc.look);
    this.scene.start(SCENE_KEYS.menu);
  }
}
