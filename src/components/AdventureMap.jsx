import { useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, Lock, Play, Star } from 'lucide-react';
import {
  CHAPTERS, isBoss, isUnlocked, LEVEL_COUNT, LEVELS_PER_CHAPTER, levelConfig, nextLevel,
} from '../game/adventure';

/** Deslocamento horizontal da trilha (zigue-zague suave), em % da largura. */
const sway = (n) => Math.sin(n * 0.95) * 30;

function Stars({ count, size = 12 }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= count ? 'adv-star-on' : 'adv-star-off'}
          fill="currentColor"
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function LevelNode({ n, stars, unlocked, current, onPlay }) {
  const { chapter } = levelConfig(n);
  const boss = isBoss(n);
  const done = stars > 0;
  return (
    <div className="adv-row" style={{ transform: `translateX(${sway(n)}%)` }}>
      <button
        type="button"
        disabled={!unlocked}
        onClick={() => onPlay(n)}
        data-current={current || undefined}
        className={['adv-node', boss && 'adv-boss', current && 'adv-current', !unlocked && 'adv-locked'].filter(Boolean).join(' ')}
        style={{ '--from': chapter.from, '--to': chapter.to }}
        aria-label={`Nível ${n}${unlocked ? '' : ' (bloqueado)'}`}
      >
        {boss && <span className="adv-crown">👑</span>}
        {unlocked ? <span className="adv-num">{n}</span> : <Lock size={boss ? 22 : 18} />}
      </button>
      <div className="adv-node-stars">{done && <Stars count={stars} />}</div>
    </div>
  );
}

/**
 * Mapa do modo Aventura: trilha de 100 níveis subindo pelos capítulos (o nível 1 fica
 * embaixo). Cada capítulo tem cor e nome próprios; a cada 10 níveis há um chefão.
 */
export default function AdventureMap({ open, stars, onClose, onPlay }) {
  const scrollRef = useRef(null);
  const current = nextLevel(stars) ?? LEVEL_COUNT;
  const total = useMemo(() => stars.reduce((a, b) => a + (b || 0), 0), [stars]);

  // Ao abrir, rola até o nível atual
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current?.querySelector('[data-current]');
    el?.scrollIntoView({ block: 'center' });
  }, [open]);

  if (!open) return null;

  const chapters = CHAPTERS.map((ch, ci) => {
    const first = ci * LEVELS_PER_CHAPTER + 1;
    const levels = Array.from({ length: LEVELS_PER_CHAPTER }, (_, i) => first + i);
    const got = levels.reduce((a, n) => a + (stars[n - 1] || 0), 0);
    return { ...ch, first, levels, got, locked: !isUnlocked(stars, first) };
  });

  return (
    <div className="adv-map fade-in fixed inset-0 z-[78] flex flex-col">
      <header className="safe-top adv-map-header flex items-center gap-3 px-4 pb-3">
        <button type="button" onClick={onClose} className="adv-icon-btn" aria-label="Voltar">
          <ChevronLeft size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black tracking-tight">Aventura</h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Bata a meta de pontos para avançar</p>
        </div>
        <div className="adv-total flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold">
          <Star size={15} className="adv-star-on" fill="currentColor" /> {total}/{LEVEL_COUNT * 3}
        </div>
      </header>

      <div ref={scrollRef} className="adv-scroll scroll-thin flex-1 overflow-y-auto" style={{ touchAction: 'pan-y' }}>
        <div className="adv-trophy">
          <div className={`adv-trophy-cup ${stars[LEVEL_COUNT - 1] > 0 ? 'is-won' : ''}`}>🏆</div>
          <p>Complete os 100 níveis e conquiste a Taça Tessel</p>
        </div>
        {/* capítulos de cima (último) para baixo (primeiro) */}
        {chapters.slice().reverse().map((ch) => (
          <section
            key={ch.name}
            className={`adv-chapter ${ch.locked ? 'is-locked' : ''}`}
            style={{ '--from': ch.from, '--to': ch.to }}
          >
            <div className="adv-levels">
              {ch.levels.slice().reverse().map((n) => (
                <LevelNode
                  key={n}
                  n={n}
                  stars={stars[n - 1] || 0}
                  unlocked={isUnlocked(stars, n)}
                  current={n === current}
                  onPlay={onPlay}
                />
              ))}
            </div>
            <div className="adv-banner">
              <span className="adv-banner-icon">{ch.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="adv-banner-name">{ch.name}</div>
                <div className="adv-banner-sub">Níveis {ch.first}–{ch.first + LEVELS_PER_CHAPTER - 1}</div>
              </div>
              <div className="adv-banner-stars">
                <Star size={13} fill="currentColor" /> {ch.got}/{LEVELS_PER_CHAPTER * 3}
              </div>
            </div>
          </section>
        ))}
        <div className="h-28" />
      </div>

      <div className="safe-bottom adv-cta-wrap px-5 pt-3">
        <button type="button" className="adv-cta" onClick={() => onPlay(current)}>
          <Play size={20} fill="currentColor" /> Jogar nível {current}
        </button>
      </div>
    </div>
  );
}
