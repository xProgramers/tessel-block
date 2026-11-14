import { useEffect, useRef, useState } from 'react';
import { fmt } from '../game/format';
import Coin from './Coin';

/** Contador de moedas com animação de incremento (rolling counter). */
export default function RollingCounter({ value, className = '', duration = 750, coin = true }) {
  const spanRef = useRef(null);
  const shown = useRef(value);
  const raf = useRef(0);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    const from = shown.current;
    const to = value;
    if (from === to) return;
    if (to > from) setBump((b) => b + 1);
    const start = performance.now();
    cancelAnimationFrame(raf.current);
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      shown.current = from + (to - from) * e;
      if (spanRef.current) spanRef.current.textContent = fmt(shown.current);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return (
    <span key={bump} className={`tabular inline-flex items-center gap-[.28em] ${bump ? 'balance-bump' : ''} ${className}`}>
      {coin && <Coin size="0.82em" />}
      <span ref={spanRef}>{fmt(shown.current)}</span>
    </span>
  );
}
