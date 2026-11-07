// Bots that play the real engine. They plan each turn by trying candidate dice
// allocations on a copy of the hunt and scoring the result, so they always obey
// the actual rules.
//
// skilled: rerolls toward the strong recipe, guards when it pays, charges on
//          quiet turns, swaps weapons for the goal part.
// casual:  attacks first, guards only big hits with leftover dice, rerolls half
//          as often, never charges, and only swaps when its weapon can't break
//          the part it wants at all.
import type { Hunt } from '../engine/types';
import * as E from '../engine';
import { nextRandom } from '../engine/rng';

export type Skill = 'skilled' | 'casual';
export interface Policy { skill: Skill; capture: boolean; goal?: string[]; noCharge?: boolean; noGuard?: boolean }

const clone = (h: Hunt): Hunt => JSON.parse(JSON.stringify(h));
const ICE_VALUE = 15;
const need = (s: string) => ({ C: [...s].filter(c => c === 'C').length, T: [...s].filter(c => c === 'T').length });

function effFor(h: Hunt, w: Hunt['weps'][number], partId: string): number {
  if (!E.canHit(h, w) || !E.reachable(h, partId, w)) return 0;
  const p = E.monsterOf(h).parts.find(x => x.id === partId)!;
  const exposed = h.mon.parts[partId].exposed > 0 ? E.EXPOSE_BREAK * E.EXPOSE_DMG : 1;
  // with ice up, what matters is how fast the weapon clears it (Cut breaks 2 layers a hit)
  const ice = h.mon.plating > 0 ? E.plateBreak(h, w) / E.CUT_ICE_BREAK : 1;
  return p.eff[w.type] * exposed * ice * (E.airborneHalf(h, w) ? 0.5 : 1);
}

function chooseTarget(h: Hunt, p: Policy) {
  const MD = E.monsterOf(h);
  // a part that needs hitting now (a regrowing stump): both skill levels go for it, swapping if only the other weapon can
  if (MD.priority) {
    let pr = MD.priority(h, E.currentWeapon(h));
    if (!pr && MD.priority(h, E.otherWeapon(h)) && E.freeDice(h).length > 1) { E.swap(h, [E.freeDice(h)[0]]); pr = MD.priority(h, E.currentWeapon(h)); }
    if (pr) { h.target = pr; return; }
  }
  // With no explicit goal, aim where the carried weapons break parts best (what the part chips show).
  const bestEff = (id: string) => Math.max(...h.weps.map(w => MD.parts.find(x => x.id === id)!.eff[w.type]));
  const order = p.goal ?? MD.parts.map(x => x.id).sort((a, b) => bestEff(b) - bestEff(a));
  const open = order.filter(id => !h.mon.parts[id].broken);
  const goal = open.find(id => h.weps.some(w => effFor(h, w, id) > 0)) ?? open[0] ?? MD.parts[0].id;
  const cur = E.currentWeapon(h), oth = E.otherWeapon(h);
  // skilled players swap whenever the other weapon is clearly better for the goal;
  // casual players only when the part chip says their weapon does None to it.
  const shouldSwap = p.skill === 'skilled'
    ? effFor(h, oth, goal) > effFor(h, cur, goal) + 0.3
    : effFor(h, cur, goal) === 0 && effFor(h, oth, goal) > 0;
  // ice up: both skill levels swap to the weapon that breaks more of it (the move captions say so)
  const iceSwap = h.mon.plating >= 2 && E.plateBreak(h, oth) > E.plateBreak(h, cur);
  if ((shouldSwap || iceSwap) && E.freeDice(h).length) {
    const free = E.freeDice(h), blank = free.find(i => h.dice[i].face === 'B');
    E.swap(h, [blank ?? free[0]]);
  }
  const w = E.currentWeapon(h);
  if (effFor(h, w, goal) > 0) h.target = goal;
  else {
    const best = MD.parts.filter(x => !h.mon.parts[x.id].broken).sort((a, b) => effFor(h, w, b.id) - effFor(h, w, a.id))[0];
    h.target = best?.id ?? goal;
  }
}

interface Plan { moves: number[]; guard: number[]; charge: number[]; score: number }

