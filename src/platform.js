// Integração com portais web (CrazyGames SDK v3). Só existe no build `npm run build:crazygames`;
// em qualquer outro lugar (Android, dev, outro site) todas as funções viram no-op.
// Docs: https://docs.crazygames.com/sdk/intro/

const sdk = () => (typeof window !== 'undefined' ? window.CrazyGames?.SDK : undefined);

let ready = false;
let playing = false;

let bootPromise = null;

/**
 * Inicializa o SDK uma única vez (chamado em main.jsx antes da primeira tela).
 * Resolve com { active, locale } — `locale` é o idioma do jogador na CrazyGames (ex.: "en-US").
 */
export function bootPlatform() {
  if (bootPromise) return bootPromise;
  const s = sdk();
  if (!s) return (bootPromise = Promise.resolve({ active: false }));
  bootPromise = (async () => {
    try {
      await s.init();
      if (s.environment === 'disabled') return { active: false }; // domínio que não é da CrazyGames
      ready = true;
      return { active: true, locale: s.user?.systemInfo?.locale };
    } catch {
      return { active: false };
    }
  })();
  return bootPromise;
}

/**
 * Liga o "mudo" da plataforma ao jogo. `onMuteChange(bool)` recebe o mudo do site
 * (ex.: durante anúncios ou pelo botão do site), que tem prioridade sobre o mudo do jogo.
 * Retorna true se o SDK está ativo.
 */
export async function initPlatform({ onMuteChange } = {}) {
  const { active } = await bootPlatform();
  if (!active) return false;
  const s = sdk();
  onMuteChange?.(Boolean(s.game.settings?.muteAudio));
  s.game.addSettingsChangeListener?.((settings) => onMuteChange?.(Boolean(settings?.muteAudio)));
  return true;
}

/** Jogador está jogando (início, voltar da loja, nova partida). */
export function gameplayStart() {
  if (!ready || playing) return;
  playing = true;
  try { sdk().game.gameplayStart(); } catch { /* ignora */ }
}

/** Pausa na jogabilidade (loja aberta, fim de partida). */
export function gameplayStop() {
  if (!ready || !playing) return;
  playing = false;
  try { sdk().game.gameplayStop(); } catch { /* ignora */ }
}
