// Reusable simulation runs: single-hunt matchups and full progression campaigns.
import * as E from '../engine';
import type { Save } from '../engine/types';
import { playHunt, type Policy } from './bot';

export interface Setup { weapons: [string, number][]; armor: string; armorLv?: number; item?: string | null; items?: number; charm?: string | null; target: string }

function saveFor(s: Setup): Save {
  const save = E.newSave();
  save.weapons = Object.fromEntries(s.weapons.map(([id, lv]) => [id, { lv }]));
  save.armors = { [s.armor]: { lv: s.armorLv ?? 0 } };
  save.items = { ...save.items, salve: 0 };
  if (s.item) save.items[s.item] = s.items ?? 3;
  if (s.charm) save.charms = { [s.charm]: true };
  save.loadout = { weapons: s.weapons.map(w => w[0]), armor: s.armor, charm: s.charm ?? null, item: s.item ?? null, target: s.target };
  return save;
}

export interface MatchupStats { win: number; captured: number; turns: number; hpLeft: number; parts: number; partRate: Record<string, number> }

export function matchup(setup: Setup, policy: Policy, n: number, seed = 1): MatchupStats {
  let win = 0, captured = 0, turns = 0, hpLeft = 0, parts = 0;
  const partRate: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const save = saveFor(setup);
    const h = playHunt(E.startHunt(save, seed + i * 7919), policy);
    turns += h.turn;
    if (h.over === 'win') {
      win++; if (h.captured) captured++;
      hpLeft += h.php / h.pmax;
      for (const [k, v] of Object.entries(h.mon.parts)) { if (v.broken) { parts++; partRate[k] = (partRate[k] ?? 0) + 1; } }
    }
  }
  for (const k of Object.keys(partRate)) partRate[k] /= Math.max(1, win);
  return { win: win / n, captured: captured / n, turns: turns / n, hpLeft: hpLeft / Math.max(1, win), parts: parts / Math.max(1, win), partRate };
}

/** A player who hunts the Gorehorn, crafts in a fixed priority order and restocks salves. Returns the hunt number each milestone was reached. */
export function gorehornCampaign(seed: number, policy: Policy, maxHunts = 60) {
  const s = E.newSave();
  const t: Record<string, number> = {};
  let fails = 0;
  for (let n = 1; n <= maxHunts; n++) {
    s.loadout.target = 'gorehorn';
    const blunt = ['crusher', 'tusk', 'maul'].find(id => s.weapons[id])!;
    const cut = ['saber', 'blade'].find(id => s.weapons[id])!;
    s.loadout.weapons = [cut, blunt];
    s.loadout.armor = s.armors.vest ? 'vest' : 'jerkin';
    s.loadout.item = s.items.salve > 0 ? 'salve' : null;
    const h = playHunt(E.startHunt(s, seed * 100_003 + n), { ...policy, goal: ['tusks', 'hide', 'legs'] });
    E.settleHunt(s, h);
    if (h.over !== 'win') fails++;
    if (s.mats.heartstone > 0) t.heartstone ??= n;
    while (s.items.salve < 3 && s.coin >= 130) E.buyItem(s, 'salve', 1);
    for (let guard = 0; guard < 20; guard++) {
      const tryDo = (kind: 'w' | 'a', id: string, key: string) => { if (E.forgeDo(s, kind, id)) { t[key] ??= n; return true; } return false; };
      if (s.weapons.maul && tryDo('w', 'tusk', 'tusk')) continue;
      if (!s.armors.vest && tryDo('a', 'vest', 'vest')) continue;
      if (s.weapons.blade && tryDo('w', 'saber', 'saber')) continue;
      if (s.weapons.tusk && tryDo('w', 'crusher', 'crusher')) continue;
      if (t.tusk && t.vest && t.saber) {
        const b = ['crusher', 'tusk'].find(id => s.weapons[id]);
        if (b && (s.weapons[b].lv < 3) && E.forgeDo(s, 'w', b)) continue;
        if (s.armors.vest && s.armors.vest.lv < 3 && E.forgeDo(s, 'a', 'vest')) continue;
        if (s.weapons.saber && s.weapons.saber.lv < 3 && E.forgeDo(s, 'w', 'saber')) continue;
      }
      break;
    }
    if (s.weapons.crusher?.lv === 3 && s.armors.vest?.lv === 3 && s.weapons.saber?.lv === 3) { t.done = n; break; }
  }
  return { t, fails };
}

