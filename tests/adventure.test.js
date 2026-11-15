import { describe, expect, it } from 'vitest';
import {
  isUnlocked, LEVEL_COUNT, levelBoard, levelConfig, levelReward, nextLevel, starsFor, targetFor,
} from '../src/game/adventure';
import { STAR_MOVES, TARGETS } from '../src/game/adventureTargets';
import { anyFit, findFullLines } from '../src/game/logic';

describe('modo Aventura', () => {
  it('tem meta e faixas de estrelas para os 100 níveis', () => {
    expect(TARGETS).toHaveLength(LEVEL_COUNT);
    expect(STAR_MOVES).toHaveLength(LEVEL_COUNT);
    TARGETS.forEach((t, i) => {
      expect(t).toBeGreaterThan(0);
      expect(t).toBeLessThanOrEqual(targetFor(i + 1)); // nunca acima da curva
    });
    STAR_MOVES.forEach(([three, two]) => expect(three).toBeLessThan(two));
  });

  it('metas sobem ao longo da aventura', () => {
    expect(TARGETS[0]).toBeLessThan(TARGETS[49]);
    expect(TARGETS[49]).toBeLessThan(TARGETS[98]);
  });

  it('tabuleiro inicial é sempre o mesmo, sem linha completa e com espaço para jogar', () => {
    for (let n = 1; n <= LEVEL_COUNT; n++) {
      const g = levelBoard(n);
      expect(levelBoard(n)).toEqual(g);
      const { rows, cols } = findFullLines(g);
      expect(rows.length + cols.length).toBe(0);
      expect(g.flat().filter((v) => !v).length).toBeGreaterThanOrEqual(20);
      expect(anyFit(g, { cells: [[0, 0], [0, 1], [0, 2]], w: 3, h: 1 })).toBe(true);
    }
  });

  it('estrelas por jogadas', () => {
    const [three, two] = STAR_MOVES[0];
    expect(starsFor(1, three)).toBe(3);
    expect(starsFor(1, two)).toBe(2);
    expect(starsFor(1, two + 1)).toBe(1);
  });

  it('recompensa paga a 1ª vitória e só as estrelas novas depois', () => {
    expect(levelReward(1, 0, 1)).toBe(30);
    expect(levelReward(10, 0, 1)).toBe(96); // chefão paga o dobro
    expect(levelReward(1, 1, 1)).toBe(0);
    expect(levelReward(1, 1, 3)).toBe(16);
    expect(levelReward(1, 3, 3)).toBe(0);
  });

  it('liberação e próximo nível', () => {
    expect(isUnlocked([], 1)).toBe(true);
    expect(isUnlocked([], 2)).toBe(false);
    expect(isUnlocked([2], 2)).toBe(true);
    expect(nextLevel([])).toBe(1);
    expect(nextLevel([3, 1, 0])).toBe(3);
    expect(nextLevel(Array(LEVEL_COUNT).fill(1))).toBeNull();
    expect(levelConfig(20).boss).toBe(true);
  });
});
