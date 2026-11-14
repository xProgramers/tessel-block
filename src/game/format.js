// Moeda do jogo: moedas de ouro virtuais (sem valor monetário), sempre inteiras.
const NUM = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export const fmt = (v) => NUM.format(Math.round(v));

/** "1.500 moedas" — para textos corridos. */
export const coins = (v) => `${fmt(v)} ${Math.round(v) === 1 ? 'moeda' : 'moedas'}`;

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* armazenamento indisponível */
  }
}

/* ---------- Progresso do jogador (moedas, temas, recorde) ----------
 * Salvo num único registro assinado: editar o localStorage à mão invalida a
 * assinatura e o progresso volta ao início. É uma barreira contra edição casual —
 * proteção real exige validar o saldo num servidor.
 */
export const SAVE_KEY = 'tb_save_v1';
const SALT = 'tessel-block::v1::k7#Qp2';
export const DEFAULT_SAVE = {
  balance: 0, owned: ['minimal'], theme: 'minimal', best: 0, sounds: ['classic'], sound: 'classic',
};

/** Completa campos adicionados em versões novas (saves antigos não têm sons). */
const normalize = (d) => ({
  balance: d.balance,
  owned: d.owned,
  theme: d.theme,
  best: d.best,
  sounds: d.sounds ?? ['classic'],
  sound: d.sound ?? 'classic',
});

function sign(str) {
  // FNV-1a em duas passadas (64 bits efetivos) — suficiente para detectar edição manual
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x5bd1e995) ^ (h1 >>> 13);
  }
  return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);
}

function validSave(d, themeIds, soundIds) {
  return (
    d &&
    Number.isSafeInteger(d.balance) && d.balance >= 0 &&
    Number.isSafeInteger(d.best) && d.best >= 0 &&
    Array.isArray(d.owned) && d.owned.includes('minimal') &&
    d.owned.every((id) => themeIds.includes(id)) &&
    d.owned.includes(d.theme) &&
    Array.isArray(d.sounds) && d.sounds.includes('classic') &&
    d.sounds.every((id) => soundIds.includes(id)) &&
    d.sounds.includes(d.sound)
  );
}

/** Lê o progresso. Retorna { data, tampered }. */
export function loadSave(themeIds, soundIds) {
  let raw = null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const { data, sig } = JSON.parse(raw);
      if (data && sig === sign(JSON.stringify(data) + SALT)) {
        const d = normalize(data);
        if (validSave(d, themeIds, soundIds)) return { data: d, tampered: false };
      }
      backup(raw);
      return { data: DEFAULT_SAVE, tampered: true };
    }
    // Migração das chaves antigas (versão sem assinatura)
    const legacy = normalize({
      balance: Math.max(0, Math.round(Number(load('bc_balance', 0)) || 0)),
      owned: load('bc_owned', ['minimal']),
      theme: load('bc_theme', 'minimal'),
      best: Math.max(0, Math.round(Number(load('bc_best', 0)) || 0)),
    });
    ['bc_balance', 'bc_owned', 'bc_theme', 'bc_best'].forEach((k) => localStorage.removeItem(k));
    return { data: validSave(legacy, themeIds, soundIds) ? legacy : DEFAULT_SAVE, tampered: false };
  } catch {
    // Falha inesperada de leitura: guarda o save original antes que o jogo grave por cima
    if (raw) backup(raw);
    return { data: DEFAULT_SAVE, tampered: true };
  }
}

/** Cópia do save rejeitado, para suporte/recuperação manual (nunca é lida automaticamente). */
function backup(raw) {
  try {
    localStorage.setItem(`${SAVE_KEY}_backup_${Date.now()}`, raw);
  } catch {
    /* sem espaço */
  }
}

export function writeSave(data) {
  try {
    const body = JSON.stringify({ data, sig: sign(JSON.stringify(data) + SALT) });
    // Evita gravar o mesmo conteúdo (e o "ping-pong" de eventos entre abas)
    if (localStorage.getItem(SAVE_KEY) !== body) localStorage.setItem(SAVE_KEY, body);
  } catch {
    /* armazenamento indisponível */
  }
}