export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)];
}

/** The whole demo: a player starting from a new save until every Tier 1 monster has been beaten once.
 *  Each hunt they go after the first unbeaten monster that's open, with the two owned weapons that do best
 *  against it (different types if possible), its counter item when they can afford one, and they spend
 *  everything at the Forge between hunts. Two failures in a row against a new monster → one farming hunt
 *  on the easiest monster already beaten. Returns hunts, turns and fails. */
export function tier1Campaign(seed: number, policy: Policy, maxHunts = 80, tiers: number[] = [1]) {
  const s = E.newSave();
  const T1 = Object.values(E.MONSTERS).filter(M => tiers.includes(M.tier)).map(M => M.id);
  const COUNTER: Record<string, string> = { galeshrike: 'net', cinderback: 'blast', rimetail: 'firepot' };
  let turns = 0, fails = 0, streak = 0, hunts = 0;
  const firstWin: Record<string, number> = {};
  const wpn = (id: string) => E.weaponInst(id, E.lvOf(s.weapons, id));
  for (let n = 1; n <= maxHunts; n++) {
    const beaten = (id: string) => (s.record[id]?.wins ?? 0) > 0;
    const todo = T1.filter(id => E.isUnlocked(s, id) && !beaten(id));
    if (!todo.length && T1.every(beaten)) break;
    const target = streak >= 2 ? 'gorehorn' : todo[0];
    const owned = Object.keys(s.weapons).sort((a, b) => E.avgVs(wpn(b), target) - E.avgVs(wpn(a), target));
    const first = owned[0], second = owned.find(id => E.WEAPONS[id].type !== E.WEAPONS[first].type) ?? owned[1];
    const arms = Object.keys(s.armors).sort((a, b) => Number(E.ARMORS[b].resist === E.MONSTERS[target].elem) - Number(E.ARMORS[a].resist === E.MONSTERS[target].elem) || E.ARMORS[b].hp - E.ARMORS[a].hp);
    const c = COUNTER[target];
    if (c && (s.items[c] ?? 0) < 1 && s.coin >= E.ITEMS[c].price! * 2) E.buyItem(s, c, 2);
    const item = c && s.items[c] > 0 ? c : s.items.salve > 0 ? 'salve' : null;
    s.loadout = { ...s.loadout, target, weapons: [first, second], armor: arms[0], item };
    const h = playHunt(E.startHunt(s, seed * 100_003 + n), { ...policy });
    E.settleHunt(s, h); E.award(s, h);
    hunts++; turns += h.turn;
    if (h.over === 'win') { firstWin[target] ??= n; if (target !== 'gorehorn' || streak < 2) streak = 0; else streak = 0; }
    else { fails++; streak++; }
    while (s.items.salve < 3 && s.coin >= 30 * 4) E.buyItem(s, 'salve', 1);
    // spend at the Forge: anything ready, cheapest first; crafted items too
    for (let k = 0; k < 20; k++) {
      const ready = (['w', 'a', 'c'] as const).flatMap(kind => Object.keys(kind === 'w' ? E.WEAPONS : kind === 'a' ? E.ARMORS : E.CHARMS).map(id => ({ kind, id })))
        .filter(r => E.recipeState(s, r.kind, r.id).cls === 'ready' && !(r.kind === 'w' && E.lvOf(s.weapons, r.id) >= 1 && E.recipeOf(s, 'w', r.id).action === 'reinforce'));
      if (!ready.length || !E.forgeDo(s, ready[0].kind, ready[0].id)) break;
    }
    E.award(s);
  }
  return { hunts, turns, fails, firstWin, achievements: [...s.achievements], done: T1.every(id => (s.record[id]?.wins ?? 0) > 0) };
}

