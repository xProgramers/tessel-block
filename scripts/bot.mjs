// Bot de partidas usado pelo simulador de economia e pela calibração do modo Aventura.
import {
  anyFit, canPlace, clearLines, emptyGrid, findFullLines, generateSet, isBoardEmpty, placePiece,
} from '../src/game/logic.js';
import { computeGain, ECONOMY } from '../src/game/economy.js';

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

/**
 * Joga uma partida com um bot.
 * skill: 'good' (sempre a melhor jogada) ou 'casual' (erra às vezes).
 * opts.grid: tabuleiro inicial (modo Aventura); opts.stopAt: para ao atingir essa pontuação;
 * opts.trace: devolve em `curve` a pontuação acumulada após cada jogada.
 */
export function playGame(skill, { mult = 1, grid: start = null, stopAt = Infinity, trace = false } = {}) {
  const curve = []; // pontuação acumulada após cada jogada (se trace)
  let grid = start ? start.map((r) => r.slice()) : emptyGrid();
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
    if (trace) curve.push(coins);
    if (coins >= stopAt) break;
    pieces = pieces.map((p, i) => (i === pick.i ? null : p));
    if (pieces.every((p) => !p)) pieces = generateSet(grid);
    if (!pieces.some((p) => p && anyFit(grid, p))) break;
  }
  return { coins, moves, lineHist, curve, capped: moves >= MAX_MOVES };
}

