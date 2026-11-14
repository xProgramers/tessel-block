import { randomPiece } from './pieces.js';

export const SIZE = 8;

export const emptyGrid = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

export function canPlace(grid, piece, row, col) {
  for (const [r, c] of piece.cells) {
    const rr = row + r;
    const cc = col + c;
    if (rr < 0 || cc < 0 || rr >= SIZE || cc >= SIZE) return false;
    if (grid[rr][cc]) return false;
  }
  return true;
}

export function placePiece(grid, piece, row, col, stamp) {
  const g = grid.map((r) => r.slice());
  for (const [r, c] of piece.cells) g[row + r][col + c] = { color: piece.color, t: stamp };
  return g;
}

export function findFullLines(grid) {
  const rows = [];
  const cols = [];
  for (let i = 0; i < SIZE; i++) {
    if (grid[i].every(Boolean)) rows.push(i);
    let full = true;
    for (let r = 0; r < SIZE; r++) if (!grid[r][i]) { full = false; break; }
    if (full) cols.push(i);
  }
  return { rows, cols };
}

export function clearLines(grid, rows, cols) {
  const g = grid.map((r) => r.slice());
  rows.forEach((r) => { for (let c = 0; c < SIZE; c++) g[r][c] = null; });
  cols.forEach((c) => { for (let r = 0; r < SIZE; r++) g[r][c] = null; });
  return g;
}

export function anyFit(grid, piece) {
  for (let r = 0; r <= SIZE - piece.h; r++)
    for (let c = 0; c <= SIZE - piece.w; c++) if (canPlace(grid, piece, r, c)) return true;
  return false;
}

/** Gera 3 peças, tentando garantir que pelo menos uma caiba (jogo mais justo). */
export function generateSet(grid) {
  // 1º: tenta um conjunto em que as 3 peças caibam (cada uma isoladamente)
  for (let attempt = 0; attempt < 25; attempt++) {
    const set = [randomPiece(), randomPiece(), randomPiece()];
    if (set.every((p) => anyFit(grid, p))) return set;
  }
  // 2º: aceita se ao menos uma couber
  let set;
  for (let attempt = 0; attempt < 25; attempt++) {
    set = [randomPiece(), randomPiece(), randomPiece()];
    if (set.some((p) => anyFit(grid, p))) return set;
  }
  return set;
}

export const isBoardEmpty = (grid) => grid.every((r) => r.every((v) => !v));