function evaluate(h: Hunt, plan: Omit<Plan, 'score'>, p: Policy): number | null {
  const c = clone(h);
  const php0 = c.php, hp0 = c.mon.hp, part0 = c.mon.parts[c.target].hp, intent0 = c.intent;
  const inc0 = E.incoming(c)?.net ?? 0;
  for (const i of plan.moves) if (!E.useMove(c, i)) return null;
  if (c.over === 'win') return 10_000 + (hp0 - c.mon.hp); // the kill: nothing after it matters (guarding would fail)
  if (plan.guard.length && !E.guard(c, plan.guard)) return null;
  if (plan.charge.length && !E.charge(c, plan.charge)) return null;
  // ice broken is worth about what a hit would have dealt, since it clears the way for the next one
  const dealt = hp0 - c.mon.hp + ICE_VALUE * (h.mon.plating - c.mon.plating), partProg = part0 - c.mon.parts[c.target].hp;
  const taken = E.incoming(c)?.net ?? 0;
  const prevented = c.intent !== intent0 ? inc0 : 0;
  if (p.skill === 'casual') return dealt * 10 + partProg;
  const risk = 1 + 3 * (1 - c.php / c.pmax);
  const burned = php0 - c.php;
  let score = dealt + 0.5 * partProg - risk * (taken + burned) + 0.3 * prevented + (plan.charge.length ? 30 : 0);
  const fi = E.currentWeapon(c).moves.findIndex(m => m.flow);
  if (fi >= 0) score += 4 * plan.moves.filter(i => i === fi).length;
  score -= risk * E.CHARGED_HIT * c.dice.filter(d => d.charged && (!d.used || d.used === 'Block')).length;
  if (plan.charge.length && taken > 0) return null; // any hit through breaks a charge
  if (c.php - taken <= 0) score -= 1000;
  return score;
}

function bestPlan(h: Hunt, p: Policy): Plan {
  const w = E.currentWeapon(h), free = E.freeDice(h);
  const fc = { C: 0, T: 0, B: 0 }; free.forEach(i => fc[h.dice[i].face]++);
  const n = w.moves.map(m => need(m.need));
  const inc = E.incoming(h)?.net ?? 0;
  let best: Plan | null = null;
  for (let a = 0; a <= 4; a++) for (let b = 0; b <= 2; b++) for (let c = 0; c <= 1; c++) {
    const C = a * n[0].C + b * n[1].C + c * n[2].C, T = a * n[0].T + b * n[1].T + c * n[2].T;
    if (C > fc.C || T > fc.T) continue;
    // a setup move (Expose: Quick Shot) goes first, so the hits after it land on the exposed part, as the hint says
    const ws = w.moves.map((m, i) => i).sort((x, y) => (w.moves[y].expose ? 1 : 0) - (w.moves[x].expose ? 1 : 0));
    const cnt = [a, b, c];
    const moves = ws.flatMap(i => Array(cnt[i]).fill(i)).sort((x, y) => (w.moves[x].expose ? 0 : 1) - (w.moves[y].expose ? 0 : 1) || y - x);
    // leftover dice after these moves, blanks first (best for guarding)
    const usedC = C, usedT = T; let rc = usedC, rt = usedT;
    const left = free.filter(i => { const f = h.dice[i].face; if (f === 'C' && rc > 0) { rc--; return false; } if (f === 'T' && rt > 0) { rt--; return false; } return true; })
      .sort((x, y) => (h.dice[x].face === 'B' ? 0 : 1) - (h.dice[y].face === 'B' ? 0 : 1));
    for (let g = 0; g <= (p.noGuard ? 0 : left.length); g++) for (const ch of [false, true]) {
      const cd = E.chargeDice(h);
      if (ch && (p.skill === 'casual' || p.noCharge || left.length - g < cd))  continue;
      // a casual player guards everything against a big hit, or when its weapon can't reach the monster at all
      if (p.skill === 'casual' && !p.noGuard && g !== (inc >= 40 || (!E.canHit(h, E.currentWeapon(h)) && inc > 0) ? left.length : 0)) continue;
      const plan = { moves, guard: left.slice(0, g), charge: ch ? left.slice(g, g + cd) : [] };
      const s = evaluate(h, plan, p);
      if (s != null && (!best || s > best.score)) best = { ...plan, score: s };
    }
  }
  return best ?? { moves: [], guard: [], charge: [], score: 0 };
}

