// Gear stats, crafting, the shop, rewards and hunt records.
import type { ArmorInst, Cost, Element, Hunt, Move, Save, WeaponInst } from './types';
import { WEAPONS } from './data/weapons';
import { ARMORS, CHARMS, ITEMS, MATERIALS } from './data/gear';
import { MONSTERS } from './data/monsters';
import { nextRandom } from './rng';
import { settleBounty } from './bounty';
import { rankAtLeast } from './rank';

/* ---------- tuning constants ---------- */
export const REWARD = { base: 100, perPart: 40, capture: 60 };
export const RARE = { chance: 0.08, captureChance: 0.12, pityStep: 0.03, pityGuarantee: 11 };
/** The monster a piece of gear is made from: the source of the first material in its recipe. Base gear (the
 *  starter blade, maul, bow and jerkin; coin-only recipes) counts as Gorehorn gear. */
export function gearSource(kind: 'w' | 'a', id: string): string {
  const d = kind === 'w' ? WEAPONS[id] : ARMORS[id];
  const c = (d as { cost?: Cost }).cost ?? (d as { craft?: Cost }).craft ?? {};
  for (const k of Object.keys(c)) if (k !== 'coin') { const src = Object.values(MONSTERS).find(M => M.common === k || M.rare === k || M.parts.some(p => p.mat === k)); if (src) return src.id; }
  return 'gorehorn';
}
/** Reinforcing (weapon rework, Nov 2026): coin plus the common material of the monster the gear comes from, so a
 *  favourite weapon sends you back to hunt its monster (it used to be Gorehorn hide for everything). */
export const reinforceCost = (lv: number, kind: 'w' | 'a' = 'w', id = 'blade'): Cost => {
  const c: Cost = { coin: 80 * (lv + 1), [MONSTERS[gearSource(kind, id)].common]: 2 * (lv + 1) };
  // the changed Ashfall Ridge (Nov 2026): Mirewood gear's last step, +2 → +3, also needs the common material of the
  // variant with the same element. That +3 is what the Stormspire asks for, so the variants are where you prepare.
  const d = kind === 'w' ? WEAPONS[id] : ARMORS[id];
  const el = kind === 'w' ? (d as { elem?: Element | null }).elem : (d as { resist?: Element | null }).resist;
  const v = el ? MONSTERS[VARIANT_OF_ELEM[el]] : undefined;
  if (lv === 2 && (d?.tier ?? 1) === 2 && v) c[v.common] = (c[v.common] ?? 0) + VARIANT_PLUS3;
  return c;
};
/** which changed-Ashfall monster each element's Mirewood gear needs for +3, and how many of its common material */
export const VARIANT_OF_ELEM: Record<Element, string> = { Stone: 'quakeback', Gale: 'squallhorn', Ember: 'ashtail', Frost: 'rimeshrike' };
export const VARIANT_PLUS3 = 2;
export const MAX_REINFORCE = 3;

/* ---------- stats ---------- */
export const lvOf = (bag: Record<string, { lv: number }>, id: string) => bag[id]?.lv ?? 0;

export function movesAt(id: string, lv: number): Move[] {
  const d = WEAPONS[id], k = d.mult * (1 + 0.05 * lv);
  return d.moves.map(m => ({ ...m, dmg: Math.round(m.dmg * k) }));
}
export function weaponInst(id: string, lv: number): WeaponInst {
  return { ...WEAPONS[id], lv, moves: movesAt(id, lv) };
}
export function armorInst(id: string, lv: number): ArmorInst {
  const a = ARMORS[id];
  return { ...a, lv, hp: a.hp + 10 * lv, guard: a.guard + lv };
}
export const ownedWeapon = (s: Save, id: string) => weaponInst(id, lvOf(s.weapons, id));
export const ownedArmor = (s: Save, id: string) => armorInst(id, lvOf(s.armors, id));

