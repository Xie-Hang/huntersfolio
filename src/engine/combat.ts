// Combat rules. Every action mutates the hunt in place and returns true if it happened.
// The UI keeps its own snapshots for Undo (structuredClone the hunt before an action).
import type { Hunt, Intent, Save, Tone, WeaponInst } from './types';
import { MONSTERS } from './data/monsters';
import { groundFlier } from './data/monsters/galeshrike';
import { ITEMS } from './data/gear';
import { armorInst, elemMult, fixLoadout, lvOf, weaponInst } from './economy';
import { rollFace } from './rng';

export const GUARD_RESIST = 0.7;       // armor element resistance multiplier
export const CHARGE_BREAK = 30;        // damage that breaks a pending charge
export const CAPTURE_AT = 0.2;         // capture allowed at or below this share of vigour
export const PIERCE_BREAK_BONUS = 1.5;
export const DAZE_START = 50, DAZE_STEP = 30;

const def = (h: Hunt) => MONSTERS[h.mid];
export const monsterOf = def;
export const currentWeapon = (h: Hunt) => h.weps[h.weapon];
export const otherWeapon = (h: Hunt) => h.weps[1 - h.weapon];

export function log(h: Hunt, t: string, tone: Tone = '') {
  h.log.unshift({ t, tone });
  if (h.log.length > 30) h.log.pop();
}

/* ---------- start ---------- */
/** Builds a hunt from the save's loadout. Carried item charges leave the stash now. */
export function startHunt(s: Save, seed: number): Hunt {
  fixLoadout(s);
  const L = s.loadout, MD = MONSTERS[L.target], arm = armorInst(L.armor, lvOf(s.armors, L.armor));
  let item = L.item, carried = 0;
  if (item && (s.items[item] ?? 0) > 0) { carried = Math.min(s.items[item], ITEMS[item].max); s.items[item] -= carried; } else item = null;
  const parts = Object.fromEntries(MD.parts.map(p => [p.id, { hp: p.hp, max: p.hp, broken: false }]));
  const h: Hunt = {
    mid: MD.id, turn: 1, php: arm.hp, pmax: arm.hp, rerolls: arm.rerolls,
    weps: L.weapons.map(id => weaponInst(id, lvOf(s.weapons, id))), weapon: 0, arm,
    item, itemCharges: carried, carried, itemUsed: false,
    dice: [], guard: 0, chargePending: false, chargeReady: false, evade: false, whet: 0,
    target: MD.parts[0].id,
    mon: { hp: MD.hp, max: MD.hp, parts, enraged: false, daze: 0, dazeMax: DAZE_START, seq: 0, charges: 0, usedWallow: false, usedRoot: false, exhausted: false, wallow: 0, air: false, airLeft: 0 },
    intent: '', log: [], over: null, captured: false,
    stats: { dealt: 0, taken: 0, guarded: 0, broken: 0, rerollsUsed: 0 },
    reward: null, rng: seed | 0
  };
  rollAll(h);
  h.intent = MD.next(h, null);
  log(h, `You set out with the ${h.weps[0].name} and ${h.weps[1].name}.`);
  log(h, MD.intro);
  return h;
}

function rollAll(h: Hunt) { h.dice = [0, 1, 2, 3].map(() => ({ face: rollFace(h), used: null })); }

/* ---------- reading the state ---------- */
export const intentInfo = (h: Hunt): Intent => def(h).intent(h, h.intent);
export const tip = (h: Hunt) => (h.over ? null : def(h).tip?.(h, h.intent) ?? null);
export const canCapture = (h: Hunt) => h.mon.hp > 0 && h.mon.hp <= h.mon.max * CAPTURE_AT;
export const captureBlocked = (h: Hunt) => canCapture(h) && def(h).canCapture?.(h) === false;
export const reachable = (h: Hunt, partId: string, w: WeaponInst) => def(h).reachable?.(h, partId, w) ?? true;
export const airborneHalf = (h: Hunt, w: WeaponInst) => h.mon.air && w.type !== 'Pierce';
export const freeDice = (h: Hunt) => h.dice.map((d, i) => (d.used ? -1 : i)).filter(i => i >= 0);

export function itemUsable(h: Hunt): boolean {
  if (!h.item || h.itemUsed || h.itemCharges < 1 || h.over) return false;
  if (ITEMS[h.item].effect === 'net') return h.mon.air;
  return true;
}

/** What the next monster action will do to you right now, given your guard. */
export function incoming(h: Hunt) {
  if (h.over) return null;
  const info = intentInfo(h); if (!info.dmg) return null;
  const res = h.arm.resist === def(h).elem, after = res ? Math.round(info.dmg * GUARD_RESIST) : info.dmg;
  if (h.evade) return { raw: info.dmg, after, net: 0, res, g: 0, half: !!info.halfGuard, evade: true };
  const g = info.halfGuard ? Math.floor(h.guard / 2) : h.guard;
  return { raw: info.dmg, after, net: Math.max(0, after - g), res, g, half: !!info.halfGuard, evade: false };
}

