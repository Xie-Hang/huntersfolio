// Composes the PLACEHOLDER music: 5 tracks synthesized from scratch (no samples, no licences).
// Replace them with real music by dropping files with the same names into public/audio/music/.
//
//   node scripts/compose-placeholder-music.mjs      (needs ffmpeg on the PATH for OGG encoding)
//
// Key: D minor throughout, so the hunt loop and its danger layer always fit together.
// town    80 BPM, 32 bars: plucked arpeggios over a soft pad, a sparse flute line in the second half
// hunt    90 BPM, 32 bars: low drone, heartbeat drum, a creeping pluck figure
// danger  90 BPM, 32 bars: a LAYER played on top of hunt (same length, same grid): driving toms, tense pad
// victory ~5 s: rising arpeggio into a D major chord
// defeat  ~5 s: falling line over a fading drone
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const SR = 44100;
const OUT = join(process.cwd(), 'public', 'audio', 'music');
const TMP = join(tmpdir(), 'hf-music');

/* ---------- tiny deterministic RNG so every render is identical ---------- */
let seed = 1;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = a => a[Math.floor(rand() * a.length)];

/* ---------- pitch ---------- */
const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function hz(name) {
  const m = /^([A-G][b#]?)(-?\d)$/.exec(name);
  const midi = 12 * (Number(m[2]) + 1) + NOTE[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/* ---------- a buffer you can mix into ---------- */
class Track {
  constructor(seconds) { this.len = Math.ceil(seconds * SR); this.d = new Float32Array(this.len + SR * 6); }
  add(start, samples, gain = 1) {
    const s = Math.floor(start * SR);
    for (let i = 0; i < samples.length && s + i < this.d.length; i++) this.d[s + i] += samples[i] * gain;
  }
}

/* ---------- instruments ---------- */
// Karplus–Strong plucked string: warm, a little like a lute or kantele.
function pluck(f, dur = 1.6, bright = 0.5) {
  const n = Math.floor(dur * SR), p = Math.max(2, Math.round(SR / f));
  const buf = new Float32Array(p); for (let i = 0; i < p; i++) buf[i] = rand() * 2 - 1;
  const out = new Float32Array(n), damp = 0.996 - (1 - bright) * 0.006;
  let idx = 0, prev = 0;
  for (let i = 0; i < n; i++) {
    const cur = buf[idx], next = buf[(idx + 1) % p];
    const v = damp * (0.5 * (cur + next));
    buf[idx] = v; out[i] = 0.5 * (cur + prev); prev = cur; idx = (idx + 1) % p;
  }
  for (let i = 0; i < 64 && i < n; i++) out[i] *= i / 64; // soften the attack click
  return out;
}
// Soft pad: a few detuned triangles through a one-pole low-pass, slow swell.
function pad(freqs, dur, attack = 1.2, release = 1.5, cutoff = 900) {
  const n = Math.floor((dur + release) * SR), out = new Float32Array(n);
  const k = 1 - Math.exp(-2 * Math.PI * cutoff / SR); let lp = 0;
  const voices = freqs.flatMap(f => [f, f * 1.003, f * 0.997]);
  const ph = voices.map(() => rand());
  for (let i = 0; i < n; i++) {
    const t = i / SR; let s = 0;
    for (let v = 0; v < voices.length; v++) { ph[v] = (ph[v] + voices[v] / SR) % 1; s += 4 * Math.abs(ph[v] - 0.5) - 1; }
    s /= voices.length;
    lp += k * (s - lp);
    const env = t < attack ? t / attack : t < dur ? 1 : Math.max(0, 1 - (t - dur) / release);
    out[i] = lp * env;
  }
  return out;
}
// Breathy flute: sine with vibrato and a touch of noise.
function flute(f, dur) {
  const n = Math.floor((dur + 0.6) * SR), out = new Float32Array(n); let ph = 0, nz = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, vib = 1 + 0.004 * Math.sin(2 * Math.PI * 5 * t) * Math.min(1, t / 0.4);
    ph += (f * vib) / SR;
    nz = 0.97 * nz + 0.03 * (rand() * 2 - 1);
    const env = Math.min(1, t / 0.15) * (t < dur ? 1 : Math.max(0, 1 - (t - dur) / 0.6));
    out[i] = (Math.sin(2 * Math.PI * ph) * 0.9 + Math.sin(4 * Math.PI * ph) * 0.08 + nz * 0.25) * env;
  }
  return out;
}
// Frame drum / tom: pitch-dropping sine plus a little filtered noise.
function drum(f0 = 110, f1 = 48, decay = 0.35, noise = 0.15) {
  const n = Math.floor(decay * 4 * SR), out = new Float32Array(n); let ph = 0, nz = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = f1 + (f0 - f1) * Math.exp(-t / 0.05);
    ph += f / SR; nz = 0.8 * nz + 0.2 * (rand() * 2 - 1);
    out[i] = (Math.sin(2 * Math.PI * ph) + nz * noise * Math.exp(-t / 0.02)) * Math.exp(-t / decay);
  }
  return out;
}

/* ---------- reverb (Schroeder: 4 combs + 2 all-passes) ---------- */
function reverb(x, mix = 0.25, size = 1) {
  const combs = [1557, 1617, 1491, 1422].map(d => ({ b: new Float32Array(Math.floor(d * size)), i: 0 }));
  const aps = [225, 556].map(d => ({ b: new Float32Array(d), i: 0 }));
  const out = new Float32Array(x.length);
  for (let n = 0; n < x.length; n++) {
    let s = 0;
    for (const c of combs) { const y = c.b[c.i]; c.b[c.i] = x[n] + y * 0.84; c.i = (c.i + 1) % c.b.length; s += y; }
    s /= combs.length;
    for (const a of aps) { const y = a.b[a.i]; const v = s + y * 0.5; a.b[a.i] = v; s = y - 0.5 * v; a.i = (a.i + 1) % a.b.length; }
    out[n] = x[n] * (1 - mix) + s * mix * 2.2;
  }
  return out;
}

/* ---------- finishing ---------- */
// Loops: fold everything that rings past the loop point back onto the start, so the loop is seamless.
// Two-pole low-pass: takes the hiss off the plucked strings for a warmer, softer sound.
function warm(x, cutoff = 6000) {
  const k = 1 - Math.exp(-2 * Math.PI * cutoff / SR); let a = 0, b = 0;
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) { a += k * (x[i] - a); b += k * (a - b); out[i] = b; }
  return out;
}
function finish(track, { loop, wet = 0.25, size = 1 }) {
  let d = warm(reverb(track.d, wet, size));
  if (loop) {
    const out = d.slice(0, track.len);
    for (let i = track.len; i < d.length; i++) out[i - track.len] += d[i];
    d = out;
  } else {
    let end = d.length; while (end > 0 && Math.abs(d[end - 1]) < 1e-4) end--;
    d = d.slice(0, end);
    for (let i = 0; i < 2205 && i < d.length; i++) d[d.length - 1 - i] *= i / 2205;
  }
  return d;
}
const peak = d => d.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const scale = (d, g) => d.map(v => Math.tanh(v * g * 1.1) / Math.tanh(1.1)); // gentle soft-clip limiter

function writeOgg(name, d) {
  const pcm = Buffer.alloc(44 + d.length * 2);
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + d.length * 2, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12);
  pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(SR, 24);
  pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(d.length * 2, 40);
  for (let i = 0; i < d.length; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, d[i])) * 32767), 44 + i * 2);
  const wav = join(TMP, `${name}.wav`); writeFileSync(wav, pcm);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libvorbis', '-q:a', '3', join(OUT, `${name}.ogg`)]);
  console.log(`${name}.ogg  ${(d.length / SR).toFixed(1)} s`);
}

