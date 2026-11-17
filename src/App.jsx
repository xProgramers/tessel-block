import { flushSync } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Coins, Flame, Map as MapIcon, PlayCircle, RotateCcw, Star, Store, Volume2, VolumeX } from 'lucide-react';
import Board from './components/Board';
import PieceTray from './components/PieceTray';
import FloatingMoney from './components/FloatingMoney';
import ShopModal from './components/ShopModal';
import AdventureMap from './components/AdventureMap';
import HomeMenu from './components/HomeMenu';
import LevelResultModal from './components/LevelResultModal';
import ParticleCanvas from './components/ParticleCanvas';
import RollingCounter from './components/RollingCounter';
import { PieceShape } from './components/Block';
import { createHoverStore, dragPoint } from './game/drag';
import { praiseFor } from './game/praise';
import { LEVEL_COUNT, levelBoard, levelConfig, levelReward, starsFor } from './game/adventure';
import { sound } from './audio/soundEngine';
import { haptic, onAppPause, onBackButton, setSystemBarsForTheme } from './native';
import {
  initAds, maybeShowInterstitial, noteGameEnded, onRewardReady, setAdsMuted, showRewarded,
} from './ads';
import {
  anyFit, canPlace, clearLines, emptyGrid, findFullLines, generateSet, isBoardEmpty, placePiece, SIZE,
} from './game/logic';
import { COLOR_COUNT, withNewId } from './game/pieces';
import { getTheme, THEME_IDS, THEMES } from './game/themes';
import {
  clearGame, fmt, load, loadGame, loadSave, save, SAVE_KEY, saveGame, writeSave,
} from './game/format';
import { computeGain, ECONOMY } from './game/economy';
import { SOUND_IDS, SOUND_PACKS } from './game/sounds';