/** Skilled only: is "one Pierce shot, swap, then the other weapon" better than a normal turn? Tried on copies. */
function tryExposeCombo(h: Hunt, p: Policy): boolean {
  if (p.skill !== 'skilled' || h.over) return false;
  const cur = E.currentWeapon(h), oth = E.otherWeapon(h);
  if (cur.type !== 'Pierce' || oth.type === 'Pierce' || !E.canHit(h, oth)) return false;
  const base = clone(h); const bp = bestPlan(base, p); applyPlan(base, bp);
  const baseScore = stateScore(h, base);
  let best: { i: number; score: number } | null = null;
  for (let i = 0; i < 3; i++) {
    const c = clone(h);
    if (!E.useMove(c, i)) continue;
    if (c.over) { best = { i, score: Infinity }; break; }
    const free = E.freeDice(c); if (free.length < 2) continue;
    const blank = free.find(j => c.dice[j].face === 'B');
    E.swap(c, [blank ?? free[0]]);
    applyPlan(c, bestPlan(c, p));
    const sc = stateScore(h, c);
    if (sc > baseScore && (!best || sc > best.score)) best = { i, score: sc };
  }
  if (!best) return false;
  E.useMove(h, best.i); if (h.over) return true;
  const free = E.freeDice(h), blank = free.find(j => h.dice[j].face === 'B');
  E.swap(h, [blank ?? free[0]]);
  applyPlan(h, bestPlan(h, p));
  return true;
}
function applyPlan(h: Hunt, plan: Plan) {
  for (const i of plan.moves) { if (!E.useMove(h, i)) break; if (h.over) return; }
  if (plan.guard.length) E.guard(h, plan.guard);
  if (plan.charge.length) E.charge(h, plan.charge);
}
/** Score a finished turn the way evaluate() does (skilled). */
function stateScore(h0: Hunt, c: Hunt): number {
  if (c.over === 'win') return 10_000 + (h0.mon.hp - c.mon.hp);
  const dealt = h0.mon.hp - c.mon.hp + ICE_VALUE * (h0.mon.plating - c.mon.plating);
  const partProg = Object.keys(c.mon.parts).reduce((n, k) => n + (h0.mon.parts[k].hp - c.mon.parts[k].hp), 0);
  const taken = (E.incoming(c)?.net ?? 0) + (h0.php - c.php);
  const risk = 1 + 3 * (1 - c.php / c.pmax);
  return dealt + 0.5 * partProg - risk * taken + (c.chargePending ? 30 : 0) - (c.php - taken <= 0 ? 1000 : 0);
}

export function playTurn(h: Hunt, p: Policy) {
  chooseTarget(h, p);
  const free = E.freeDice(h);
  if (p.capture && E.captureReady(h) && free.length >= 2) { E.capture(h, free.slice(0, 2)); const rest = E.freeDice(h); if (rest.length) E.guard(h, rest); return; }
  // items
  if (h.item && E.itemUsable(h)) {
    const fx = E.ITEMS[h.item].effect, inc = E.incoming(h)?.net ?? 0;
    if (fx === 'heal30' && h.php < h.pmax * 0.55) E.useItem(h);
    else if (fx === 'net' && (h.intent === 'gust' || h.intent === 'circle')) E.useItem(h);
    else if (fx === 'thaw' && h.mon.plating >= 2) E.useItem(h);
    else if (fx === 'blast' && (h.intent === 'erupt' || h.intent === 'spray') && !E.canHit(h, E.currentWeapon(h))) E.useItem(h);
    else if (fx === 'smoke' && inc >= 40) E.useItem(h);
    else if (fx === 'cureInfect' && (h.mon.pInf ?? 0) >= 2) E.useItem(h);
    else if ((fx === 'trapRush' || fx === 'trapLand') && E.trapCatches(fx, h.intent)) E.useItem(h);
    else if (fx === 'cureSpark' && ((h.mon.pSpark ?? 0) >= 2 || h.dice.filter(d => d.charged && !d.used).length >= 2)) E.useItem(h);
  }
  // one reroll toward the strong recipe
  const w = E.currentWeapon(h), sn = need(w.moves[2].need);
  const fr = E.freeDice(h), fc = { C: 0, T: 0 }; fr.forEach(i => { const f = h.dice[i].face; if (f !== 'B') fc[f]++; });
  const wantsReroll = h.rerolls > 0 && !(fc.C >= sn.C && fc.T >= sn.T) && !(p.skill === 'casual' && nextRandom(h) < 0.5);
  if (wantsReroll) {
    let kc = sn.C, kt = sn.T; const big = (E.incoming(h)?.net ?? 0) >= 30;
    const toRoll = fr.filter(i => { const f = h.dice[i].face; if (f === 'C' && kc > 0) { kc--; return false; } if (f === 'T' && kt > 0) { kt--; return false; } if (f === 'B' && big) return false; return true; });
    if (toRoll.length) E.reroll(h, toRoll);
  }
  if (tryExposeCombo(h, p)) return;
  const plan = bestPlan(h, p);
  if (h.item && E.ITEMS[h.item].effect.startsWith('whet') && plan.moves.includes(2) && E.itemUsable(h)) E.useItem(h);
  for (const i of plan.moves) { E.useMove(h, i); if (h.over) return; }
  if (plan.guard.length) E.guard(h, plan.guard);
  if (plan.charge.length) E.charge(h, plan.charge);
}

export function playHunt(h: Hunt, p: Policy, maxTurns = 60): Hunt {
  while (!h.over) {
    if (h.turn > maxTurns) { E.abandon(h); break; }
    playTurn(h, p);
    if (!h.over) E.endTurn(h);
  }
  return h;
}