/** Indices of free dice that satisfy a recipe, preferring the ones in `prefer`. */
export function pickDice(h: Hunt, need: string, prefer: number[] = []): number[] | null {
  const picks: number[] = [];
  for (const ch of need) {
    const ok = (i: number) => !h.dice[i].used && h.dice[i].face === ch && !picks.includes(i);
    let i = prefer.find(ok);
    if (i === undefined) i = h.dice.findIndex((_, j) => ok(j));
    if (i === undefined || i < 0) return null;
    picks.push(i);
  }
  return picks;
}
export const canUseMove = (h: Hunt, i: number) => !h.over && !!pickDice(h, currentWeapon(h).moves[i].need);

/* ---------- player actions ---------- */
function checkEnrage(h: Hunt) {
  const m = h.mon;
  if (!m.enraged && m.hp > 0 && m.hp <= m.max / 2) { m.enraged = true; log(h, def(h).enrageText, 'ember'); }
}
function finish(h: Hunt, result: 'win' | 'lose') {
  h.over = result;
  const MD = def(h);
  if (result === 'win') { if (!h.captured) log(h, `${MD.name} falls. Hunt complete.`, 'gold'); }
  else log(h, 'You go down. The hunt has failed.', 'ember');
}

export interface HitResult { dmg: number; broke: boolean }

/** Use weapon move i. `prefer` lists selected dice to spend first. */
export function useMove(h: Hunt, i: number, prefer: number[] = []): HitResult | null {
  if (h.over) return null;
  const w = currentWeapon(h), mv = w.moves[i], m = h.mon, MD = def(h);
  const picks = pickDice(h, mv.need, prefer); if (!picks) return null;
  picks.forEach(j => (h.dice[j].used = mv.name));
  let dmg = mv.dmg; const notes: string[] = [];
  if (h.chargeReady) { dmg *= 2; h.chargeReady = false; notes.push('charged ×2'); }
  if (h.whet) { dmg = Math.round(dmg * (1 + h.whet)); notes.push(`whetted +${Math.round(h.whet * 100)}%`); h.whet = 0; }
  const em = elemMult(w.elem, h.mid);
  if (em !== 1) { dmg = Math.round(dmg * em); notes.push(em > 1 ? 'weakness ×1.5' : 'resisted ×0.75'); }
  if (airborneHalf(h, w)) { dmg = Math.round(dmg / 2); notes.push('airborne ½'); }
  const p = m.parts[h.target], pdef = MD.parts.find(x => x.id === h.target)!;
  const mod = MD.hitMod?.(h, h.target, w);
  if (mod) { dmg = Math.round(dmg * mod.mult); notes.push(mod.note); }
  dmg = Math.min(dmg, m.hp);
  m.hp -= dmg; h.stats.dealt += dmg;
  log(h, `${mv.name} hits the ${pdef.name.toLowerCase()} for ${dmg}${notes.length ? ' (' + notes.join(', ') + ')' : ''}.`);
  let broke = false;
  const reach = reachable(h, h.target, w);
  if (!p.broken) {
    const e = pdef.eff[w.type];
    if (!reach) log(h, `The ${pdef.name.toLowerCase()} is out of reach right now. Only Pierce gets there.`);
    else if (e > 0) {
      p.hp = Math.max(0, p.hp - Math.round(dmg * e * (mv.part ?? 1) * (w.type === 'Pierce' ? PIERCE_BREAK_BONUS : 1)));
      if (p.hp === 0) {
        p.broken = true; h.stats.broken++; broke = true; log(h, pdef.brk, 'ember');
        if (h.arm.breakHeal) { const heal = Math.min(25, h.pmax - h.php); h.php += heal; h.rerolls++; log(h, `${h.arm.name}: +${heal} HP, +1 reroll.`, 'gold'); }
      }
    } else if (dmg > 0) log(h, `${w.type} weapons can't break the ${pdef.name.toLowerCase()}. The hit still counts toward the kill.`);
  }
  if (mv.flow) { h.rerolls++; log(h, 'FLOW: +1 reroll.'); }
  if (mv.daze && h.target === MD.head && reach && m.hp > 0) {
    m.daze = Math.min(m.dazeMax, m.daze + dmg);
    if (m.daze >= m.dazeMax) { m.daze = 0; m.dazeMax += DAZE_STEP; h.intent = 'dazed'; log(h, 'DAZE: the blow rattles its skull. It loses its action!', 'daze'); }
  }
  if (mv.pin) { const t = MD.onPin?.(h); if (t) log(h, t, 'gold'); }
  checkEnrage(h);
  if (m.hp <= 0) finish(h, 'win');
  return { dmg, broke };
}