/** the element wheel, as the monsters use it: what each element is weak to and what it resists */
export const WEAK_OF: Record<Element, Element> = { Stone: 'Gale', Gale: 'Frost', Ember: 'Stone', Frost: 'Ember' };
export const RESIST_OF: Record<Element, Element> = { Stone: 'Ember', Gale: 'Stone', Ember: 'Frost', Frost: 'Gale' };
/** a monster's element, weakness and resistance right now (they change with the Wanderer Sovereign's stance) */
export function elemsNow(monsterId: string, h?: Hunt | null): { elem: Element; weak: Element; resist: Element } {
  const M = MONSTERS[monsterId];
  if (h && M.elemOf) { const e = M.elemOf(h); return { elem: e, weak: WEAK_OF[e], resist: RESIST_OF[e] }; }
  return { elem: M.elem, weak: M.weak, resist: M.resist };
}
export function elemMult(elem: Element | null, monsterId: string, h?: Hunt | null): number {
  if (!elem) return 1;
  const M = elemsNow(monsterId, h);
  return elem === M.weak ? 1.5 : elem === M.resist ? 0.75 : 1;
}

const avgCache = new Map<string, number>();
/** Expose's damage bonus, mirrored here to avoid an import cycle with combat.ts (kept equal by a test). */
export const EXPOSE_DMG_FOR_AVG = 1.15;
/** Expected damage per turn if all 4 dice go to attacking, without rerolls. */
export function avgDmg(moves: Move[]): number {
  const key = moves.map(m => m.need + ':' + m.dmg + (m.expose ? 'x' : '')).join('|');
  const hit = avgCache.get(key); if (hit != null) return hit;
  const nc = moves.map(m => ({ C: [...m.need].filter(c => c === 'C').length, T: [...m.need].filter(c => c === 'T').length }));
  const f = [1, 1, 2, 6, 24];
  let ev = 0;
  for (let C = 0; C <= 4; C++) for (let T = 0; T <= 4 - C; T++) {
    let best = 0;
    for (let a = 0; a <= 4; a++) for (let x = 0; x <= 2; x++) for (let y = 0; y <= 1; y++) {
      const uc = a * nc[0].C + x * nc[1].C + y * nc[2].C, ut = a * nc[0].T + x * nc[1].T + y * nc[2].T;
      if (uc > C || ut > T) continue;
      let d = a * moves[0].dmg + x * moves[1].dmg + y * moves[2].dmg;
      // Expose (Pierce): every hit after the first lands on an exposed part. Lead with the smallest.
      if (moves[0].expose && a + x + y > 1) {
        const first = a ? moves[0].dmg : x ? moves[1].dmg : moves[2].dmg;
        d = first + (d - first) * EXPOSE_DMG_FOR_AVG;
      }
      best = Math.max(best, d);
    }
    const B = 4 - C - T;
    ev += (f[4] / (f[C] * f[T] * f[B])) / 81 * best;
  }
  const r = Math.round(ev);
  avgCache.set(key, r);
  return r;
}
export const avgVs = (w: { elem: Element | null; moves: Move[] }, monsterId: string) => Math.round(avgDmg(w.moves) * elemMult(w.elem, monsterId));

/* ---------- costs ---------- */
export function canPay(s: Save, c: Cost): boolean {
  return Object.entries(c).every(([k, v]) => (k === 'coin' ? s.coin : s.mats[k] ?? 0) >= v);
}
export function pay(s: Save, c: Cost) {
  for (const [k, v] of Object.entries(c)) { if (k === 'coin') s.coin -= v; else s.mats[k] -= v; }
}
export function missingCount(s: Save, c: Cost | null): number {
  if (!c) return 0;
  return Object.entries(c).filter(([k]) => k !== 'coin').reduce((n, [k, v]) => n + Math.max(0, v - (s.mats[k] ?? 0)), 0);
}

/* ---------- recipes ---------- */
export type RecipeKind = 'w' | 'a' | 'c';
export interface Recipe { action: 'craft' | 'upgrade' | 'reinforce' | null; cost: Cost | null; locked?: boolean }

