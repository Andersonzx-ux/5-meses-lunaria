/**
 * Gerador pseudoaleatório determinístico (LCG): o mesmo `seed` produz sempre a
 * mesma sequência, então cenários gerados ficam idênticos a cada visita.
 */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
