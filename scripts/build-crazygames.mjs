// Gera o pacote para upload na CrazyGames: build com o SDK + tessel-block-crazygames.zip
// com o index.html na raiz do zip. Uso: npm run build:crazygames
import { spawnSync } from 'node:child_process';
import { readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = 'dist-crazygames';
const ZIP = 'tessel-block-crazygames.zip';
const win = process.platform === 'win32';

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: win, ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

rmSync(OUT_DIR, { recursive: true, force: true });
rmSync(ZIP, { force: true });
run('npx', ['vite', 'build', '--mode', 'crazygames']);

// Confere os limites da CrazyGames (1500 arquivos, 50 MB sem SDK / 250 MB com SDK)
const files = [];
const walk = (dir) => readdirSync(dir).forEach((f) => {
  const p = join(dir, f);
  statSync(p).isDirectory() ? walk(p) : files.push(p);
});
walk(OUT_DIR);
const bytes = files.reduce((s, f) => s + statSync(f).size, 0);
console.log(`\n${files.length} arquivos, ${(bytes / 1024).toFixed(0)} KB`);
if (files.length > 1500 || bytes > 50 * 1024 * 1024) {
  console.error('Passou do limite da CrazyGames (1500 arquivos / 50 MB).');
  process.exit(1);
}

// Zip com o conteúdo da pasta na raiz (index.html no topo, sem pasta extra).
// Windows 10+ e macOS: tar (bsdtar) gera .zip com -a; Linux: comando zip.
const entries = readdirSync(OUT_DIR);
if (win || process.platform === 'darwin') run('tar', ['-a', '-c', '-f', join('..', ZIP), ...entries], { cwd: OUT_DIR, shell: false });
else run('zip', ['-r', '-q', join('..', ZIP), ...entries], { cwd: OUT_DIR, shell: false });

console.log(`Pronto: ${ZIP} (${(statSync(ZIP).size / 1024).toFixed(0)} KB) — envie este arquivo no portal da CrazyGames.`);
