import Phaser from 'phaser';
import { TEX } from '../art/textures';
import { COLORS } from '../constants';
import { DIALOGUES, casaProgressLine, nextMemoryLine, type DialogueLine } from '../data/dialogues';
import { getDiscovery } from '../data/discoveries';
import { INTERACT_RADIUS, NPCS, SPOTS, type Script, type SpotData } from '../data/interactions';
import { LOCATIONS, type LocationId } from '../data/locations';
import { NPC } from '../entities/NPC';
import type { HUDScene } from '../scenes/HUDScene';
import { DiscoverySystem } from '../systems/DiscoverySystem';
import { InteractionSystem, type Interactable } from '../systems/InteractionSystem';
import { ProgressSystem } from '../systems/ProgressSystem';
import { SCENE_KEYS } from '../scenes/BootScene';

const NPC_IDS = new Set(NPCS.map((n) => n.id));

interface Sparkle {
  objects: Phaser.GameObjects.Image[];
  discoveryHidden: () => boolean;
}

/** Quem é o jogador nesta interação (para o NPC olhar para ele). */
interface Viewer {
  x: number;
  y: number;
}

/**
 * Monta os moradores, os brilhos e os pontos de interação da cidade e executa
 * os roteiros definidos em `data/interactions.ts`.
 */
export class CityInteractions {
  readonly system: InteractionSystem;
  private readonly sparkles: Sparkle[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly hud: HUDScene,
    obstacles: Phaser.Physics.Arcade.StaticGroup,
    private readonly viewer: Viewer,
  ) {
    const targets: Interactable[] = [];

    for (const data of NPCS) {
      const npc = new NPC(scene, data);
      obstacles.add(scene.add.zone(data.x, data.y - 4, 22, 12));
      targets.push({
        id: data.id,
        x: data.x,
        y: data.y,
        promptY: data.y - 76,
        label: 'Conversar',
        isEnabled: () => true,
        run: () => this.talk(npc, data.script),
      });
    }

    for (const spot of SPOTS) {
      if (spot.sparkle) this.addSparkle(spot);
      targets.push({
        id: spot.id,
        x: spot.x,
        y: spot.y,
        promptY: spot.y - (spot.sparkle ? 46 : 92),
        label: spot.label,
        isEnabled: () => this.spotEnabled(spot),
        run: () => this.useSpot(spot),
      });
    }

    this.system = new InteractionSystem(scene, targets, INTERACT_RADIUS);
  }

  /** Mostra falas sem cobrir a personagem: a caixa sobe se ela estiver embaixo na tela. */
  say(lines: readonly DialogueLine[]): Promise<void> {
    const camera = this.scene.cameras.main;
    // Ponto mais baixo a manter visível: os pés da personagem.
    const feetY = (this.viewer.y + 4 - camera.worldView.y) * camera.zoom;
    return this.hud.say(lines, feetY);
  }

  private spotEnabled(spot: SpotData): boolean {
    const discovery = spot.script?.discovery;
    if (!discovery) return true;
    // Lembranças de capítulos futuros ainda não existem na cidade.
    if (!DiscoverySystem.isAvailable(discovery)) return false;
    // Depois de encontrada, só continua interativa se tiver fala de repetição.
    return !DiscoverySystem.has(discovery) || spot.script?.repeat !== undefined;
  }

  private addSparkle(spot: SpotData): void {
    const discovery = spot.script?.discovery;
    const glow = this.scene.add
      .image(spot.x, spot.y - 10, TEX.glow)
      .setTint(COLORS.gold)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.45)
      .setAlpha(0.5)
      .setDepth(spot.y - 1);
    const star = this.scene.add.image(spot.x, spot.y - 10, TEX.star).setTint(COLORS.gold).setScale(0.26).setDepth(spot.y);
    this.scene.tweens.add({ targets: [star, glow], alpha: 0.25, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.scene.tweens.add({ targets: star, angle: 45, scale: 0.32, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const sparkle: Sparkle = {
      objects: [glow, star],
      // Brilha só enquanto a lembrança está liberada e ainda não foi encontrada.
      discoveryHidden: () =>
        discovery !== undefined && (DiscoverySystem.has(discovery) || !DiscoverySystem.isAvailable(discovery)),
    };
    this.sparkles.push(sparkle);
    this.refreshSparkles();
  }

  private refreshSparkles(): void {
    for (const s of this.sparkles) {
      const hidden = s.discoveryHidden();
      for (const o of s.objects) o.setVisible(!hidden);
    }
  }

  private async talk(npc: NPC, script: Script): Promise<void> {
    npc.lookAt(this.viewer.x, this.viewer.y);
    try {
      await this.runScript(npc.info.id, script);
    } finally {
      npc.rest();
    }
  }

  private async useSpot(spot: SpotData): Promise<void> {
    if (spot.special === 'casa') {
      await this.knockCasa();
      return;
    }
    if (spot.script) await this.runScript(spot.id, spot.script);
  }

  private async runScript(id: string, script: Script): Promise<void> {
    const { discovery, topic } = script;
    const memory = discovery ?? topic;

    // Capítulo ainda não chegou: fala de espera e a pista do lugar certo.
    if (memory && !DiscoverySystem.isAvailable(memory)) {
      await this.say([...(script.early ? DIALOGUES[script.early] : []), ...this.nextHint()]);
      return;
    }

    if (discovery) {
      if (DiscoverySystem.has(discovery)) {
        await this.say(DIALOGUES[script.repeat ?? script.lines]);
        return;
      }
      await this.say(DIALOGUES[script.lines]);
      DiscoverySystem.register(discovery);
      this.refreshSparkles();
      await this.hud.revealDiscovery(getDiscovery(discovery));
      if (script.after) await this.say(DIALOGUES[script.after]);
      return;
    }

    if (topic && DiscoverySystem.has(topic) && script.done) {
      await this.say(DIALOGUES[script.done]);
    } else if (ProgressSystem.hasMet(id) && script.repeat) {
      await this.say(DIALOGUES[script.repeat]);
    } else {
      await this.say(DIALOGUES[script.lines]);
    }
    if (NPC_IDS.has(id)) ProgressSystem.markMet(id);
  }

  /** Pista de onde está a próxima lembrança (vazia se a história já foi toda vivida). */
  private nextHint(): DialogueLine[] {
    const next = DiscoverySystem.next();
    return next ? [nextMemoryLine(placeName(next.location))] : [];
  }

  private async knockCasa(): Promise<void> {
    if (DiscoverySystem.isComplete()) {
      await this.say(DIALOGUES.casaUnlocked);
      await this.enterFinale();
      return;
    }
    const lines: DialogueLine[] = [
      ...DIALOGUES.casaLocked,
      casaProgressLine(DiscoverySystem.requiredFound(), DiscoverySystem.requiredTotal()),
      ...this.nextHint(),
    ];
    await this.say(lines);
  }

  /** A porta se abre: a tela clareia em dourado e começa a cena do pedido. */
  private enterFinale(): Promise<void> {
    const camera = this.scene.cameras.main;
    return new Promise((resolve) => {
      camera.fadeOut(1400, 255, 240, 220);
      camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        resolve();
        this.scene.scene.stop(SCENE_KEYS.hud);
        this.scene.scene.start(SCENE_KEYS.final);
      });
    });
  }
}

function placeName(location: LocationId | 'lago'): string {
  if (location === 'lago') return 'o lago';
  return LOCATIONS.find((l) => l.id === location)?.name ?? location;
}
