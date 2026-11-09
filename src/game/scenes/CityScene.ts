import Phaser from 'phaser';
import { PLAYER_SPAWN, WORLD, type Point } from '../data/cityLayout';
import { DIALOGUES } from '../data/dialogues';
import { LOCATIONS, visitArea, type LocationData } from '../data/locations';
import { Player } from '../entities/Player';
import { MovementInput } from '../systems/MovementInput';
import { ProgressSystem } from '../systems/ProgressSystem';
import { bindKeys } from '../systems/keyboard';
import { CityInteractions } from '../world/CityInteractions';
import { buildCity, type CityMap } from '../world/CityMap';
import { SCENE_KEYS } from './BootScene';
import { HUDScene } from './HUDScene';

/**
 * Suavização da câmera, em 1/s (quanto maior, mais rápido alcança o personagem).
 * Equivale ao lerp 0.12 por quadro a 60 fps, mas independe da taxa de quadros.
 */
const CAMERA_SMOOTHING = 7.5;
const STILL = new Phaser.Math.Vector2(0, 0);
/** Intervalo do salvamento automático da posição. */
const POSITION_SAVE_MS = 2000;
/** Margem extra para "sair" de um local (evita a faixa piscar na borda). */
const LEAVE_MARGIN = 24;

const VISIT_AREAS = LOCATIONS.map((location) => ({ location, ...visitArea(location) }));

/** A cidade explorável de Lunária. */
export class CityScene extends Phaser.Scene {
  private map?: CityMap;
  private player?: Player;
  private movement?: MovementInput;
  private hud?: HUDScene;
  private interactions?: CityInteractions;
  /** Centro da câmera suavizado, em ponto flutuante. */
  private readonly cameraFocus = new Phaser.Math.Vector2();
  private currentLocation?: LocationData;
  private readonly lastSaved = new Phaser.Math.Vector2();
  private introPending = false;

  constructor() {
    super(SCENE_KEYS.city);
  }

  /** Obstáculos sólidos da cidade. */
  get obstacles(): Phaser.Physics.Arcade.StaticGroup {
    if (!this.map) throw new Error('A cidade ainda não foi construída.');
    return this.map.obstacles;
  }

  create(): void {
    ProgressSystem.ensureStarted();
    this.currentLocation = undefined;
    this.introPending = false;
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
    this.map = buildCity(this);

    const start = this.spawnPoint();
    const player = new Player(this, start.x, start.y);
    this.player = player;
    this.lastSaved.set(start.x, start.y);
    this.physics.add.collider(player, this.map.obstacles);

    const hud = this.scene.get(SCENE_KEYS.hud);
    if (!(hud instanceof HUDScene)) throw new Error('Cena de interface não encontrada.');
    this.hud = hud;
    this.movement = new MovementInput(this, () => hud.touchVector());
    this.interactions = new CityInteractions(this, hud, this.map.obstacles, player);
    const act = (event: KeyboardEvent): void => {
      if (!event.repeat && !hud.isBusy()) this.interactions?.system.trigger();
    };
    bindKeys(this, { e: act, E: act, Enter: act, ' ': act });
    // Botão de ação da tela de toque.
    hud.setWorldAction(() => this.interactions?.system.trigger());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => hud.setWorldAction(undefined));

    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameraFocus.set(player.x, player.y);
    this.applyCamera();
    camera.fadeIn(600, 11, 16, 48);

