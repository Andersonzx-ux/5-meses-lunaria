import { DISCOVERIES, type DiscoveryId } from '../data/discoveries';
import { NPCS } from '../data/interactions';
import { LOCATIONS, type LocationId } from '../data/locations';

const SAVE_KEY = 'lunaria:save';
const SAVE_VERSION = 2;

export interface SavedPosition {
  x: number;
  y: number;
}

export interface SaveData {
  version: typeof SAVE_VERSION;
  createdAt: string;
  updatedAt: string;
  visitedLocations: LocationId[];
  discoveries: DiscoveryId[];
  /** NPCs com quem o jogador já conversou. */
  metNpcs: string[];
  /** Última posição do personagem (pés), ou `null` para começar no ponto inicial. */
  player: SavedPosition | null;
  /** O prólogo já foi mostrado. */
  introSeen: boolean;
  finished: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items: unknown[] = value;
  const strings = items.filter((item): item is string => typeof item === 'string');
  return strings.length === items.length ? strings : null;
}

const isLocationId = (v: string): v is LocationId => LOCATIONS.some((l) => l.id === v);
const isDiscoveryId = (v: string): v is DiscoveryId => DISCOVERIES.some((d) => d.id === v);
const isNpcId = (v: string): boolean => NPCS.some((n) => n.id === v);

function position(value: unknown): SavedPosition | null {
  if (!isRecord(value)) return null;
  const { x, y } = value;
  return typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

/**
 * Converte o conteúdo salvo (v1 ou v2) para o formato atual. Ids que não
 * existem mais nos dados do jogo são descartados, sem invalidar o resto.
 */
function parse(value: unknown): SaveData | null {
  if (!isRecord(value)) return null;
  const { version, createdAt, updatedAt, finished } = value;
  if (version !== 1 && version !== 2) return null;
  if (typeof createdAt !== 'string' || typeof updatedAt !== 'string' || typeof finished !== 'boolean') return null;

  const visited = stringArray(value.visitedLocations);
  const discoveries = stringArray(value.discoveries);
  if (!visited || !discoveries) return null;

  // v1 não tinha moradores nem posição.
  const met = version === 2 ? stringArray(value.metNpcs) : [];
  if (!met) return null;

  return {
    version: SAVE_VERSION,
    createdAt,
    updatedAt,
    visitedLocations: [...new Set(visited.filter(isLocationId))],
    discoveries: [...new Set(discoveries.filter(isDiscoveryId))],
    metNpcs: [...new Set(met.filter(isNpcId))],
    player: version === 2 ? position(value.player) : null,
    // Saves antigos não tinham o prólogo: considera visto se já havia progresso.
    introSeen: typeof value.introSeen === 'boolean' ? value.introSeen : visited.length > 0 || discoveries.length > 0,
    finished,
  };
}

/** Persistência do progresso em LocalStorage. */
export const SaveSystem = {
  load(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw === null) return null;
      return parse(JSON.parse(raw));
    } catch {
      // JSON corrompido ou armazenamento bloqueado: trata como sem progresso.
      return null;
    }
  },

  hasProgress(): boolean {
    return SaveSystem.load() !== null;
  },

  /** Dados de um jogo novo (ainda não gravados). */
  fresh(): SaveData {
    const now = new Date().toISOString();
    return {
      version: SAVE_VERSION,
      createdAt: now,
      updatedAt: now,
      visitedLocations: [],
      discoveries: [],
      metNpcs: [],
      player: null,
      introSeen: false,
      finished: false,
    };
  },

  /** Grava o progresso. Devolve `false` se o navegador não permitir (modo privado, cota cheia). */
  save(data: SaveData): boolean {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, updatedAt: new Date().toISOString() }));
      return true;
    } catch {
      return false;
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // Sem armazenamento, não há o que limpar.
    }
  },
};
