// Motor de efeitos sonoros 100% sintetizado via Web Audio API.

let ctx = null;
let master = null;
let previewOut = null; // saída da prévia da loja (toca mesmo com o jogo no mudo)
let bus = null; // saída atual das vozes (master ou previewOut)
let verbIn = null; // envio de reverb da saída atual
let masterVerb = null;
let previewVerb = null;
let noiseBuffer = null;
let muted = false;
let placePack = 'classic';
let level = 1; // ganho do som atual (mixagem entre os efeitos, ver run())
const MASTER_VOL = 0.55;

/** Resposta de impulso sintética: sala pequena e clara (~0,7 s), estéreo. */
function makeImpulse(seconds = 0.7, decay = 3.2) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return ir;
}

/** Cria uma saída (volume + reverb próprio) que desemboca na cadeia final. */
function makeOutput(vol, chain) {
  const out = ctx.createGain();
  out.gain.value = vol;
  out.connect(chain);
  const verb = ctx.createConvolver();
  verb.buffer = makeImpulse();
  const wet = ctx.createGain();
  wet.gain.value = 0.55;
  // Reverb só nos médios/agudos: grave com reverb embola e tira o "punch"
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 450;
  hp.connect(verb).connect(wet).connect(out);
  return { out, verbIn: hp };
}

/** Linear até 0,7; acima disso arredonda suavemente até 1 (nunca estoura). */
function softClipCurve(n = 2048, knee = 0.7) {
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    const ax = Math.abs(x);
    const y = ax <= knee ? ax : knee + (1 - knee) * Math.tanh((ax - knee) / (1 - knee));
    curve[i] = Math.sign(x) * y;
  }
  return curve;
}

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: 'interactive' });
    // Cadeia final: EQ leve (corpo + brilho) → saturação suave como proteção contra clipping.
    // Não usamos DynamicsCompressor: no Chrome/Android ele "come" o ataque de sons curtos
    // (medimos até -16 dB no transiente), e era isso que deixava o encaixe fraco/abafado.
    const low = ctx.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = 160;
    low.gain.value = 3;
    const high = ctx.createBiquadFilter();
    high.type = 'highshelf';
    high.frequency.value = 6000;
    high.gain.value = 2;
    const clip = ctx.createWaveShaper();
    clip.curve = softClipCurve();
    clip.oversample = '2x';
    low.connect(high).connect(clip).connect(ctx.destination);

    const m = makeOutput(muted ? 0 : MASTER_VOL, low);
    const p = makeOutput(MASTER_VOL, low);
    master = m.out;
    masterVerb = m.verbIn;
    previewOut = p.out;
    previewVerb = p.verbIn;
    bus = master;
    verbIn = masterVerb;
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

/** Pequena variação aleatória: repetir o mesmo som idêntico soa "de robô". */
const vary = (amount = 0.04) => 1 + (Math.random() * 2 - 1) * amount;

/** Liga a voz à saída atual (e ao reverb, na proporção `rev`). */
function route(node, rev) {
  node.connect(bus);
  if (rev > 0) {
    const s = ctx.createGain();
    s.gain.value = rev;
    node.connect(s).connect(verbIn);
  }
}

/** Oscilador com envelope (ataque rápido + decaimento exponencial). */
function tone({ type = 'sine', f, f2, at = 0, dur = 0.2, vol = 0.2, attack = 0.004, detune = 0, rev = 0, glide }) {
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + (glide ?? dur));
  o.detune.value = detune;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol * level, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  route(g, rev);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** Rajada de ruído filtrado (freq2: varredura do filtro, ex. "whoosh"). */
