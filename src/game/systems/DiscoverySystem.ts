import Phaser from 'phaser';
import { DISCOVERIES, REQUIRED_DISCOVERIES, getDiscovery, type DiscoveryData, type DiscoveryId } from '../data/discoveries';

export const DISCOVERY_FOUND = 'found';

/**
 * Registro das descobertas do jogador. Emite `DISCOVERY_FOUND` com a
 * `DiscoveryData` sempre que algo novo é encontrado.
 */
class DiscoveryState extends Phaser.Events.EventEmitter {
  private readonly found = new Set<DiscoveryId>();

  has(id: DiscoveryId): boolean {
    return this.found.has(id);
  }

  /** Registra uma descoberta. Devolve `false` se ela já tinha sido feita. */
  register(id: DiscoveryId): boolean {
    if (this.found.has(id)) return false;
    this.found.add(id);
    this.emit(DISCOVERY_FOUND, getDiscovery(id));
    return true;
  }

  requiredFound(): number {
    return DISCOVERIES.filter((d) => d.required && this.found.has(d.id)).length;
  }

  requiredTotal(): number {
    return REQUIRED_DISCOVERIES;
  }

  isComplete(): boolean {
    return this.requiredFound() >= REQUIRED_DISCOVERIES;
  }

  /** Já pode ser encontrada (a lembrança anterior do capítulo foi feita). */
  isAvailable(id: DiscoveryId): boolean {
    const { requires } = getDiscovery(id);
    return requires === undefined || this.found.has(requires);
  }

  /** Próxima lembrança obrigatória da história, ou `undefined` se todas foram feitas. */
  next(): DiscoveryData | undefined {
    return DISCOVERIES.find((d) => d.required && !this.found.has(d.id) && this.isAvailable(d.id));
  }

  list(): DiscoveryData[] {
    return DISCOVERIES.filter((d) => this.found.has(d.id));
  }

  ids(): DiscoveryId[] {
    return [...this.found];
  }

  /** Recarrega descobertas salvas, sem emitir eventos de "nova descoberta". */
  restore(ids: readonly DiscoveryId[]): void {
    this.found.clear();
    for (const id of ids) this.found.add(id);
  }
}

export const DiscoverySystem = new DiscoveryState();
