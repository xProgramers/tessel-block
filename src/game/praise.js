// Elogios que aparecem grandes no tabuleiro ao limpar linhas (estímulo para manter o combo).

const WORDS = ['Boa!', 'Ótimo!', 'Incrível!', 'Fantástico!', 'Espetacular!'];

/**
 * Escolhe o elogio pela "força" da jogada: linhas de uma vez + sequência (streak).
 * Uma linha solta, sem sequência, não ganha elogio (para o elogio continuar especial).
 * Retorna { text, tier } (tier 1..5, usado no tamanho/cor) ou null.
 */
export function praiseFor(lines, streak, allClear) {
  if (allClear) return { text: 'Perfeito!', tier: 5 };
  if (!lines) return null;
  const power = lines + Math.max(streak - 1, 0) - 1;
  if (power <= 0) return null;
  const tier = Math.min(power, WORDS.length);
  return { text: WORDS[tier - 1], tier };
}
