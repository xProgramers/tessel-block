// Gera as imagens-fonte do ícone, da tela de abertura e da arte da Play Store a partir do logo em SVG.
// Uso: npm run icons   (depois o @capacitor/assets cria todos os tamanhos do Android)
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import sharp from 'sharp';

const OUT = 'assets';
const STORE = 'store';
mkdirSync(OUT, { recursive: true });
mkdirSync(STORE, { recursive: true });

const BG_TOP = '#1e293b';
const BG_BOTTOM = '#0b1120';

const BLOCKS = {
  rose: ['#fda4af', '#f43f5e', '#9f1239'],
  amber: ['#fde68a', '#f59e0b', '#92400e'],
  cyan: ['#a5f3fc', '#06b6d4', '#155e75'],
  violet: ['#ddd6fe', '#8b5cf6', '#4c1d95'],
};

// Grade 3x3 de peças encaixadas (tesselação); a célula vazia leva a moeda de ouro
const GRID = [
  ['rose', 'rose', 'amber'],
  ['cyan', 'coin', 'amber'],
  ['cyan', 'violet', 'violet'],
];

function defs() {
  const grads = Object.entries(BLOCKS).map(([k, [hi, mid, lo]]) => `
    <linearGradient id="g-${k}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${hi}"/><stop offset="0.45" stop-color="${mid}"/><stop offset="1" stop-color="${lo}"/>
    </linearGradient>`).join('');
  return `<defs>${grads}
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BG_TOP}"/><stop offset="1" stop-color="${BG_BOTTOM}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.6">
      <stop offset="0" stop-color="#38bdf8" stop-opacity="0.22"/><stop offset="1" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="coin" cx="0.38" cy="0.32" r="0.75">
      <stop offset="0" stop-color="#fffbe6"/><stop offset="0.25" stop-color="#fde047"/><stop offset="0.75" stop-color="#eab308"/><stop offset="1" stop-color="#a16207"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>`;
}

/** Logo (grade de blocos) ocupando um quadrado de `size` px a partir de (x, y). */
function logo(x, y, size) {
  const gap = size * 0.035;
  const cell = (size - gap * 2) / 3;
  const r = cell * 0.2;
  let out = `<g filter="url(#shadow)">`;
  GRID.forEach((row, ri) =>
    row.forEach((k, ci) => {
      const cx = x + ci * (cell + gap);
      const cy = y + ri * (cell + gap);
      if (k === 'coin') {
        const c = cell / 2;
        out += `<circle cx="${cx + c}" cy="${cy + c}" r="${c * 0.78}" fill="url(#coin)" stroke="#a16207" stroke-width="${cell * 0.05}"/>
          <circle cx="${cx + c}" cy="${cy + c}" r="${c * 0.48}" fill="none" stroke="#a16207" stroke-opacity="0.55" stroke-width="${cell * 0.035}"/>`;
        return;
      }
      out += `<rect x="${cx}" y="${cy}" width="${cell}" height="${cell}" rx="${r}" fill="url(#g-${k})"/>
        <rect x="${cx + cell * 0.12}" y="${cy + cell * 0.07}" width="${cell * 0.76}" height="${cell * 0.1}" rx="${cell * 0.05}" fill="#fff" fill-opacity="0.38"/>
        <rect x="${cx + 1}" y="${cy + 1}" width="${cell - 2}" height="${cell - 2}" rx="${r}" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="2"/>`;
    }),
  );
  return `${out}</g>`;
}

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs()}${body}</svg>`;
const bg = (w, h) => `<rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#glow)"/>`;
const png = (s, file) => sharp(Buffer.from(s)).png().toFile(file).then(() => console.log('✓', file));

const S = 1024;
await Promise.all([
  // Ícone completo (Play Store 512 px e Android antigo)
  png(svg(S, S, bg(S, S) + logo(S * 0.19, S * 0.19, S * 0.62)), `${OUT}/icon-only.png`),
  // Ícone adaptativo: frente transparente na zona segura + fundo
  png(svg(S, S, logo(S * 0.27, S * 0.27, S * 0.46)), `${OUT}/icon-foreground.png`),
  png(svg(S, S, bg(S, S)), `${OUT}/icon-background.png`),
  // Tela de abertura (claro e escuro iguais: o jogo é escuro)
  png(svg(2732, 2732, bg(2732, 2732) + logo(2732 / 2 - 300, 2732 / 2 - 300, 600)), `${OUT}/splash.png`),
  png(svg(2732, 2732, bg(2732, 2732) + logo(2732 / 2 - 300, 2732 / 2 - 300, 600)), `${OUT}/splash-dark.png`),
  // Play Store: ícone 512 e imagem de destaque 1024x500
  png(svg(S, S, bg(S, S) + logo(S * 0.19, S * 0.19, S * 0.62)), `${STORE}/icon-1024.png`).then(() =>
    sharp(`${STORE}/icon-1024.png`).resize(512, 512).toFile(`${STORE}/play-icon-512.png`).then(() => console.log('✓', `${STORE}/play-icon-512.png`))),
  png(
    svg(1024, 500, bg(1024, 500) + logo(90, 90, 320) +
      `<text x="470" y="235" font-family="Segoe UI, Arial, sans-serif" font-size="78" font-weight="800" fill="#f8fafc">Tessel Block</text>
       <text x="474" y="300" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="600" fill="#fbbf24">Encaixe. Limpe. Junte ouro.</text>`),
    `${STORE}/feature-graphic-1024x500.png`,
  ),
]);

rmSync(`${STORE}/icon-1024.png`, { force: true });

// Gera todos os tamanhos de ícone e tela de abertura dentro do projeto Android
const color = BG_BOTTOM;
const args = ['capacitor-assets', 'generate', '--android',
  '--iconBackgroundColor', color, '--iconBackgroundColorDark', color,
  '--splashBackgroundColor', color, '--splashBackgroundColorDark', color];
const res = spawnSync('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(res.status ?? 1);
