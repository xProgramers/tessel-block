// Gera o .aab de release para a Play Store (Windows, macOS e Linux).
// Uso: npm run android:bundle
// Precisa do Android SDK (vem com o Android Studio) e de android/keystore.properties
// (ou das variáveis TB_KEYSTORE_*) para sair assinado. Veja docs/PUBLICAR-PLAY-STORE.md.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const isWin = process.platform === 'win32';

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: isWin, ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run('npx', ['vite', 'build']);
run('npx', ['cap', 'sync', 'android']);
run(isWin ? 'gradlew.bat' : './gradlew', ['bundleRelease'], { cwd: 'android' });

const aab = join('android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const signed = existsSync(join('android', 'keystore.properties')) || Boolean(process.env.TB_KEYSTORE_FILE);
console.log(`\n✔ Bundle gerado: ${aab}`);
console.log(signed
  ? '  Assinado com a sua chave de upload — pronto para enviar ao Play Console.'
  : '  ⚠ SEM assinatura (android/keystore.properties não encontrado). O Play Console vai recusar este arquivo.');
