// The single source of UI state: the save, the hunt in progress, and the current view.
// Every rule lives in the engine; this file only calls it, records Undo snapshots,
// triggers effects (floating numbers, shakes, dice rolls) and persists.
import * as E from '../engine';
import { read, write, remove, SAVE_KEY, HUNT_KEY } from './storage';

export type View = 'board' | 'forge' | 'shop' | 'hunt';
type Panel = 'mon' | 'player';
export interface Float { id: number; at: Panel; text: string; cls: string }

let floatId = 0;

class Game {
  save = $state<E.Save>(E.newSave());
  hunt = $state<E.Hunt | null>(null);
  view = $state<View>('board');
  /** indices of selected dice */
  sel = $state<number[]>([]);
  /** snapshots taken before each action this turn */
  undoStack = $state.raw<E.Hunt[]>([]);
  rolling = $state<number[]>([]);
  floats = $state<Float[]>([]);
  shakes = $state({ mon: 0, player: 0 });

  get inHunt() { return this.view === 'hunt' && !!this.hunt && !this.hunt.over; }

  /* ---------- persistence ---------- */
  load() {
    this.save = E.loadSave(read(SAVE_KEY));
    E.fixLoadout(this.save);
    const h = read(HUNT_KEY) as E.Hunt | null;
    // Resume a hunt that was interrupted (app closed mid-hunt). Its item charges already left the stash.
    if (h && !h.over && E.MONSTERS[h.mid] && Array.isArray(h.dice)) { this.hunt = h; this.view = 'hunt'; }
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
  begin() {
    E.fixLoadout(this.save);
    if (this.save.loadout.weapons.length !== 2) return;
    this.hunt = E.startHunt(this.save, E.randomSeed());
    this.undoStack = [];
    this.sel = [];
    this.view = 'hunt';
    this.roll([0, 1, 2, 3]);
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
    if (h.over) { E.settleHunt(this.save, h); E.fixLoadout(this.save); this.undoStack = []; this.sel = []; }
    this.persist();
  }

  toggleDie(i: number) {
    const h = this.hunt;
    if (!h || h.over || h.dice[i].used) return;
    this.sel = this.sel.includes(i) ? this.sel.filter(x => x !== i) : [...this.sel, i];
  }
  target(part: string) {
    if (!this.hunt || this.hunt.over) return;
    this.hunt.target = part;
    this.persist();
  }
  move(i: number) {
    const r = this.act(h => E.useMove(h, i, this.sel), r => !!r);
    if (!r) return;
    this.float('mon', `−${r.dmg}`);
    if (r.broke || r.dmg >= 50) this.shake('mon');
  }
  guard() { this.act(h => E.guard(h, this.sel), ok => ok); }
  charge() { this.act(h => E.charge(h, this.sel), ok => ok); }
  swap() { this.act(h => E.swap(h, this.sel), ok => ok); }
  capture() {
    // the engine logs a reason when capture is blocked (airborne); keep that on screen
    const r = this.act(h => E.capture(h, this.sel), ok => ok);
    if (r === false) this.persist();
  }
  reroll() {
    const idx = this.act(h => E.reroll(h, this.sel), r => r.length > 0);
    if (idx?.length) this.roll(idx);
  }
  item() {
    const before = this.hunt?.php ?? 0;
    const ok = this.act(h => E.useItem(h), ok => ok);
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
    const { taken } = E.endTurn(h);
    if (taken) { this.float('player', `−${taken}`, 'hurt'); if (taken >= E.CHARGE_BREAK) this.shake('player'); }
    this.undoStack = [];
    this.sel = [];
    if (!h.over) this.roll([0, 1, 2, 3]);
    this.after();
  }
  abandon() {
    const h = this.hunt;
    if (!h || h.over) return;
    E.abandon(h);
    this.after();
  }

  /* ---------- town actions (forge and shop return a message for the toast) ---------- */
  town(fn: (s: E.Save) => string | null): string | null {
    const msg = fn(this.save);
    this.persist();
    return msg;
  }
}

export const game = new Game();
