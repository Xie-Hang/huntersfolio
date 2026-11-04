// The single source of UI state: the save, the hunt in progress, and the current view.
// Every rule lives in the engine; this file only calls it, records Undo snapshots,
// triggers effects (floating numbers, shakes, dice rolls) and persists.
import * as E from '../engine';
import { read, write, remove, lockSaves, SAVE_KEY, HUNT_KEY } from './storage';
import { sfx, type Sfx } from './sfx';
import * as PL from './playlog';
import { checkAchievements } from './achievements';

export type View = 'board' | 'forge' | 'shop' | 'hunt';
type Panel = 'mon' | 'player';
export interface Float { id: number; at: Panel; text: string; cls: string }

let floatId = 0;

class Game {
  save = $state<E.Save>(E.newSave());
  /** the save on this PC is from a newer build (the full game): play without saving, never overwrite it */
  newerSave = $state(false);
  hunt = $state<E.Hunt | null>(null);
  view = $state<View>('board');
  /** indices of selected dice */
  sel = $state<number[]>([]);
  /** snapshots taken before each action this turn */
  undoStack = $state.raw<E.Hunt[]>([]);
  rolling = $state<number[]>([]);
  floats = $state<Float[]>([]);
  shakes = $state({ mon: 0, player: 0 });
  /** one-shot animation cues for the monster plate: it was hit / it attacked */
  pulse = $state({ hit: 0, act: 0, actIntent: '' });

  get inHunt() { return this.view === 'hunt' && !!this.hunt && !this.hunt.over; }

  /* ---------- persistence ---------- */
  load() {
    const raw = read(SAVE_KEY);
    if (E.isNewerSave(raw) || E.isFullSaveInDemo(raw, E.EDITION)) { lockSaves(); this.newerSave = true; this.save = E.newSave(); return; }
    this.save = E.loadSave(raw);
    if (E.EDITION === 'full') this.save.edition = 'full';
    E.fixLoadout(this.save);
    const h = read(HUNT_KEY) as E.Hunt | null;
    // Resume a hunt that was interrupted (app closed mid-hunt). Its item charges already left the stash.
    if (h && !h.over && E.MONSTERS[h.mid] && Array.isArray(h.dice)) {
      if (h.version === E.HUNT_VERSION) { this.hunt = h; this.view = 'hunt'; }
      else {
        // Saved by an older build: give back the carried item charges rather than resume a hunt the rules no longer fit.
        if (h.item && E.ITEMS[h.item]) this.save.items[h.item] = (this.save.items[h.item] ?? 0) + (h.itemCharges ?? 0);
        remove(HUNT_KEY);
        write(SAVE_KEY, $state.snapshot(this.save));
      }
    }
    if (checkAchievements(this.save).length) write(SAVE_KEY, $state.snapshot(this.save));
  }
  persist() {
    write(SAVE_KEY, $state.snapshot(this.save));
    if (this.hunt && !this.hunt.over) write(HUNT_KEY, $state.snapshot(this.hunt));
    else remove(HUNT_KEY);
  }
  reset() {
    this.save = E.newSave();
    this.hunt = null;
    this.undoStack = [];
    this.sel = [];
    this.view = 'board';
    this.persist();
  }

  /* ---------- town ---------- */
  go(v: View) {
    if (this.inHunt) return;
    E.fixLoadout(this.save);
    this.view = v;
  }
  /** `scripted`: the tutorial's first hunt, opening on fixed dice */
  begin(scripted = false) {
    E.fixLoadout(this.save);
    if (this.save.loadout.weapons.length !== 2 || !E.isUnlocked(this.save, this.save.loadout.target)) return;
    this.hunt = E.startHunt(this.save, E.randomSeed(), scripted ? E.TUTORIAL_SCRIPT : undefined);
    PL.huntBegin(this.hunt, this.save);
    this.undoStack = [];
    this.sel = [];
    this.view = 'hunt';
    this.roll([0, 1, 2, 3]);
    sfx('diceRoll');
    this.persist();
  }

  /* ---------- effects ---------- */
  private roll(idx: number[]) {
    this.rolling = idx;
    setTimeout(() => (this.rolling = []), 480);
  }
  private float(at: Panel, text: string, cls = '') {
    const f = { id: ++floatId, at, text, cls };
    this.floats = [...this.floats, f];
    setTimeout(() => (this.floats = this.floats.filter(x => x.id !== f.id)), 950);
  }
  private shake(at: Panel) { this.shakes[at]++; }

  /* ---------- hunt actions ---------- */
  /** Run an engine action with an Undo snapshot; keep the snapshot only if the action happened. */
  private act<T>(fn: (h: E.Hunt) => T, happened: (r: T) => boolean): T | null {
    const h = this.hunt;
    if (!h || h.over) return null;
    const snap = $state.snapshot(h) as E.Hunt;
    const r = fn(h);
    if (!happened(r)) return r;
    this.undoStack = [...this.undoStack, snap];
    this.sel = [];
    this.after();
    return r;
  }
  private after() {
    const h = this.hunt!;
    if (h.over) { PL.huntEnd(h, this.save); E.settleHunt(this.save, h); checkAchievements(this.save, h); E.fixLoadout(this.save); this.undoStack = []; this.sel = []; }
    this.persist();
  }

