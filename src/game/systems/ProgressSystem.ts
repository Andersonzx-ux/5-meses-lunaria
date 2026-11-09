import Phaser from 'phaser';
import type { LocationId } from '../data/locations';
import { DISCOVERY_FOUND, DiscoverySystem } from './DiscoverySystem';
import { SaveSystem, type SaveData, type SavedPosition } from './SaveSystem';

export const PROGRESS_EVENTS = {
  /** O navegador recusou a gravação (emitido uma vez por sessão de jogo). */
  saveFailed: 'save-failed',
} as const;

/**
 * Progresso do jogador e salvamento automático: descobertas (via
 * DiscoverySystem), locais visitados, moradores conhecidos e posição.
 * Mudanças importantes são gravadas na hora; a posição, periodicamente.
 */
class ProgressState extends Phaser.Events.EventEmitter {
  private data: SaveData | null = null;
  private readonly visited = new Set<LocationId>();
  private readonly met = new Set<string>();
  private warnedFailure = false;
  private lastSaveOk = true;

  constructor() {
    super();
    DiscoverySystem.on(DISCOVERY_FOUND, () => this.save());
  }

  /** `false` se a última tentativa de gravar falhou. */
  storageWorking(): boolean {
    return this.lastSaveOk;
  }

  /** Começa um jogo novo ou continua o salvo (se não houver, começa um novo). */
  begin(newGame: boolean): void {
    const loaded = newGame ? null : SaveSystem.load();
    const data = loaded ?? SaveSystem.fresh();
    this.data = data;
    this.visited.clear();
    data.visitedLocations.forEach((id) => this.visited.add(id));
    this.met.clear();
    data.metNpcs.forEach((id) => this.met.add(id));
    DiscoverySystem.restore(data.discoveries);
    this.warnedFailure = false;
    this.save();
  }

  /** Garante que há um jogo em andamento (ex.: a cidade aberta sem passar pelo menu). */
  ensureStarted(): void {
    if (!this.data) this.begin(false);
  }

  hasVisited(id: LocationId): boolean {
    return this.visited.has(id);
  }

  visitedCount(): number {
    return this.visited.size;
  }

  /** Marca um local como visitado. Devolve `true` na primeira visita. */
  markVisited(id: LocationId): boolean {
    if (this.visited.has(id)) return false;
    this.visited.add(id);
    this.save();
    return true;
  }

  hasMet(npcId: string): boolean {
    return this.met.has(npcId);
  }

  markMet(npcId: string): void {
    if (this.met.has(npcId)) return;
    this.met.add(npcId);
    this.save();
  }

  playerPosition(): SavedPosition | null {
    return this.data?.player ?? null;
  }

  /** O pedido foi aceito e a carta foi aberta: a história chegou ao fim. */
  markFinished(): void {
    if (!this.data || this.data.finished) return;
    this.data.finished = true;
    this.save();
  }

  /** O prólogo ainda não foi mostrado nesta jornada. */
  needsIntro(): boolean {
    return this.data !== null && !this.data.introSeen;
  }

  markIntroSeen(): void {
    if (!this.data || this.data.introSeen) return;
    this.data.introSeen = true;
    this.save();
  }

  /** Atualiza a posição em memória; grava se `persist` for verdadeiro. */
  setPlayerPosition(x: number, y: number, persist: boolean): void {
    if (!this.data) return;
    this.data.player = { x: Math.round(x), y: Math.round(y) };
    if (persist) this.save();
  }

  /** Grava tudo agora. */
  save(): void {
    if (!this.data) return;
    this.data.visitedLocations = [...this.visited];
    this.data.metNpcs = [...this.met];
    this.data.discoveries = DiscoverySystem.ids();
    const ok = SaveSystem.save(this.data);
    this.lastSaveOk = ok;
    if (!ok && !this.warnedFailure) {
      this.warnedFailure = true;
      this.emit(PROGRESS_EVENTS.saveFailed);
    }
  }
}

export const ProgressSystem = new ProgressState();
