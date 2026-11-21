import { CHAPTERS, LEVELS_PER_CHAPTER } from '../game/adventure';
import { t } from '../i18n';

/*
 * Joia Tessel: diamante lapidado em 10 facetas, uma por capítulo da Aventura.
 * Cada capítulo completo acende a sua faceta com a cor dele; com os 100 níveis
 * vencidos a joia inteira brilha. Antes disso fica em "vidro fosco" (cinza).
 */
const G = [[8, 62], [54, 62], [100, 62], [146, 62], [192, 62]]; // cintura (girdle)
const T = [[58, 18], [100, 18], [142, 18]]; // mesa (topo)
const C = [100, 168]; // ponta (culet)

// Facetas na ordem dos capítulos: pavilhão (de baixo) primeiro, depois a coroa.
const FACETS = [
  [G[0], G[1], C],
  [G[1], G[2], C],
  [G[2], G[3], C],
  [G[3], G[4], C],
  [G[0], T[0], G[1]],
  [T[0], T[1], G[1]],
  [T[1], G[1], G[2]],
  [T[1], G[2], G[3]],
  [T[1], T[2], G[3]],
  [T[2], G[4], G[3]],
];
const pts = (poly) => poly.map((p) => p.join(',')).join(' ');

export default function TesselGem({ stars, size = 132 }) {
  const chapterDone = CHAPTERS.map((_, ci) =>
    Array.from({ length: LEVELS_PER_CHAPTER }, (__, i) => stars[ci * LEVELS_PER_CHAPTER + i] > 0).every(Boolean),
  );
  const complete = chapterDone.every(Boolean);
  const lit = chapterDone.filter(Boolean).length;

  return (
    <div className={`gem ${complete ? 'is-complete' : ''}`} style={{ width: size }}>
      <svg viewBox="0 0 200 176" aria-label={complete ? t('gemAria') : t('gemAriaProgress', { lit })}>
        <defs>
          <linearGradient id="gem-shine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".55" />
            <stop offset=".45" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {FACETS.map((poly, i) => {
          const on = chapterDone[i];
          const c = CHAPTERS[i];
          return (
            <polygon
              key={i}
              points={pts(poly)}
              className={on ? 'gem-facet is-on' : 'gem-facet'}
              style={on ? { fill: i % 2 ? c.from : c.to } : undefined}
            />
          );
        })}
        {/* brilho por cima de tudo + contorno fino */}
        <polygon points={pts([G[0], T[0], T[2], G[4], C])} fill="url(#gem-shine)" className="gem-shine" />
        <polygon points={pts([G[0], T[0], T[2], G[4], C])} className="gem-outline" />
        <polyline points={pts(G)} className="gem-outline" />
      </svg>
      {complete && (
        <>
          <i className="gem-spark" style={{ top: '6%', left: '14%' }} />
          <i className="gem-spark" style={{ top: '18%', right: '6%', animationDelay: '.6s' }} />
          <i className="gem-spark" style={{ bottom: '18%', left: '30%', animationDelay: '1.1s' }} />
        </>
      )}
    </div>
  );
}
