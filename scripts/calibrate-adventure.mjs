// Calibra o modo Aventura. Para cada nível, um bot "casual" joga N partidas em cada
// VARIANTE de tabuleiro (semente de levelBoard) e usamos a variante mais jogável (maior
// pontuação mediana: evita desenhos que travam logo de cara).
// A meta segue a curva suave targetFor(n), limitada pela mediana do bot no tabuleiro,
// e as estrelas saem de quantas jogadas os bots vencedores levaram para chegar na meta.
// A pontuação do bot é bimodal (uma parte das partidas morre nas primeiras jogadas), por
// isso a meta não sai de um percentil baixo: daria níveis de 5 jogadas.
// Uso: node scripts/calibrate-adventure.mjs [partidas por variante] [--write]
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { availableParallelism } from 'node:os';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LEVEL_COUNT, levelBoard, targetFor } from '../src/game/adventure.js';
import { playGame } from './bot.mjs';

const VARIANTS = 8; // tabuleiros candidatos por nível
const CAP = 3000; // nenhuma meta passa disso: corta partidas longas

const nice = (v) => (v < 200 ? Math.round(v / 5) * 5 : Math.round(v / 10) * 10);
const quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * sorted.length)))];

if (isMainThread) {
  const games = Number(process.argv[2] ?? 300);
  const write = process.argv.includes('--write');
  const levels = Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1);
  const threads = Math.max(1, availableParallelism());
  const chunks = Array.from({ length: threads }, (_, t) => levels.filter((_, i) => i % threads === t));
  const t0 = Date.now();
  const results = (await Promise.all(chunks.map((chunk) => new Promise((resolve, reject) => {
    const w = new Worker(fileURLToPath(import.meta.url), { workerData: { chunk, games } });
    w.on('message', resolve);
    w.on('error', reject);
  })))).flat().sort((a, b) => a.n - b.n);

  const rows = results.map(({ n, variant, scores, curves }) => {
    const sorted = scores.slice().sort((a, b) => a - b);
    // Meta da curva suave, limitada pela mediana do bot (todo nível vencível em ≥ ~50%)
    const target = Math.min(targetFor(n), nice(quantile(sorted, 0.5)));
    const win = scores.filter((v) => v >= target).length / scores.length;
    // jogadas até a meta, só das partidas vencedoras
    const movesToWin = curves.map((c) => c.findIndex((s) => s >= target) + 1).filter((m) => m > 0).sort((a, b) => a - b);
    const three = quantile(movesToWin, 0.3);
    const two = Math.max(three + 1, quantile(movesToWin, 0.7));
    return { n, target, variant, three, two, win, median: quantile(sorted, 0.5) };
  });

  console.table(rows.map((r) => ({
    nível: r.n, meta: r.target, variante: r.variant, 'vitória bot': (r.win * 100).toFixed(0) + '%',
    '3★ até': r.three, '2★ até': r.two, 'mediana pts': r.median,
  })));
  const capped = rows.filter((r) => r.target < targetFor(r.n));
  console.log(`Metas limitadas pela mediana (tabuleiro mais difícil): ${capped.map((r) => r.n).join(', ') || 'nenhum'}`);
  console.log(`${games} partidas/variante em ${((Date.now() - t0) / 1000).toFixed(0)} s`);

  if (write) {
    const file = new URL('../src/game/adventureTargets.js', import.meta.url);
    writeFileSync(file, `// GERADO por scripts/calibrate-adventure.mjs (${games} partidas/variante) — não edite à mão.
// Meta de pontos de cada nível do modo Aventura (índice 0 = nível 1).
export const TARGETS = ${JSON.stringify(rows.map((r) => r.target))};
// [máximo de jogadas para 3 estrelas, máximo para 2 estrelas] por nível.
export const STAR_MOVES = ${JSON.stringify(rows.map((r) => [r.three, r.two]))};
// Variante de tabuleiro escolhida para cada nível (semente de levelBoard).
export const BOARD_VARIANTS = ${JSON.stringify(rows.map((r) => r.variant))};
`);
    console.log('Gravado em src/game/adventureTargets.js');
  }
} else {
  const { chunk, games } = workerData;
  const out = chunk.map((n) => {
    const runs = [];
    for (let variant = 0; variant < VARIANTS; variant++) {
      const grid = levelBoard(n, variant);
      const scores = [];
      const curves = [];
      for (let i = 0; i < games; i++) {
        const r = playGame('casual', { grid, stopAt: CAP, trace: true });
        scores.push(r.coins);
        curves.push(r.curve);
      }
      const median = quantile(scores.slice().sort((a, b) => a - b), 0.5);
      runs.push({ n, variant, scores, curves, median });
    }
    runs.sort((a, b) => a.median - b.median);
    return runs[runs.length - 1]; // variante mais jogável (a que menos trava)
  });
  parentPort.postMessage(out);
}
