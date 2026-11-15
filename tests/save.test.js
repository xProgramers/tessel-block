import { describe, expect, it } from 'vitest';
import {
  clearGame, DEFAULT_SAVE, GAME_KEY, loadGame, loadSave, SAVE_KEY, saveGame, writeSave,
} from '../src/game/format.js';
import { emptyGrid, placePiece } from '../src/game/logic.js';

const THEMES = ['minimal', 'candy', 'zen'];
const SOUNDS = ['classic', 'wood'];
const progress = { balance: 1234, owned: ['minimal', 'candy'], theme: 'candy', best: 99, sounds: ['classic', 'wood'], sound: 'wood' };

describe('progresso do jogador', () => {
  it('grava e lê de volta', () => {
    writeSave(progress);
    expect(loadSave(THEMES, SOUNDS)).toEqual({ data: progress, tampered: false });
  });
  it('sem save, começa do padrão', () => {
    expect(loadSave(THEMES, SOUNDS)).toEqual({ data: DEFAULT_SAVE, tampered: false });
  });
  it('edição manual é detectada e o original vai para backup', () => {
    writeSave(progress);
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    raw.data.balance = 999999;
    localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
    expect(loadSave(THEMES, SOUNDS)).toEqual({ data: DEFAULT_SAVE, tampered: true });
    const backups = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
      .filter((k) => k.startsWith(`${SAVE_KEY}_backup_`));
    expect(backups).toHaveLength(1);
  });
  it('tema ou som removido numa versão nova não zera o progresso', () => {
    writeSave(progress);
    const { data, tampered } = loadSave(['minimal', 'zen'], ['classic']);
    expect(tampered).toBe(false);
    expect(data).toEqual({ balance: 1234, owned: ['minimal'], theme: 'minimal', best: 99, sounds: ['classic'], sound: 'classic' });
  });
  it('save antigo sem sons ganha os padrões', () => {
    writeSave({ balance: 5, owned: ['minimal'], theme: 'minimal', best: 0 });
    expect(loadSave(THEMES, SOUNDS).data).toMatchObject({ sounds: ['classic'], sound: 'classic' });
  });
  it('migra as chaves antigas sem assinatura', () => {
    localStorage.setItem('bc_balance', '42');
    localStorage.setItem('bc_owned', JSON.stringify(['minimal', 'zen']));
    localStorage.setItem('bc_theme', JSON.stringify('zen'));
    expect(loadSave(THEMES, SOUNDS).data).toMatchObject({ balance: 42, owned: ['minimal', 'zen'], theme: 'zen' });
    expect(localStorage.getItem('bc_balance')).toBeNull();
  });
});

describe('partida em andamento', () => {
  const square = { id: 5, cells: [[0, 0], [0, 1], [1, 0], [1, 1]], w: 2, h: 2, color: 3 };
  const game = () => ({
    grid: placePiece(emptyGrid(), square, 2, 2, 17),
    pieces: [square, null, { ...square, id: 6, color: 1 }],
    score: 320,
    streak: 2,
    missCount: 1,
  });

  it('grava e restaura', () => {
    saveGame(game());
    const g = loadGame(8, 7);
    expect(g.score).toBe(320);
    expect(g.streak).toBe(2);
    expect(g.missCount).toBe(1);
    expect(g.grid[3][3]).toEqual({ color: 3, t: -1 });
    expect(g.grid[0][0]).toBeNull();
    expect(g.pieces[1]).toBeNull();
    expect(g.pieces[0]).toEqual({ cells: square.cells, w: 2, h: 2, color: 3 });
  });
  it('sem partida salva devolve null', () => {
    expect(loadGame(8, 7)).toBeNull();
  });
  it('clearGame apaga a partida', () => {
    saveGame(game());
    clearGame();
    expect(loadGame(8, 7)).toBeNull();
  });
  it('partida editada à mão é ignorada', () => {
    saveGame(game());
    const raw = JSON.parse(localStorage.getItem(GAME_KEY));
    raw.data.score = 1e9;
    localStorage.setItem(GAME_KEY, JSON.stringify(raw));
    expect(loadGame(8, 7)).toBeNull();
  });
  it('partida com formato inválido é ignorada', () => {
    saveGame({ ...game(), pieces: [null, null, null] });
    expect(loadGame(8, 7)).toBeNull();
    saveGame({ ...game(), pieces: [{ ...square, color: 9 }, null, null] });
    expect(loadGame(8, 7)).toBeNull();
    localStorage.setItem(GAME_KEY, 'não é json');
    expect(loadGame(8, 7)).toBeNull();
  });
});