export function recipeOf(s: Save, kind: RecipeKind, id: string): Recipe {
  if (kind === 'w') {
    const d = WEAPONS[id];
    if (s.weapons[id]) { const lv = s.weapons[id].lv; return lv < MAX_REINFORCE ? { action: 'reinforce', cost: reinforceCost(lv, 'w', id) } : { action: null, cost: null }; }
    if (d.craft) return { action: 'craft', cost: d.craft };
    if (d.from && s.weapons[d.from]) return { action: 'upgrade', cost: d.cost! };
    return { action: null, cost: d.cost ?? null, locked: true };
  }
  if (kind === 'c') {
    if (s.charms[id]) return { action: null, cost: null };
    const need = CHARMS[id].bounties;
    if (need && Object.keys(s.bounties).length < need) return { action: null, cost: CHARMS[id].craft, locked: true };
    return { action: 'craft', cost: CHARMS[id].craft };
  }
  if (s.armors[id]) { const lv = s.armors[id].lv; return lv < MAX_REINFORCE ? { action: 'reinforce', cost: reinforceCost(lv, 'a', id) } : { action: null, cost: null }; }
  return { action: 'craft', cost: ARMORS[id].craft };
}

export const isOwned = (s: Save, kind: RecipeKind, id: string) => (kind === 'w' ? !!s.weapons[id] : kind === 'a' ? !!s.armors[id] : !!s.charms[id]);
export const gearDef = (kind: RecipeKind, id: string): { name: string } => (kind === 'w' ? WEAPONS[id] : kind === 'a' ? ARMORS[id] : CHARMS[id]);

export type RecipeState = { cls: 'owned' | 'ready' | 'short' | 'locked'; text: string };
export function recipeState(s: Save, kind: RecipeKind, id: string): RecipeState {
  const owned = isOwned(s, kind, id);
  const r = recipeOf(s, kind, id);
  if (r.locked) return kind === 'c' ? { cls: 'locked', text: `Complete ${CHARMS[id].bounties} bounties (${Object.keys(s.bounties).length} done)` } : { cls: 'locked', text: `Needs ${WEAPONS[WEAPONS[id].from!].name}` };
  if (owned && !r.action) return { cls: 'owned', text: kind === 'c' ? 'Owned' : 'Owned · max' };
  const ready = !!r.cost && canPay(s, r.cost);
  if (owned) return ready ? { cls: 'ready', text: 'Owned · reinforce ready' } : { cls: 'owned', text: 'Owned' };
  if (ready) return { cls: 'ready', text: 'Ready' };
  const miss = missingCount(s, r.cost);
  return { cls: 'short', text: miss ? `Need ${miss} more` : 'Need coin' };
}

/** Craft, upgrade or reinforce. Returns a message, or null if it couldn't be done. */
export function forgeDo(s: Save, kind: RecipeKind, id: string): string | null {
  const r = recipeOf(s, kind, id);
  if (!r.action || !r.cost || !canPay(s, r.cost)) return null;
  pay(s, r.cost);
  let msg = '';
  if (kind === 'w') {
    const d = WEAPONS[id];
    if (r.action === 'craft') { s.weapons[id] = { lv: 0 }; msg = `Crafted the ${d.name}.`; }
    if (r.action === 'upgrade') {
      // Weapon rework (Nov 2026): crafting the next weapon in a line keeps the one before it (so every branch
      // stays open) and starts the new one at +0. It only needs the previous weapon owned.
      s.weapons[id] = { lv: 0 };
      msg = `Crafted the ${d.name}. You keep your ${WEAPONS[d.from!].name}.`;
    }
    if (r.action === 'reinforce') { s.weapons[id].lv++; msg = `${d.name} reinforced to +${s.weapons[id].lv}.`; }
  } else if (kind === 'c') {
    s.charms[id] = true; msg = `Crafted the ${CHARMS[id].name}.`;
    if (!s.loadout.charm) s.loadout.charm = id;
  } else {
    if (r.action === 'craft') { s.armors[id] = { lv: 0 }; msg = `Crafted the ${ARMORS[id].name}.`; }
    if (r.action === 'reinforce') { s.armors[id].lv++; msg = `${ARMORS[id].name} reinforced to +${s.armors[id].lv}.`; }
  }
  if (s.tracked === `${kind}:${id}` && r.action !== 'reinforce') s.tracked = null;
  return msg;
}

