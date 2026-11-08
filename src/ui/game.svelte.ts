// The single source of UI state: the save, the hunt in progress, and the current view.
// Every rule lives in the engine; this file only calls it, records Undo snapshots,
// triggers effects (floating numbers, shakes, dice rolls) and persists.
import * as E from '../engine';
import { read, write, remove, lockSaves, SAVE_KEY, HUNT_KEY } from './storage';
import { sfx, type Sfx } from './sfx';
import * as PL from './playlog';
import { checkAchievements } from './achievements';
import { settings } from './settings.svelte';
import { shows } from './reveal';

/** a dice roll on screen (Nov 2026 playtest: make it look and sound like dice): each die tumbles for ROLL_MS,
 *  the next one ROLL_STAGGER later, flickering through faces until it lands */
export const ROLL_MS = 720, ROLL_STAGGER = 70;

export type View = 'board' | 'forge' | 'shop' | 'hunt';
type Panel = 'mon' | 'player';
export interface Float { id: number; at: Panel; text: string; cls: string }

let floatId = 0;
/** The turn each held-back action arrives on, in the hunt that teaches it (Mekkman, 8 Nov 2026: nothing on screen
 *  before Mell explains it): Reroll on the Cragling's turn 3, Block on the Rimekit's turn 3, Undo on the Tuskling's
 *  turn 2 and Swap on its turn 3. */
const ARRIVES: Record<string, number> = { reroll: 3, block: 3, undo: 2, swap: 3 };
function hold(h: E.Hunt, k: string) { if (!h.show?.includes(k)) return; h.show = h.show.filter(x => x !== k); h.held = { ...(h.held ?? {}), [k]: ARRIVES[k] }; }
/** each tutorial hunt's prompts: a lost hunt shows them again (coach.svelte.ts) */
const ISLAND_HUNT_TIPS: Record<string, string[]> = {
  scuttlehog: ['i-die', 'i-move', 'i-again', 'i-end', 'i-tele', 'i-pick', 'i-reroll'],
  snapclaw: ['i-faces2', 'i-twice', 'i-twice2', 'i-block'],
  tuskling: ['i-aim', 'i-undo', 'i-swap', 'i-tusks'],
  gorehorn: ['i-salve']
};

class Game {
  save = $state<E.Save>(E.newSave());
  /** the save on this PC is from a newer build (the full game): play without saving, never overwrite it */
  newerSave = $state(false);
  hunt = $state<E.Hunt | null>(null);
  view = $state<View>('board');
  /** the Hunt Board has two pages (Nov 2026 playtest: 23 monsters made one long list): the grid of every monster, and
   *  one monster's page with its bestiary entry and your loadout. New players open on the Gorehorn's page. */
  boardMon = $state(false);
  /** indices of selected dice */
  sel = $state<number[]>([]);
  /** snapshots taken before each action this turn */
  undoStack = $state.raw<E.Hunt[]>([]);
  /** End turn was pressed once with dice still worth spending: the next press ends it */
  endArmed = $state(false);
  rolling = $state<number[]>([]);
  /** when the current roll started (the dice flicker through faces until each lands) */
  rolledAt = 0;
  floats = $state<Float[]>([]);
  shakes = $state({ mon: 0, player: 0 });
  /** one-shot animation cues for the monster plate: it was hit / it attacked */
  pulse = $state({ hit: 0, act: 0, actIntent: '' });

  get inHunt() { return this.view === 'hunt' && !!this.hunt && !this.hunt.over; }

