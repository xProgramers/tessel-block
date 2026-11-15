import { describe, expect, it } from 'vitest';
import { mosaicLayout } from '../src/components/AdventureMap';
import { LEVEL_COUNT } from '../src/game/adventure';

describe('mosaico da Aventura', () => {
  it('tem um ladrilho por nível, sem sobreposição, e o nível 1 na ponta de baixo', () => {
    const cells = mosaicLayout();
    expect(cells).toHaveLength(LEVEL_COUNT);
    expect(new Set(cells.map((c) => `${c.row},${c.col}`)).size).toBe(LEVEL_COUNT);
    const maxRow = Math.max(...cells.map((c) => c.row));
    expect(cells[0]).toMatchObject({ n: 1, row: maxRow });
  });
  it('níveis seguidos ficam lado a lado ou na fileira de cima (trilha contínua)', () => {
    const cells = mosaicLayout();
    for (let i = 1; i < cells.length; i++) {
      const a = cells[i - 1];
      const b = cells[i];
      const sameRow = a.row === b.row && Math.abs(a.col - b.col) === 1;
      expect(sameRow || b.row === a.row - 1).toBe(true);
    }
  });
});