/* ---------- tracking ---------- */
export function trackedRecipe(s: Save) {
  if (!s.tracked) return null;
  const [kind, id] = s.tracked.split(':') as [RecipeKind, string];
  const def = gearDef(kind, id);
  if (!def) return null;
  const r = recipeOf(s, kind, id);
  if (!r.cost || (!r.action && !r.locked)) return null;
  return { kind, id, name: def.name, cost: r.cost, action: r.action };
}
export function trackedNeed(s: Save, mat: string): string {
  const t = trackedRecipe(s);
  if (!t || !t.cost[mat]) return '';
  const have = s.mats[mat] ?? 0, need = t.cost[mat];
  return have >= need ? `enough for ${t.name}` : `need ${need - have} more for ${t.name}`;
}
export function trackedLine(s: Save): string {
  const t = trackedRecipe(s); if (!t) return '';
  const miss = missingCount(s, t.cost);
  return `Tracking: ${t.name}${miss ? ` · ${miss} material${miss > 1 ? 's' : ''} to go` : canPay(s, t.cost) ? ' · ready' : ' · need coin'}`;
}

/* ---------- shop ---------- */
/** Most of this material that any recipe you can still work toward needs. */
export function reserveFor(s: Save, mat: string): number {
  let r = 0;
  for (const id of Object.keys(WEAPONS)) { const x = recipeOf(s, 'w', id); if (x.cost && (x.action || x.locked) && x.cost[mat]) r = Math.max(r, x.cost[mat]); }
  for (const id of Object.keys(ARMORS)) { const x = recipeOf(s, 'a', id); if (x.cost && x.action && x.cost[mat]) r = Math.max(r, x.cost[mat]); }
  for (const id of Object.keys(CHARMS)) { const x = recipeOf(s, 'c', id); if (x.cost && x.action && x.cost[mat]) r = Math.max(r, x.cost[mat]); }
  for (const it of Object.values(ITEMS)) if (it.craft?.[mat]) r = Math.max(r, it.craft[mat]);
  return r;
}
export function usedIn(s: Save, mat: string): string[] {
  const out: string[] = [];
  for (const [id, d] of Object.entries(WEAPONS)) { const x = recipeOf(s, 'w', id); if (x.cost && (x.action || x.locked) && x.cost[mat]) out.push(x.action === 'reinforce' ? `reinforcing ${d.name}` : d.name); }
  for (const [id, d] of Object.entries(ARMORS)) { const x = recipeOf(s, 'a', id); if (x.cost && x.action && x.cost[mat]) out.push(x.action === 'reinforce' ? `reinforcing ${d.name}` : d.name); }
  for (const [id, d] of Object.entries(CHARMS)) { const x = recipeOf(s, 'c', id); if (x.cost && x.action && x.cost[mat]) out.push(d.name); }
  return out;
}
export function buyItem(s: Save, id: string, n: number): string | null {
  const it = ITEMS[id]; if (!it.price || n < 1 || s.coin < it.price * n) return null;
  s.coin -= it.price * n; s.items[id] = (s.items[id] ?? 0) + n;
  return `Bought ${n} ${it.name}.`;
}
export function craftItem(s: Save, id: string): string | null {
  const it = ITEMS[id]; if (!it.craft || !canPay(s, it.craft)) return null;
  pay(s, it.craft); s.items[id] = (s.items[id] ?? 0) + (it.yields ?? 1);
  return `Crafted ${it.yields ?? 1} ${it.name}.`;
}
export function sellMat(s: Save, id: string, n: number): string | null {
  const m = MATERIALS[id], k = Math.min(n, s.mats[id] ?? 0); if (k < 1 || m.sell <= 0) return null;
  s.mats[id] -= k; s.coin += m.sell * k;
  return `Sold ${k} ${m.base} for ${m.sell * k} coin.`;
}
/** Coin your spare materials would sell for: what no recipe still needs (the Shop's Sell surplus). Playtest
 *  (Nov 2026): three testers never found out that materials sell for coin. */