function hiss({ at = 0, dur = 0.05, vol = 0.2, type = 'bandpass', freq = 3000, freq2, q = 1, attack = 0.002, rev = 0 }) {
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noise();
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (freq2) f.frequency.exponentialRampToValueAtTime(freq2, t + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol * level, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g);
  route(g, rev);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

/** Tilintar metálico de uma moeda: parciais inarmônicos com decaimento rápido. */
function clink(at, vol, f) {
  [1, 1.47, 2.09, 2.76].forEach((m, i) =>
    tone({ type: 'sine', f: f * m, at, dur: 0.2 - i * 0.035, vol: vol / (i + 1), attack: 0.001, rev: 0.25 }),
  );
  hiss({ at, dur: 0.01, vol: vol * 0.5, type: 'highpass', freq: 7000, q: 0.7 });
}

/** Nota "de sino/marimba" afinada: fundamental + harmônicos que somem rápido. */
function bell(f, at, vol, dur = 0.45, rev = 0.35) {
  tone({ type: 'sine', f, at, dur, vol, attack: 0.002, rev });
  tone({ type: 'sine', f: f * 2, at, dur: dur * 0.5, vol: vol * 0.35, attack: 0.001, rev });
  tone({ type: 'triangle', f: f * 3.01, at, dur: dur * 0.18, vol: vol * 0.18, attack: 0.001, rev });
}

/** Toca `fn` com o ganho de mixagem `gain` (equilíbrio entre os efeitos). */
function run(fn, gain = 1) {
  if (muted) return;
  if (!ac()) return;
  const prev = level;
  level = prev * gain;
  try { fn(); } catch { /* ignora falhas de áudio */ }
  level = prev;
}

/** Graus da escala maior em semitons (o acorde da limpeza sobe por eles a cada streak). */
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11, 12];

/** Escala pentatônica maior (C): qualquer combinação de notas soa bem junta. */

/* ---------- Pacotes de som de encaixe (vendidos na loja) ---------- */
// Cada encaixe tem 3 camadas: transiente (clique bem curto que dá o "punch"),
// corpo (o material) e grave (o peso). Peças maiores soam mais graves e cheias.
const PLACE_SOUNDS = {
  /** Pop-thock (padrão): "tóc" médio e cheio que desce de tom, com um grave por baixo. */
  classic(size) {
    const k = Math.min(size, 9);
    const v = vary();
    const f = (600 - k * 16) * v; // peças maiores: um pouco mais grave
    hiss({ dur: 0.008, vol: 0.45, type: 'highpass', freq: 4500, q: 0.7, attack: 0.0005 });
    hiss({ dur: 0.035, vol: 0.3, type: 'bandpass', freq: 1800 * v, q: 1.5, attack: 0.001 });
    tone({ type: 'sine', f, f2: f * 0.55, glide: 0.08, dur: 0.12, vol: 0.6, attack: 0.0015, rev: 0.08 });
    tone({ type: 'triangle', f: f * 2, f2: f * 1.1, glide: 0.05, dur: 0.05, vol: 0.1, attack: 0.001 });
    tone({ type: 'sine', f: 140 * v, f2: 60, glide: 0.06, dur: 0.1 + k * 0.006, vol: 0.5, attack: 0.001 });
  },
  /** Bloco de madeira: "toc" seco e ressonante. */
  wood(size) {
    const k = Math.min(size, 9);
    const f = (800 - k * 26) * vary(0.03);
    hiss({ dur: 0.014, vol: 0.4, type: 'bandpass', freq: 2600, q: 2.2, attack: 0.0005 });
    tone({ type: 'sine', f, f2: f * 0.96, dur: 0.1, vol: 0.5, attack: 0.001, rev: 0.12 });
    tone({ type: 'sine', f: f * 2.71, dur: 0.035, vol: 0.13, attack: 0.001 });
    tone({ type: 'triangle', f: f * 0.5, f2: f * 0.42, dur: 0.07, vol: 0.28, attack: 0.001 });
    tone({ type: 'sine', f: 120, f2: 60, dur: 0.07, vol: 0.35, attack: 0.001 });
  },
  /** Bolha: "plop" com o tom subindo. */
  bubble(size) {
    const k = Math.min(size, 9);
    const f = (250 + (9 - k) * 22) * vary(0.05);
    hiss({ dur: 0.01, vol: 0.18, type: 'highpass', freq: 3500, q: 0.7, attack: 0.0005 });
    tone({ type: 'sine', f, f2: f * 3.4, glide: 0.06, dur: 0.1, vol: 0.55, attack: 0.002, rev: 0.15 });
    tone({ type: 'sine', f: f * 2, f2: f * 5, at: 0.022, dur: 0.07, vol: 0.14, attack: 0.002, rev: 0.2 });
    tone({ type: 'sine', f: 110, f2: 55, dur: 0.08, vol: 0.4, attack: 0.001 });
  },
  /** Cristal: sininho de vidro curto e brilhante — cada tamanho de peça é uma nota. */
  crystal(size) {
    const notes = [2093, 1976, 1760, 1568, 1397, 1319, 1175, 1047, 988];
    const f = notes[Math.min(size, 9) - 1] ?? 1568;
    hiss({ dur: 0.008, vol: 0.3, type: 'highpass', freq: 6000, q: 0.7, attack: 0.0005 });
    [1, 2.0, 3.01, 4.2].forEach((m, i) =>
      tone({ type: 'sine', f: f * m, dur: 0.55 - i * 0.11, vol: 0.2 / (i + 1), attack: 0.001, rev: 0.4 }),
    );
    tone({ type: 'sine', f: 130, f2: 65, dur: 0.08, vol: 0.45, attack: 0.001 });
  },
};

