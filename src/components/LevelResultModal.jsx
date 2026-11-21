import { ChevronRight, Map, RotateCcw, Star } from 'lucide-react';
import { fmt } from '../game/format';
import Coin from './Coin';
import { t } from '../i18n';

/**
 * Fim de um nível da Aventura.
 * result: { n, won, stars, points, target, reward, last }
 */
export default function LevelResultModal({ result, onNext, onRetry, onMap }) {
  if (!result) return null;
  const { n, won, stars, points, target, reward, last } = result;
  const pct = Math.min(100, Math.round((points / target) * 100));
  return (
    <div className="fade-in fixed inset-0 z-[76] flex items-center justify-center bg-black/65 p-5 backdrop-blur-md">
      <div className="sheet-in w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-center text-slate-100 shadow-2xl">
        <div className="text-xs font-bold tracking-[.2em] text-slate-400 uppercase">{t('level', { n })}</div>
        <h2 className={`mt-1 text-3xl font-black ${won ? 'text-amber-300' : ''}`}>
          {won ? (last ? t('adventureComplete') : t('levelComplete')) : t('noSpaceTitle')}
        </h2>

        {won ? (
          <div className="result-stars mt-4 flex items-end justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                size={i === 2 ? 58 : 46}
                className={i <= stars ? 'adv-star-on result-star' : 'adv-star-off'}
                style={{ animationDelay: `${150 + i * 220}ms` }}
                fill="currentColor"
                strokeWidth={1.2}
              />
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-slate-400">{t('noPieceFits')}</p>
        )}

        <div className="mt-5 rounded-2xl bg-white/5 p-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold text-slate-400">{t('points')}</span>
            <span className="tabular font-black">{fmt(points)} / {fmt(target)}</span>
          </div>
          <div className="adv-progress mt-2"><div style={{ width: `${pct}%` }} /></div>
          {won && reward > 0 && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-lg font-black text-amber-300">
              +{fmt(reward)} <Coin size="0.95em" /> {t('rewardSuffix')}
            </div>
          )}
          {won && stars < 3 && (
            <p className="mt-2 text-xs text-slate-400">{t('moreStarsHint')}</p>
          )}
        </div>

        {won && !last ? (
          <button type="button" autoFocus onClick={onNext} className="result-primary mt-5">
            {t('nextLevel')} <ChevronRight size={19} />
          </button>
        ) : (
          <button type="button" autoFocus onClick={onRetry} className="result-primary mt-5">
            <RotateCcw size={18} /> {won ? t('playAgain') : t('tryAgain')}
          </button>
        )}
        <div className={`mt-2.5 grid gap-2.5 ${won && !last ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {won && !last && (
            <button type="button" onClick={onRetry} className="result-secondary"><RotateCcw size={15} /> {t('replay')}</button>
          )}
          <button type="button" onClick={onMap} className="result-secondary">
            <Map size={15} /> {t('map')}
          </button>
        </div>
      </div>
    </div>
  );
}
