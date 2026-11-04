// Composes the PLACEHOLDER trailer music, synthesized from scratch like the in-game placeholder tracks
// (same instruments, same key, same 90 BPM as the hunt loop), timed to the trailer edit.
//   node art/trailer/compose-trailer-music.mjs <out.wav> '<json of impact times in seconds>'
// 24 bars at 90 BPM = 64 s. Sections line up with the edit in art/trailer/edit.mjs:
//   0–8 s    cold open: drone and heartbeat
//   8–32 s   the hunt: groove, chords, flute enters
//   32–53 s  four monsters: driving toms, tense harmony
//   53–56 s  break: everything drops, a rising arpeggio
//   56–64 s  the logo: a D major arrival, ringing out
import { writeFileSync } from 'node:fs';
const SR = 44100;
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
const CHORDS = {
  Dm: ['D3', 'F3', 'A3'], Bb: ['Bb2', 'D3', 'F3'], F: ['F2', 'A2', 'C3'], C: ['C3', 'E3', 'G3'],
  Gm: ['G2', 'Bb2', 'D3'], A: ['A2', 'C#3', 'E3'], Asus: ['A2', 'D3', 'E3']
};
const up = (n, o) => n.replace(/-?\d$/, d => String(Number(d) + o));

const OUTF = process.argv[2] || 'trailer.wav';
const HITS = JSON.parse(process.argv[3] || '[]');   // moments in the footage that land (a hit, a break)
const B = 60 / 90, BAR = B * 4, LEN = 64;
const at = (bar, beat = 0) => bar * BAR + beat * B;
seed = 77;
const t = new Track(LEN), dr = new Track(LEN);         // music, and drums (drums get less reverb)
const boom = (time, g = 0.6) => { g *= 0.55; dr.add(time, drum(70, 32, 0.9, 0.25), g); dr.add(time, drum(160, 60, 0.18, 0.5), g * 0.4); };

/* A: cold open */
t.add(0, pad([hz('D2'), hz('A2')], at(3), 2.5, 2, 420), 0.32);
for (let b = 1; b < 3; b++) for (const k of [0, 2]) dr.add(at(b, k), drum(90, 45, 0.3, 0.1), k ? 0.24 : 0.4);
['D3', 'F3', 'E3', 'D3', 'A2', 'C3'].forEach((n, i) => t.add(at(1) + i * B / 2, pluck(hz(n), 1.2, 0.35), 0.24));
boom(at(2), 0.55); t.add(at(2), pad(CHORDS.Dm.map(hz), BAR, 0.6, 1.6, 900), 0.16);

/* B: the hunt (bars 3–12) */
const progB = ['Dm', 'Dm', 'Bb', 'C'];
for (let b = 3; b < 12; b++) {
  const ch = CHORDS[progB[Math.floor((b - 3) / 2) % 4]];
  if ((b - 3) % 2 === 0) { t.add(at(b), pad(ch.map(hz), BAR * 2, 1, 1.6, 800), 0.13); t.add(at(b), pluck(hz(up(ch[0], -1)), 3, 0.3), 0.34); }
  for (const k of [0, 2]) dr.add(at(b, k), drum(90, 45, 0.3, 0.1), k ? 0.26 : 0.42);
  dr.add(at(b, 3.5), drum(130, 80, 0.1, 0.3), 0.14);
  const fig = [ch[0], up(ch[1], 0), up(ch[2], 0), ch[0], up(ch[2], -1), ch[1], up(ch[0], 1), ch[2]];
  fig.forEach((n, i) => { if (i < 6 || rand() < 0.6) t.add(at(b) + i * B / 2, pluck(hz(n), 1.1, 0.4), 0.2); });
}
const melB = [['D5', 0, 3], ['F5', 3, 1], ['E5', 4, 2], ['C5', 6, 2], ['D5', 8, 3], ['A4', 11, 1], ['Bb4', 12, 2], ['A4', 14, 2],
              ['F5', 16, 2], ['G5', 18, 1], ['A5', 19, 1], ['G5', 20, 2], ['F5', 22, 2], ['E5', 24, 4]];
for (const [n, beat, len] of melB) t.add(at(6) + beat * B, flute(hz(n), len * B * 0.95), 0.12);
boom(at(6), 0.45); boom(at(9, 2), 0.45);

