// Sound effects, synthesized live with Web Audio: no files, no licences, a few hundred lines.
// Stylised on purpose (like the engravings): short, dry, recognisable. Every sound is one function.
import { audioContext } from './audio';

export type Sfx =
  | 'diceRoll' | 'reroll' | 'dieTap'
  | 'hitCut' | 'hitBlunt' | 'hitPierce' | 'bigHit'
  | 'partBreak' | 'daze' | 'expose' | 'iceBreak' | 'iceGone'
  | 'guard' | 'charge' | 'swap' | 'item' | 'capture'
  | 'hurt' | 'hurtHeavy' | 'forge' | 'coin';

let bus: GainNode | null = null;
let volume = 0.8;
let noiseBuf: AudioBuffer | null = null;

function ctx(): AudioContext | null {
  const c = audioContext();
  if (!c) return null;
  if (!bus) { bus = c.createGain(); bus.gain.value = volume; bus.connect(c.destination); }
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return c;
}

export function setSfxVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  const c = audioContext(); if (bus && c) bus.gain.setTargetAtTime(volume, c.currentTime, 0.03);
}

/* ---------- building blocks ---------- */
type Env = { a?: number; d: number; peak?: number };
function env(c: AudioContext, t: number, { a = 0.002, d, peak = 1 }: Env) {
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  g.connect(bus!);
  return g;
}
/** A tone, optionally sliding from f0 to f1. */
function tone(c: AudioContext, t: number, f0: number, f1: number, e: Env, type: OscillatorType = 'sine') {
  const o = c.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + (e.a ?? 0.002) + e.d);
  o.connect(env(c, t, e)); o.start(t); o.stop(t + (e.a ?? 0.002) + e.d + 0.05);
}
/** Filtered noise: 'bandpass' | 'lowpass' | 'highpass', with an optional filter sweep. */
function noise(c: AudioContext, t: number, type: BiquadFilterType, f0: number, f1: number, e: Env, q = 1) {
  const src = c.createBufferSource(); src.buffer = noiseBuf; src.playbackRate.value = 0.9 + Math.random() * 0.2;
  const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + (e.a ?? 0.002) + e.d);
  src.connect(f).connect(env(c, t, e));
  src.start(t, Math.random() * 0.5); src.stop(t + (e.a ?? 0.002) + e.d + 0.05);
}
/** Inharmonic partials: metal, bells, glass. */
function partials(c: AudioContext, t: number, freqs: number[], d: number, peak: number) {
  freqs.forEach((f, i) => tone(c, t, f, f, { d: d * (1 - i * 0.12), peak: peak / (i + 1) }));
}
const jitter = (x: number, amt = 0.08) => x * (1 + (Math.random() * 2 - 1) * amt);