export const sound = {
  unlock() { ac(); },

  /** Pausa o áudio (app em segundo plano). O próximo toque chama unlock() e retoma. */
  suspend() {
    if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
  },

  setMuted(m) {
    muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : MASTER_VOL, ctx.currentTime, 0.02);
  },

  /** "Tk" curto e leve ao pegar a peça. */
  pick() {
    run(() => {
      const v = vary(0.06);
      hiss({ dur: 0.02, vol: 0.4, type: 'bandpass', freq: 2800 * v, q: 2, attack: 0.0005 });
      tone({ type: 'sine', f: 700 * v, f2: 1150 * v, glide: 0.03, dur: 0.05, vol: 0.28, attack: 0.001 });
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
        verbIn = previewVerb;
        try { fn(size); } catch { /* ignora */ }
        bus = master;
        verbIn = masterVerb;
      }, i * 230),
    );
  },

  /**
   * Moeda(s) de ouro ao ganhar no encaixe: "bling" de moeda + tilintar metálico.
   * Fica por trás do encaixe (que é o som principal) — peças maiores soltam 2–3 moedinhas.
   */
  coin(blocks = 1) {
    run(() => {
      tone({ type: 'triangle', f: 1976, at: 0.035, dur: 0.05, vol: 0.05, attack: 0.001 });
      tone({ type: 'sine', f: 2637, at: 0.08, dur: 0.3, vol: 0.075, attack: 0.001, rev: 0.3 });
      const extra = blocks >= 6 ? 2 : blocks >= 3 ? 1 : 0;
      for (let i = 0; i <= extra; i++) clink(0.06 + i * 0.07, 0.05, 2700 + Math.random() * 900);
    }, 2.5);
  },

  /**
   * Limpeza de linha(s): estalo + "pop" e um acorde maior brilhante que fica soando (~0,6 s).
   * A cada jogada seguida limpando linhas (streak) o acorde sobe um grau da escala: dá a
   * sensação de "subindo de nível" e dá vontade de manter o combo.
   * Combo (2+ linhas, streak alto ou tabuleiro limpo) ganha um "boom" grave e um whoosh subindo.
   */
  clear(lines = 1, streak = 1, allClear = false) {
    run(() => {
      const step = Math.min(Math.max(streak - 1, 0), MAJOR_STEPS.length - 1);
      const up = Math.pow(2, MAJOR_STEPS[step] / 12);
      const combo = lines >= 2 || streak >= 3 || allClear;
      // Estalo inicial (vidro/blocos quebrando)
      for (let i = 0; i < 3; i++) {
        hiss({ at: i * 0.022, dur: 0.02, vol: 0.32, type: 'highpass', freq: 3500 + i * 1500, q: 0.8, attack: 0.0005 });
      }
      // "Pop" que desce
      tone({ type: 'sine', f: 660 * up, f2: 300 * up, at: 0.05, glide: 0.1, dur: 0.14, vol: 0.45, attack: 0.002 });
      // Acorde maior (C-E-G em 2–3 oitavas), cada nota com um par levemente desafinado = brilho
      const chord = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      if (lines >= 2 || allClear) chord.push(2093);
      chord.forEach((f, i) => {
        const vol = (i >= 3 ? 0.075 : 0.06) * (combo ? 1.25 : 1);
        const at = 0.04 + i * 0.012;
        const dur = 0.6 + (combo ? 0.35 : 0);
        tone({ type: 'sine', f: f * up, at, dur, vol, attack: 0.008, detune: -6, rev: 0.45 });
        tone({ type: 'sine', f: f * up, at, dur: dur * 0.85, vol: vol * 0.6, attack: 0.008, detune: 7, rev: 0.45 });
      });
      if (!combo) return;
      // Stinger de combo: boom grave + whoosh subindo + nota de baixo
      tone({ type: 'sine', f: 78, f2: 34, glide: 0.45, dur: 0.6, vol: 0.9, attack: 0.003 });
      hiss({ dur: 0.3, vol: 0.4, type: 'lowpass', freq: 1800, freq2: 150, q: 0.7, attack: 0.002 });
      hiss({ dur: 0.45, vol: 0.18, type: 'bandpass', freq: 800, freq2: 8000, q: 1.2, attack: 0.05, rev: 0.5 });
      tone({ type: 'triangle', f: 392 * up, at: 0.04, dur: 0.9, vol: 0.12, attack: 0.01, rev: 0.3 });
      if (allClear) {
        [1046.5, 1318.51, 1567.98, 2093, 2637].forEach((f, i) => bell(f * up, 0.3 + i * 0.05, 0.08, 0.6, 0.5));
      }
    }, 1.6);
  },

  /** Chuva de moedas de ouro ao limpar linhas/combos (camada de fundo). intensity: 1..6 */
  coinShower(intensity = 1) {
    run(() => {
      const lift = Math.pow(2, Math.min(intensity - 1, 5) / 12);
      // "Bling" de abertura
      tone({ type: 'triangle', f: 1976 * lift, at: 0.08, dur: 0.06, vol: 0.04 });
      tone({ type: 'sine', f: 2637 * lift, at: 0.135, dur: 0.45, vol: 0.06, rev: 0.3 });
      // Cascata de moedas caindo e se empilhando (tempo acelera, tom desce)
      const count = 5 + intensity * 3;
      const span = 0.4 + intensity * 0.1;
      for (let i = 0; i < count; i++) {
        const k = i / count;
        const at = 0.15 + span * Math.pow(k, 0.8) + Math.random() * 0.025;
        const f = 3300 - k * 1200 + (Math.random() - 0.5) * 700;
        clink(at, 0.04 + Math.random() * 0.035, f);
      }
      // Moedas "assentando" na pilha
      clink(0.17 + span, 0.07, 1900);
      clink(0.23 + span, 0.05, 1650);
    }, 2);
  },

  /** Soltou fora de lugar: "bonk" abafado. */
  invalid() {
    run(() => {
      tone({ type: 'sine', f: 190, f2: 120, dur: 0.11, vol: 0.5, attack: 0.002 });
      hiss({ dur: 0.04, vol: 0.14, type: 'lowpass', freq: 700, q: 0.7 });
    });
  },

  purchase() {
    run(() => {
      sound.coinShower(4);
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(f, 0.3 + i * 0.08, 0.14, 0.5));
      [1046.5, 1318.51, 1567.98].forEach((f) => bell(f, 0.62, 0.07, 1, 0.5));
    });
  },

  equip() {
    run(() => {
      bell(880, 0, 0.12, 0.25);
      bell(1318.51, 0.07, 0.12, 0.35);
    });
  },

  gameOver() {
    run(() => {
      [392, 330, 262, 196].forEach((f, i) =>
        tone({ type: 'triangle', f, at: i * 0.17, dur: 0.45, vol: 0.16, rev: 0.4 }),
      );
      tone({ type: 'sine', f: 98, f2: 80, at: 0.62, dur: 0.9, vol: 0.3 });
    });
  },

  /** Nova leva de peças chegando na bandeja. */
  newSet() {
    run(() => {
      [783.99, 1046.5, 1318.51].forEach((f, i) => bell(f, i * 0.045, 0.06, 0.2, 0.2));
      hiss({ dur: 0.12, vol: 0.06, type: 'bandpass', freq: 1500, freq2: 4500, q: 1, attack: 0.02 });
    }, 2);
  },
};
