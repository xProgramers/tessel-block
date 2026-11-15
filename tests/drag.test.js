import { describe, expect, it, vi } from 'vitest';
import { createHoverStore, dragPoint, DRAG_GAIN, LIFT_CELLS } from '../src/game/drag';

const base = { sx: 100, sy: 500, w: 60, h: 40, cs: 20 };

describe('dragPoint', () => {
  it('no mouse segue o cursor 1:1, centralizado', () => {
    expect(dragPoint({ ...base, x: 130, y: 300, touch: false })).toEqual({ left: 100, top: 280 });
  });

  it('no toque a peça anda mais que o dedo e fica acima dele', () => {
    const p = dragPoint({ ...base, x: 150, y: 400, touch: true });
    expect(p.left).toBeCloseTo(100 + 50 * DRAG_GAIN.x - 30);
    expect(p.top).toBeCloseTo(500 - 100 * DRAG_GAIN.y - 40 - 20 * LIFT_CELLS);
  });

  it('no toque, sem mover, a peça aparece logo acima do dedo', () => {
    const p = dragPoint({ ...base, x: 100, y: 500, touch: true });
    expect(p).toEqual({ left: 70, top: 500 - 40 - 20 * LIFT_CELLS });
  });

  it('mantém ao menos metade da peça dentro da tela', () => {
    const p = dragPoint({ ...base, x: -400, y: -900, touch: true }, 360, 800);
    expect(p).toEqual({ left: -30, top: -20 });
  });
});

describe('createHoverStore', () => {
  it('notifica só quando o valor muda', () => {
    const s = createHoverStore();
    const fn = vi.fn();
    const off = s.subscribe(fn);
    const v = { cells: new Set() };
    s.set(v);
    s.set(v);
    expect(s.get()).toBe(v);
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    s.set(null);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
