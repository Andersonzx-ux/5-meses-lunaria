export const COLORS = {
  navy: 0x0b1030,
  lilac: 0xb9a6e8,
  rose: 0xf2b6c8,
  gold: 0xf3d58a,
  cream: 0xfbf1dc,
} as const;

/** Lado menor da área lógica do jogo em telas grandes (960×540 num monitor 16:9). */
const MAX_SHORT_SIDE = 540;
/** Limite inferior para telas muito pequenas. */
const MIN_SHORT_SIDE = 420;
/** Proporção máxima; além disso sobram faixas laterais. */
const MAX_ASPECT = 2.4;
/** Em celulares, quantos px lógicos por px de CSS no lado menor (textos e botões não encolhem demais). */
const SMALL_SCREEN_DENSITY = 1.2;

export interface GameSize {
  width: number;
  height: number;
}

/**
 * Tamanho lógico do jogo para uma área de tela (em px de CSS): mesma proporção
 * da tela, com o lado menor entre 420 e 540. Em pé, o jogo fica em pé.
 */
export function computeGameSize(cssWidth: number, cssHeight: number): GameSize {
  const w = Math.max(1, cssWidth);
  const h = Math.max(1, cssHeight);
  const shortCss = Math.min(w, h);
  const shortSide = Math.round(Math.min(MAX_SHORT_SIDE, Math.max(MIN_SHORT_SIDE, shortCss * SMALL_SCREEN_DENSITY)));
  const longSide = Math.round(shortSide * Math.min(Math.max(w, h) / shortCss, MAX_ASPECT));
  return w >= h ? { width: longSide, height: shortSide } : { width: shortSide, height: longSide };
}
