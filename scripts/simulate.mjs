// Simulador de balanceamento: joga milhares de partidas com bots e mede o ganho de moedas.
// Uso: node scripts/simulate.mjs [partidas]
import {
  anyFit, canPlace, clearLines, emptyGrid, findFullLines, generateSet, isBoardEmpty, placePiece,
} from '../src/game/logic.js';
import { computeGain, ECONOMY } from '../src/game/economy.js';
import { THEMES } from '../src/game/themes.js';

const GAMES = Number(process.argv[2] ?? 400);
// OLD=1 reproduz a economia original (para comparação)
if (process.env.OLD) Object.assign(ECONOMY, { perBlock: 10, perLine: 150, allClear: 1000, streakStep: 0.5, streakCap: 1e9 });
const SECONDS_PER_MOVE = 3.5; // ritmo de um jogador casual (pensar + arrastar + animação)
const MAX_MOVES = 3000; // trava de segurança contra partida infinita

function evaluate(grid, piece, r, c) {
  const g = placePiece(grid, piece, r, c, 0);
  const { rows, cols } = findFullLines(g);
  const lines = rows.length + cols.length;
  const after = clearLines(g, rows, cols);
  let adj = 0;
  for (const [pr, pc] of piece.cells) {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = r + pr + dr;
      const cc = c + pc + dc;
      if (rr < 0 || cc < 0 || rr > 7 || cc > 7 || g[rr][cc]) adj++;
    }
  }
  let holes = 0;
  let filled = 0;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    if (after[i][j]) { filled++; continue; }
    let blocked = 0;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = i + dr;
      const cc = j + dc;
      if (rr < 0 || cc < 0 || rr > 7 || cc > 7 || after[rr][cc]) blocked++;
    }
    if (blocked === 4) holes++;
  }
  return lines * 60 + adj * 2 - holes * 14 - filled * 0.6;
}

function playGame(skill, mult) {
  let grid = emptyGrid();
  let pieces = generateSet(grid);
  let streak = 0;
  let miss = 0;
  let coins = 0;
  let moves = 0;
  const lineHist = [0, 0, 0, 0, 0, 0];
  while (moves < MAX_MOVES) {
    const options = [];
    pieces.forEach((p, i) => {
      if (!p) return;
      for (let r = 0; r <= 8 - p.h; r++)
        for (let c = 0; c <= 8 - p.w; c++)
          if (canPlace(grid, p, r, c)) options.push({ i, r, c, s: evaluate(grid, p, r, c) });
    });
    if (!options.length) break;
    options.sort((a, b) => b.s - a.s);
    let pick;
    if (skill === 'good') pick = options[0];
    // casual: costuma ver a melhor jogada, mas às vezes escolhe a 2ª/3ª ou erra
    else {
      const roll = Math.random();
      pick = roll < 0.06 ? options[(Math.random() * options.length) | 0]
        : roll < 0.4 ? options[Math.min(options.length - 1, 1 + ((Math.random() * 2) | 0))]
        : options[0];
    }

    const piece = pieces[pick.i];
    let g = placePiece(grid, piece, pick.r, pick.c, 0);
    const { rows, cols } = findFullLines(g);
    const lines = rows.length + cols.length;
    if (lines) { streak++; miss = 0; } else if (++miss >= ECONOMY.streakGrace) streak = 0;
    g = clearLines(g, rows, cols);
    coins += computeGain({ blocks: piece.cells.length, lines, streak, allClear: lines > 0 && isBoardEmpty(g), mult }).total;
    lineHist[Math.min(lines, 5)]++;
    grid = g;
    moves++;
    pieces = pieces.map((p, i) => (i === pick.i ? null : p));
    if (pieces.every((p) => !p)) pieces = generateSet(grid);
    if (!pieces.some((p) => p && anyFit(grid, p))) break;
  }
  return { coins, moves, lineHist };
}

function stats(skill, mult = 1) {
  const res = Array.from({ length: GAMES }, () => playGame(skill, mult));
  const coins = res.map((r) => r.coins).sort((a, b) => a - b);
  const moves = res.map((r) => r.moves).sort((a, b) => a - b);
  const totalCoins = coins.reduce((a, b) => a + b, 0);
  const totalMoves = moves.reduce((a, b) => a + b, 0);
  const perMove = totalCoins / totalMoves;
  const hist = [0, 0, 0, 0, 0, 0];
  res.forEach((r) => r.lineHist.forEach((v, i) => (hist[i] += v)));
  return {
    skill,
    perMove,
    perMin: (perMove * 60) / SECONDS_PER_MOVE,
    medianCoins: coins[GAMES >> 1],
    p90Coins: coins[Math.floor(GAMES * 0.9)],
    medianMoves: moves[GAMES >> 1],
    medianMinutes: (moves[GAMES >> 1] * SECONDS_PER_MOVE) / 60,
    capped: res.filter((r) => r.moves >= MAX_MOVES).length,
    clearsPct: hist.slice(1).map((v) => ((v / totalMoves) * 100).toFixed(1) + '%').join(' / '),
  };
}

const casual = stats('casual');
const good = stats('good');
console.table([casual, good].map((s) => ({
  bot: s.skill,
  'moedas/jogada': s.perMove.toFixed(2),
  'moedas/min': s.perMin.toFixed(0),
  'mediana moedas/partida': s.medianCoins,
  'p90 moedas/partida': s.p90Coins,
  'mediana jogadas': s.medianMoves,
  'mediana min/partida': s.medianMinutes.toFixed(1),
  'partidas infinitas': s.capped,
  'limpou 1/2/3/4/5+ linhas': s.clearsPct,
})));

// Tempo de jogo para desbloquear a loja comprando em ordem e equipando cada nível
for (const s of [casual, good]) {
  let minutes = 0;
  const rows = [];
  let mult = 1;
  for (const t of THEMES) {
    if (t.price > 0) {
      minutes += t.price / (s.perMin * mult);
      rows.push({ nível: t.level, tema: t.name, preço: t.price, mult: t.mult, 'minutos acumulados': minutes.toFixed(0), 'horas acumuladas': (minutes / 60).toFixed(1) });
    }
    mult = t.mult;
  }
  console.log(`\nProgressão da loja — bot ${s.skill} (${s.perMin.toFixed(0)} moedas/min no nível 1):`);
  console.table(rows);
}