/* C: four monsters (bars 12–20) */
const progC = ['Dm', 'Bb', 'Gm', 'A'];
for (let b = 12; b < 20; b++) {
  const ch = CHORDS[progC[Math.floor((b - 12) / 2) % 4]];
  if ((b - 12) % 2 === 0) {
    t.add(at(b), pad(ch.map(hz), BAR * 2, 0.5, 1.2, 1300), 0.12);
    t.add(at(b), pad([hz('D4'), hz('Eb4')], BAR * 2, 0.8, 1, 1400), b < 14 ? 0.06 : 0.03);
    t.add(at(b), pluck(hz(up(ch[0], -1)), 3, 0.35), 0.36);
  }
  for (let e = 0; e < 8; e++) {
    const acc = e === 0 || e === 3 || e === 6;
    dr.add(at(b) + e * B / 2, drum(acc ? 150 : 120, acc ? 70 : 85, acc ? 0.22 : 0.12, 0.35), (acc ? 0.5 : 0.24) * (b >= 16 ? 1.2 : 1));
  }
  const run = [ch[0], ch[1], ch[2], ch[1]].map(n => up(n, 1));
  for (let s = 0; s < 16; s++) if (s % 2 === 0 || b >= 16) t.add(at(b) + s * B / 4, pluck(hz(run[(s / 2 | 0) % 4]), 0.5, 0.7), 0.15);
}
const melC = [['A5', 0, 3], ['G5', 3, 1], ['F5', 4, 2], ['E5', 6, 2], ['D5', 8, 4], ['Bb4', 12, 2], ['C5', 14, 2],
              ['D5', 16, 3], ['F5', 19, 1], ['G5', 20, 4], ['A5', 24, 3], ['C#5', 27, 1], ['E5', 28, 4]];
for (const [n, beat, len] of melC) t.add(at(14) + beat * B, flute(hz(n), len * B * 0.95), 0.13);
boom(at(12), 0.6); boom(at(13), 0.5); boom(at(15, 2), 0.5); boom(at(18), 0.5);

/* D: break, a rising arpeggio and a noise swell */
['D4', 'F4', 'A4', 'D5', 'F5', 'A5', 'D6', 'F6'].forEach((n, i) => t.add(at(20) + i * B / 2, pluck(hz(n), 1, 0.7), 0.16 + i * 0.02));
{ const n = Math.floor(BAR * SR), sw = new Float32Array(n); let lp = 0;
  for (let i = 0; i < n; i++) { const x = i / n, k = 0.02 + x * 0.3; lp += k * ((rand() * 2 - 1) - lp); sw[i] = lp * x * x; }
  t.add(at(20), sw, 0.5); }

/* E: arrival on the logo */
boom(at(21), 0.75);
t.add(at(21), pad(['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'].map(hz), BAR * 2.2, 0.08, 3, 1500), 0.3);
['D3', 'A3', 'D4', 'F#4', 'A4', 'D5'].forEach((n, i) => t.add(at(21) + i * 0.12, pluck(hz(n), 3, 0.6), 0.3));
t.add(at(21, 2), flute(hz('D5'), BAR * 1.5), 0.13);

/* impacts from the footage */
for (const h of HITS) { dr.add(h, drum(110, 40, 0.45, 0.4), 0.45); }

/* mix: stereo from two slightly different reverbs; drums drier */
const L = warm(reverb(t.d, 0.3, 1.0)), R = warm(reverb(t.d, 0.3, 1.07));
const DL = warm(reverb(dr.d, 0.12, 1.0), 4500), DR = warm(reverb(dr.d, 0.12, 1.05), 4500);
const n = Math.ceil(LEN * SR), out = [new Float32Array(n), new Float32Array(n)];
for (let i = 0; i < n; i++) {
  const fade = i > n - 1.5 * SR ? (n - i) / (1.5 * SR) : 1;
  out[0][i] = (L[i] + DL[i]) * fade; out[1][i] = (R[i] + DR[i]) * fade;
}
const pk = Math.max(peak(out[0]), peak(out[1]));
const [a, b] = out.map(d => scale(d, 0.9 / pk));
const buf = Buffer.alloc(44 + n * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
for (let i = 0; i < n; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, a[i])) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, b[i])) * 32767), 46 + i * 4); }
writeFileSync(OUTF, buf); console.log('wrote', OUTF, LEN, 's');