export default function App() {
  const [initial] = useState(() => loadSave(THEME_IDS, SOUND_IDS));
  const [ownedSounds, setOwnedSounds] = useState(initial.data.sounds);
  const [soundId, setSoundId] = useState(initial.data.sound);
  // Partida em andamento salva (se o app foi fechado no meio de uma partida)
  const [resumed] = useState(() => {
    const g = loadGame(SIZE, COLOR_COUNT);
    return g && { ...g, pieces: g.pieces.map((p) => (p ? withNewId(p) : null)) };
  });
  const [grid, setGrid] = useState(() => resumed?.grid ?? emptyGrid());
  const [pieces, setPieces] = useState(() => resumed?.pieces ?? generateSet(emptyGrid()));
  const [balance, setBalance] = useState(initial.data.balance);
  const [owned, setOwned] = useState(initial.data.owned);
  const [themeId, setThemeId] = useState(initial.data.theme);
  const [muted, setMuted] = useState(() => load('bc_muted', false));
  const [best, setBest] = useState(initial.data.best);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [score, setScore] = useState(resumed?.score ?? 0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [streak, setStreak] = useState(resumed?.streak ?? 0);
  const [missCount, setMissCount] = useState(resumed?.missCount ?? 0);
  const [gameOver, setGameOver] = useState(false);
  const [isRecord, setIsRecord] = useState(false);
  // Anúncio premiado: vídeo opcional no fim da partida que dobra as moedas ganhas nela
  const [rewardReady, setRewardReady] = useState(false);
  const [doubled, setDoubled] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [drag, setDrag] = useState(null);
  // Prévia do encaixe fica num "store" próprio: atualizá-la durante o arraste re-renderiza
  // só o tabuleiro, não o App inteiro (antes cada célula nova travava um quadro no Android).
  const [hoverStore] = useState(createHoverStore);
  const setHover = hoverStore.set;
  const [floats, setFloats] = useState([]);
  const [clearFx, setClearFx] = useState([]);
  const [lastStamp, setLastStamp] = useState(0);
  // Modo Aventura
  const [advStars, setAdvStars] = useState(initial.data.adv); // estrelas por nível (0 = não vencido)
  const [level, setLevel] = useState(null); // nível em jogo (null = modo Clássico)
  const [levelPoints, setLevelPoints] = useState(0);
  const [levelMoves, setLevelMoves] = useState(0);
  const [levelResult, setLevelResult] = useState(null);
  // Tela atual: menu inicial → (Clássico) partida | (Aventura) mapa → partida do nível
  const [screen, setScreen] = useState('menu');
  const mapOpen = screen === 'map';
  const classicStash = useRef(null); // partida clássica guardada enquanto joga a Aventura
  const levelDone = useRef(false); // nível já decidido (bloqueia jogadas até o resultado)

  const theme = getTheme(themeId);
  // Ficou sem espaço (Clássico: fim de partida; Aventura: nível perdido)
  const stuck = level ? Boolean(levelResult && !levelResult.won) : gameOver;

  const boardRef = useRef(null);
  const dragElRef = useRef(null);
  const shakeRef = useRef(null);
  const particlesRef = useRef(null);
  const dragData = useRef(null);
  const uid = useRef(1);
  const gameOverTimer = useRef(0);

  // Estado mais recente para handlers de ponteiro (evita closures obsoletas)
  const state = useRef({});
  state.current = {
    grid, pieces, streak, missCount, theme, score, best, gameOver, balance, owned, ownedSounds,
    level, levelPoints, levelMoves, advStars,
  };

  // Progresso salvo num registro assinado único (ver format.js)
  useEffect(() => {
    writeSave({ balance, owned, theme: themeId, best, sounds: ownedSounds, sound: soundId, adv: advStars });
  }, [balance, owned, themeId, best, ownedSounds, soundId, advStars]);

  useEffect(() => sound.setPlacePack(soundId), [soundId]);

  // Anúncios (só no Android): consentimento, SDK e o vídeo premiado pré-carregado
  useEffect(() => {
    initAds();
    return onRewardReady(setRewardReady);
  }, []);
  useEffect(() => setAdsMuted(muted), [muted]);

  // Partida em andamento: salva a cada jogada; terminada, apaga (a próxima abertura começa do zero).
  // Durante um nível da Aventura a partida clássica salva fica intacta.
  useEffect(() => {
    if (level) return;
    if (gameOver) clearGame();
    else saveGame({ grid, pieces, score, streak, missCount });
  }, [grid, pieces, score, streak, missCount, gameOver, level]);

  // Partida restaurada sem jogada possível (o app fechou durante o "game over"): encerra agora
  useEffect(() => {
    if (!resumed || resumed.pieces.some((p) => p && anyFit(resumed.grid, p))) return;
    setIsRecord(resumed.score > initial.data.best);
    setBest((b) => Math.max(b, resumed.score));
    setGameOver(true);
  }, [resumed, initial]);

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
      setAdvStars((a) => (a.join() === data.adv.join() ? a : data.adv));
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
    if (import.meta.env.DEV) window.__game = { setGrid, setBalance, setPieces, setThemeId, setOwned, setLevelPoints, setAdvStars, setScore, setBest, setStreak };
  }, []);

  const fits = useMemo(() => pieces.map((p) => (p ? anyFit(grid, p) : false)), [grid, pieces]);

  const addFloats = (items) => {
    const withIds = items.map((i) => ({ ...i, id: uid.current++ }));
    const ids = new Set(withIds.map((i) => i.id));
    setFloats((f) => [...f, ...withIds]);
    const life = Math.max(1200, ...withIds.map((i) => (i.life ?? 0) + (i.delay ?? 0)));
    setTimeout(() => setFloats((f) => f.filter((x) => !ids.has(x.id))), life);
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
    const { grid, pieces, streak, missCount, theme, score, best, level, levelPoints, levelMoves } = state.current;
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
      if (labels.length) fl.push({ x: cx, y: cy - cs * 1.1, text: labels.join(' · '), variant: 'label', delay: 140 });
      // Elogio grande no meio do tabuleiro: cresce junto com o combo
      const praise = praiseFor(lines, newStreak, allClear);
      if (praise) {
        fl.push({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height * 0.42,
          text: praise.text,
          variant: `praise praise-${praise.tier}`,
          delay: 60,
          life: 1500,
        });
      }

      const fxIds = new Set(fx.map((f) => f.id));
      setClearFx((f) => [...f, ...fx]);
      setTimeout(() => setClearFx((f) => f.filter((x) => !fxIds.has(x.id))), 1000);

      sound.clear(lines, newStreak, allClear);
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
    setSessionTotal((s) => s + gain);
    addFloats(fl);

    if (level) {
      // Aventura: pontos sem o multiplicador do tema (todo mundo enfrenta a mesma meta)
      const pts = computeGain({ blocks: piece.cells.length, lines, streak: newStreak, allClear, mult: 1 }).total;
      const points = levelPoints + pts;
      const moves = levelMoves + 1;
      setLevelPoints(points);
      setLevelMoves(moves);
      if (points >= levelConfig(level).target) return winLevel(level, moves, points);
      if (!next.some((p) => p && anyFit(g, p))) {
        levelDone.current = true;
        clearTimeout(gameOverTimer.current);
        gameOverTimer.current = setTimeout(() => {
          setLevelResult({ n: level, won: false, stars: 0, points, target: levelConfig(level).target, reward: 0 });
          noteGameEnded();
          sound.gameOver();
          haptic('heavy');
        }, 750);
      }
      return;
    }

    setScore((s) => s + gain);
    if (!next.some((p) => p && anyFit(g, p))) {
      const finalScore = score + gain;
      clearTimeout(gameOverTimer.current);
      gameOverTimer.current = setTimeout(() => {
        setIsRecord(finalScore > best);
        setBest((b) => Math.max(b, finalScore));
        setGameOver(true);
        noteGameEnded();
        sound.gameOver();
        haptic('heavy');
      }, 750);
    }
  };
  /** Venceu o nível: estrelas, prêmio em moedas e a tela de resultado. */
  const winLevel = (n, moves, points) => {
    levelDone.current = true;
    const prev = state.current.advStars[n - 1] || 0;
    const stars = starsFor(n, moves);
    const reward = levelReward(n, prev, stars);
    if (stars > prev) {
      setAdvStars((a) => {
        const next = a.slice();
        while (next.length < n) next.push(0);
        next[n - 1] = Math.max(next[n - 1] || 0, stars);
        return next;
      });
    }
    if (reward) {
      setBalance((b) => b + reward);
      setSessionTotal((s) => s + reward);
    }
    clearTimeout(gameOverTimer.current);
    gameOverTimer.current = setTimeout(() => {
      setLevelResult({ n, won: true, stars, points, target: levelConfig(n).target, reward, last: n === LEVEL_COUNT });
      noteGameEnded();
      sound.levelWin(stars);
      haptic('heavy');
      particlesRef.current?.burst(window.innerWidth / 2, window.innerHeight * 0.4, theme.particles, 70, 1.5);
    }, 650);
  };

  const placeRef = useRef(place);
  placeRef.current = place;

  /* ---------------- Drag & drop (mouse + touch) ---------------- */
  const positionDrag = useCallback(() => {
    const d = dragData.current;
    if (!d) return;
    const { left, top } = dragPoint(d, window.innerWidth, window.innerHeight);
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
    // No toque, usa o ponto "previsto" pelo navegador (compensa ~1 quadro de atraso da tela)
    const predicted = d.touch && e.getPredictedEvents ? e.getPredictedEvents() : null;
    const p = predicted?.length ? predicted[predicted.length - 1] : e;
    d.x = p.clientX;
    d.y = p.clientY;
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
    if (dragData.current || s.gameOver || levelDone.current) return;
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
      x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY,
      key: null, target: null, overBoard: false,
    };
    flushSync(() => setDrag({ index, piece, cs })); // peça aparece no mesmo quadro do toque
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
  uiRef.current = { shopOpen, confirmRestart, screen, level };
  useEffect(() => onBackButton(() => {
    if (dragData.current) {
      onUp({ pointerId: dragData.current.id, type: 'pointercancel' });
      return true;
    }
    if (uiRef.current.shopOpen) {
      setShopOpen(false);
      return true;
    }
    if (uiRef.current.screen === 'map') {
      setScreen('menu');
      return true;
    }
    if (uiRef.current.confirmRestart) {
      setConfirmRestart(false);
      return true;
    }
    if (uiRef.current.screen === 'game') {
      setScreen(uiRef.current.level ? 'map' : 'menu');
      return true;
    }
    return false;
  }), [onUp]);

  // Android: app em segundo plano → silencia o áudio (volta no próximo toque)
  useEffect(() => onAppPause(() => sound.suspend()), []);

  /* ---------------- Ações ---------------- */
  const restart = () => {
    if (state.current.gameOver) maybeShowInterstitial();
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
    setDoubled(false);
    setClearFx([]);
    sound.unlock();
    sound.newSet();
  };

  /* ---------------- Modo Aventura ---------------- */
  const startLevel = (n) => {
    if (levelDone.current) maybeShowInterstitial();
    clearTimeout(gameOverTimer.current);
    if (dragData.current) onUp({ pointerId: dragData.current.id, type: 'pointercancel' });
    const s = state.current;
    // Sai do Clássico: guarda a partida para voltar exatamente nela
    if (!s.level) {
      classicStash.current = {
        grid: s.grid, pieces: s.pieces, score: s.score, streak: s.streak, missCount: s.missCount, gameOver: s.gameOver,
      };
    }
    const g = levelBoard(n);
    levelDone.current = false;
    setLevel(n);
    setGrid(g);
    setPieces(generateSet(g));
    setStreak(0);
    setMissCount(0);
    setLevelPoints(0);
    setLevelMoves(0);
    setLevelResult(null);
    setGameOver(false);
    setConfirmRestart(false);
    setClearFx([]);
    setScreen('game');
    sound.unlock();
    sound.newSet();
  };

  const exitToClassic = () => {
    clearTimeout(gameOverTimer.current);
    if (dragData.current) onUp({ pointerId: dragData.current.id, type: 'pointercancel' });
    const c = classicStash.current;
    classicStash.current = null;
    levelDone.current = false;
    setLevel(null);
    setLevelResult(null);
    setConfirmRestart(false);
    setClearFx([]);
    if (c) {
      setGrid(c.grid);
      setPieces(c.pieces);
      setScore(c.score);
      setStreak(c.streak);
      setMissCount(c.missCount);
      setGameOver(c.gameOver);
    } else {
      const g = emptyGrid();
      setGrid(g);
      setPieces(generateSet(g));
      setScore(0);
      setStreak(0);
      setMissCount(0);
      setGameOver(false);
    }
  };

  const openMap = () => {
    sound.unlock();
    if (levelResult) exitToClassic();
    setScreen('map');
  };

  // Botão de reiniciar no meio da partida pede confirmação (toque duplo)
  const askRestart = () => {
    const again = level ? () => startLevel(level) : restart;
    const fresh = level ? levelMoves === 0 || levelDone.current : state.current.score === 0;
    if (confirmRestart || gameOver || fresh) return again();
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

  /** Vídeo premiado: dobra as moedas ganhas na partida clássica que acabou de terminar. */
  const watchToDouble = async () => {
    if (watchingAd || doubled) return;
    const coins = state.current.score;
    setWatchingAd(true);
    sound.suspend();
    const earned = await showRewarded();
    setWatchingAd(false);
    if (!earned || coins <= 0) return;
    setDoubled(true);
    setBalance((b) => b + coins);
    setSessionTotal((s) => s + coins);
    sound.unlock();
    sound.purchase();
    haptic('medium');
    addFloats([{ x: window.innerWidth / 2, y: window.innerHeight * 0.45, text: `+${fmt(coins)}`, coin: true, variant: 'gold' }]);
    particlesRef.current?.burst(window.innerWidth / 2, window.innerHeight * 0.45, theme.particles, 60, 1.4);
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
          <button
            type="button"
            onClick={() => { sound.unlock(); setScreen(level ? 'map' : 'menu'); }}
            className="panel grid h-11 w-11 shrink-0 place-items-center rounded-xl transition hover:brightness-125 active:scale-95"
            aria-label={level ? 'Voltar ao mapa' : 'Voltar ao menu'}
          >
            <ChevronLeft size={22} />
          </button>
          <div className="panel flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl py-2 pr-4 pl-3 shadow-lg shadow-black/20">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--money) 16%, transparent)' }}>
              <Coins className="money-text" size={19} />
            </div>
            <div className="min-w-0 leading-none">
              <div className="mb-1 text-[10px] font-semibold tracking-[.16em] uppercase" style={{ color: 'var(--muted)' }}>
                Moedas
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
              aria-label="Loja"
              className="panel flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold transition hover:brightness-125 active:scale-95"
            >
              <Store size={18} style={{ color: 'var(--accent)' }} />
              <span className="hidden min-[400px]:inline">Loja / Níveis</span>
            </button>
          </div>
        </header>

        {/* Área de jogo */}
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2.5">
          {/* Placar no centro: na Aventura, pontos → meta; no Clássico, a pontuação da partida */}
          <div className="score-hud" style={{ width: 'var(--board)' }}>
            {level ? (
              <>
                <div className="score-sub mb-1.5 flex items-center gap-2">
                  <span>Nível {level}{levelConfig(level).boss ? ' · Chefão' : ''}</span>
                  <span className="flex items-center" title="Estrelas se você bater a meta na próxima jogada">
                    {[1, 2, 3].map((i) => (
                      <Star
                        key={i}
                        size={12}
                        fill="currentColor"
                        className={i <= starsFor(level, levelMoves + 1) ? 'adv-star-on' : 'adv-star-off'}
                      />
                    ))}
                  </span>
                </div>
                <div className="goal-row">
                  <span className="goal-now tabular">
                    <RollingCounter value={levelPoints} duration={450} coin={false} />
                  </span>
                  <span className="adv-progress">
                    <span className="block" style={{ width: `${Math.min(100, (levelPoints / levelConfig(level).target) * 100)}%` }} />
                  </span>
                  <span className={`goal-target tabular ${levelPoints >= levelConfig(level).target ? 'is-hit' : ''}`}>
                    {fmt(levelConfig(level).target)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <RollingCounter value={score} duration={500} className="score-big tabular" />
                <div className="score-sub mt-1">Recorde {fmt(Math.max(best, score))}</div>
              </>
            )}
            <div className="absolute top-0 right-0 flex items-center gap-1.5">
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
            {!level && (
              <span
                className="absolute top-0 left-0 rounded-full px-2 py-0.5 text-xs font-extrabold"
                style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)' }}
                title={`${theme.name}: moedas ${theme.mult}x`}
              >
                {theme.mult}x
              </span>
            )}
          </div>

          <Board ref={boardRef} grid={grid} theme={theme} hoverStore={hoverStore} clearFx={clearFx} lastStamp={lastStamp} />

          <PieceTray
            stuck={stuck}
            pieces={pieces}
            fits={fits}
            theme={theme}
            draggingIndex={drag?.index ?? -1}
            onPointerDown={onPointerDown}
          />
        </main>

        <footer className="safe-bottom px-4 text-center text-[10.5px] opacity-70" style={{ color: 'var(--muted)', visibility: stuck ? 'hidden' : undefined }}>
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

      {/* Sem espaço: nada de tela por cima — o tabuleiro fica à vista para o jogador
          ver onde errou, as peças ficam em preto e branco e o botão aparece embaixo. */}
      {stuck && screen === 'game' && !shopOpen && (
        <div className="stuck-bar">
          <span className="stuck-note">
            Sem espaço ·{' '}
            {level
              ? `${fmt(levelResult.points)} de ${fmt(levelResult.target)} pontos`
              : isRecord && score > 0 ? '✨ novo recorde!' : `recorde ${fmt(Math.max(best, score))}`}
          </span>
          <div className="stuck-actions">
            {!level && rewardReady && !doubled && score > 0 && (
              <button type="button" className="stuck-btn-ad" onClick={watchToDouble} disabled={watchingAd}>
                <PlayCircle size={15} /> +{fmt(score)}
              </button>
            )}
            {level && (
              <button type="button" className="stuck-btn-secondary" onClick={openMap} aria-label="Mapa">
                <MapIcon size={16} />
              </button>
            )}
            <button type="button" className="stuck-btn" onClick={level ? () => startLevel(level) : restart}>
              <RotateCcw size={15} /> Tentar de novo
            </button>
          </div>
        </div>
      )}
      <LevelResultModal
        result={shopOpen || screen !== 'game' || !levelResult?.won ? null : levelResult}
        onNext={() => startLevel(levelResult.n + 1)}
        onRetry={() => startLevel(levelResult.n)}
        onMap={openMap}
      />
      <AdventureMap open={mapOpen} stars={advStars} onClose={() => setScreen('menu')} onPlay={startLevel} />
      <HomeMenu
        open={screen === 'menu' && !shopOpen}
        theme={theme}
        balance={balance}
        best={best}
        classicScore={classicStash.current ? classicStash.current.score : level ? 0 : score}
        advStars={advStars}
        muted={muted}
        onToggleMute={toggleMute}
        onClassic={() => {
          sound.unlock();
          if (level) exitToClassic();
          setScreen('game');
        }}
        onAdventure={() => { sound.unlock(); setScreen('map'); }}
        onShop={() => { sound.unlock(); setShopOpen(true); }}
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
