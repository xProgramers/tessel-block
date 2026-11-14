import { forwardRef, memo, useMemo } from 'react';
import Block from './Block';

/**
 * Tabuleiro 8x8.
 * hover: { cells: Set<"r,c">, rows: number[], cols: number[], color } | null
 * clearFx: [{ id, r, c, color, delay }]
 */
const Board = forwardRef(function Board({ grid, theme, hover, clearFx, lastStamp }, ref) {
  const { palette, block } = theme;

  const glowSet = useMemo(() => {
    const s = new Set();
    if (!hover) return s;
    hover.rows.forEach((r) => { for (let c = 0; c < 8; c++) s.add(`${r},${c}`); });
    hover.cols.forEach((c) => { for (let r = 0; r < 8; r++) s.add(`${r},${c}`); });
    return s;
  }, [hover]);

  const cells = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const key = `${r},${c}`;
      const v = grid[r][c];
      const isGhost = hover?.cells.has(key);
      const glow = glowSet.has(key);
      // Na antecipação, as linhas assumem a cor da peça (estilo Block Blast)
      const color = glow ? palette[hover.color] : v ? palette[v.color] : palette[hover?.color ?? 0];
      cells.push(
        <div className="cell" key={key}>
          <div className="cell-empty" />
          {v && (
            <Block
              key={v.t}
              color={color}
              variant={block}
              className={glow ? 'block-glow' : v.t === lastStamp ? 'block-placed' : ''}
            />
          )}
          {!v && isGhost && (
            <Block color={color} variant={block} className={glow ? 'block-glow' : 'block-ghost'} />
          )}
        </div>,
      );
    }
  }

  return (
    <div className="board-frame">
      <div className="board-grid" ref={ref}>
        {cells}
        {clearFx.map((fx) => (
          <div
            key={fx.id}
            className="clear-fx"
            style={{ left: `${fx.c * 12.5}%`, top: `${fx.r * 12.5}%` }}
          >
            <Block
              color={palette[fx.color]}
              variant={block}
              style={{ animationDelay: `${fx.delay}ms` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

export default memo(Board);