const freeOnly = (h: Hunt, idx: number[]) => idx.filter(i => h.dice[i] && !h.dice[i].used);

export function guard(h: Hunt, idx: number[]): boolean {
  const sel = freeOnly(h, idx); if (!sel.length || h.over) return false;
  for (const i of sel) { h.guard += h.arm.guard * (h.arm.blankx2 && h.dice[i].face === 'B' ? 2 : 1); h.dice[i].used = 'Guard'; }
  return true;
}
export function charge(h: Hunt, idx: number[]): boolean {
  const sel = freeOnly(h, idx); if (sel.length !== 2 || h.chargePending || h.over) return false;
  sel.forEach(i => (h.dice[i].used = 'Charge')); h.chargePending = true;
  log(h, 'You plant your feet and build up power.');
  return true;
}
export function swap(h: Hunt, idx: number[]): boolean {
  const sel = freeOnly(h, idx); if (sel.length !== 1 || h.over) return false;
  h.dice[sel[0]].used = 'Swap'; h.weapon = 1 - h.weapon;
  log(h, `You switch to the ${currentWeapon(h).name}.`);
  return true;
}
export function capture(h: Hunt, idx: number[]): boolean {
  const sel = freeOnly(h, idx); if (sel.length !== 2 || !canCapture(h) || h.over) return false;
  if (captureBlocked(h)) { log(h, 'You can’t snare it while it’s in the air.'); return false; }
  sel.forEach(i => (h.dice[i].used = 'Capture'));
  h.captured = true; log(h, `The snare bites. ${def(h).name} thrashes, then lies still. Captured!`, 'gold');
  finish(h, 'win');
  return true;
}
export function reroll(h: Hunt, idx: number[]): number[] {
  const sel = freeOnly(h, idx); if (!sel.length || h.rerolls < 1 || h.over) return [];
  h.rerolls--; h.stats.rerollsUsed++;
  for (const i of sel) h.dice[i].face = rollFace(h);
  return sel;
}
export function useItem(h: Hunt): boolean {
  if (!itemUsable(h)) return false;
  h.itemUsed = true; h.itemCharges--;
  const it = ITEMS[h.item!];
  switch (it.effect) {
    case 'heal30': { const heal = Math.min(30, h.pmax - h.php); h.php += heal; log(h, `${it.name}: +${heal} HP.`); break; }
    case 'smoke': h.evade = true; log(h, 'You throw down smoke. Its next attack will miss.'); break;
    case 'whet50': h.whet = 0.5; log(h, 'You sharpen your edge. Next hit +50%.'); break;
    case 'whet100': h.whet = 1; log(h, 'You grind your edge on the tusk. Next hit +100%.'); break;
    case 'net': groundFlier(h); log(h, 'The net wraps its wings. It crashes to the ground!', 'gold'); break;
  }
  return true;
}
export function abandon(h: Hunt) {
  if (h.over) return;
  log(h, 'You retreat from the hunt.', 'ember');
  finish(h, 'lose');
}

/* ---------- monster turn ---------- */
export interface TurnResult { taken: number }

export function endTurn(h: Hunt): TurnResult {
  if (h.over) return { taken: 0 };
  const type = h.intent, info = intentInfo(h), m = h.mon, MD = def(h);
  let taken = 0;
  if (info.dmg > 0) {
    if (h.evade) { h.evade = false; log(h, `${info.name} tears through the smoke and misses you.`, 'gold'); }
    else {
      const res = h.arm.resist === MD.elem;
      const raw = res ? Math.round(info.dmg * GUARD_RESIST) : info.dmg;
      const g = info.halfGuard ? Math.floor(h.guard / 2) : h.guard;
      taken = Math.max(0, raw - g);
      const blocked = raw - taken;
      h.php = Math.max(0, h.php - taken); h.stats.taken += taken; h.stats.guarded += blocked;
      log(h, `${info.name} hits you for ${taken}${blocked ? ` (${blocked} blocked${info.halfGuard ? ', guard halved' : ''})` : ''}${res ? ` (${MD.elem} resisted)` : ''}.`, taken >= CHARGE_BREAK ? 'ember' : '');
      if (h.chargePending && taken >= CHARGE_BREAK) { h.chargePending = false; log(h, 'The hit breaks your focus. Your charge is lost.', 'ember'); }
    }
  }
  const line = MD.resolve(h, type);
  if (line) log(h, line);
  if (m.wallow > 0) m.wallow--;
  if (h.php <= 0) { finish(h, 'lose'); return { taken }; }
  if (h.chargeReady) log(h, 'Your unused charge fades.');
  h.turn++; h.chargeReady = h.chargePending; h.chargePending = false; h.guard = 0; h.itemUsed = false;
  rollAll(h);
  h.intent = MD.next(h, type);
  return { taken };
}
