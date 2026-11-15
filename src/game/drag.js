// Arraste das peças: geometria pura (testável) + store leve da prévia de encaixe.

/**
 * Ganho do arraste no toque: a peça anda mais que o dedo, como nos jogos do gênero.
 * Assim o caminho da bandeja até o topo do tabuleiro fica curto e a peça parece "voar",
 * em vez de ir deslizando atrás do dedo. No mouse fica 1:1 (precisão).
 */
export const DRAG_GAIN = { x: 1.2, y: 1.4 };
/** Quanto a peça fica acima do dedo (em células) para o dedo não cobri-la. */
export const LIFT_CELLS = 0.9;

/**
 * Canto superior esquerdo da peça arrastada, em px de viewport.
 * d: { x, y, sx, sy, w, h, cs, touch } — posição atual e inicial do ponteiro e tamanho da peça.
 */
export function dragPoint(d, vw = Infinity, vh = Infinity) {
  if (!d.touch) return { left: d.x - d.w / 2, top: d.y - d.h / 2 };
  const px = d.sx + (d.x - d.sx) * DRAG_GAIN.x;
  const py = d.sy + (d.y - d.sy) * DRAG_GAIN.y;
  const left = px - d.w / 2;
  const top = py - d.h - d.cs * LIFT_CELLS;
  // Com ganho a peça pode "fugir" da tela: mantém pelo menos metade dela visível
  return {
    left: clamp(left, -d.w / 2, vw - d.w / 2),
    top: clamp(top, -d.h / 2, vh - d.h / 2),
  };
}

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

/** Store mínimo compatível com useSyncExternalStore. */
export function createHoverStore() {
  let value = null;
  const subs = new Set();
  return {
    get: () => value,
    set: (v) => {
      if (v === value) return;
      value = v;
      subs.forEach((fn) => fn());
    },
    subscribe: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}