export function surplusValue(s: Save): number {
  let total = 0;
  for (const [k, m] of Object.entries(MATERIALS)) { const spare = (s.mats[k] ?? 0) - Math.min(s.mats[k] ?? 0, reserveFor(s, k)); if (spare > 0 && m.sell > 0) total += spare * m.sell; }
  return total;
}
export function sellSurplus(s: Save): string {
  let total = 0, n = 0;
  for (const [k, m] of Object.entries(MATERIALS)) {
    const spare = (s.mats[k] ?? 0) - Math.min(s.mats[k] ?? 0, reserveFor(s, k));
    if (spare > 0 && m.sell > 0) { s.mats[k] -= spare; total += spare * m.sell; n += spare; }
  }
  s.coin += total;
  return n ? `Sold ${n} surplus materials for ${total} coin.` : 'Nothing surplus to sell.';
}

/* ---------- hunts: preparation and settlement ---------- */
export function fixLoadout(s: Save) {
  const L = s.loadout;
  L.weapons = L.weapons.filter(id => s.weapons[id]);
  for (const id of Object.keys(s.weapons)) { if (L.weapons.length >= 2) break; if (!L.weapons.includes(id)) L.weapons.push(id); }
  if (!s.armors[L.armor]) L.armor = Object.keys(s.armors)[0];
  if (L.item && !((s.items[L.item] ?? 0) > 0)) L.item = null;
  if (L.charm === undefined || (L.charm && !s.charms[L.charm])) L.charm = null;
}

/* ---------- unlocks ---------- */
/** Can this monster be hunted? Locked until its prerequisite is beaten. Already-hunted monsters stay open. */
export function isUnlocked(s: Save, id: string): boolean {
  const req = MONSTERS[id]?.requires;
  const reqs = req ? (Array.isArray(req) ? req : [req]) : [];
  // a promotion hunt counts as passed once you hold its rank (older saves earn their rank from their records)
  const met = (r: string) => (s.record[r]?.wins ?? 0) > 0 || (!!MONSTERS[r]?.promotion && rankAtLeast(s, MONSTERS[r].promotion!));
  return reqs.every(met) || (s.record[id]?.hunts ?? 0) > 0;
}

/** How to unlock a locked monster, in words: "Beat the Gorehorn first" or "Beat every monster on Ashfall Ridge first". */
export function unlockHint(id: string): string {
  const req = MONSTERS[id]?.requires; if (!req) return '';
  const reqs = (Array.isArray(req) ? req : [req]).filter(r => MONSTERS[r]);
  // a promotion hunt (Nov 2026: rank F → E is the Cragwing) opens the next rank's regions
  if (reqs.length === 1) return MONSTERS[reqs[0]].promotion ? `Pass the ${MONSTERS[reqs[0]].short} promotion hunt first` : `Beat the ${MONSTERS[reqs[0]].short} first`;
  const tiers = new Set(reqs.map(r => MONSTERS[r].tier));
  if (tiers.size === 1 && tiers.has(1)) return 'Beat every monster on Ashfall Ridge first';
  if (tiers.size === 1 && tiers.has(2)) return 'Beat every monster in the Mirewood first';
  const mire = Object.values(MONSTERS).filter(M => M.tier === 2).map(M => M.id), rest = reqs.filter(r => !mire.includes(r));
  if (mire.length && mire.every(r => reqs.includes(r)) && rest.length === 1) return `Beat every monster in the Mirewood and the ${MONSTERS[rest[0]].short} first`;
  if (tiers.size === 1 && tiers.has(3) && reqs.length === Object.values(MONSTERS).filter(M => M.tier === 3).length) return 'Beat every monster on the Stormspire first';
  return `Beat ${reqs.map(r => MONSTERS[r].short).join(', ')} first`;
}