  /* ---------- persistence ---------- */
  load() {
    const raw = read(SAVE_KEY);
    if (E.isNewerSave(raw) || E.isFullSaveInDemo(raw, E.EDITION)) { lockSaves(); this.newerSave = true; this.save = E.newSave(); return; }
    // nothing on this PC yet: a new player, who starts in the Foothills
    this.save = raw ? E.loadSave(raw) : E.newPlayerSave();
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
    this.boardMon = this.save.hunts === 0;
  }
  persist() {
    if (this.lesson) return; // a replayed lesson plays on a copy: nothing it does is kept
    write(SAVE_KEY, $state.snapshot(this.save));
    if (this.hunt && !this.hunt.over) write(HUNT_KEY, $state.snapshot(this.hunt));
    else remove(HUNT_KEY);
  }
  /** "Skip tutorial" on the Foothills: kit out as the island would, leave any island hunt, open the Ridge */
  skipIsland() {
    if (E.islandDone(this.save)) return;
    if (this.hunt && !this.hunt.over && E.MONSTERS[this.hunt.mid]?.island) { this.hunt = null; this.undoStack = []; this.sel = []; this.view = 'board'; }
    E.skipIsland(this.save);
    this.boardMon = true;
    this.persist();
  }
  /* ---------- replayable lessons (Help → How to hunt) ---------- */
  /** a lesson replayed from Help: it plays on a copy of a new player's save, and the real save waits here */
  lesson = $state<{ n: number; real: E.Save; view: View } | null>(null);
  startLesson(n: number) {
    if (this.inHunt || this.lesson || !E.LESSONS[n]) return;
    this.lesson = { n, real: this.save, view: this.view };
    this.save = E.lessonSave(n);
    this.hunt = null; this.undoStack = []; this.sel = [];
    if (E.LESSONS[n].hunt) this.begin(); else { this.view = 'board'; this.boardMon = true; }
  }
  endLesson() {
    const l = this.lesson; if (!l) return;
    this.save = l.real; this.lesson = null;
    this.hunt = null; this.undoStack = []; this.sel = [];
    this.view = l.view === 'hunt' ? 'board' : l.view;
    this.boardMon = !E.islandDone(this.save);
    this.persist();
  }
  reset() {
    this.save = E.newPlayerSave();
    this.hunt = null;
    this.undoStack = [];
    this.sel = [];
    this.view = 'board';
    this.boardMon = true;
    this.persist();
  }

  /* ---------- town ---------- */
  /** the Shop tab to open on the next visit (the sell prompts send players straight to Sell) */
  shopTab = $state<'buy' | 'craft' | 'sell'>('buy');
  /** the Forge's tab and selected recipe (kept here for the Foothills' prompts) */
  forgeTab = $state<'weapons' | 'armor' | 'charms'>('weapons');
  /** the Shop's open tab, and materials sold this session (the Foothills' selling lesson) */
  shopOpenTab = $state<'buy' | 'craft' | 'sell'>('buy');
  sold = $state(0);
  /** the dice the action under the pointer or focus would use: they lift in the tray (Nov 2026 playtest: no more "Uses …" text) */
  preview = $state<number[]>([]);
  forgeSel = $state<string | null>(null);
  go(v: View, shopTab?: 'buy' | 'craft' | 'sell') {
    if (this.inHunt) return;
    E.fixLoadout(this.save);
    if (shopTab) this.shopTab = shopTab;
    // on the island the Hunt Board opens straight on the next monster's page (one less click to find it)
    // (and during the town tour after the promotion hunt, which ends on the Gorehorn's page, at its bounties)
    const tour = E.islandDone(this.save) && this.save.tips.includes('i-begin') && !this.save.tips.includes('i-ridge');
    if (v === 'board') this.boardMon = (!E.islandDone(this.save) || tour) && E.isUnlocked(this.save, this.save.loadout.target);
    this.view = v;
  }
  /** a monster's page on the Hunt Board: its entry and your loadout for it */
  openMonster(id: string) {
    if (this.inHunt || !E.MONSTERS[id]) return;
    this.save.loadout.target = id;
    E.fixLoadout(this.save);
    this.persist();
    this.view = 'board';
    this.boardMon = true;
  }
  /** `scripted`: the tutorial's first hunt, opening on fixed dice */
  begin(scripted = false) {
    E.fixLoadout(this.save);
    const L = this.save.loadout;
    // two weapons, except early in the Foothills (one, until the lodge gives you the maul)
    if (L.weapons.length !== (E.twoWeapons(this.save) ? 2 : 1) || !E.isUnlocked(this.save, L.target)) return;
    // the first three hunts each add one layer of the hunt screen (see reveal.ts); "Show every action" skips that.
    // Foothills hunts name what they show themselves (MonsterDef.island) and don't count toward the Ridge's layers.
    const isl = !!E.MONSTERS[L.target]?.island, prior = E.ISLAND_MONSTERS.reduce((n, id) => n + (this.save.record[id]?.hunts ?? 0), 0);
    const ridgeHunts = this.save.hunts - prior;
    // (island graduates have been taught everything: the layers are only for saves that never saw the island)
    const lesson = isl || !E.islandDone(this.save) || this.save.tips.includes('i-begin') || settings.prefs.showAll || ridgeHunts >= 3 ? undefined : ridgeHunts + 1;
    this.hunt = E.startHunt(this.save, E.randomSeed(), scripted ? E.TUTORIAL_SCRIPT : undefined, lesson);
    this.rerollLesson(true);
    PL.huntBegin(this.hunt, this.save);
    this.undoStack = [];
    this.sel = [];
    this.view = 'hunt';
    this.roll(this.hunt.dice.map((_, i) => i));
    sfx('diceRoll');
    this.persist();
  }

