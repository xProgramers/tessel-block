// Modo Aventura: 100 níveis com tabuleiro inicial desenhado e meta de pontos.
// As metas e as faixas de estrelas vêm de scripts/calibrate-adventure.mjs
// (bot jogando centenas de vezes cada nível) e ficam em adventureTargets.js.
import { SIZE, emptyGrid, findFullLines } from './logic.js';
import { BOARD_VARIANTS, STAR_MOVES, TARGETS } from './adventureTargets.js';

export const LEVEL_COUNT = 100;
export const LEVELS_PER_CHAPTER = 10;

/** Capítulos do mapa (10 níveis cada): nome + cores da arte do mapa. */
export const CHAPTERS = [
  { name: 'Vale Esmeralda', from: '#10b981', to: '#065f46', icon: '🌿' },
  { name: 'Dunas Douradas', from: '#f59e0b', to: '#92400e', icon: '🏜️' },
  { name: 'Recife de Coral', from: '#fb7185', to: '#9f1239', icon: '🐚' },
  { name: 'Floresta Encantada', from: '#22c55e', to: '#14532d', icon: '🍄' },
  { name: 'Picos Gelados', from: '#7dd3fc', to: '#0c4a6e', icon: '❄️' },
  { name: 'Cânion Rubi', from: '#f97316', to: '#7c2d12', icon: '🪨' },
  { name: 'Lagoa Lunar', from: '#818cf8', to: '#312e81', icon: '🌙' },
  { name: 'Vulcão Ardente', from: '#ef4444', to: '#450a0a', icon: '🌋' },
  { name: 'Nebulosa Violeta', from: '#c084fc', to: '#3b0764', icon: '🌌' },
  { name: 'Coroa Celestial', from: '#fde047', to: '#a16207', icon: '👑' },
];

/*
 * Desenhos dos tabuleiros iniciais. "." = vazio, dígito = cor da paleta do tema
 * (0 vermelho, 1 laranja, 2 amarelo, 3 verde, 4 ciano, 5 azul, 6 roxo).
 * No máximo 7x7: assim nenhuma linha/coluna começa completa.
 */
const MOTIFS = {
  heart: ['.00.00.', '0000000', '0000000', '.00000.', '..000..', '...0...'],
  star: ['...2...', '..222..', '2222222', '.22222.', '.22.22.', '.2...2.'],
  arrow: ['...4...', '..444..', '.44444.', '...4...', '...4...', '...4...'],
  mushroom: ['..000..', '.00000.', '0000000', '..222..', '..222..'],
  tree: ['...3...', '..333..', '.33333.', '..333..', '.33333.', '3333333', '...1...'],
  house: ['...0...', '..000..', '.00000.', '0000000', '.55555.', '.55.55.', '.55.55.'],
  crown: ['2..2..2', '22.2.22', '2222222', '2626262', '2222222'],
  smile: ['.22222.', '2.....2', '2.2.2.2', '2.....2', '2.222.2', '2.....2', '.22222.'],
  diamond: ['..444..', '.44444.', '4455544', '.55555.', '..555..', '...5...'],
  rocket: ['...6...', '..666..', '..646..', '..666..', '.66666.', '.6.0.6.', '...0...'],
  cat: ['1.....1', '11...11', '1111111', '1.111.1', '1111111', '.11111.'],
  cross: ['33...33', '.33.33.', '..333..', '.33.33.', '33...33'],
  trophy: ['2222222', '.22222.', '2.222.2', '..222..', '...2...', '..222..', '.22222.'],
};
const ROTATION = ['heart', 'star', 'arrow', 'mushroom', 'tree', 'house', 'crown', 'smile', 'diamond', 'rocket', 'cat', 'cross'];

/** Gerador pseudoaleatório com semente (mesmo nível = mesmo tabuleiro sempre). */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Meta de pontos do nível n: sobe suave (~120 no nível 1, ~520 no 100), com chefão
 * (+20%) a cada 10 níveis e um respiro (-10%) no nível seguinte.
 * Pontos = mesma conta das moedas no tema 1x (ver economy.js), sem multiplicador de tema.
 */