/** A sensible player through the whole game (Nov 2026; the old campaign farmed the Gorehorn whenever it got stuck,
 *  crafted whatever happened to be affordable and never reinforced past +1, so it never got past Tier 2).
 *  Each hunt: go after the first open monster not yet beaten. Plan gear for it: the two best weapons of different
 *  types that can be made from monsters already beaten (scored by damage against it and how well the type breaks
 *  its parts), and armor that resists its element if one can be made. Craft and reinforce (to +2) toward that plan.
 *  After a loss, farm the beaten monster that drops the most missing materials, then try again. Returns hunts
 *  to the first win of each monster and per tier. */
export interface FullRun { hunts: number; turns: number; fails: number; firstWin: Record<string, number>; tierDone: Record<number, number>; done: boolean }
/** forge rules to compare: 'now' (an upgrade replaces the old weapon and keeps its level; reinforcing costs Gorehorn
 *  hide), 'own' (crafting the next weapon keeps the old one and needs only to own it; the new one starts at +0;
 *  reinforcing costs the weapon's own monster's common material), 'max' (as 'own', but the old one must be at +3). */
export type ForgeRules = 'now' | 'own' | 'max';
export function fullCampaign(seed: number, policy: Policy, maxHunts = 250, tiers: number[] = [1, 2, 3], opt: { reinforceTo?: number; rules?: ForgeRules } = {}): FullRun {
  const s = E.newSave();
  const RE = opt.reinforceTo ?? 2, RULES = opt.rules ?? 'now';
  const MON = Object.values(E.MONSTERS).filter(M => tiers.includes(M.tier)).sort((a, b) => a.tier - b.tier);
  const source: Record<string, string> = {};
  for (const M of Object.values(E.MONSTERS)) { source[M.common] = M.id; source[M.rare] = M.id; for (const p of M.parts) source[p.mat] = M.id; }
  const beaten = (id: string) => (s.record[id]?.wins ?? 0) > 0;
  /** the monster a piece of gear is made from: the source of its first material (base gear: the Gorehorn) */
  const gearSrc = (kind: 'w' | 'a', id: string) => { const d = kind === 'w' ? E.WEAPONS[id] : E.ARMORS[id]; const c = (d as { cost?: Record<string, number> }).cost ?? (d as { craft?: Record<string, number> }).craft ?? {}; const m = Object.keys(c).find(k => k !== 'coin' && source[k]); return m ? source[m] : 'gorehorn'; };
  const rcost = (kind: 'w' | 'a', id: string, lv: number): Record<string, number> => RULES === 'now' ? E.reinforceCost(lv) as Record<string, number> : { coin: 80 * (lv + 1), [E.MONSTERS[gearSrc(kind, id)].common]: 2 * (lv + 1) };
  const bag = (kind: 'w' | 'a') => (kind === 'w' ? s.weapons : s.armors);
  /** cost and readiness of the next forge action on this item under RULES */
  const recipe = (kind: 'w' | 'a', id: string): { act: 'craft' | 'upgrade' | 'reinforce' | null; cost: Record<string, number> } => {
    if (RULES === 'now') { const r = E.recipeOf(s, kind, id); return { act: r.locked ? null : r.action, cost: (r.cost ?? {}) as Record<string, number> }; }
    const b = bag(kind);
    if (b[id]) return b[id].lv < E.MAX_REINFORCE ? { act: 'reinforce', cost: rcost(kind, id, b[id].lv) } : { act: null, cost: {} };
    if (kind === 'a') return { act: 'craft', cost: { ...E.ARMORS[id].craft } as Record<string, number> };
    const d = E.WEAPONS[id];
    if (d.craft) return { act: 'craft', cost: { ...d.craft } as Record<string, number> };
    if (d.from && s.weapons[d.from] && (RULES === 'own' || s.weapons[d.from].lv >= E.MAX_REINFORCE)) return { act: 'upgrade', cost: { ...d.cost } as Record<string, number> };
    return { act: null, cost: { ...(d.cost ?? {}) } as Record<string, number> };
  };
  const afford = (c: Record<string, number>) => Object.entries(c).every(([k, v]) => (k === 'coin' ? s.coin : (s.mats[k] ?? 0)) >= v);
  const doForge = (kind: 'w' | 'a', id: string): boolean => {
    if (RULES === 'now') return !!E.forgeDo(s, kind, id);
    const r = recipe(kind, id); if (!r.act || !afford(r.cost)) return false;
    for (const [k, v] of Object.entries(r.cost)) { if (k === 'coin') s.coin -= v; else s.mats[k] -= v; }
    const b = bag(kind);
    if (r.act === 'reinforce') b[id].lv++; else b[id] = { lv: 0 };
    return true;
  };
  const fit = (type: E.DamageType, mid: string) => { const ps = E.MONSTERS[mid].parts; return 0.5 + ps.reduce((a, p) => a + (p.eff[type] ?? 0), 0) / ps.length; };
  const score = (id: string, mid: string) => E.avgVs(E.weaponInst(id, Math.max(RE, E.lvOf(s.weapons, id))), mid) * fit(E.WEAPONS[id].type, mid);
  const costOf = (kind: 'w' | 'a', id: string): Record<string, number> => {
    const d = kind === 'w' ? E.WEAPONS[id] : E.ARMORS[id];
    return { ...((d as { craft?: Record<string, number> }).craft ?? (d as { cost?: Record<string, number> }).cost ?? {}) };
  };
  /** every material in the chain up to this weapon comes from a beaten monster */
  const makeable = (kind: 'w' | 'a', id: string): boolean => {
    const d = kind === 'w' ? E.WEAPONS[id] : E.ARMORS[id];
    if ((d.tier ?? 1) > Math.max(...tiers)) return false;
    if (kind === 'w' && s.weapons[id]) return true;
    if (kind === 'a' && s.armors[id]) return true;
    const ok = Object.keys(costOf(kind, id)).every(k => k === 'coin' || (source[k] && beaten(source[k])));
    return ok && (kind === 'a' || !E.WEAPONS[id].from || makeable('w', E.WEAPONS[id].from!));
  };
  const plan = (mid: string) => {
    const ws = Object.keys(E.WEAPONS).filter(id => makeable('w', id)).sort((a, b) => score(b, mid) - score(a, mid));
    const w1 = ws[0], w2 = ws.find(id => E.WEAPONS[id].type !== E.WEAPONS[w1].type) ?? ws[1];
    const elem = E.MONSTERS[mid].elem;
    const as = Object.keys(E.ARMORS).filter(id => makeable('a', id)).sort((a, b) => Number(E.ARMORS[b].resist === elem) - Number(E.ARMORS[a].resist === elem) || E.ARMORS[b].hp - E.ARMORS[a].hp);
    return { weapons: [w1, w2], armor: as[0] };
  };
  /** the next forge step toward a planned weapon: the first link in its chain not yet owned */
  const nextStep = (id: string): string => {
    let cur = id; while (E.WEAPONS[cur].from && !s.weapons[E.WEAPONS[cur].from!]) cur = E.WEAPONS[cur].from!;
    // under 'max' the link before must be maxed first: reinforce it
    const f = E.WEAPONS[cur].from; if (RULES === 'max' && f && !s.weapons[cur] && s.weapons[f].lv < E.MAX_REINFORCE) return f;
    return cur;
  };
  const steps = (p: ReturnType<typeof plan>) => {
    const out: { kind: 'w' | 'a'; id: string }[] = [];
    // armor first: HP is what keeps a casual player alive
    if (!s.armors[p.armor]) out.push({ kind: 'a', id: p.armor }); else if (s.armors[p.armor].lv < RE) out.push({ kind: 'a', id: p.armor });
    for (const w of p.weapons) if (!s.weapons[w]) out.push({ kind: 'w', id: nextStep(w) }); else if (s.weapons[w].lv < RE) out.push({ kind: 'w', id: w });
    return out;
  };
  const missing = (kind: 'w' | 'a', id: string) => { const c = recipe(kind, id).cost; return Object.entries(c).filter(([k, v]) => k !== 'coin' && (s.mats[k] ?? 0) < v).map(([k, v]) => [k, v - (s.mats[k] ?? 0)] as [string, number]); };
  const pick = (mid: string) => {
    const ws = Object.keys(s.weapons).sort((a, b) => score(b, mid) - score(a, mid));
    const w1 = ws[0], w2 = ws.find(id => E.WEAPONS[id].type !== E.WEAPONS[w1].type) ?? ws[1];
    const elem = E.MONSTERS[mid].elem;
    const as = Object.keys(s.armors).sort((a, b) => Number(E.ARMORS[b].resist === elem) - Number(E.ARMORS[a].resist === elem) || (E.ARMORS[b].hp + 20 * s.armors[b].lv) - (E.ARMORS[a].hp + 20 * s.armors[a].lv));
    return { weapons: [w1, w2], armor: as[0] };
  };
  let turns = 0, fails = 0, hunts = 0, lost = 0, farmed = 0;
  const firstWin: Record<string, number> = {}, tierDone: Record<number, number> = {};
  for (let n = 1; n <= maxHunts; n++) {
    const goal = MON.find(M => E.isUnlocked(s, M.id) && !beaten(M.id));
    if (!goal) break;
    const p = plan(goal.id);
    // farm after a loss, while the plan still needs materials (at most 4 farming hunts between attempts)
    let target = goal.id, goalParts: string[] | undefined;
    if (lost > 0 && farmed < 4) {
      const need: Record<string, number> = {};
      for (const st of steps(p)) for (const [k, v] of missing(st.kind, st.id)) if (source[k] && beaten(source[k])) need[source[k]] = (need[source[k]] ?? 0) + v;
      // a real player farms what they can beat: weight by their record against it
      const rate = (id: string) => { const r = s.record[id]; return r ? r.wins / Math.max(1, r.hunts) : 0; };
      const best = Object.entries(need).map(([id, v]) => [id, v * rate(id) ** 2] as [string, number]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1])[0];
      if (best) {
        target = best[0]; farmed++;
        const want = new Set(steps(p).flatMap(st => missing(st.kind, st.id).map(([k]) => k)));
        goalParts = E.MONSTERS[target].parts.filter(pt => want.has(pt.mat) || (want.has(E.MONSTERS[target].rare) && pt.id === E.MONSTERS[target].rarePart)).map(pt => pt.id);
      }
    }
    const L = pick(target);
    // keep coin for the plan: salves only from what's left over
    const reserve = steps(p).reduce((a, st) => a + (recipe(st.kind, st.id).cost.coin ?? 0), 0);
    while (s.items.salve < 3 && s.coin - reserve >= 30) E.buyItem(s, 'salve', 1);
    s.loadout = { ...s.loadout, target, weapons: L.weapons, armor: L.armor, item: s.items.salve > 0 ? 'salve' : null, charm: null, bounty: null };
    const h = playHunt(E.startHunt(s, seed * 100_003 + n), { ...policy, ...(goalParts?.length ? { goal: goalParts } : {}) });
    E.settleHunt(s, h);
    hunts++; turns += h.turn;
        if (target === goal.id) {
      if (h.over === 'win') { firstWin[goal.id] = n; lost = 0; farmed = 0; if (MON.filter(M => M.tier === goal.tier).every(M => beaten(M.id))) tierDone[goal.tier] = n; }
      else { fails++; lost++; farmed = 0; }
    } else if (h.over !== 'win') fails++;
    // forge toward the plan (for the goal, re-planned now that more may be makeable)
    for (let k = 0; k < 12; k++) {
      const st = steps(plan(goal.id)).find(x => { const r = recipe(x.kind, x.id); return !!r.act && afford(r.cost); });
      if (!st || !doForge(st.kind, st.id)) break;
    }
  }
  return { hunts, turns, fails, firstWin, tierDone, done: MON.every(M => beaten(M.id)) };
}
