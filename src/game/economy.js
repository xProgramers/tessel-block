// Regras de pontuação (moedas de ouro). Compartilhado entre o jogo e o simulador
// de balanceamento (scripts/simulate.mjs) — mude aqui e rode `npm run simulate`.

export const ECONOMY = {
  perBlock: 1, // moedas por bloco encaixado
  perLine: 10, // moedas base por linha/coluna limpa
  allClear: 100, // bônus por esvaziar o tabuleiro
  streakStep: 0.25, // +25% por limpeza consecutiva...
  streakCap: 2, // ...até no máximo 2x
  streakGrace: 3, // jogadas sem limpar antes de perder a sequência
};

/** Multiplicador de combo por linhas simultâneas: 1, 2, 3, 4… (por linha). */
export const comboMult = (lines) => Math.max(1, lines);

export const streakMult = (streak) =>
  Math.min(ECONOMY.streakCap, 1 + Math.max(0, streak - 1) * ECONOMY.streakStep);

/**
 * Ganho de uma jogada.
 * blocks: blocos da peça; lines: linhas+colunas limpas; streak: sequência JÁ incluindo esta jogada.
 */
export function computeGain({ blocks, lines, streak, allClear, mult }) {
  const place = Math.round(blocks * ECONOMY.perBlock * mult);
  let clear = 0;
  if (lines > 0) {
    clear = ECONOMY.perLine * lines * comboMult(lines) * streakMult(streak);
    if (allClear) clear += ECONOMY.allClear;
    clear = Math.round(clear * mult);
  }
  return { place, clear, total: place + clear };
}
