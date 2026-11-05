// Music playback. Files live in public/audio/music/ (town, hunt, danger, victory, defeat .ogg).
// The placeholders are composed by scripts/compose-placeholder-music.mjs; real music replaces the files.
//
// town    loops in the Hunt Board, Forge and Shop
// hunt    loops during a hunt; `danger` is a layer started in sync with it and faded in when a
//         threat 3–4 attack is telegraphed
// victory / defeat  one-shot stings when a hunt ends
// Browsers only allow audio after the player interacts, so the context starts on the first click.

/** One audio context for music and sound effects; created on the first click (browser rule). */
let sharedCtx: AudioContext | null = null;
export function audioContext(create = false): AudioContext | null {
  if (!sharedCtx && create) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) sharedCtx = new AC();
  }
  if (sharedCtx?.state === 'suspended') void sharedCtx.resume();
  return sharedCtx;
}

export type Scene = 'town' | 'hunt' | 'none';
type Name = 'town' | 'hunt' | 'danger' | 'victory' | 'defeat';

/** Per-track level trims so the loops sit at the same loudness (placeholders: town measures ~4.5 dB hotter). */
const TRIM: Record<Name, number> = { town: 0.6, hunt: 1, danger: 1, victory: 0.8, defeat: 0.8 };
const FADE = 1.2, DANGER_FADE = 1.5;
/** the very first track fades in fast: there's nothing to crossfade from (playtest: "a few seconds before the music") */
const FIRST_FADE = 0.25;
const ALL: Name[] = ['town', 'hunt', 'danger', 'victory', 'defeat'];
/** The files are fetched as soon as the page loads (no audio context needed for that); decoding waits for the
 *  context, then runs for every track at once so nothing decodes at the moment it's needed. */
const raw = new Map<Name, Promise<ArrayBuffer | null>>();
const fetchTrack = (n: Name) => {
  if (!raw.has(n)) raw.set(n, fetch(`audio/music/${n}.ogg`).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null));
  return raw.get(n)!;
};
if (typeof window !== 'undefined' && typeof fetch === 'function') for (const n of ALL) void fetchTrack(n);

class Music {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private buffers = new Map<Name, AudioBuffer | null>();
  private playing: { scene: Scene; nodes: { src: AudioBufferSourceNode; gain: GainNode; name: Name }[] } = { scene: 'none', nodes: [] };
  private wanted: Scene = 'none';
  private dangerOn = false;
  private volume = 0.7;

  /** Call from a user gesture (first click). Safe to call repeatedly. */
  unlock() {
    if (this.ctx) { audioContext(); return; }
    const ctx = audioContext(true);
    if (!ctx) return;
    this.ctx = ctx;
    this.bus = this.ctx.createGain();
    this.bus.gain.value = this.volume;
    this.bus.connect(this.ctx.destination);
    void this.setScene(this.wanted, true);
    // decode the rest now, in the background, so the hunt music and stings are ready when they're needed
    for (const n of ALL) void this.load(n);
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.bus && this.ctx) this.bus.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
  }

  private decoding = new Map<Name, Promise<AudioBuffer | null>>();
  private load(name: Name): Promise<AudioBuffer | null> {
    if (!this.decoding.has(name)) {
      this.decoding.set(name, (async () => {
        let buf: AudioBuffer | null = null;
        try {
          const data = await fetchTrack(name);
          // decodeAudioData detaches its input: give it a copy so a retry could still use the original
          if (data && this.ctx) buf = await this.ctx.decodeAudioData(data.slice(0));
        } catch { /* missing or undecodable: play nothing for this track */ }
        this.buffers.set(name, buf);
        return buf;
      })());
    }
    return this.decoding.get(name)!;
  }
  private started = false;

  private start(name: Name, buf: AudioBuffer, when: number, level: number, loop: boolean) {
    const ctx = this.ctx!, src = ctx.createBufferSource(), gain = ctx.createGain();
    src.buffer = buf; src.loop = loop;
    gain.gain.setValueAtTime(0, when);
    const fade = !loop ? 0.02 : this.started ? FADE : FIRST_FADE;
    gain.gain.linearRampToValueAtTime(level * TRIM[name], when + fade);
    src.connect(gain).connect(this.bus!);
    src.start(when);
    return { src, gain, name };
  }

  private fadeOutCurrent(seconds = FADE) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const n of this.playing.nodes) {
      n.gain.gain.cancelScheduledValues(now);
      n.gain.gain.setValueAtTime(n.gain.gain.value, now);
      n.gain.gain.linearRampToValueAtTime(0, now + seconds);
      n.src.stop(now + seconds + 0.05);
    }
    this.playing = { scene: 'none', nodes: [] };
  }

  async setScene(scene: Scene, force = false) {
    this.wanted = scene;
    if (!this.ctx || (!force && this.playing.scene === scene)) return;
    this.fadeOutCurrent();
    if (scene === 'none') return;
    const names: Name[] = scene === 'town' ? ['town'] : ['hunt', 'danger'];
    const bufs = await Promise.all(names.map(n => this.load(n)));
    if (this.wanted !== scene || !this.ctx) return; // the scene changed while loading
    const when = this.ctx.currentTime + 0.05;
    const nodes = names.flatMap((n, i) => {
      const b = bufs[i]; if (!b) return [];
      return [this.start(n, b, when, n === 'danger' ? (this.dangerOn ? 1 : 0) : 1, true)];
    });
    this.playing = { scene, nodes };
    if (nodes.length) this.started = true;
  }

  /** Fade the danger layer in or out (hunt scene only). */
  setDanger(on: boolean) {
    if (this.dangerOn === on) return;
    this.dangerOn = on;
    const d = this.playing.nodes.find(n => n.name === 'danger');
    if (!d || !this.ctx) return;
    const now = this.ctx.currentTime;
    d.gain.gain.cancelScheduledValues(now);
    d.gain.gain.setValueAtTime(d.gain.gain.value, now);
    d.gain.gain.linearRampToValueAtTime(on ? TRIM.danger : 0, now + DANGER_FADE);
  }

  /** End of a hunt: fade the hunt music and play the result sting. */
  async sting(kind: 'victory' | 'defeat') {
    if (!this.ctx) return;
    this.wanted = 'none';
    this.fadeOutCurrent(0.6);
    const buf = await this.load(kind);
    if (buf && this.ctx) this.playing.nodes.push(this.start(kind, buf, this.ctx.currentTime + 0.1, 1, false));
  }
}

export const music = new Music();
