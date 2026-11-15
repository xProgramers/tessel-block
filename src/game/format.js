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

const uniq = (arr) => [...new Set(arr)];

/**
 * Completa campos adicionados em versões novas (saves antigos não têm sons) e
 * descarta temas/sons que não existem mais nesta versão, em vez de zerar o progresso.
 * Itens gratuitos ('minimal' / 'classic') estão sempre na lista.
 */
const normalize = (d, themeIds, soundIds) => {
  const owned = uniq(['minimal', ...(Array.isArray(d.owned) ? d.owned : [])]).filter((id) => themeIds.includes(id));
  const sounds = uniq(['classic', ...(Array.isArray(d.sounds) ? d.sounds : [])]).filter((id) => soundIds.includes(id));
  return {
    balance: d.balance,
    owned,
    theme: owned.includes(d.theme) ? d.theme : 'minimal',
    best: d.best,
    sounds,
    sound: sounds.includes(d.sound) ? d.sound : 'classic',
  };
};

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

const signed = (data) => JSON.stringify({ data, sig: sign(JSON.stringify(data) + SALT) });

/** Lê um registro assinado; devolve os dados ou null se ausente/editado. */
function readSigned(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const { data, sig } = JSON.parse(raw);
  return data && sig === sign(JSON.stringify(data) + SALT) ? data : null;
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
        const d = normalize(data, themeIds, soundIds);
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
    }, themeIds, soundIds);
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
    const body = signed(data);
    // Evita gravar o mesmo conteúdo (e o "ping-pong" de eventos entre abas)
    if (localStorage.getItem(SAVE_KEY) !== body) localStorage.setItem(SAVE_KEY, body);
  } catch {
    /* armazenamento indisponível */
  }
}

/* ---------- Partida em andamento ----------
 * Salva tabuleiro, peças e pontuação a cada jogada, para que a partida continue
 * se o Android fechar o app em segundo plano. Usa a mesma assinatura do progresso
 * (a pontuação vira recorde no fim da partida).
 */
export const GAME_KEY = 'tb_game_v1';

const isInt = (v, min, max) => Number.isSafeInteger(v) && v >= min && v <= max;

function validPiece(p, size, colors) {
  return (
    p && isInt(p.w, 1, size) && isInt(p.h, 1, size) && isInt(p.color, 0, colors - 1) &&
    Array.isArray(p.cells) && p.cells.length > 0 &&
    p.cells.every((c) => Array.isArray(c) && c.length === 2 && isInt(c[0], 0, p.h - 1) && isInt(c[1], 0, p.w - 1))
  );
}

function validGame(d, size, colors) {
  return (
    d &&
    Array.isArray(d.grid) && d.grid.length === size &&
    d.grid.every((row) => Array.isArray(row) && row.length === size && row.every((v) => v === null || isInt(v, 0, colors - 1))) &&
    Array.isArray(d.pieces) && d.pieces.length === 3 &&
    d.pieces.every((p) => p === null || validPiece(p, size, colors)) &&
    d.pieces.some(Boolean) &&
    isInt(d.score, 0, Number.MAX_SAFE_INTEGER) &&
    isInt(d.streak, 0, Number.MAX_SAFE_INTEGER) &&
    isInt(d.missCount, 0, Number.MAX_SAFE_INTEGER)
  );
}

/** Grava a partida. grid: células { color } ou null; pieces: até 3 peças ou null. */
export function saveGame({ grid, pieces, score, streak, missCount }) {
  const data = {
    grid: grid.map((row) => row.map((v) => (v ? v.color : null))),
    pieces: pieces.map((p) => (p ? { cells: p.cells, w: p.w, h: p.h, color: p.color } : null)),
    score,
    streak,
    missCount,
  };
  try {
    const body = signed(data);
    if (localStorage.getItem(GAME_KEY) !== body) localStorage.setItem(GAME_KEY, body);
  } catch {
    /* armazenamento indisponível */
  }
}

/**
 * Lê a partida salva. Devolve null se não houver, ou se estiver inválida/editada.
 * As células voltam como { color, t: -1 } (sem animação de encaixe) e as peças sem id
 * (quem chama atribui ids novos).
 */
export function loadGame(size, colors) {
  try {
    const d = readSigned(GAME_KEY);
    if (!validGame(d, size, colors)) return null;
    return {
      grid: d.grid.map((row) => row.map((v) => (v === null ? null : { color: v, t: -1 }))),
      pieces: d.pieces,
      score: d.score,
      streak: d.streak,
      missCount: d.missCount,
    };
  } catch {
    return null;
  }
}

export function clearGame() {
  try {
    localStorage.removeItem(GAME_KEY);
  } catch {
    /* armazenamento indisponível */
  }
}
