import { useState } from 'react';
import {
  AudioLines, Candy, Check, Crown, Droplets, Flame, Gamepad2, Gem, Lock, Orbit, Palette, Play,
  Snowflake, Sparkles, Store, TreePine, Volume2, X, Zap, Hammer,
} from 'lucide-react';
import { THEMES } from '../game/themes';
import { SOUND_PACKS } from '../game/sounds';
import { coins, fmt } from '../game/format';
import Block from './Block';
import Coin from './Coin';
import RollingCounter from './RollingCounter';
import { t as tr } from '../i18n';

const ICONS = {
  minimal: Sparkles, candy: Candy, wood: TreePine, neon: Zap, pixel: Gamepad2,
  ice: Snowflake, lava: Flame, gold: Crown, cosmic: Orbit, emerald: Gem,
};

function Preview({ theme }) {
  const layout = [
    [0, 0, 0], [0, 1, 1], [1, 1, 1], [1, 2, 3], [2, 2, 3], [0, 3, 4], [1, 3, 4], [2, 3, 6],
  ];
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-xl"
      style={{ ...theme.vars, width: 84, height: 84, background: theme.vars['--bg'] }}
    >
      <div
        className="absolute inset-2 rounded-lg"
        style={{ background: 'var(--board-bg)', border: '1px solid var(--board-border)', boxShadow: 'var(--board-glow)' }}
      >
        <div className="relative grid h-full w-full grid-cols-4 grid-rows-4 p-[3px]">
          {Array.from({ length: 16 }, (_, i) => {
            const r = Math.floor(i / 4);
            const c = i % 4;
            const hit = layout.find(([rr, cc]) => rr === r && cc === c);
            return (
              <div key={i} className="relative">
                <div className="cell-empty" />
                {hit && <Block color={theme.palette[hit[2]]} variant={theme.block} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const SOUND_ICONS = { classic: AudioLines, wood: Hammer, bubble: Droplets, crystal: Gem };

export default function ShopModal({
  open, onClose, balance, owned, activeId, onBuy, onEquip,
  ownedSounds, activeSound, onBuySound, onEquipSound, onPreviewSound,
}) {
  const [tab, setTab] = useState('themes');
  if (!open) return null;
  return (
    <div className="fade-in fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onPointerDown={onClose}>
      <div
        className="sheet-in flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-3xl border border-white/10 bg-slate-900/95 text-slate-100 shadow-2xl sm:rounded-3xl"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/15 text-amber-300">
              <Store size={20} />
            </div>
            <div>
              <h2 className="text-lg leading-tight font-bold">{tr('shop')}</h2>
              <p className="text-xs text-slate-400">
                {tab === 'themes'
                  ? tr('themesCount', { owned: owned.length, total: THEMES.length })
                  : tr('soundsCount', { owned: ownedSounds.length, total: SOUND_PACKS.length })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-slate-300 transition hover:bg-white/10" aria-label={tr('close')}>
            <X size={18} />
          </button>
        </div>

        <div className="mx-5 mb-3 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-2.5">
          <span className="text-sm text-slate-400">{tr('yourCoins')}</span>
          <RollingCounter value={balance} className="text-lg font-extrabold text-amber-300" />
        </div>

        <div className="mx-5 mb-3 grid grid-cols-2 gap-1 rounded-2xl bg-white/5 p-1" role="tablist">
          {[
            { id: 'themes', label: tr('tabThemes'), Icon: Palette },
            { id: 'sounds', label: tr('tabSounds'), Icon: Volume2 },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold transition ${
                tab === id ? 'bg-white/15 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        <div className="scroll-thin flex flex-col gap-3 overflow-y-auto px-5 pb-5" style={{ touchAction: 'pan-y' }}>
          {tab === 'themes' && (
          <>
          {THEMES.map((t) => {
            const Icon = ICONS[t.id];
            const isOwned = owned.includes(t.id);
            const isActive = activeId === t.id;
            const canAfford = balance >= t.price;
            return (
              <div
                key={t.id}
                className={`flex items-center gap-3.5 rounded-2xl border p-3 transition ${
                  isActive ? 'border-emerald-400/60 bg-emerald-400/[.07]' : 'border-white/10 bg-white/[.03]'
                }`}
              >
                <Preview theme={t} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    <Icon size={12} /> {tr('shopLevel', { n: t.level })}
                  </div>
                  <div className="truncate text-[15px] leading-tight font-bold">{tr(`theme.${t.id}.name`)}</div>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-400">{tr(`theme.${t.id}.tagline`)}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[11px] font-bold text-amber-300">
                      {tr('earnings', { mult: t.mult })}
                    </span>
                    {!isOwned && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                        {t.price ? <><Coin /> {fmt(t.price)}</> : tr('free')}
                      </span>
                    )}
                  </div>
                </div>
                <ActionButton
                  isActive={isActive}
                  isOwned={isOwned}
                  canAfford={canAfford}
                  missing={t.price - balance}
                  onEquip={() => onEquip(t.id)}
                  onBuy={() => onBuy(t.id)}
                />
              </div>
            );
          })}
          </>
          )}

          {tab === 'sounds' && (
            <>
              <p className="px-1 text-xs leading-snug text-slate-400">
                {tr('soundsIntro').split('{play}')[0]}<Play size={11} className="inline -mt-0.5" />{tr('soundsIntro').split('{play}')[1]}
              </p>
              {SOUND_PACKS.map((s) => {
                const Icon = SOUND_ICONS[s.id];
                const isOwned = ownedSounds.includes(s.id);
                const isActive = activeSound === s.id;
                const canAfford = balance >= s.price;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3.5 rounded-2xl border p-3 transition ${
                      isActive ? 'border-emerald-400/60 bg-emerald-400/[.07]' : 'border-white/10 bg-white/[.03]'
                    }`}
                  >
                    <button
                      onClick={() => onPreviewSound(s.id)}
                      className="group relative grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-400/25 to-violet-500/25 text-sky-200 transition hover:brightness-125 active:scale-90"
                      aria-label={tr('listenTo', { name: tr(`sound.${s.id}.name`) })}
                      title={tr('listen')}
                    >
                      <Icon size={22} className="transition group-hover:opacity-0" />
                      <Play size={22} className="absolute opacity-0 transition group-hover:opacity-100" fill="currentColor" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] leading-tight font-bold">{tr(`sound.${s.id}.name`)}</div>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-400">{tr(`sound.${s.id}.tagline`)}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <button
                          onClick={() => onPreviewSound(s.id)}
                          className="flex items-center gap-1 rounded-md bg-sky-400/15 px-1.5 py-0.5 text-[11px] font-bold text-sky-300 transition hover:bg-sky-400/25"
                        >
                          <Volume2 size={11} /> {tr('listen')}
                        </button>
                        {!isOwned && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                            {s.price ? <><Coin /> {fmt(s.price)}</> : tr('free')}
                          </span>
                        )}
                      </div>
                    </div>
                    <ActionButton
                      isActive={isActive}
                      isOwned={isOwned}
                      canAfford={canAfford}
                      missing={s.price - balance}
                      onEquip={() => onEquipSound(s.id)}
                      onBuy={() => onBuySound(s.id)}
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ isActive, isOwned, canAfford, missing, onEquip, onBuy }) {
  return (
    <div className="shrink-0">
      {isActive ? (
        <span className="flex items-center gap-1 rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-300">
          <Check size={14} /> {tr('equipped')}
        </span>
      ) : isOwned ? (
        <button
          onClick={onEquip}
          className="rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold transition hover:bg-white/20 active:scale-95"
        >
          {tr('equip')}
        </button>
      ) : (
        <button
          disabled={!canAfford}
          onClick={onBuy}
          className={`flex flex-col items-center rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
            canAfford
              ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 shadow-lg shadow-amber-500/25 hover:brightness-110'
              : 'cursor-not-allowed bg-white/5 text-slate-500'
          }`}
        >
          <span className="flex items-center gap-1">
            {canAfford ? <Sparkles size={13} /> : <Lock size={13} />} {tr('unlock')}
          </span>
          {!canAfford && <span className="text-[10px] font-medium">{tr('missing', { coins: coins(missing) })}</span>}
        </button>
      )}
    </div>
  );
}
