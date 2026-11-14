import { memo } from 'react';

/** Um bloco estilizado conforme o tema (soft / neon / gold / gem). */
function Block({ color, variant, className = '', style }) {
  return <div className={`block block-${variant} ${className}`} style={{ '--c': color, ...style }} />;
}

export default memo(Block);

/** Desenha uma peça em uma grade absoluta com tamanho de célula `size` (CSS). */
export function PieceShape({ piece, palette, variant, size }) {
  return (
    <div
      className="relative"
      style={{ width: `calc(${size} * ${piece.w})`, height: `calc(${size} * ${piece.h})` }}
    >
      {piece.cells.map(([r, c]) => (
        <div
          key={`${r}-${c}`}
          className="absolute"
          style={{ left: `calc(${size} * ${c})`, top: `calc(${size} * ${r})`, width: size, height: size }}
        >
          <Block color={palette[piece.color]} variant={variant} />
        </div>
      ))}
    </div>
  );
}