    // A física só atualiza a posição do sprite no POST_UPDATE; profundidade e
    // câmera são sincronizadas depois disso para não ficarem um quadro atrasadas.
    const afterPhysics = (_time: number, delta: number): void => {
      player.syncDepth();
      this.followPlayer(delta);
    };
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, afterPhysics);

    this.setupAutosave();

    // Os eventos da cena sobrevivem a reinícios: remove para não acumular.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, afterPhysics);
    });

    this.scene.launch(SCENE_KEYS.hud);
  }

  override update(): void {
    if (!this.player || !this.movement || !this.interactions || !this.hud) return;
    const blocked = this.introPending || this.hud.isBusy() || this.interactions.system.isRunning();
    this.player.move(blocked ? STILL : this.movement.read());
    this.interactions.system.update(this.player.x, this.player.y, !blocked);
    this.hud.setActionLabel(this.interactions.system.currentLabel());
    this.trackLocation(this.player.x, this.player.y);
    this.maybePlayIntro();
  }

  /** Prólogo na primeira entrada da jornada, assim que a interface estiver pronta. */
  private maybePlayIntro(): void {
    const hud = this.hud;
    if (this.introPending || !hud?.isReady() || hud.isBusy() || !ProgressSystem.needsIntro()) return;
    ProgressSystem.markIntroSeen();
    // Espera o fade-in da câmera; até lá o personagem fica parado (introPending).
    this.introPending = true;
    this.time.delayedCall(700, () => {
      this.introPending = false;
      if (hud.isReady() && !hud.isBusy()) void this.interactions?.say(DIALOGUES.prologue);
    });
  }

  /** Posição salva, se for válida e livre; senão, o ponto inicial da cidade. */
  private spawnPoint(): Point {
    const saved = ProgressSystem.playerPosition();
    if (!saved) return PLAYER_SPAWN;
    const inside = saved.x >= 20 && saved.x <= WORLD.width - 20 && saved.y >= 40 && saved.y <= WORLD.height - 2;
    // Mesmo retângulo do corpo do personagem (pés).
    const blocked = inside && this.physics.overlapRect(saved.x - 9, saved.y - 9, 18, 10, false, true).length > 0;
    return inside && !blocked ? saved : PLAYER_SPAWN;
  }

  /** Grava a posição periodicamente e sempre que a página for escondida ou fechada. */
  private setupAutosave(): void {
    const savePosition = (force: boolean): void => {
      if (!this.player) return;
      const moved = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.lastSaved.x, this.lastSaved.y);
      if (!force && moved < 8) return;
      this.lastSaved.set(this.player.x, this.player.y);
      ProgressSystem.setPlayerPosition(this.player.x, this.player.y, true);
    };
    this.time.addEvent({ delay: POSITION_SAVE_MS, loop: true, callback: () => savePosition(false) });

    // No celular, `pagehide`/`visibilitychange` são os únicos avisos confiáveis antes de fechar.
    const onHide = (): void => savePosition(true);
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') onHide();
    };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      savePosition(true);
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
    });
  }

  /** Detecta a chegada a um local: mostra o nome e registra a visita. */
  private trackLocation(x: number, y: number): void {
    // Espera a interface existir para não perder a faixa com o nome do local.
    if (!this.hud?.isReady()) return;
    const current = VISIT_AREAS.find((a) => a.location === this.currentLocation);
    if (current && Math.hypot(x - current.x, y - current.y) <= current.radius + LEAVE_MARGIN) return;

    const entered = VISIT_AREAS.find((a) => Math.hypot(x - a.x, y - a.y) <= a.radius);
    this.currentLocation = entered?.location;
    if (!entered) return;
    const firstVisit = ProgressSystem.markVisited(entered.location.id);
    this.hud.showLocation(entered.location.name, firstVisit);
  }

  /**
   * Seguimento próprio em vez de `startFollow`: com `roundPixels`, o Phaser
   * arredonda o scroll para baixo depois do lerp, e a câmera para até ~8 px
   * antes do centro ao andar para a direita ou para baixo.
   */
  private followPlayer(delta: number): void {
    if (!this.player) return;
    const t = 1 - Math.exp((-CAMERA_SMOOTHING * delta) / 1000);
    this.cameraFocus.x += (this.player.x - this.cameraFocus.x) * t;
    this.cameraFocus.y += (this.player.y - this.cameraFocus.y) * t;
    this.applyCamera();
  }

  private applyCamera(): void {
    const camera = this.cameras.main;
    // Scroll já inteiro: o arredondamento interno não altera mais o valor.
    camera.setScroll(
      Math.round(this.cameraFocus.x - camera.width / 2),
      Math.round(this.cameraFocus.y - camera.height / 2),
    );
  }
}
