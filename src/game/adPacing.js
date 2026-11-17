// Ritmo dos anúncios de tela cheia (intersticiais). Fica separado do SDK para poder testar.
// Regra: no máximo um a cada INTERSTITIAL_EVERY partidas encerradas e nunca dois em menos de
// INTERSTITIAL_GAP_MS — quem joga partidas curtas não vê anúncio a cada minuto.

export const INTERSTITIAL_EVERY = 3;
export const INTERSTITIAL_GAP_MS = 120_000;

/** Contador inicial. lastShownAt = início da sessão, então ninguém vê anúncio logo ao abrir. */
export const newPacing = (now) => ({ ended: 0, lastShownAt: now });

/** Uma partida (Clássico) ou um nível (Aventura) terminou. */
export const noteEnded = (p) => ({ ...p, ended: p.ended + 1 });

export const shouldShowInterstitial = (p, now) =>
  p.ended >= INTERSTITIAL_EVERY && now - p.lastShownAt >= INTERSTITIAL_GAP_MS;

/** Anúncio mostrado: zera o contador. */
export const noteShown = (now) => ({ ended: 0, lastShownAt: now });