/* ---------- the sounds ---------- */
const SOUNDS: Record<Sfx, (c: AudioContext, t: number) => void> = {
  // dice: a run of wooden knocks that slows and settles (matches the 0.45 s tumble animation)
  diceRoll: (c, t) => {
    let at = t;
    for (let i = 0; i < 9; i++) {
      noise(c, at, 'bandpass', jitter(1800, 0.3), jitter(1800, 0.3), { d: 0.025, peak: 0.5 - i * 0.03 }, 6);
      at += 0.025 + i * 0.008 + Math.random() * 0.015;
    }
    noise(c, at, 'bandpass', 900, 900, { d: 0.06, peak: 0.45 }, 3);
    tone(c, at, 180, 120, { d: 0.06, peak: 0.25 });
  },
  reroll: (c, t) => {
    let at = t;
    for (let i = 0; i < 5; i++) { noise(c, at, 'bandpass', jitter(2000, 0.3), jitter(2000, 0.3), { d: 0.02, peak: 0.4 }, 6); at += 0.03 + i * 0.01; }
    noise(c, at, 'bandpass', 950, 950, { d: 0.05, peak: 0.35 }, 3);
  },
  dieTap: (c, t) => { noise(c, t, 'bandpass', 2400, 2400, { d: 0.02, peak: 0.25 }, 8); },

  // weapon types: Cut swishes, Blunt thuds, Pierce twangs
  hitCut: (c, t) => {
    noise(c, t, 'bandpass', 1800, 6500, { a: 0.03, d: 0.11, peak: 0.45 }, 1.5);
    noise(c, t + 0.1, 'highpass', 3000, 3000, { d: 0.04, peak: 0.25 });
  },
  hitBlunt: (c, t) => {
    tone(c, t, 140, 45, { d: 0.22, peak: 0.85 });
    noise(c, t, 'lowpass', 900, 300, { d: 0.12, peak: 0.45 });
  },
  hitPierce: (c, t) => {
    tone(c, t, 980, 420, { d: 0.05, peak: 0.25 }, 'triangle');
    noise(c, t, 'highpass', 4000, 4000, { d: 0.03, peak: 0.2 });
    tone(c, t + 0.07, 220, 90, { d: 0.09, peak: 0.55 });
    noise(c, t + 0.07, 'bandpass', 700, 400, { d: 0.06, peak: 0.3 }, 2);
  },
  bigHit: (c, t) => { tone(c, t + 0.02, 70, 32, { d: 0.45, peak: 0.7 }); },

  partBreak: (c, t) => {
    noise(c, t, 'bandpass', 1200, 500, { d: 0.18, peak: 0.8 }, 1.2);
    tone(c, t, 90, 40, { d: 0.3, peak: 0.6 });
    for (let i = 0; i < 5; i++) noise(c, t + 0.08 + i * 0.05 + Math.random() * 0.03, 'bandpass', jitter(2600, 0.3), jitter(2600, 0.3), { d: 0.02, peak: 0.22 }, 6);
  },
  daze: (c, t) => {
    partials(c, t, [660, 990, 1485], 0.7, 0.3);
    tone(c, t + 0.05, 700, 640, { a: 0.02, d: 0.6, peak: 0.12 }, 'triangle');
  },
  expose: (c, t) => { tone(c, t, 1320, 1320, { d: 0.18, peak: 0.25 }); tone(c, t + 0.05, 1980, 1980, { d: 0.14, peak: 0.12 }); },
  iceBreak: (c, t) => {
    partials(c, t, [jitter(3100), jitter(4300), jitter(5600)], 0.16, 0.25);
    noise(c, t, 'highpass', 5000, 5000, { d: 0.07, peak: 0.35 });
  },
  iceGone: (c, t) => {
    for (let i = 0; i < 6; i++) partials(c, t + i * 0.035, [jitter(2600 + i * 300), jitter(4000 + i * 250)], 0.18, 0.2);
    noise(c, t, 'highpass', 4500, 2500, { d: 0.25, peak: 0.35 });
  },

  guard: (c, t) => { partials(c, t, [410, 1180, 2090], 0.28, 0.45); noise(c, t, 'bandpass', 2500, 2500, { d: 0.02, peak: 0.3 }, 2); },
  charge: (c, t) => { noise(c, t, 'bandpass', 300, 2200, { a: 0.3, d: 0.15, peak: 0.4 }, 3); tone(c, t, 110, 220, { a: 0.3, d: 0.15, peak: 0.2 }, 'triangle'); },
  swap: (c, t) => {
    noise(c, t, 'bandpass', 1200, 4000, { a: 0.02, d: 0.07, peak: 0.3 }, 1.5);
    noise(c, t + 0.1, 'bandpass', 1500, 5000, { a: 0.02, d: 0.07, peak: 0.3 }, 1.5);
  },
  item: (c, t) => { tone(c, t, 320, 680, { d: 0.08, peak: 0.4 }); noise(c, t, 'bandpass', 1500, 1500, { d: 0.03, peak: 0.2 }, 3); },
  capture: (c, t) => {
    tone(c, t, 260, 180, { d: 0.25, peak: 0.35 }, 'triangle');
    noise(c, t + 0.05, 'lowpass', 600, 200, { d: 0.25, peak: 0.5 });
    tone(c, t + 0.12, 90, 45, { d: 0.3, peak: 0.6 });
  },

  hurt: (c, t) => { tone(c, t, 120, 60, { d: 0.16, peak: 0.55 }); noise(c, t, 'lowpass', 1200, 400, { d: 0.09, peak: 0.35 }); },
  hurtHeavy: (c, t) => {
    tone(c, t, 100, 35, { d: 0.4, peak: 0.85 });
    noise(c, t, 'lowpass', 1600, 250, { d: 0.25, peak: 0.6 });
  },

  // town
  forge: (c, t) => { partials(c, t, [1040, 2710, 4020], 0.5, 0.4); partials(c, t + 0.22, [1040, 2710], 0.35, 0.18); },
  coin: (c, t) => { partials(c, t, [2400, 3600], 0.15, 0.25); partials(c, t + 0.07, [2600, 3900], 0.15, 0.2); }
};

/** Play one or more sounds now (later ones offset slightly so they don't mask each other). */
export function sfx(...names: Sfx[]) {
  const c = ctx(); if (!c || !volume) return;
  names.forEach((n, i) => SOUNDS[n](c, c.currentTime + 0.01 + i * 0.03));
}
