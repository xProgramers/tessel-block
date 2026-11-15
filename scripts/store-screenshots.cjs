// Tira as capturas de tela da Play Store (1080x1920) a partir do servidor de desenvolvimento.
// Uso: npm run dev (em outro terminal) e depois: node scripts/store-screenshots.cjs store/screenshots
// Precisa do Playwright: npm i -D playwright && npx playwright install chromium
// Usa os ganchos de depuração window.__game, que só existem em modo dev.
const { chromium } = require('playwright');
const OUT = process.argv[2];
const ONLY = process.argv[3];
const P = (pat, color) => { const rows = pat.split('/'); const cells = []; rows.forEach((r, ri) => [...r].forEach((ch, ci) => ch === 'X' && cells.push([ri, ci]))); return { id: Math.floor(Math.random()*1e9), cells, h: rows.length, w: Math.max(...rows.map(r => r.length)), color }; };
// grade de texto: '.' vazio, dígito = cor
const G = (rows) => rows.map(r => [...r].map(ch => ch === '.' ? null : { color: +ch, t: 0 }));
const BOARD_PLAY = G([
  '........',
  '.....33.',
  '2....33.',
  '22..1111',
  '55...0..',
  '5644.0..',
  '56440066',
  '..2..226',
]);
const BOARD_COMBO = G([
  '........',
  '......4.',
  '1.....44',
  '11...333',
  '6..5.3..',
  '...55..0',
  '..314660',
  '.2211540',
]);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173');
  await p.waitForTimeout(800);
  const setup = async (fn, arg) => { await p.evaluate(fn, arg); await p.waitForTimeout(500); };
  await setup(() => { const g = window.__game; g.setBalance(18640); g.setOwned(['minimal','candy','wood','neon','pixel','ice']); g.setAdvStars(Array.from({length:100},(_,i)=> i<23 ? [3,3,2,3,1][i%5] : 0)); });
  const shot = async (name) => { if (!ONLY || ONLY.includes(name)) await p.screenshot({ path: `${OUT}/${name}.png` }); };
  await shot('01-menu');
  // Clássico em andamento
  await p.getByText('Clássico').click(); await p.waitForTimeout(700);
  await setup(({ board, pieces }) => { window.__game.setGrid(board); window.__game.setPieces(pieces); window.__game.setScore(3480); window.__game.setBest(12950); }, { board: BOARD_PLAY, pieces: [P('XX/X.', 2), P('XXX', 4), P('X./XX/X.', 1)] });
  await p.waitForTimeout(900);
  await shot('02-classico');
  // Combo: peça 3x... limpa 2 linhas
  await setup(({ board, pieces }) => { window.__game.setGrid(board); window.__game.setPieces(pieces); window.__game.setStreak(3); }, { board: BOARD_COMBO, pieces: [P('XXX/XX./X..', 3), P('XX/XX', 5), P('X', 0)] });
  await p.waitForTimeout(900);
  const boardBox = await p.locator('.board-grid').boundingBox();
  const cs = boardBox.width / 8;
  const tray = p.locator('.tray-piece').first();
  const tb = await tray.boundingBox();
  await p.mouse.move(tb.x + tb.width/2, tb.y + tb.height/2);
  await p.mouse.down();
  // destino: canto superior esquerdo em (5,0) → centro = (0 + 3/2, 5 + 3/2) células
  const tx = boardBox.x + 1.5 * cs, ty = boardBox.y + 6.5 * cs;
  await p.mouse.move(tx, ty, { steps: 12 });
  await p.mouse.move(tx + 1, ty, { steps: 1 });
  await p.mouse.up();
  await p.waitForTimeout(Number(process.env.COMBO_MS || 260));
  await shot('03-combo');
  await p.waitForTimeout(1500);
  // Tema Cyber Neon
  await setup(({ board, pieces }) => { window.__game.setThemeId('neon'); window.__game.setGrid(board); window.__game.setPieces(pieces); }, { board: BOARD_PLAY, pieces: [P('XXX/.X.', 6), P('XX', 3), P('XX/XX', 0)] });
  await p.waitForTimeout(900);
  await shot('05-tema-neon');
  // Loja
  await setup(() => window.__game.setThemeId('minimal'));
  await p.getByLabel('Loja', { exact: true }).click();
  await p.waitForTimeout(900);
  await shot('06-loja');
  console.log(await p.evaluate(() => [...document.querySelectorAll('[aria-label]')].map(e=>e.getAttribute('aria-label')).join(' | ')));
  const p2 = await ctx.newPage();
  await p2.goto('http://localhost:5173'); await p2.waitForTimeout(800);
  await p2.evaluate(() => window.__game.setAdvStars(Array.from({length:100},(_,i)=> i<23 ? [3,3,2,3,1][i%5] : 0)));
  await p2.waitForTimeout(300);
  await p2.getByText('Aventura').click(); await p2.waitForTimeout(1200);
  await p2.screenshot({ path: OUT + '/04-aventura-mapa.png' });
  await b.close();
})();
