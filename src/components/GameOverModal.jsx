import { RotateCcw, Store, Trophy } from 'lucide-react';
import { fmt } from '../game/format';
import RollingCounter from './RollingCounter';
import Coin from './Coin';

export default function GameOverModal({ open, score, sessionTotal, best, isRecord, onRestart, onShop }) {
  if (!open) return null;
  return (
    <div className="fade-in fixed inset-0 z-[75] flex items-center justify-center bg-black/65 p-5 backdrop-blur-md">
      <div className="sheet-in w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-center text-slate-100 shadow-2xl">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 shadow-lg shadow-amber-500/30">
          <Trophy size={28} />
        </div>
        <h2 className="text-2xl font-extrabold">Sem espaço!</h2>
        <p className="mt-1 text-sm text-slate-400">Nenhuma peça cabe no tabuleiro.</p>

        <div className="mt-5 rounded-2xl bg-white/5 p-4">
          <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Moedas na partida</div>
          <RollingCounter value={score} duration={1100} className="mt-1 text-4xl font-black text-amber-300" />
          {isRecord && score > 0 && (
            <div className="mt-1 text-xs font-bold tracking-wider text-amber-300 uppercase">✨ Novo recorde!</div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-2xl bg-white/5 px-3.5 py-3">
            <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Total na sessão</div>
            <div className="tabular mt-0.5 flex items-center gap-1.5 font-bold text-slate-100"><Coin /> {fmt(sessionTotal)}</div>
          </div>
          <div className="rounded-2xl bg-white/5 px-3.5 py-3">
            <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Recorde</div>
            <div className="tabular mt-0.5 flex items-center gap-1.5 font-bold text-slate-100"><Coin /> {fmt(best)}</div>
          </div>
        </div>

        <button
          onClick={onRestart}
          autoFocus
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-600 py-3.5 text-base font-extrabold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:brightness-110 active:scale-[.98]"
        >
          <RotateCcw size={18} /> Jogar de novo
        </button>
        <button
          onClick={onShop}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          <Store size={16} /> Loja / Níveis
        </button>
      </div>
    </div>
  );
}
