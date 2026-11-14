// Motor de efeitos sonoros 100% sintetizado via Web Audio API.

let ctx = null;
let master = null;
let previewOut = null; // saída da prévia da loja (toca mesmo com o jogo no mudo)
let bus = null; // saída atual das vozes (master ou previewOut)
let noiseBuffer = null;
let muted = false;
let placePack = 'classic';

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.7;
    previewOut = ctx.createGain();
    previewOut.gain.value = 0.7;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 12;
    comp.ratio.value = 5;
    master.connect(comp);
    previewOut.connect(comp);
    comp.connect(ctx.destination);
    bus = master;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noise() {
  if (!noiseBuffer) {
    const len = ctx.sampleRate;
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/** Oscilador com envelope (ataque rápido + decaimento exponencial). */
function tone({ type = 'sine', f, f2, at = 0, dur = 0.2, vol = 0.2, attack = 0.004, detune = 0 }) {
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  o.detune.value = detune;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** Rajada de ruído filtrado. */
function hiss({ at = 0, dur = 0.05, vol = 0.2, type = 'bandpass', freq = 3000, q = 1 }) {
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noise();
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(bus);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

/** Tilintar metálico de uma moeda: parciais inarmônicos com decaimento rápido. */
function clink(at, vol, f) {
  [1, 1.47, 2.09, 2.76].forEach((m, i) =>
    tone({ type: 'sine', f: f * m, at, dur: 0.22 - i * 0.04, vol: vol / (i + 1), attack: 0.001 }),
  );
  hiss({ at, dur: 0.012, vol: vol * 0.6, type: 'highpass', freq: 6000, q: 0.7 });
}

function run(fn) {
  if (muted) return;
  if (!ac()) return;
  try { fn(); } catch { /* ignora falhas de áudio */ }
}

/* ---------- Pacotes de som de encaixe (vendidos na loja) ---------- */
const PLACE_SOUNDS = {
  /** Thock grave e macio (padrão). */
  classic(size) {
    const base = 210 - Math.min(size, 9) * 9;
    tone({ type: 'sine', f: base, f2: base * 0.42, dur: 0.16, vol: 0.55, attack: 0.002 });
    tone({ type: 'triangle', f: base * 2.1, f2: base, dur: 0.06, vol: 0.12, attack: 0.002 });
    hiss({ dur: 0.035, vol: 0.18, type: 'lowpass', freq: 1400, q: 0.7 });
  },
  /** Bloco de madeira: "toc" seco e ressonante. */
  wood(size) {
    const f = 880 - Math.min(size, 9) * 28;
    tone({ type: 'sine', f, f2: f * 0.94, dur: 0.11, vol: 0.38, attack: 0.001 });
    tone({ type: 'sine', f: f * 2.76, dur: 0.04, vol: 0.09, attack: 0.001 });
    tone({ type: 'triangle', f: f * 0.5, f2: f * 0.45, dur: 0.07, vol: 0.18, attack: 0.001 });
    hiss({ dur: 0.018, vol: 0.28, type: 'bandpass', freq: 2200, q: 2.5 });
  },
  /** Bolha: "plop" com o tom subindo. */
  bubble(size) {
    const f = 260 + Math.max(0, 9 - Math.min(size, 9)) * 22;
    tone({ type: 'sine', f, f2: f * 3.2, dur: 0.09, vol: 0.42, attack: 0.002 });
    tone({ type: 'sine', f: f * 2, f2: f * 5, at: 0.025, dur: 0.07, vol: 0.12, attack: 0.002 });
    hiss({ dur: 0.012, vol: 0.12, type: 'highpass', freq: 3500, q: 0.7 });
  },
  /** Cristal: sininho de vidro curto e brilhante. */
  crystal(size) {
    const notes = [2093, 1976, 1760, 1568, 1397, 1319, 1175, 1047, 988];
    const f = notes[Math.min(size, 9) - 1] ?? 1568;
    [1, 2.0, 3.01, 4.2].forEach((m, i) =>
      tone({ type: 'sine', f: f * m, dur: 0.5 - i * 0.1, vol: 0.18 / (i + 1), attack: 0.001 }),
    );
    tone({ type: 'sine', f: 120, f2: 70, dur: 0.07, vol: 0.25, attack: 0.002 });
  },
};

export const sound = {
  unlock() { ac(); },

  setMuted(m) {
    muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.7, ctx.currentTime, 0.02);
  },

  /** Clique leve e agudo ao pegar a peça. */
  pick() {
    run(() => {
      tone({ type: 'triangle', f: 1500, f2: 2300, dur: 0.05, vol: 0.12 });
      hiss({ dur: 0.02, vol: 0.05, freq: 6000, q: 2 });
    });
  },

  /** Som de encaixe do pacote equipado. */
  place(size = 4) {
    run(() => (PLACE_SOUNDS[placePack] ?? PLACE_SOUNDS.classic)(size));
  },

  setPlacePack(id) {
    placePack = PLACE_SOUNDS[id] ? id : 'classic';
  },

  /** Prévia na loja: 3 encaixes (peça pequena, média e grande). Toca mesmo no mudo. */
  previewPlace(id) {
    if (!ac()) return;
    const fn = PLACE_SOUNDS[id] ?? PLACE_SOUNDS.classic;
    [1, 4, 9].forEach((size, i) =>
      setTimeout(() => {
        bus = previewOut;
        try { fn(size); } catch { /* ignora */ }
        bus = master;
      }, i * 230),
    );
  },

  /**
   * Moeda(s) de ouro ao ganhar no encaixe: "bling" de moeda + tilintar metálico.
   * Peças maiores soltam 2–3 moedinhas em sequência.
   */
  coin(blocks = 1) {
    run(() => {
      tone({ type: 'square', f: 1976, at: 0.03, dur: 0.06, vol: 0.03 });
      tone({ type: 'square', f: 2637, at: 0.085, dur: 0.24, vol: 0.03 });
      tone({ type: 'sine', f: 2637, at: 0.085, dur: 0.32, vol: 0.06 });
      const extra = blocks >= 6 ? 2 : blocks >= 3 ? 1 : 0;
      for (let i = 0; i <= extra; i++) clink(0.06 + i * 0.07, 0.11, 2700 + Math.random() * 900);
    });
  },

  /** Chuva de moedas de ouro ao limpar linhas/combos. intensity: 1..6 */
  coinShower(intensity = 1) {
    run(() => {
      const lift = Math.pow(2, Math.min(intensity - 1, 5) / 12);
      // "Bling" de abertura
      tone({ type: 'square', f: 1976 * lift, dur: 0.06, vol: 0.035 });
      tone({ type: 'square', f: 2637 * lift, at: 0.055, dur: 0.3, vol: 0.035 });
      tone({ type: 'sine', f: 2637 * lift, at: 0.055, dur: 0.45, vol: 0.08 });
      // Cascata de moedas caindo e se empilhando (tempo acelera, tom desce)
      const count = 6 + intensity * 4;
      const span = 0.45 + intensity * 0.12;
      for (let i = 0; i < count; i++) {
        const k = i / count;
        const at = 0.08 + span * Math.pow(k, 0.8) + Math.random() * 0.025;
        const f = 3300 - k * 1200 + (Math.random() - 0.5) * 700;
        clink(at, 0.06 + Math.random() * 0.05, f);
      }
      // Moedas "assentando" na pilha
      clink(0.1 + span, 0.1, 1900);
      clink(0.16 + span, 0.07, 1650);
      // Brilho extra em combos
      if (intensity >= 2) {
        const notes = [1319, 1568, 1976, 2637, 3136, 3951];
        notes.slice(0, Math.min(2 + intensity, 6)).forEach((f, i) =>
          tone({ type: 'triangle', f: f * lift, at: 0.12 + i * 0.055, dur: 0.25, vol: 0.06 }),
        );
      }
    });
  },

  invalid() {
    run(() => {
      tone({ type: 'sine', f: 240, f2: 170, dur: 0.12, vol: 0.12 });
    });
  },

  purchase() {
    run(() => {
      sound.coinShower(4);
      [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', f, at: 0.35 + i * 0.08, dur: 0.35, vol: 0.12 }));
    });
  },

  equip() {
    run(() => {
      tone({ type: 'triangle', f: 880, at: 0, dur: 0.1, vol: 0.1 });
      tone({ type: 'triangle', f: 1320, at: 0.07, dur: 0.18, vol: 0.1 });
    });
  },

  gameOver() {
    run(() => {
      [392, 330, 262, 196].forEach((f, i) => tone({ type: 'triangle', f, at: i * 0.16, dur: 0.4, vol: 0.14 }));
      tone({ type: 'sine', f: 98, at: 0.6, dur: 0.8, vol: 0.2 });
    });
  },

  newSet() {
    run(() => {
      [880, 1175, 1480].forEach((f, i) => tone({ type: 'sine', f, at: i * 0.04, dur: 0.12, vol: 0.05 }));
    });
  },
};
