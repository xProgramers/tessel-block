import { describe, expect, it } from 'vitest';
import { comboMult, computeGain, ECONOMY, streakMult } from '../src/game/economy.js';

describe('economia', () => {
  it('encaixe sem limpar paga só por bloco', () => {
    expect(computeGain({ blocks: 4, lines: 0, streak: 0, allClear: false, mult: 1 }))
      .toEqual({ place: 4 * ECONOMY.perBlock, clear: 0, total: 4 * ECONOMY.perBlock });
  });
  it('combo multiplica por linha simultânea', () => {
    expect(comboMult(0)).toBe(1);
    expect(comboMult(3)).toBe(3);
    const { clear } = computeGain({ blocks: 1, lines: 2, streak: 1, allClear: false, mult: 1 });
    expect(clear).toBe(ECONOMY.perLine * 2 * 2);
  });
  it('streak cresce e respeita o teto', () => {
    expect(streakMult(1)).toBe(1);
    expect(streakMult(2)).toBe(1 + ECONOMY.streakStep);
    expect(streakMult(1000)).toBe(ECONOMY.streakCap);
  });
  it('tabuleiro limpo e multiplicador do tema', () => {
    const base = computeGain({ blocks: 3, lines: 1, streak: 1, allClear: true, mult: 1 });
    expect(base.clear).toBe(ECONOMY.perLine + ECONOMY.allClear);
    const themed = computeGain({ blocks: 3, lines: 1, streak: 1, allClear: true, mult: 1.5 });
    expect(themed.clear).toBe(Math.round((ECONOMY.perLine + ECONOMY.allClear) * 1.5));
    expect(Number.isInteger(themed.place)).toBe(true);
  });
});
