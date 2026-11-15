import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Play, Star } from 'lucide-react';
import TesselGem from './TesselGem';
import { chapterOf, isBoss, isUnlocked, LEVEL_COUNT, nextLevel } from '../game/adventure';

/*
 * Mosaico da Aventura: os 100 níveis são os "ladrilhos" de uma joia lapidada.
 * Larguras das fileiras, de cima para baixo, numa grade de 10 colunas (soma = 100).
 * O nível 1 fica na ponta de baixo e a numeração sobe em zigue-zague (cobrinha), então
 * cada nível vencido "pinta" o ladrilho com a cor do capítulo e a joia vai aparecendo.
 */
const ROWS = [4, 6, 8, 10, 10, 10, 10, 10, 8, 8, 6, 4, 4, 2];
const COLS = 10;

/** Posição (linha, coluna) de cada nível no mosaico. Exportado para os testes. */
export function mosaicLayout() {
  const cells = [];
  let n = 1;
  for (let i = ROWS.length - 1, k = 0; i >= 0; i--, k++) {
    const w = ROWS[i];
    const start = (COLS - w) / 2;
    const cols = Array.from({ length: w }, (_, j) => start + j);
    if (k % 2) cols.reverse(); // cobrinha: uma fileira vai, a outra volta
    cols.forEach((c) => cells.push({ n: n++, row: i, col: c }));
  }
  return cells;
}
const LAYOUT = mosaicLayout();

/**
 * Mapa do modo Aventura. Toque num nível liberado para escolhê-lo e em "Jogar" para começar.
 */
export default function AdventureMap({ open, stars, onClose, onPlay }) {
  const current = nextLevel(stars) ?? LEVEL_COUNT;
  // Nada selecionado ao abrir: o botão de jogar só aparece depois de tocar num nível
  const [selected, setSelected] = useState(null);
  const total = useMemo(() => stars.reduce((a, b) => a + (b || 0), 0), [stars]);
  const done = stars.filter((s) => s > 0).length;

  // Cada vez que abre, limpa a seleção
  useEffect(() => {
    if (open) setSelected(null);
  }, [open]);

  if (!open) return null;

  return (
    <div className="adv-map fade-in fixed inset-0 z-[78] flex flex-col">
      <header className="safe-top adv-map-header flex items-center gap-3 px-4 pb-2">
        <button type="button" onClick={onClose} className="adv-icon-btn" aria-label="Voltar ao menu">
          <ChevronLeft size={22} />
        </button>
        <h2 className="flex-1 text-xl font-black tracking-tight">Aventura</h2>
        <div className="adv-total flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold">
          <Star size={15} className="adv-star-on" fill="currentColor" /> {total}/{LEVEL_COUNT * 3}
        </div>
      </header>

      <div className="scroll-thin flex flex-1 flex-col items-center overflow-y-auto px-4 pb-24" style={{ touchAction: 'pan-y' }}>
        <TesselGem stars={stars} />
        <p className="adv-caption">
          {done === LEVEL_COUNT ? 'Joia conquistada!' : `Vença os ${LEVEL_COUNT} níveis para conquistar a joia`}
          <span>{done}/{LEVEL_COUNT} níveis</span>
        </p>

        <div
          className="mosaic"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS.length}, 1fr)` }}
        >
          {LAYOUT.map(({ n, row, col }) => {
            const s = stars[n - 1] || 0;
            const unlocked = isUnlocked(stars, n);
            const chapter = chapterOf(n);
            const cls = [
              'tile',
              s > 0 ? 'is-done' : unlocked ? 'is-open' : 'is-locked',
              n === current && 'is-current',
              n === selected && 'is-selected',
              (row + col) % 2 ? 'facet-a' : 'facet-b',
            ].filter(Boolean).join(' ');
            return (
              <button
                key={n}
                type="button"
                className={cls}
                style={{ gridRow: row + 1, gridColumn: col + 1, '--c': chapter.from }}
                disabled={!unlocked}
                onClick={() => setSelected(n)}
                onDoubleClick={() => onPlay(n)}
                aria-label={`Nível ${n}${s ? `, ${s} estrelas` : unlocked ? '' : ', bloqueado'}`}
              >
                {isBoss(n) && <i className="tile-boss" />}
                <span className="tile-num">{n}</span>
                {s > 0 && (
                  <span className="tile-stars">
                    {[1, 2, 3].map((i) => <i key={i} className={i <= s ? 'on' : ''} />)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {selected != null && (
        <div className="safe-bottom adv-cta-wrap px-5 pt-3">
          <button type="button" className="adv-cta adv-cta-in" onClick={() => onPlay(selected)}>
            <Play size={18} fill="currentColor" /> Jogar nível {selected}
            {isBoss(selected) && <span className="adv-cta-replay">chefão</span>}
            {stars[selected - 1] > 0 && <span className="adv-cta-replay">de novo</span>}
          </button>
        </div>
      )}
    </div>
  );
}
