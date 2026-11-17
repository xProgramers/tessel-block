import { describe, expect, it } from 'vitest';
import {
  INTERSTITIAL_EVERY, INTERSTITIAL_GAP_MS, newPacing, noteEnded, noteShown, shouldShowInterstitial,
} from '../src/game/adPacing.js';

const endN = (p, n) => Array.from({ length: n }).reduce(noteEnded, p);

describe('ritmo dos intersticiais', () => {
  it('não mostra logo ao abrir o app', () => {
    const p = newPacing(0);
    expect(shouldShowInterstitial(endN(p, INTERSTITIAL_EVERY), 1000)).toBe(false);
  });
  it(`mostra depois de ${INTERSTITIAL_EVERY} partidas e tempo mínimo`, () => {
    const p = endN(newPacing(0), INTERSTITIAL_EVERY);
    expect(shouldShowInterstitial(p, INTERSTITIAL_GAP_MS)).toBe(true);
    expect(shouldShowInterstitial(endN(newPacing(0), INTERSTITIAL_EVERY - 1), INTERSTITIAL_GAP_MS * 5)).toBe(false);
  });
  it('depois de mostrar, zera e espera de novo', () => {
    const t = INTERSTITIAL_GAP_MS * 3;
    let p = noteShown(t);
    expect(p.ended).toBe(0);
    p = endN(p, INTERSTITIAL_EVERY);
    expect(shouldShowInterstitial(p, t + 10_000)).toBe(false);
    expect(shouldShowInterstitial(p, t + INTERSTITIAL_GAP_MS)).toBe(true);
  });
});