/* ---------- harmony ---------- */
const CHORDS = {
  Dm: ['D3', 'F3', 'A3'], Bb: ['Bb2', 'D3', 'F3'], F: ['F2', 'A2', 'C3'], C: ['C3', 'E3', 'G3'],
  Gm: ['G2', 'Bb2', 'D3'], A: ['A2', 'C#3', 'E3'], Asus: ['A2', 'D3', 'E3']
};
const up = (n, o) => n.replace(/-?\d$/, d => String(Number(d) + o));

/* ---------- town: 80 BPM, 32 bars ---------- */
function town() {
  seed = 11;
  const beat = 60 / 80, bar = beat * 4, bars = 32, t = new Track(bars * bar);
  const prog = ['Dm', 'Bb', 'F', 'C', 'Dm', 'Gm', 'Bb', 'Asus'];
  for (let b = 0; b < bars; b += 2) {
    const ch = CHORDS[prog[(b / 2) % prog.length]], at = b * bar;
    t.add(at, pad(ch.map(hz), bar * 2, 1.5, 2), 0.16);
    t.add(at, pluck(hz(up(ch[0], -1)), 3, 0.3), 0.35); // bass
    const arp = [...ch, ...ch.map(n => up(n, 1))];
    for (let e = 0; e < 16; e++) {                       // eighth-note arpeggio, a few gaps
      if (rand() < 0.18) continue;
      const n = e % 8 === 0 ? arp[0] : pick(arp);
      t.add(at + e * beat / 2, pluck(hz(up(n, 1)), 1.4, 0.55), e % 4 === 0 ? 0.32 : 0.22);
    }
  }
  const melody = ['D5', 'F5', 'E5', 'C5', 'D5', 'A4', 'Bb4', 'A4', 'F5', 'G5', 'F5', 'E5', 'D5', 'C5', 'A4', 'D5'];
  for (let i = 0; i < melody.length; i++) {             // flute enters in the second half
    if (i % 4 === 3) continue;
    t.add((16 + i) * bar + beat * (i % 2), flute(hz(melody[i]), beat * 2.5), 0.13);
  }
  return finish(t, { loop: true, wet: 0.3, size: 1.1 });
}