/** The unlock hint split for the Hunt Board: the condition a whole region shares, and what this monster adds to it
 *  (the changed Mirewood: every Mirewood monster, plus one from the Gloamhollow). */
export function unlockParts(id: string): { base: string; extra: string | null } {
  const full = unlockHint(id), m = /^Beat every monster in the Mirewood and the (.+) first$/.exec(full);
  return m ? { base: 'Beat every monster in the Mirewood first', extra: m[1] } : { base: full, extra: null };
}

/** Every monster in this build has been beaten at least once: the end of the content (in the demo, the end of the demo). */
export function contentComplete(s: Save): boolean {
  return Object.keys(MONSTERS).every(id => (s.record[id]?.wins ?? 0) > 0);
}

/** Apply a finished hunt's results to the save. Safe to call more than once. */
export function settleHunt(s: Save, h: Hunt) {
  if (!h.over || h.reward) return;
  const MD = MONSTERS[h.mid];
  const lockedBefore = Object.keys(MONSTERS).filter(id => !isUnlocked(s, id));
  s.hunts++;
  s.items.snare = (s.items.snare ?? 0) + (h.snares ?? 0); // unused snares come home, win or lose
  const rec = (s.record[h.mid] ??= { hunts: 0, wins: 0, captures: 0, breaks: {} });
  rec.hunts++;
  for (const [k, v] of Object.entries(h.mon.parts)) if (v.broken || (v.cracks ?? 0) > 0) rec.breaks[k] = (rec.breaks[k] ?? 0) + 1;
  if (h.over === 'win') {
    rec.wins++; if (h.captured) rec.captures++;
    const mult = h.captured ? 2 : 1;
    const mats: Record<string, number> = { [MD.common]: h.captured ? 3 : 2 };
    for (const p of MD.parts) if (h.mon.parts[p.id].broken || (h.mon.parts[p.id].cracks ?? 0) > 0) mats[p.mat] = (mats[p.mat] ?? 0) + mult;
    let rare = false;
    if (h.mon.parts[MD.rarePart].broken) {
      const pity = s.pity[MD.rare] ?? 0;
      const chance = Math.min(1, (h.captured ? RARE.captureChance : RARE.chance) + RARE.pityStep * pity);
      if (pity >= RARE.pityGuarantee || nextRandom(h) < chance) { rare = true; mats[MD.rare] = 1; s.pity[MD.rare] = 0; }
      else s.pity[MD.rare] = pity + 1;
    }
    const coin = REWARD.base + REWARD.perPart * h.stats.broken + (h.captured ? REWARD.capture : 0);
    s.coin += coin;
    for (const [k, v] of Object.entries(mats)) s.mats[k] = (s.mats[k] ?? 0) + v;
    if (h.item) s.items[h.item] = (s.items[h.item] ?? 0) + h.itemCharges;
    h.reward = { coin, mats, rare, returned: h.item ? h.itemCharges : 0, lost: 0, unlocked: lockedBefore.filter(id => isUnlocked(s, id)) };
  } else {
    // A failed hunt keeps the materials of the parts you broke (one each; no coin, no carve, no rare, and the
    // items you carried are lost). Playtest/sim (Nov 2026): losses paid nothing, so an under-geared player at a new
    // tier could lose their way into a hole they couldn't farm out of.
    const mats: Record<string, number> = {};
    for (const p of MD.parts) if (h.mon.parts[p.id].broken || (h.mon.parts[p.id].cracks ?? 0) > 0) mats[p.mat] = (mats[p.mat] ?? 0) + 1;
    for (const [k, v] of Object.entries(mats)) s.mats[k] = (s.mats[k] ?? 0) + v;
    h.reward = { coin: 0, mats, rare: false, returned: 0, lost: h.item ? h.carried : 0 };
  }
  settleBounty(s, h);
}
