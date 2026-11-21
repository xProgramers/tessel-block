// Integração com portais web (CrazyGames SDK v3). Só existe no build `npm run build:crazygames`;
// em qualquer outro lugar (Android, dev, outro site) todas as funções viram no-op.
// Docs: https://docs.crazygames.com/sdk/intro/

const sdk = () => (typeof window !== 'undefined' ? window.CrazyGames?.SDK : undefined);

let ready = false;
let playing = false;

/**
 * Inicializa o SDK. `onMuteChange(bool)` recebe o "mudo" da plataforma
 * (ex.: durante anúncios ou pelo botão do site), que tem prioridade sobre o mudo do jogo.
 * Retorna true se o SDK está ativo.
 */
export async function initPlatform({ onMuteChange } = {}) {
  const s = sdk();
  if (!s) return false;
  try {
    await s.init();
    if (s.environment === 'disabled') return false; // domínio que não é da CrazyGames
    ready = true;
    onMuteChange?.(Boolean(s.game.settings?.muteAudio));
    s.game.addSettingsChangeListener?.((settings) => onMuteChange?.(Boolean(settings?.muteAudio)));
    return true;
  } catch {
    return false;
  }
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