/* ---------- hunt + danger: 90 BPM, 32 bars, same grid ---------- */
function hunt() {
  seed = 23;
  const beat = 60 / 90, bar = beat * 4, bars = 32, t = new Track(bars * bar);
  const plan = ['Dm', 'Dm', 'Dm', 'Dm', 'Bb', 'Bb', 'C', 'C'];
  for (let b = 0; b < bars; b += 4) {
    const ch = CHORDS[plan[(b / 4) % plan.length]];
    t.add(b * bar, pad([hz(up(ch[0], -1)), hz(up(ch[0], -1)) * 1.5], bar * 4, 2, 2.5, 500), 0.28); // drone root + fifth
  }
  for (let b = 0; b < bars; b++) {
    for (const k of [0, 2]) t.add(b * bar + k * beat, drum(90, 45, 0.3, 0.1), k === 0 ? 0.42 : 0.26); // heartbeat
    if (b % 2 === 1) {
      const fig = ['D3', 'F3', 'E3', 'D3', 'A2', 'C3', 'D3', 'E3'];
      fig.forEach((n, i) => { if (i < 6 || rand() < 0.5) t.add(b * bar + i * beat / 2, pluck(hz(n), 1.2, 0.35), 0.22); });
    }
  }
  return t;
}
function danger() {
  seed = 37;
  const beat = 60 / 90, bar = beat * 4, bars = 32, t = new Track(bars * bar);
  for (let b = 0; b < bars; b += 4) t.add(b * bar, pad([hz('D4'), hz('Eb4'), hz('A4')], bar * 4, 0.8, 2, 1400), 0.12); // tense rub
  for (let b = 0; b < bars; b++) {
    for (let e = 0; e < 8; e++) {
      const acc = e === 0 || e === 3 || e === 6;
      t.add(b * bar + e * beat / 2, drum(acc ? 150 : 120, acc ? 70 : 85, acc ? 0.22 : 0.12, 0.35), acc ? 0.38 : 0.18);
    }
    const run = ['D4', 'Eb4', 'D4', 'A3'];
    for (let s = 0; s < 16; s += 2) t.add(b * bar + s * beat / 4, pluck(hz(run[(s / 2) % 4]), 0.5, 0.7), 0.12);
  }
  return t;
}

/* ---------- stings ---------- */
function victory() {
  seed = 41; const t = new Track(5);
  ['D4', 'F#4', 'A4', 'D5'].forEach((n, i) => t.add(i * 0.14, pluck(hz(n), 2.4, 0.6), 0.4));
  t.add(0.56, pad(['D3', 'F#3', 'A3', 'D4'].map(hz), 2.2, 0.3, 1.8, 1600), 0.28);
  t.add(0.56, drum(120, 60, 0.5, 0.2), 0.4);
  return finish(t, { loop: false, wet: 0.35, size: 1.2 });
}
function defeat() {
  seed = 43; const t = new Track(5);
  t.add(0, pad([hz('D2'), hz('A2')], 3, 0.4, 2, 400), 0.35);
  ['A3', 'G3', 'F3', 'D3'].forEach((n, i) => t.add(i * 0.55, pluck(hz(n), 2.5, 0.25), 0.4));
  t.add(0, drum(80, 40, 0.8, 0.1), 0.4);
  return finish(t, { loop: false, wet: 0.35, size: 1.2 });
}

/* ---------- render ---------- */
mkdirSync(OUT, { recursive: true }); mkdirSync(TMP, { recursive: true });
const tw = town(); writeOgg('town', scale(tw, 0.89 / peak(tw)));
// hunt and danger share one gain, so the danger layer sits in the right balance on top of the hunt loop
const h = finish(hunt(), { loop: true, wet: 0.25 }), dg = finish(danger(), { loop: true, wet: 0.2 });
const both = h.map((v, i) => v + dg[i]), g = 0.89 / peak(both);
writeOgg('hunt', scale(h, g)); writeOgg('danger', scale(dg, g));
const v = victory(); writeOgg('victory', scale(v, 0.89 / peak(v)));
const d = defeat(); writeOgg('defeat', scale(d, 0.89 / peak(d)));
rmSync(TMP, { recursive: true, force: true });
