// Simulador de balanceamento: joga milhares de partidas com bots e mede o ganho de moedas.
// Uso: node scripts/simulate.mjs [partidas]
import { ECONOMY } from '../src/game/economy.js';
import { playGame } from './bot.mjs';
import { THEMES } from '../src/game/themes.js';

const GAMES = Number(process.argv[2] ?? 400);
// OLD=1 reproduz a economia original (para comparação)
if (process.env.OLD) Object.assign(ECONOMY, { perBlock: 10, perLine: 150, allClear: 1000, streakStep: 0.5, streakCap: 1e9 });
const SECONDS_PER_MOVE = 3.5; // ritmo de um jogador casual (pensar + arrastar + animação)

function stats(skill, mult = 1) {
  const res = Array.from({ length: GAMES }, () => playGame(skill, { mult }));
  const coins = res.map((r) => r.coins).sort((a, b) => a - b);
  const moves = res.map((r) => r.moves).sort((a, b) => a - b);
  const totalCoins = coins.reduce((a, b) => a + b, 0);
  const totalMoves = moves.reduce((a, b) => a + b, 0);
  const perMove = totalCoins / totalMoves;
  const hist = [0, 0, 0, 0, 0, 0];
  res.forEach((r) => r.lineHist.forEach((v, i) => (hist[i] += v)));
  return {
    skill,
    perMove,
    perMin: (perMove * 60) / SECONDS_PER_MOVE,
    medianCoins: coins[GAMES >> 1],
    p90Coins: coins[Math.floor(GAMES * 0.9)],
    medianMoves: moves[GAMES >> 1],
    medianMinutes: (moves[GAMES >> 1] * SECONDS_PER_MOVE) / 60,
    capped: res.filter((r) => r.capped).length,
    clearsPct: hist.slice(1).map((v) => ((v / totalMoves) * 100).toFixed(1) + '%').join(' / '),
  };
}

const casual = stats('casual');
const good = stats('good');
console.table([casual, good].map((s) => ({
  bot: s.skill,
  'moedas/jogada': s.perMove.toFixed(2),
  'moedas/min': s.perMin.toFixed(0),
  'mediana moedas/partida': s.medianCoins,
  'p90 moedas/partida': s.p90Coins,
  'mediana jogadas': s.medianMoves,
  'mediana min/partida': s.medianMinutes.toFixed(1),
  'partidas infinitas': s.capped,
  'limpou 1/2/3/4/5+ linhas': s.clearsPct,
})));

// Tempo de jogo para desbloquear a loja comprando em ordem e equipando cada nível
for (const s of [casual, good]) {
  let minutes = 0;
  const rows = [];
  let mult = 1;
  for (const t of THEMES) {
    if (t.price > 0) {
      minutes += t.price / (s.perMin * mult);
      rows.push({ nível: t.level, tema: t.name, preço: t.price, mult: t.mult, 'minutos acumulados': minutes.toFixed(0), 'horas acumuladas': (minutes / 60).toFixed(1) });
    }
    mult = t.mult;
  }
  console.log(`\nProgressão da loja — bot ${s.skill} (${s.perMin.toFixed(0)} moedas/min no nível 1):`);
  console.table(rows);
}
