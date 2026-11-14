import { memo } from 'react';
import Coin from './Coin';

/** Textos flutuantes ("+40 🪙") posicionados em coordenadas de tela. */
function FloatingMoney({ items }) {
  return (
    <>
      {items.map((f) => (
        <div
          key={f.id}
          className={`float-money float-${f.variant}`}
          style={{ left: f.x, top: f.y, animationDelay: `${f.delay ?? 0}ms` }}
        >
          {f.text}
          {f.coin && <Coin size="0.9em" />}
          {f.suffix}
        </div>
      ))}
    </>
  );
}

export default memo(FloatingMoney);
