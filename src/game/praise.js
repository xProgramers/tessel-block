// Elogios que aparecem grandes no tabuleiro ao limpar linhas (estímulo para manter o combo).
import { t } from '../i18n.js';

const WORDS = ['praise1', 'praise2', 'praise3', 'praise4', 'praise5'];

/**
 * Escolhe o elogio pela "força" da jogada: linhas de uma vez + sequência (streak).
 * Uma linha solta, sem sequência, não ganha elogio (para o elogio continuar especial).
 * Retorna { text, tier } (tier 1..5, usado no tamanho/cor) ou null. O texto vem no idioma do jogo.
 */
export function praiseFor(lines, streak, allClear) {
  if (allClear) return { text: t('perfect'), tier: 5 };
  if (!lines) return null;
  const power = lines + Math.max(streak - 1, 0) - 1;
  if (power <= 0) return null;
  const tier = Math.min(power, WORDS.length);
  return { text: t(WORDS[tier - 1]), tier };
}