export function targetFor(n) {
  let t = 120 + 4 * (n - 1);
  if (n % LEVELS_PER_CHAPTER === 0) t *= 1.2;
  else if (n % LEVELS_PER_CHAPTER === 1 && n > 1) t *= 0.9;
  return t < 200 ? Math.round(t / 5) * 5 : Math.round(t / 10) * 10;
}

export const isBoss = (n) => n % LEVELS_PER_CHAPTER === 0;
export const chapterOf = (n) => CHAPTERS[Math.min(Math.floor((n - 1) / LEVELS_PER_CHAPTER), CHAPTERS.length - 1)];

/**
 * Tabuleiro inicial do nível n: um desenho (espelhado/deslocado conforme a semente)
 * e, a partir do capítulo 2, alguns blocos soltos de "entulho" que crescem com o nível.
 * `variant` muda a semente: a calibração escolhe, para cada nível, a variante cuja
 * dificuldade bate com a curva desejada (evita tabuleiros que travam logo de cara).
 * Células: { color, t: -1 } (sem animação de encaixe). Nunca começa com linha completa.
 */
export function levelBoard(n, variant = BOARD_VARIANTS[n - 1] ?? 0) {
  const rnd = seeded(n * 7919 + 13 + variant * 104729);
  const art = MOTIFS[isBoss(n) ? 'trophy' : ROTATION[(n - 1) % ROTATION.length]];
  const mirror = rnd() < 0.5;
  const h = art.length;
  const w = Math.max(...art.map((r) => r.length));
  const top = Math.floor(rnd() * (SIZE - h + 1));
  const left = Math.floor(rnd() * (SIZE - w + 1));
  const g = emptyGrid();
  art.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === '.') return;
      const cc = mirror ? w - 1 - c : c;
      g[top + r][left + cc] = { color: Number(ch), t: -1 };
    });
  });
  // Entulho: 0 no capítulo 1, depois +1 por capítulo (até 8)
  const junk = Math.min(Math.floor((n - 1) / LEVELS_PER_CHAPTER), 8);
  const free = () => g.flat().filter((v) => !v).length;
  // (nunca deixa menos de 26 casas livres: tabuleiro apertado demais vira loteria)
  for (let i = 0, tries = 0; i < junk && tries < 200 && free() > 26; tries++) {
    const r = Math.floor(rnd() * SIZE);
    const c = Math.floor(rnd() * SIZE);
    if (g[r][c]) continue;
    g[r][c] = { color: Math.floor(rnd() * 7), t: -1 };
    const { rows, cols } = findFullLines(g);
    if (rows.length || cols.length) g[r][c] = null;
    else i++;
  }
  return g;
}

/** Configuração completa do nível n (1..100). */
export function levelConfig(n) {
  return {
    n,
    target: TARGETS[n - 1],
    starMoves: STAR_MOVES[n - 1], // [jogadas p/ 3★, jogadas p/ 2★]
    boss: isBoss(n),
    chapter: chapterOf(n),
  };
}

/** Estrelas ao vencer: menos jogadas para bater a meta = mais estrelas (mínimo 1). */
export function starsFor(n, moves) {
  const [three, two] = STAR_MOVES[n - 1];
  return moves <= three ? 3 : moves <= two ? 2 : 1;
}

/**
 * Moedas de ouro pela 1ª vitória no nível (estrelas novas em replays também pagam).
 * Ex.: nível 1 = 30, nível 50 = 128, nível 100 = 228; chefão (múltiplos de 10) paga o dobro.
 */
export function levelReward(n, prevStars, stars) {
  const base = 28 + n * 2;
  const first = prevStars === 0 ? base * (isBoss(n) ? 2 : 1) : 0;
  const extra = Math.max(0, stars - Math.max(prevStars, 1)) * Math.round(base * 0.25);
  return first + extra;
}

/** Próximo nível a jogar (o primeiro sem estrelas), ou null se zerou tudo. */
export function nextLevel(stars) {
  for (let i = 0; i < LEVEL_COUNT; i++) if (!(stars[i] > 0)) return i + 1;
  return null;
}

/** Nível n liberado? (o 1º sempre; os demais após vencer o anterior) */
export const isUnlocked = (stars, n) => n === 1 || stars[n - 2] > 0;
