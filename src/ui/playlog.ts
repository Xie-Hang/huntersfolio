// The hunt log: a small local record of how hunts go, for Steam Playtest feedback.
// Nothing leaves the player's PC on its own. Settings → Feedback exports it as a file they can send.
// What it holds: per hunt, the monster, the loadout, the result, how long each turn took, what hurt them,
// and which tutorial tips appeared; plus sessions (when the game was opened) and any errors.
// No names, no account data. Capped so it stays small.
import * as E from '../engine';
import { read, write } from './storage';

const KEY = 'log';
const MAX_HUNTS = 400, MAX_ERRORS = 30, MAX_SESSIONS = 200;
/** a turn longer than this is someone who walked away, not someone thinking: counted as idle */
export const IDLE_MS = 3 * 60_000;

export interface HuntRecord {
  at: string;                 // ISO time the hunt began
  build: string;
  mid: string;
  weapons: string[];          // "id+lv"
  armor: string; charm: string | null; item: string | null;
  scripted: boolean;          // the tutorial's fixed opening
  result: 'win' | 'capture' | 'lose' | 'abandon' | 'unfinished';
  turns: number;
  turnMs: number[];           // active time per completed turn (idle turns capped at IDLE_MS)
  idleTurns: number;
  dealt: number; taken: number; guarded: number; broken: string[]; rerollsUsed: number;
  hpLeft: number; monHpLeft: number;
  killedBy: string | null;    // the attack that ended a lost hunt
  tips: string[];             // tutorial tips first shown during this hunt
}
export interface ErrorRecord { at: string; build: string; where: string; message: string; stack?: string }
export interface PlayLog { v: 1; sessions: { at: string; build: string }[]; hunts: HuntRecord[]; errors: ErrorRecord[] }

const BUILD = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
const now = () => new Date().toISOString();

function load(): PlayLog {
  const raw = read(KEY) as Partial<PlayLog> | null;
  return {
    v: 1,
    sessions: Array.isArray(raw?.sessions) ? raw!.sessions : [],
    hunts: Array.isArray(raw?.hunts) ? raw!.hunts : [],
    errors: Array.isArray(raw?.errors) ? raw!.errors : []
  };
}
let log = load();
const save = () => {
  log.hunts = log.hunts.slice(-MAX_HUNTS); log.errors = log.errors.slice(-MAX_ERRORS); log.sessions = log.sessions.slice(-MAX_SESSIONS);
  write(KEY, log);
};

export function sessionStart() { log.sessions.push({ at: now(), build: BUILD }); save(); }

/* ---------- the hunt in progress (lives in memory; a reload mid-hunt starts a fresh clock) ---------- */
let cur: { rec: HuntRecord; turnStart: number; tipsBefore: string[]; abandoned: boolean } | null = null;

export function huntBegin(h: E.Hunt, s: E.Save) {
  cur = {
    rec: {
      at: now(), build: BUILD, mid: h.mid,
      weapons: h.weps.map(w => `${w.id}+${w.lv}`), armor: `${h.arm.id}+${h.arm.lv}`, charm: h.charm, item: h.item,
      scripted: !!h.script, result: 'unfinished', turns: 0, turnMs: [], idleTurns: 0,
      dealt: 0, taken: 0, guarded: 0, broken: [], rerollsUsed: 0, hpLeft: 0, monHpLeft: 0, killedBy: null, tips: []
    },
    turnStart: Date.now(), tipsBefore: [...s.tips], abandoned: false
  };
}
/** Call just before the engine resolves the monster's turn; `intent` is what is about to hit. */
export function turnEnd(h: E.Hunt) {
  if (!cur || cur.rec.mid !== h.mid) return;
  const ms = Date.now() - cur.turnStart;
  if (ms > IDLE_MS) cur.rec.idleTurns++;
  cur.rec.turnMs.push(Math.min(ms, IDLE_MS));
  cur.rec.killedBy = E.intentInfo(h).name;
  cur.turnStart = Date.now();
}
export function markAbandon() { if (cur) cur.abandoned = true; }
/** Call once the hunt is over (any way it ended). */
export function huntEnd(h: E.Hunt, s: E.Save) {
  if (!cur || cur.rec.mid !== h.mid) return;
  const r = cur.rec;
  r.result = cur.abandoned ? 'abandon' : h.over === 'win' ? (h.captured ? 'capture' : 'win') : 'lose';
  r.turns = h.turn; r.dealt = h.stats.dealt; r.taken = h.stats.taken; r.guarded = h.stats.guarded;
  r.rerollsUsed = h.stats.rerollsUsed; r.hpLeft = h.php; r.monHpLeft = h.mon.hp;
  r.broken = Object.entries(h.mon.parts).filter(([, p]) => p.broken).map(([k]) => k);
  if (r.result !== 'lose') r.killedBy = null;
  r.tips = s.tips.filter(t => !cur!.tipsBefore.includes(t));
  log.hunts.push(r); cur = null; save();
}

export function logError(where: string, err: unknown) {
  const e = err instanceof Error ? err : new Error(String(err));
  log.errors.push({ at: now(), build: BUILD, where, message: e.message.slice(0, 500), stack: e.stack?.slice(0, 2000) });
  save();
}

/* ---------- export ---------- */
export function counts() { return { hunts: log.hunts.length, errors: log.errors.length }; }

/** Everything a feedback file needs: the log, a summary of the save (no personal data) and the settings. */
export function report(s: E.Save, settings: unknown) {
  return {
    game: "Hunter's Folio", build: BUILD, exported: now(),
    platform: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    save: {
      version: s.version, hunts: s.hunts, coin: s.coin, record: s.record,
      weapons: s.weapons, armors: s.armors, charms: Object.keys(s.charms), items: s.items, tips: s.tips, endSeen: s.endSeen
    },
    settings,
    log
  };
}
export function clear() { log = { v: 1, sessions: [], hunts: [], errors: [] }; save(); }
