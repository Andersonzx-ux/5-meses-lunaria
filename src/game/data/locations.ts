/**
 * Os lugares especiais de Lunária.
 *
 * Coordenadas no mundo (pixels). Para prédios, (x, y) é o centro da base da
 * fachada — onde fica a porta. Os nomes aparecem nas placas da cidade.
 */
export type LocationId = 'cafeteria' | 'cinema' | 'emporio' | 'floricultura' | 'biblioteca' | 'praca' | 'casa';
export type BuildingId = Exclude<LocationId, 'praca'>;

interface LocationBase {
  name: string;
  x: number;
  y: number;
}

export interface BuildingLocation extends LocationBase {
  id: BuildingId;
  kind: 'building';
  /** Tamanho total da arte (fachada + telhado). */
  width: number;
  height: number;
  /** Área sólida na base do prédio; acima dela o personagem passa "atrás" do telhado. */
  collider: { width: number; height: number };
}

export interface PlazaLocation extends LocationBase {
  id: 'praca';
  kind: 'plaza';
  radius: number;
}

export type LocationData = BuildingLocation | PlazaLocation;

export const LOCATIONS: readonly LocationData[] = [
  {
    id: 'casa',
    kind: 'building',
    name: 'Casa do Futuro',
    x: 1200,
    y: 360,
    width: 300,
    height: 260,
    collider: { width: 220, height: 110 },
  },
  {
    id: 'cafeteria',
    kind: 'building',
    name: 'Cafeteria da Lua',
    x: 560,
    y: 600,
    width: 280,
    height: 230,
    collider: { width: 240, height: 110 },
  },
  {
    id: 'cinema',
    kind: 'building',
    name: 'Cinema das Estrelas',
    x: 1840,
    y: 600,
    width: 300,
    height: 250,
    collider: { width: 260, height: 120 },
  },
  {
    id: 'emporio',
    kind: 'building',
    name: 'Empório da Meia-Noite',
    x: 1500,
    y: 600,
    width: 220,
    height: 210,
    collider: { width: 196, height: 100 },
  },
  {
    id: 'floricultura',
    kind: 'building',
    name: 'Floricultura dos Desejos',
    x: 560,
    y: 1300,
    width: 260,
    height: 220,
    collider: { width: 220, height: 100 },
  },
  {
    id: 'biblioteca',
    kind: 'building',
    name: 'Biblioteca dos Segredos',
    x: 1840,
    y: 1300,
    width: 300,
    height: 260,
    collider: { width: 260, height: 110 },
  },
  { id: 'praca', kind: 'plaza', name: 'Praça das Luzes', x: 1200, y: 960, radius: 230 },
];

export function isBuilding(location: LocationData): location is BuildingLocation {
  return location.kind === 'building';
}

export function getPlaza(): PlazaLocation {
  const plaza = LOCATIONS.find((l): l is PlazaLocation => l.kind === 'plaza');
  if (!plaza) throw new Error('A Praça das Luzes não está definida em LOCATIONS.');
  return plaza;
}

/**
 * Área circular que conta como "estar" no local: em frente à porta dos
 * prédios ou dentro da praça.
 */
export function visitArea(location: LocationData): { x: number; y: number; radius: number } {
  if (location.kind === 'plaza') return { x: location.x, y: location.y, radius: location.radius };
  return { x: location.x, y: location.y + 40, radius: 150 };
}
