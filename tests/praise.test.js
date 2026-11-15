import { describe, expect, it } from 'vitest';
import { praiseFor } from '../src/game/praise';

describe('praiseFor', () => {
  it('uma linha sem sequência não ganha elogio', () => {
    expect(praiseFor(1, 1, false)).toBeNull();
    expect(praiseFor(0, 0, false)).toBeNull();
  });
  it('cresce com linhas e sequência', () => {
    expect(praiseFor(2, 1, false)).toEqual({ text: 'Boa!', tier: 1 });
    expect(praiseFor(1, 3, false)).toEqual({ text: 'Ótimo!', tier: 2 });
    expect(praiseFor(3, 3, false).tier).toBe(4);
    expect(praiseFor(4, 9, false)).toEqual({ text: 'Espetacular!', tier: 5 });
  });
  it('tabuleiro limpo é sempre "Perfeito!"', () => {
    expect(praiseFor(1, 1, true)).toEqual({ text: 'Perfeito!', tier: 5 });
  });
});