  /* ---------- effects ---------- */
  private roll(idx: number[]) {
    this.rolling = idx;
    const at = (this.rolledAt = performance.now());
    setTimeout(() => { if (this.rolledAt === at) this.rolling = []; }, ROLL_MS + 4 * ROLL_STAGGER + 40);
  }
  /** land the dice at once: any input (selecting a die, pointing at or using an action) cuts the tumble short
   *  (Nov 2026 playtest: the animation kept playing while the player was already choosing) */
  settle() { if (this.rolling.length) this.rolling = []; }
  private float(at: Panel, text: string, cls = '') {
    const f = { id: ++floatId, at, text, cls };
    this.floats = [...this.floats, f];
    setTimeout(() => (this.floats = this.floats.filter(x => x.id !== f.id)), cls === 'kill' ? 1600 : 950);
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
    this.settle();
    this.undoStack = [...this.undoStack, snap];
    this.sel = [];
    this.endArmed = false;
    this.preview = [];
    this.after();
    return r;
  }
  private after() {
    const h = this.hunt!;
    // a lost tutorial hunt is tried again with its prompts (Mekkman, 8 Nov 2026)
    if (h.over === 'lose' && !this.lesson && ISLAND_HUNT_TIPS[h.mid] && E.onRails(this.save)) this.save.tips = this.save.tips.filter(id => !ISLAND_HUNT_TIPS[h.mid].includes(id));
    if (h.over) { PL.huntEnd(h, this.save); E.settleHunt(this.save, h); if (!this.lesson) checkAchievements(this.save, h); E.fixLoadout(this.save); this.undoStack = []; this.sel = []; }
    this.persist();
  }

