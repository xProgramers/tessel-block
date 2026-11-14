import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Coins, Flame, RotateCcw, Store, Volume2, VolumeX } from 'lucide-react';
import Board from './components/Board';
import PieceTray from './components/PieceTray';
import FloatingMoney from './components/FloatingMoney';
import ShopModal from './components/ShopModal';
import GameOverModal from './components/GameOverModal';
import ParticleCanvas from './components/ParticleCanvas';
import RollingCounter from './components/RollingCounter';
import { PieceShape } from './components/Block';
import { sound } from './audio/soundEngine';
import { haptic, onAppPause, onBackButton, setSystemBarsForTheme } from './native';
import {
  anyFit, canPlace, clearLines, emptyGrid, findFullLines, generateSet, isBoardEmpty, placePiece,
} from './game/logic';
import { getTheme, THEME_IDS, THEMES } from './game/themes';
import { fmt, load, loadSave, save, SAVE_KEY, writeSave } from './game/format';
import { computeGain, ECONOMY } from './game/economy';
import { SOUND_IDS, SOUND_PACKS } from './game/sounds';

export default function App() {
  const [initial] = useState(() => loadSave(THEME_IDS, SOUND_IDS));
  const [ownedSounds, setOwnedSounds] = useState(initial.data.sounds);
  const [soundId, setSoundId] = useState(initial.data.sound);
  const [grid, setGrid] = useState(emptyGrid);
  const [pieces, setPieces] = useState(() => generateSet(emptyGrid()));
  const [balance, setBalance] = useState(initial.data.balance);
  const [owned, setOwned] = useState(initial.data.owned);
  const [themeId, setThemeId] = useState(initial.data.theme);
  const [muted, setMuted] = useState(() => load('bc_muted', false));
  const [best, setBest] = useState(initial.data.best);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [score, setScore] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isRecord, setIsRecord] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [drag, setDrag] = useState(null);
  const [hover, setHover] = useState(null);
  const [floats, setFloats] = useState([]);
  const [clearFx, setClearFx] = useState([]);
  const [lastStamp, setLastStamp] = useState(0);

  const theme = getTheme(themeId);

  const boardRef = useRef(null);
  const dragElRef = useRef(null);
  const shakeRef = useRef(null);
  const particlesRef = useRef(null);
  const dragData = useRef(null);
  const uid = useRef(1);
  const gameOverTimer = useRef(0);

  // Estado mais recente para handlers de ponteiro (evita closures obsoletas)
  const state = useRef({});
  state.current = { grid, pieces, streak, missCount, theme, score, best, gameOver, balance, owned, ownedSounds };

  // Progresso salvo num registro assinado único (ver format.js)
  useEffect(() => {
    writeSave({ balance, owned, theme: themeId, best, sounds: ownedSounds, sound: soundId });
  }, [balance, owned, themeId, best, ownedSounds, soundId]);

  useEffect(() => sound.setPlacePack(soundId), [soundId]);

  useEffect(() => {
    if (initial.tampered) console.warn('[Tessel Block] Save inválido ou editado — progresso reiniciado.');
  }, [initial]);

  // Várias abas abertas: sincroniza o progresso para impedir gastar o mesmo saldo duas vezes
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== SAVE_KEY) return;
      const { data, tampered } = loadSave(THEME_IDS, SOUND_IDS);
      if (tampered) return;
      setBalance(data.balance);
      setOwned((o) => (o.join() === data.owned.join() ? o : data.owned));
      setThemeId(data.theme);
      setBest(data.best);
      setOwnedSounds((o) => (o.join() === data.sounds.join() ? o : data.sounds));
      setSoundId(data.sound);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    save('bc_muted', muted);
    sound.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.vars['--panel']);
    setSystemBarsForTheme(Boolean(theme.light)); // ícones da barra de status legíveis no tema
  }, [theme]);

  // Ganchos de depuração apenas em desenvolvimento
  useEffect(() => {
    if (import.meta.env.DEV) window.__game = { setGrid, setBalance, setPieces, setThemeId, setOwned };
  }, []);

  const fits = useMemo(() => pieces.map((p) => (p ? anyFit(grid, p) : false)), [grid, pieces]);

  const addFloats = (items) => {
    const withIds = items.map((i) => ({ ...i, id: uid.current++ }));
    const ids = new Set(withIds.map((i) => i.id));
    setFloats((f) => [...f, ...withIds]);
    setTimeout(() => setFloats((f) => f.filter((x) => !ids.has(x.id))), 1200);
  };

  const screenShake = (amp) => {
    const el = shakeRef.current;
    if (!el) return;
    el.style.setProperty('--shake', `${amp}px`);
    el.classList.remove('shake');
    void el.offsetWidth; // reinicia a animação
    el.classList.add('shake');
  };

  /* ---------------- Encaixe e pontuação ---------------- */
  const place = (index, row, col) => {
    const { grid, pieces, streak, missCount, theme, score, best } = state.current;
    const piece = pieces[index];
    if (!piece || !canPlace(grid, piece, row, col)) return;

    const stamp = uid.current++;
    let g = placePiece(grid, piece, row, col, stamp);
    const { rows, cols } = findFullLines(g);
    const lines = rows.length + cols.length;
    let newStreak = streak;
    let newMiss = missCount;
    const rect = boardRef.current.getBoundingClientRect();
    const cs = rect.width / 8;
    const mult = theme.mult;
    if (lines) {
      newStreak = streak + 1;
      newMiss = 0;
    } else {
      newMiss = missCount + 1;
      if (newMiss >= ECONOMY.streakGrace) newStreak = 0;
    }
    const allClear = lines > 0 && isBoardEmpty(clearLines(g, rows, cols));
    const reward = computeGain({ blocks: piece.cells.length, lines, streak: newStreak, allClear, mult });

    const placeGain = reward.place;
    const gain = reward.total;
    const fl = [{
      x: rect.left + (col + piece.w / 2) * cs,
      y: rect.top + (row + piece.h / 2) * cs,
      text: `+${fmt(placeGain)}`,
      coin: true,
      variant: 'green',
    }];

    sound.place(piece.cells.length);
    haptic(lines >= 2 ? 'heavy' : lines ? 'medium' : 'light');
    sound.coin(piece.cells.length);

    if (lines) {
      const lineGain = reward.clear;
      const cleared = new Map();
      rows.forEach((r) => { for (let c = 0; c < 8; c++) cleared.set(`${r},${c}`, [r, c]); });
      cols.forEach((c) => { for (let r = 0; r < 8; r++) cleared.set(`${r},${c}`, [r, c]); });

      const pr = row + piece.h / 2;
      const pc = col + piece.w / 2;
      const fx = [];
      let sx = 0;
      let sy = 0;
      const big = lines >= 2;
      cleared.forEach(([r, c]) => {
        const cell = g[r][c];
        const delay = Math.round(Math.hypot(r + 0.5 - pr, c + 0.5 - pc) * 30);
        fx.push({ id: uid.current++, r, c, color: cell.color, delay });
        const x = rect.left + (c + 0.5) * cs;
        const y = rect.top + (r + 0.5) * cs;
        sx += x;
        sy += y;
        const colors = [theme.palette[cell.color], ...theme.particles];
        setTimeout(() => particlesRef.current?.burst(x, y, colors, big ? 9 : 6, big ? 1.25 : 1), delay + 90);
      });

      g = clearLines(g, rows, cols);

      const cx = sx / cleared.size;
      const cy = sy / cleared.size;
      fl.push({ x: cx, y: cy, text: `+${fmt(lineGain)}`, coin: true, suffix: '🔥', variant: 'gold', delay: 70 });
      const labels = [];
      if (lines >= 2) labels.push(`Combo ${lines}x`);
      if (newStreak >= 2) labels.push(`Streak ${newStreak}`);
      if (allClear) labels.push('Tabuleiro limpo!');
      if (labels.length) fl.push({ x: cx, y: cy - cs * 1.1, text: labels.join(' · '), variant: 'label', delay: 140 });

      const fxIds = new Set(fx.map((f) => f.id));
      setClearFx((f) => [...f, ...fx]);
      setTimeout(() => setClearFx((f) => f.filter((x) => !fxIds.has(x.id))), 1000);

      setTimeout(() => sound.coinShower(Math.min(lines + newStreak - 1 + (allClear ? 2 : 0), 6)), 60);
      if (big || allClear) screenShake(Math.min(2 + lines * 1.6, 9));
    }

    let next = pieces.map((p, i) => (i === index ? null : p));
    if (next.every((p) => !p)) {
      next = generateSet(g);
      setTimeout(() => sound.newSet(), 160);
    }

    setGrid(g);
    setPieces(next);
    setStreak(newStreak);
    setMissCount(newMiss);
    setLastStamp(stamp);
    setBalance((b) => b + gain);
    setScore((s) => s + gain);
    setSessionTotal((s) => s + gain);
    addFloats(fl);

    if (!next.some((p) => p && anyFit(g, p))) {
      const finalScore = score + gain;
      clearTimeout(gameOverTimer.current);
      gameOverTimer.current = setTimeout(() => {
        setIsRecord(finalScore > best);
        setBest((b) => Math.max(b, finalScore));
        setGameOver(true);
        sound.gameOver();
        haptic('heavy');
      }, 750);
    }
  };
  const placeRef = useRef(place);
  placeRef.current = place;

  /* ---------------- Drag & drop (mouse + touch) ---------------- */
  const positionDrag = useCallback(() => {
    const d = dragData.current;
    if (!d) return;
    const left = d.x - d.w / 2;
    const top = d.touch ? d.y - d.h - d.cs * 0.9 : d.y - d.h / 2;
    if (dragElRef.current) dragElRef.current.style.transform = `translate3d(${left}px, ${top}px, 0)`;

    const fx = (left - d.rect.left) / d.cs;
    const fy = (top - d.rect.top) / d.cs;
    const g = state.current.grid;
    const candidates = [
      [Math.round(fy), Math.round(fx)],
      [Math.floor(fy), Math.floor(fx)], [Math.floor(fy), Math.ceil(fx)],
      [Math.ceil(fy), Math.floor(fx)], [Math.ceil(fy), Math.ceil(fx)],
    ];
    let found = null;
    for (const [r, c] of candidates) {
      if (Math.abs(r - fy) < 0.8 && Math.abs(c - fx) < 0.8 && canPlace(g, d.piece, r, c)) {
        found = [r, c];
        break;
      }
    }
    d.overBoard = fx > -d.piece.w && fx < 8 && fy > -d.piece.h && fy < 8;
    const key = found ? found.join(',') : 'none';
    if (key === d.key) return;
    d.key = key;
    if (!found) {
      d.target = null;
      setHover(null);
      return;
    }
    const [row, col] = found;
    const { rows, cols } = findFullLines(placePiece(g, d.piece, row, col, 0));
    d.target = { row, col };
    setHover({
      cells: new Set(d.piece.cells.map(([r, c]) => `${row + r},${col + c}`)),
      rows,
      cols,
      color: d.piece.color,
    });
  }, []);

  const onMove = useCallback((e) => {
    const d = dragData.current;
    if (!d || e.pointerId !== d.id) return;
    d.x = e.clientX;
    d.y = e.clientY;
    positionDrag();
  }, [positionDrag]);

  const onUp = useCallback((e) => {
    const d = dragData.current;
    if (!d || e.pointerId !== d.id) return;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    dragData.current = null;
    setDrag(null);
    setHover(null);
    if (d.target && e.type === 'pointerup') placeRef.current(d.index, d.target.row, d.target.col);
    else if (d.overBoard) sound.invalid();
  }, [onMove]);

  const onPointerDown = useCallback((index, e) => {
    const s = state.current;
    if (dragData.current || s.gameOver) return;
    const piece = s.pieces[index];
    if (!piece) return;
    e.preventDefault();
    sound.unlock();
    sound.pick();
    const rect = boardRef.current.getBoundingClientRect();
    const cs = rect.width / 8;
    dragData.current = {
      id: e.pointerId, index, piece, cs, rect,
      w: piece.w * cs, h: piece.h * cs,
      touch: e.pointerType !== 'mouse',
      x: e.clientX, y: e.clientY,
      key: null, target: null, overBoard: false,
    };
    setDrag({ index, piece, cs });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }, [onMove, onUp]);

  // Posiciona a peça arrastada assim que ela é montada
  useLayoutEffect(() => {
    if (drag) positionDrag();
  }, [drag, positionDrag]);

  useEffect(() => () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
  }, [onMove, onUp]);

  // Trocar de app/aba no meio do arraste não pode deixar a peça "presa" no cursor
  useEffect(() => {
    const cancel = () => {
      const d = dragData.current;
      if (d) onUp({ pointerId: d.id, type: 'pointercancel' });
    };
    const onVisibility = () => document.hidden && cancel();
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [onUp]);

  // Android: botão "voltar" fecha o que estiver aberto; sem nada aberto, minimiza o app
  const uiRef = useRef({});
  uiRef.current = { shopOpen, confirmRestart };
  useEffect(() => onBackButton(() => {
    if (dragData.current) {
      onUp({ pointerId: dragData.current.id, type: 'pointercancel' });
      return true;
    }
    if (uiRef.current.shopOpen) {
      setShopOpen(false);
      return true;
    }
    if (uiRef.current.confirmRestart) {
      setConfirmRestart(false);
      return true;
    }
    return false;
  }), [onUp]);

  // Android: app em segundo plano → silencia o áudio (volta no próximo toque)
  useEffect(() => onAppPause(() => sound.suspend()), []);

  /* ---------------- Ações ---------------- */
  const restart = () => {
    // Cancela um "game over" agendado da partida anterior (senão a nova partida terminaria sozinha)
    clearTimeout(gameOverTimer.current);
    if (dragData.current) onUp({ pointerId: dragData.current.id, type: 'pointercancel' });
    setBest((b) => Math.max(b, state.current.score));
    setConfirmRestart(false);
    const g = emptyGrid();
    setGrid(g);
    setPieces(generateSet(g));
    setScore(0);
    setStreak(0);
    setMissCount(0);
    setGameOver(false);
    setIsRecord(false);
    setClearFx([]);
    sound.unlock();
    sound.newSet();
  };

  // Botão de reiniciar no meio da partida pede confirmação (toque duplo)
  const askRestart = () => {
    if (confirmRestart || gameOver || state.current.score === 0) return restart();
    setConfirmRestart(true);
  };
  useEffect(() => {
    if (!confirmRestart) return;
    const t = setTimeout(() => setConfirmRestart(false), 2500);
    return () => clearTimeout(t);
  }, [confirmRestart]);

  const buy = (id) => {
    const t = THEMES.find((x) => x.id === id);
    const { owned, balance } = state.current; // valores mais recentes (evita compra dupla em cliques rápidos)
    if (!t || owned.includes(id) || balance < t.price) return;
    state.current = { ...state.current, owned: [...owned, id], balance: balance - t.price };
    setBalance((b) => b - t.price);
    setOwned((o) => [...o, id]);
    setThemeId(id);
    sound.unlock();
    sound.purchase();
    haptic('medium');
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    particlesRef.current?.burst(cx, cy, t.particles, 70, 1.6);
    screenShake(5);
  };

  const equip = (id) => {
    if (!owned.includes(id)) return;
    setThemeId(id);
    sound.unlock();
    sound.equip();
  };

  const buySound = (id) => {
    const s = SOUND_PACKS.find((x) => x.id === id);
    const { ownedSounds, balance } = state.current;
    if (!s || ownedSounds.includes(id) || balance < s.price) return;
    state.current = { ...state.current, ownedSounds: [...ownedSounds, id], balance: balance - s.price };
    setBalance((b) => b - s.price);
    setOwnedSounds((o) => [...o, id]);
    setSoundId(id);
    sound.unlock();
    sound.purchase();
    haptic('medium');
    particlesRef.current?.burst(window.innerWidth / 2, window.innerHeight / 2, theme.particles, 50, 1.4);
  };

  const equipSound = (id) => {
    if (!ownedSounds.includes(id)) return;
    setSoundId(id);
    sound.previewPlace(id);
  };

  const toggleMute = () => {
    sound.unlock();
    setMuted((m) => !m);
  };

  return (
    <div className="app-root font-sans" style={theme.vars}>
      <div ref={shakeRef} className="mx-auto flex h-full w-full flex-col items-center">
        {/* Cabeçalho */}
        <header
          className="safe-top flex items-center justify-between gap-2 pb-1"
          style={{ width: 'max(min(100% - 24px, 520px), var(--board))' }}
        >
          <div className="panel flex min-w-0 items-center gap-2.5 rounded-2xl py-2 pr-4 pl-3 shadow-lg shadow-black/20">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--money) 16%, transparent)' }}>
              <Coins className="money-text" size={19} />
            </div>
            <div className="min-w-0 leading-none">
              <div className="mb-1 text-[10px] font-semibold tracking-[.16em] uppercase" style={{ color: 'var(--muted)' }}>
                Moedas de ouro
              </div>
              <RollingCounter value={balance} className="money-text text-[22px] font-black tracking-tight sm:text-2xl" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={toggleMute}
              className="panel grid h-11 w-11 place-items-center rounded-xl transition hover:brightness-125 active:scale-95"
              aria-label={muted ? 'Ativar som' : 'Silenciar'}
            >
              {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
            </button>
            <button
              onClick={() => { sound.unlock(); setShopOpen(true); }}
              className="panel flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold transition hover:brightness-125 active:scale-95"
            >
              <Store size={18} style={{ color: 'var(--accent)' }} />
              <span className="hidden min-[400px]:inline">Loja / Níveis</span>
            </button>
          </div>
        </header>

        {/* Área de jogo */}
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2.5">
          <div className="flex items-center justify-between" style={{ width: 'var(--board)' }}>
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-semibold tracking-[.14em] uppercase" style={{ color: 'var(--muted)' }}>Partida</span>
              <RollingCounter value={score} duration={500} className="text-base font-extrabold" />
            </div>
            <div className="flex items-center gap-1.5">
              {streak >= 1 && (
                <span
                  key={streak}
                  className="streak-chip flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-extrabold"
                  style={{ color: 'var(--streak, #fdba74)' }}
                  title="Sequência de jogadas limpando linhas"
                >
                  <Flame size={13} /> {streak}
                </span>
              )}
              <span
                className="rounded-full px-2 py-0.5 text-xs font-extrabold"
                style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)' }}
                title={theme.name}
              >
                {theme.mult}x
              </span>
              <button
                onClick={askRestart}
                className={`flex h-7 items-center justify-center gap-1 rounded-full transition active:scale-90 ${
                  confirmRestart ? 'bg-rose-500/90 px-2.5 text-xs font-bold text-white' : 'w-7 hover:bg-white/10'
                }`}
                style={confirmRestart ? undefined : { color: 'var(--muted)' }}
                aria-label="Reiniciar partida"
                title="Reiniciar partida"
              >
                <RotateCcw size={confirmRestart ? 13 : 15} />
                {confirmRestart && 'Reiniciar?'}
              </button>
            </div>
          </div>

          <Board ref={boardRef} grid={grid} theme={theme} hover={hover} clearFx={clearFx} lastStamp={lastStamp} />

          <PieceTray
            pieces={pieces}
            fits={fits}
            theme={theme}
            draggingIndex={drag?.index ?? -1}
            onPointerDown={onPointerDown}
          />
        </main>

        <footer className="safe-bottom px-4 text-center text-[10.5px] opacity-70" style={{ color: 'var(--muted)' }}>
          Jogo recreativo — moedas virtuais sem valor monetário.
        </footer>
      </div>

      {drag && (
        <div ref={dragElRef} className="drag-layer" style={{ transform: 'translate3d(-9999px,0,0)' }}>
          <div className="drag-inner">
            <PieceShape piece={drag.piece} palette={theme.palette} variant={theme.block} size={`${drag.cs}px`} />
          </div>
        </div>
      )}

      <FloatingMoney items={floats} />
      <ParticleCanvas ref={particlesRef} />

      <GameOverModal
        open={gameOver && !shopOpen}
        score={score}
        sessionTotal={sessionTotal}
        best={best}
        isRecord={isRecord}
        onRestart={restart}
        onShop={() => setShopOpen(true)}
      />
      <ShopModal
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        balance={balance}
        owned={owned}
        activeId={themeId}
        onBuy={buy}
        onEquip={equip}
        ownedSounds={ownedSounds}
        activeSound={soundId}
        onBuySound={buySound}
        onEquipSound={equipSound}
        onPreviewSound={(id) => sound.previewPlace(id)}
      />
    </div>
  );
}
