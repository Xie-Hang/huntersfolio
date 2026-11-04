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
