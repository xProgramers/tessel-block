import { memo } from 'react';
import { PieceShape } from './Block';

/** Bandeja com as 3 peças disponíveis. */
function PieceTray({ pieces, fits, theme, draggingIndex, onPointerDown }) {
  return (
    <div
      className="grid grid-cols-3 items-center"
      style={{ width: 'var(--board)', height: 'calc(var(--board) * 0.34)' }}
    >
      {pieces.map((piece, i) => (
        <div key={i} className="flex h-full items-center justify-center">
          {piece && (
            <div key={piece.id} className="tray-in" style={{ animationDelay: `${i * 70}ms` }}>
              <div
                className={['tray-piece p-2', draggingIndex === i && 'is-dragging', !fits[i] && 'no-fit']
                  .filter(Boolean)
                  .join(' ')}
                onPointerDown={(e) => onPointerDown(i, e)}
                role="button"
                aria-label="Peça disponível"
              >
                <PieceShape piece={piece} palette={theme.palette} variant={theme.block} size="var(--tcell)" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default memo(PieceTray);
