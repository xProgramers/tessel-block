import { Map as MapIcon, Play, Star, Store, Trophy, Volume2, VolumeX } from 'lucide-react';
import { LEVEL_COUNT, nextLevel } from '../game/adventure';
import { fmt } from '../game/format';
import Coin from './Coin';
import { t } from '../i18n';

/** Logotipo: um mini "tessel" de blocos com as cores do tema. */
function Logo({ palette }) {
  const tiles = [[0, 0, 0], [0, 1, 1], [1, 1, 2], [1, 2, 3], [2, 0, 4], [2, 2, 5], [0, 2, 6]];
  return (
    <div className="home-logo">
      <div className="home-logo-tiles">
        {tiles.map(([r, c, k]) => (
          <span key={`${r}${c}`} style={{ gridRow: r + 1, gridColumn: c + 1, background: palette[k % palette.length] }} />
        ))}
      </div>
      <h1>
        Tessel<span>Block</span>
      </h1>
    </div>
  );
}

/**
 * Menu inicial: escolhe o modo antes de jogar.
 * Clássico = partida livre (continua a partida salva); Aventura = abre o mapa de níveis.
 */
export default function HomeMenu({
  open, theme, balance, best, classicScore, advStars, muted, onToggleMute, onClassic, onAdventure, onShop,
}) {
  if (!open) return null;
  const next = nextLevel(advStars);
  const stars = advStars.reduce((a, b) => a + (b || 0), 0);
  const done = advStars.filter((s) => s > 0).length;
  return (
    <div className="home fade-in fixed inset-0 z-[79] flex flex-col" style={theme.vars}>
      <div className="safe-top flex items-center justify-between px-4 pt-3">
        <div className="home-chip">
          <Coin size="1.05em" /> <span className="money-text">{fmt(balance)}</span>
        </div>
        <button type="button" onClick={onToggleMute} className="home-icon-btn" aria-label={muted ? t('soundOn') : t('soundOff')}>
          {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-7 px-6">
        <Logo palette={theme.palette} />

        <div className="flex w-full max-w-sm flex-col gap-3.5">
          <button type="button" className="home-mode home-mode-classic" onClick={onClassic}>
            <span className="home-mode-icon"><Play size={24} fill="currentColor" /></span>
            <span className="min-w-0 flex-1 text-left">
              <span className="home-mode-title">{t('classic')}</span>
              <span className="home-mode-sub">
                {classicScore > 0 ? (
                  <>{t('continueGame', { score: fmt(classicScore) })}</>
                ) : (
                  <><Trophy size={12} /> {t('best', { score: fmt(best) })}</>
                )}
              </span>
            </span>
          </button>

          <button type="button" className="home-mode home-mode-adventure" onClick={onAdventure}>
            <span className="home-mode-icon"><MapIcon size={24} /></span>
            <span className="min-w-0 flex-1 text-left">
              <span className="home-mode-title">{t('adventure')}</span>
              <span className="home-mode-sub">
                {next ? t('level', { n: next }) : t('adventureDone')} · <Star size={12} fill="currentColor" /> {stars}/{LEVEL_COUNT * 3}
              </span>
              <span className="home-mode-bar"><span style={{ width: `${(done / LEVEL_COUNT) * 100}%` }} /></span>
            </span>
          </button>

          <button type="button" className="home-shop" onClick={onShop}>
            <Store size={17} /> {t('shopButton')}
          </button>
        </div>
      </div>

      <p className="safe-bottom px-4 pb-3 text-center text-[10.5px] opacity-60">
        {t('disclaimer')}
      </p>
    </div>
  );
}