  toggleDie(i: number) {
    const h = this.hunt;
    if (!h || h.over || !h.dice[i] || h.dice[i].used) return;
    this.settle();
    this.sel = this.sel.includes(i) ? this.sel.filter(x => x !== i) : [...this.sel, i];
    this.endArmed = false; // the "End turn anyway?" warning clears once you do something else (Nov 2026 playtest)
    sfx('dieTap');
  }
  target(part: string) {
    if (!this.hunt || this.hunt.over || !shows(this.hunt, 'parts')) return;
    this.hunt.target = part;
    this.persist();
  }
  move(i: number) {
    const h0 = this.hunt; if (!h0) return;
    if (i >= 2 && !shows(h0, 'rend')) return; // the Foothills: the third move isn't shown yet
    // what the hit did, read by comparing before and after
    const w = E.currentWeapon(h0), ice0 = h0.mon.plating, intent0 = h0.intent, rr0 = h0.rerolls;
    const exposed0 = Object.values(h0.mon.parts).filter(p => p.exposed > 0).length;
    // dice for two (or more) whole copies of the move: it's used that many times (Slash ×2)
    const reps = Math.max(1, E.repeatCount(h0, i, this.sel)), sel0 = [...this.sel];
    const r = this.act(h => {
      let total: E.HitResult | null = null;
      for (let k = 0; k < reps && !h.over; k++) {
        const one = E.useMove(h, i, sel0.filter(j => !h.dice[j]?.used));
        if (!one) break;
        total = total ? { dmg: total.dmg + one.dmg, broke: total.broke || one.broke } : one;
      }
      return total;
    }, r => !!r);
    if (!r) return;
    if (reps > 1) this.multi++;
    const h = this.hunt!;
    this.pulse.hit++;
    const sounds: Sfx[] = [];
    if (h.mon.plating < ice0) {
      sounds.push(h.mon.plating === 0 ? 'iceGone' : 'iceBreak');
      const pw = E.monsterOf(h).plateWord, word = pw === 'scale' ? 'Scales' : pw ? pw[0].toUpperCase() + pw.slice(1) : 'Ice';
      this.float('mon', h.mon.plating === 0 ? `${word} shattered` : `${word} cracked`, 'ice');
    } else {
      sounds.push(w.type === 'Cut' ? 'hitCut' : w.type === 'Blunt' ? 'hitBlunt' : 'hitPierce');
      if (r.dmg >= 50) sounds.push('bigHit');
      // the killing blow lands bigger and slower (Nov 2026 playtest: "a lack of satisfaction")
      this.float('mon', `−${r.dmg}`, h.over === 'win' ? 'kill' : '');
    }
    if (r.broke) sounds.push('partBreak');
    if (h.intent === 'dazed' && intent0 !== 'dazed') sounds.push('daze');
    if (Object.values(h.mon.parts).filter(p => p.exposed > 0).length > exposed0) sounds.push('expose');
    if (h.over === 'win' && !h.captured) sounds.push('bigHit');
    sfx(...sounds);
    if (r.broke || r.dmg >= 50 || h.over === 'win') this.shake('mon');
    if (h.rerolls > rr0) this.float('player', `+${h.rerolls - rr0} reroll`, 'heal');
  }
  /** the selected dice, or the ones the action would take on its own (E.autoDice) */
  private diceFor(a: E.DiceAction): number[] { return this.sel.length || !this.hunt ? this.sel : E.autoDice(this.hunt, a) ?? []; }
  guard() { if (!shows(this.hunt, 'block')) return; const d = this.diceFor('guard'); if (this.act(h => E.guard(h, d), ok => ok)) sfx('guard'); }
  // actions a layer hasn't shown yet are off for keys and pads too
  charge() { if (!shows(this.hunt, 'charge')) return; const d = this.diceFor('charge'); if (this.act(h => E.charge(h, d), ok => ok)) sfx('charge'); }
  swap() { if (!shows(this.hunt, 'swap')) return; const d = this.diceFor('swap'); if (this.act(h => E.swap(h, d), ok => ok)) sfx('swap'); }
  capture() {
    if (!shows(this.hunt, 'capture')) return;
    // the engine logs a reason when capture is blocked (airborne); keep that on screen
    const d = this.diceFor('capture');
    const r = this.act(h => E.capture(h, d), ok => ok);
    if (r) sfx('capture');
    if (r === false) this.persist();
  }
  reroll() {
    if (!shows(this.hunt, 'reroll')) return;
    const idx = this.act(h => E.reroll(h, this.sel), r => r.length > 0);
    // A reroll can't be undone, and neither can anything before it: undoing would rewind the dice seed and let
    // the player peek at what a reroll gives, then pick different dice (playtest: "you can cheese it").
    if (idx?.length) { this.undoStack = []; this.roll(idx); sfx('reroll'); }
  }
  /** The island's rigged rolls (Mekkman, Nov 2026), so each prompt is sure to come up, not left to the dice. */
  rerollLesson(start: boolean) {
    const h = this.hunt, st = E.islandStep(this.save);
    const seen = (id: string) => this.save.tips.includes(id);
    if (!start || !h || h.over || !settings.prefs.tips && !this.lesson) return;
    const turn = (t: number, f: E.Face[]) => { h.script = h.script ?? []; h.script[t - 1] = f; };
    // the Cragling: two Fangs on turns 1 and 2 (its only face), then two blanks on turn 3 for Reroll (it can't be
    // finished before then: 60 HP, 24 a turn)
    if (h.mid === 'scuttlehog' && st === 0 && !seen('i-reroll')) { turn(3, ['B', 'B']); hold(h, 'reroll'); }
    // the Rimekit: one Fang on turn 1, three on turn 2 (Slash ×3 reads as one per Fang), so it's still standing for
    // the Block lesson on turn 3 (Nov 2026 playtest: teach using several dice for the same move on the second monster)
    if (h.mid === 'snapclaw' && st === 1 && !seen('i-twice2')) {
      const f: E.Face[] = ['C', 'T', 'B']; h.dice.forEach((d, i) => { d.face = f[i] ?? d.face; });
      turn(2, ['C', 'C', 'C']);
      // (Block is taught on turn 1: after Slash, the Claw and the blank fit no move, so Block is what they're for)
    }
    // the Tuskling: turn 3 has a blank for Swap to take on its own (without one the player would have to pick a die
    // first, and the prompt's lock would leave them stuck)
    if (h.mid === 'tuskling' && st === 3 && !seen('i-swap')) { turn(3, ['C', 'T', 'B', 'C']); hold(h, 'swap'); }
    if (h.mid === 'tuskling' && st === 3 && !seen('i-undo')) hold(h, 'undo');
  }
  item() {
    if (!shows(this.hunt, 'item')) return;
    const before = this.hunt?.php ?? 0;
    const ok = this.act(h => E.useItem(h), ok => ok);
    if (ok) sfx('item');
    if (ok && this.hunt && this.hunt.php > before) this.float('player', `+${this.hunt.php - before}`, 'heal');
  }
  /** how many times Undo has been used this session (the Foothills' Undo step waits for one) */
  undos = $state(0);
  /** moves used several times at once (Slash ×2): the Rimekit prompt teaches it */
  multi = $state(0);
  undo() {
    if (!this.hunt || this.hunt.over || !this.undoStack.length || !shows(this.hunt, 'undo')) return;
    this.undos++;
    this.hunt = this.undoStack[this.undoStack.length - 1];
    this.undoStack = this.undoStack.slice(0, -1);
    this.sel = [];
    this.endArmed = false;
    this.persist();
  }
  /** Dice left that would still do something: a move fits them, or the monster is about to hit you (Guard). */
  get spareDice(): number {
    const h = this.hunt; if (!h || h.over) return 0;
    const free = E.freeDice(h).length; if (!free) return 0;
    const moveReady = E.currentWeapon(h).moves.some((_, i) => E.canUseMove(h, i));
    return moveReady || ((E.incoming(h)?.net ?? 0) > 0 && shows(h, 'block')) ? free : 0;
  }
  /** End turn from a button or key. With dice still worth spending, the first press only warns.
   *  (Playtest: players ended turns with dice unspent and didn't notice.) */
  requestEnd() {
    if (!this.hunt || this.hunt.over) return;
    if (this.spareDice && !this.endArmed) { this.endArmed = true; sfx('dieTap'); return; }
    this.endTurn();
  }
  endTurn() {
    const h = this.hunt;
    if (!h || h.over) return;
    this.endArmed = false; this.preview = [];
    PL.turnEnd(h);
    if (E.intentInfo(h).dmg > 0) { this.pulse.actIntent = h.intent; this.pulse.act++; }
    // everything you lost this end of turn, not only the attack: a Spark going off or slime used to land with no number
    const t0 = h.stats.taken; E.endTurn(h); const taken = h.stats.taken - t0;
    if (taken) { this.float('player', `−${taken}`, 'hurt'); if (taken >= E.CHARGE_BREAK) this.shake('player'); }
    if (taken) sfx(taken >= E.CHARGE_BREAK ? 'hurtHeavy' : 'hurt');
    if (!h.over) setTimeout(() => sfx('diceRoll'), taken ? 260 : 0); // the new roll lands after the hit
    // held-back actions arrive on the turn their prompt teaches them (rerollLesson)
    for (const [k, t] of Object.entries(h.held ?? {})) if (h.turn >= t) { h.show = [...(h.show ?? []), k]; delete h.held![k]; }
    this.undoStack = [];
    this.sel = [];
    if (!h.over) this.roll(h.dice.map((_, i) => i));
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
    if (msg && !this.lesson) checkAchievements(this.save);
    this.persist();
    return msg;
  }
}

export const game = new Game();