  toggleDie(i: number) {
    const h = this.hunt;
    if (!h || h.over || h.dice[i].used) return;
    this.sel = this.sel.includes(i) ? this.sel.filter(x => x !== i) : [...this.sel, i];
    sfx('dieTap');
  }
  target(part: string) {
    if (!this.hunt || this.hunt.over) return;
    this.hunt.target = part;
    this.persist();
  }
  move(i: number) {
    const h0 = this.hunt; if (!h0) return;
    // what the hit did, read by comparing before and after
    const w = E.currentWeapon(h0), ice0 = h0.mon.plating, intent0 = h0.intent;
    const exposed0 = Object.values(h0.mon.parts).filter(p => p.exposed > 0).length;
    const r = this.act(h => E.useMove(h, i, this.sel), r => !!r);
    if (!r) return;
    const h = this.hunt!;
    this.pulse.hit++;
    const sounds: Sfx[] = [];
    if (h.mon.plating < ice0) {
      sounds.push(h.mon.plating === 0 ? 'iceGone' : 'iceBreak');
      this.float('mon', h.mon.plating === 0 ? 'Ice shattered' : 'Ice cracked', 'ice');
    } else {
      sounds.push(w.type === 'Cut' ? 'hitCut' : w.type === 'Blunt' ? 'hitBlunt' : 'hitPierce');
      if (r.dmg >= 50) sounds.push('bigHit');
      this.float('mon', `−${r.dmg}`);
    }
    if (r.broke) sounds.push('partBreak');
    if (h.intent === 'dazed' && intent0 !== 'dazed') sounds.push('daze');
    if (Object.values(h.mon.parts).filter(p => p.exposed > 0).length > exposed0) sounds.push('expose');
    if (h.over === 'win' && !h.captured) sounds.push('bigHit');
    sfx(...sounds);
    if (r.broke || r.dmg >= 50) this.shake('mon');
  }
  guard() { if (this.act(h => E.guard(h, this.sel), ok => ok)) sfx('guard'); }
  charge() { if (this.act(h => E.charge(h, this.sel), ok => ok)) sfx('charge'); }
  swap() { if (this.act(h => E.swap(h, this.sel), ok => ok)) sfx('swap'); }
  capture() {
    // the engine logs a reason when capture is blocked (airborne); keep that on screen
    const r = this.act(h => E.capture(h, this.sel), ok => ok);
    if (r) sfx('capture');
    if (r === false) this.persist();
  }
  reroll() {
    const idx = this.act(h => E.reroll(h, this.sel), r => r.length > 0);
    if (idx?.length) { this.roll(idx); sfx('reroll'); }
  }
  item() {
    const before = this.hunt?.php ?? 0;
    const ok = this.act(h => E.useItem(h), ok => ok);
    if (ok) sfx('item');
    if (ok && this.hunt && this.hunt.php > before) this.float('player', `+${this.hunt.php - before}`, 'heal');
  }
  undo() {
    if (!this.hunt || this.hunt.over || !this.undoStack.length) return;
    this.hunt = this.undoStack[this.undoStack.length - 1];
    this.undoStack = this.undoStack.slice(0, -1);
    this.sel = [];
    this.persist();
  }
  endTurn() {
    const h = this.hunt;
    if (!h || h.over) return;
    PL.turnEnd(h);
    if (E.intentInfo(h).dmg > 0) { this.pulse.actIntent = h.intent; this.pulse.act++; }
    const { taken } = E.endTurn(h);
    if (taken) { this.float('player', `−${taken}`, 'hurt'); if (taken >= E.CHARGE_BREAK) this.shake('player'); }
    if (taken) sfx(taken >= E.CHARGE_BREAK ? 'hurtHeavy' : 'hurt');
    if (!h.over) setTimeout(() => sfx('diceRoll'), taken ? 260 : 0); // the new roll lands after the hit
    this.undoStack = [];
    this.sel = [];
    if (!h.over) this.roll([0, 1, 2, 3]);
    this.after();
  }
  abandon() {
    const h = this.hunt;
    if (!h || h.over) return;
    PL.markAbandon();
    E.abandon(h);
    this.after();
  }

  /* ---------- town actions (forge and shop return a message for the toast) ---------- */
  town(fn: (s: E.Save) => string | null, sound?: Sfx): string | null {
    const msg = fn(this.save);
    if (msg && sound) sfx(sound);
    if (msg) checkAchievements(this.save);
    this.persist();
    return msg;
  }
}

export const game = new Game();
