import { describe, expect, it } from 'vitest';
import {
  anyFit, canPlace, clearLines, emptyGrid, findFullLines, generateSet, isBoardEmpty, placePiece, SIZE,
} from '../src/game/logic.js';
import { randomPiece } from '../src/game/pieces.js';

const piece = (cells, color = 0) => ({
  id: 0, cells, color,
  h: Math.max(...cells.map(([r]) => r)) + 1,
  w: Math.max(...cells.map(([, c]) => c)) + 1,
});
const square = piece([[0, 0], [0, 1], [1, 0], [1, 1]]);

describe('canPlace', () => {
  it('aceita peça dentro do tabuleiro vazio', () => {
    expect(canPlace(emptyGrid(), square, 0, 0)).toBe(true);
    expect(canPlace(emptyGrid(), square, SIZE - 2, SIZE - 2)).toBe(true);
  });
  it('recusa peça fora do tabuleiro', () => {
    expect(canPlace(emptyGrid(), square, SIZE - 1, 0)).toBe(false);
    expect(canPlace(emptyGrid(), square, 0, -1)).toBe(false);
  });
  it('recusa sobreposição', () => {
    const g = placePiece(emptyGrid(), square, 0, 0, 1);
    expect(canPlace(g, square, 1, 1)).toBe(false);
    expect(canPlace(g, square, 2, 2)).toBe(true);
  });
});

describe('placePiece', () => {
  it('não altera o tabuleiro original', () => {
    const g = emptyGrid();
    const g2 = placePiece(g, square, 0, 0, 7);
    expect(isBoardEmpty(g)).toBe(true);
    expect(g2[1][1]).toEqual({ color: 0, t: 7 });
  });
});

describe('linhas completas', () => {
  it('encontra e limpa linha e coluna ao mesmo tempo', () => {
    let g = emptyGrid();
    for (let i = 0; i < SIZE; i++) {
      g[3][i] = { color: 1, t: 1 };
      g[i][5] = { color: 2, t: 1 };
    }
    g[0][0] = { color: 0, t: 1 };
    const { rows, cols } = findFullLines(g);
    expect(rows).toEqual([3]);
    expect(cols).toEqual([5]);
    g = clearLines(g, rows, cols);
    expect(g[0][0]).toBeTruthy();
    expect(findFullLines(g)).toEqual({ rows: [], cols: [] });
    g[0][0] = null;
    expect(isBoardEmpty(g)).toBe(true);
  });
});

describe('anyFit / generateSet', () => {
  it('detecta tabuleiro sem espaço', () => {
    const full = emptyGrid().map((r) => r.map(() => ({ color: 0, t: 0 })));
    expect(anyFit(full, square)).toBe(false);
    full[7][7] = null;
    expect(anyFit(full, square)).toBe(false);
    expect(anyFit(full, piece([[0, 0]]))).toBe(true);
  });
  it('no tabuleiro vazio, as 3 peças sempre cabem', () => {
    for (let i = 0; i < 200; i++) {
      const set = generateSet(emptyGrid());
      expect(set).toHaveLength(3);
      expect(set.every((p) => anyFit(emptyGrid(), p))).toBe(true);
    }
  });
  it('peças sorteadas têm formato coerente', () => {
    for (let i = 0; i < 500; i++) {
      const p = randomPiece();
      expect(p.cells.every(([r, c]) => r < p.h && c < p.w)).toBe(true);
    }
  });
});
