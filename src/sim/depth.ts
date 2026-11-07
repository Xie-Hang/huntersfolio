// How much does skill matter in a hunt? (Nov 2026.) The same gear, four players, every monster:
//   skilled  the simulator's best bot · casual  its casual bot
//   naive    the biggest move the dice allow, then guard with the rest; no rerolls, no charge, no plan
//   random   random legal actions (a floor)
// Gear = what a player could have by then (made from earlier monsters), at +LV (default 2).
// A new mechanic that makes choices matter should widen the gap: skilled stays 90%+, naive falls under 80%.
//   npm run sim:depth -- [hunts per monster]        LV=0 npm run sim:depth
import * as E from '../engine';
import { WEAPONS } from '../engine/data/weapons';
import { ARMORS } from '../engine/data/gear';
import { playTurn } from './bot';

const N = Number(process.argv[2] || 80);
const TYPES = ['Cut', 'Blunt', 'Pierce'] as const;
type T = typeof TYPES[number];

// gear a player could have when they reach this monster: made from monsters before it (or the starter kit and
// Gorehorn gear on Ashfall Ridge), best expected damage against it, covering the reach it demands
const STARTER = ['blade', 'maul', 'bow'];
function avail(kind: 'w' | 'a', id: string, M: E.MonsterDef) {
  const src = E.gearSource(kind, id), st = E.MONSTERS[src]?.tier ?? 1;
  if (kind === 'w' && STARTER.includes(id)) return true;
  // the Oath line costs coin and bounties, not parts: count it from past its own tier (bounties take hunting to earn)
  if (kind === 'w' && WEAPONS[id].bounties) return M.tier > (WEAPONS[id].tier ?? 1);
  if (kind === 'a' && id === 'jerkin') return true;
  if (M.tier < 1.5) return src === 'gorehorn' && M.id !== 'gorehorn';
  return st < M.tier && src !== M.id;
}
function gearFor(mid: string) {
  const M = E.MONSTERS[mid];
  const ws = Object.values(WEAPONS).filter(w => avail('w', w.id, M));
  const score = (w: typeof ws[number]) => E.avgVs(E.weaponInst(w.id, 2), mid);
  const best = (t: T) => ws.filter(w => w.type === t).sort((a, b) => score(b) - score(a))[0];
  const need: T[] = [];
  if (M.flier) need.push('Pierce');
  if (M.burrower) need.push('Blunt');
  const rest = [...TYPES].filter(t => !need.includes(t)).sort((a, b) => score(best(b)) - score(best(a)));
  const [a, b] = [...need, ...rest].slice(0, 2).map(best);
  const arms = Object.values(ARMORS).filter(x => avail('a', x.id, M) && !x.adaptive);
  const arm = arms.filter(x => x.resist === (M.elemOf ? null : M.elem)).sort((x, y) => y.hp - x.hp)[0] ?? arms.sort((x, y) => y.hp - x.hp)[0];
  return { weapons: [a.id, b.id], armor: arm.id };
}

function save(mid: string) {
  const g = gearFor(mid), s = E.newSave();
  for (const id of Object.keys(E.MONSTERS)) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  const LV = Number(process.env.LV ?? 2); s.weapons = Object.fromEntries(g.weapons.map(w => [w, { lv: LV }])); s.armors = { [g.armor]: { lv: LV } };
  s.items = { ...s.items, salve: 3, snare: 0 };
  s.loadout = { weapons: g.weapons, armor: g.armor, charm: null, item: 'salve', target: mid };
  return { s, g };
}

function naiveTurn(h: E.Hunt) {
  const MD = E.monsterOf(h);
  if (!E.canHit(h, E.currentWeapon(h)) && E.canHit(h, E.otherWeapon(h)) && E.freeDice(h).length) E.swap(h, [E.freeDice(h)[0]]);
  const w = E.currentWeapon(h);
  const open = MD.parts.filter(p => !h.mon.parts[p.id].broken).sort((a, b) => (b.eff[w.type] ?? 0) - (a.eff[w.type] ?? 0));
  if (open.length) h.target = open[0].id;
  if (h.item && E.itemUsable(h) && E.ITEMS[h.item].effect === 'heal30' && h.php < h.pmax * 0.5) E.useItem(h);
  const order = w.moves.map((m, i) => [m.dmg, i]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  for (let k = 0; k < 10 && !h.over; k++) { const i = order.find(j => E.canUseMove(h, j)); if (i === undefined) break; E.useMove(h, i); }
  if (!h.over) { const f = E.freeDice(h); if (f.length) E.guard(h, f); }
}

let rs = 1; const rnd = () => { rs = (rs * 1103515245 + 12345) & 0x7fffffff; return rs / 0x7fffffff; };
function randomTurn(h: E.Hunt) {
  for (let a = 0; a < 6 && !h.over; a++) {
    const r = rnd(), free = E.freeDice(h);
    if (r < 0.5) { const i = Math.floor(rnd() * 3); if (E.canUseMove(h, i)) E.useMove(h, i); }
    else if (r < 0.65) { if (free.length) E.guard(h, free.filter(() => rnd() < 0.5)); }
    else if (r < 0.75) { if (free.length) E.swap(h, [free[0]]); }
    else if (r < 0.85) { if (h.rerolls > 0 && free.length) E.reroll(h, free.filter(() => rnd() < 0.5)); }
    else if (r < 0.9) E.useItem(h);
    else { const parts = Object.keys(h.mon.parts); h.target = parts[Math.floor(rnd() * parts.length)]; }
  }
}

const sig = (h0: E.Hunt, h: E.Hunt) => JSON.stringify([h0.mon.hp - h.mon.hp, h.guard, h.chargePending, h.weapon, h.rerolls, h.target]);

const rows: string[] = [];
const tot = { skilled: 0, casual: 0, naive: 0, random: 0, agree: 0, turns: 0 };
for (const mid of Object.keys(E.MONSTERS)) {
  const res: Record<string, { win: number; turns: number; hp: number }> = {};
  let agree = 0, turnsSeen = 0;
  for (const pol of ['skilled', 'casual', 'naive', 'random'] as const) {
    let win = 0, turns = 0, hp = 0;
    for (let i = 0; i < N; i++) {
      const { s } = save(mid); const h = E.startHunt(s, 1000 + i * 7919);
      while (!h.over && h.turn <= 60) {
        if (pol === 'skilled' || pol === 'casual') {
          if (pol === 'skilled') { const c: E.Hunt = JSON.parse(JSON.stringify(h)); naiveTurn(c); const h0 = JSON.parse(JSON.stringify(h)); playTurn(h, { skill: 'skilled', capture: false }); if (sig(h0, h) === sig(h0, c)) agree++; turnsSeen++; }
          else playTurn(h, { skill: 'casual', capture: false });
        } else if (pol === 'naive') naiveTurn(h); else randomTurn(h);
        if (!h.over) E.endTurn(h);
      }
      if (h.over === 'win') { win++; hp += h.php / h.pmax; turns += h.turn; }
    }
    res[pol] = { win: win / N, turns: win ? turns / win : 0, hp: win ? hp / win : 0 };
    tot[pol] += win / N;
  }
  tot.agree += agree / Math.max(1, turnsSeen); tot.turns++;
  const g = gearFor(mid);
  const pc = (x: number) => `${Math.round(x * 100)}%`.padStart(4);
  rows.push(`${mid.padEnd(11)} ${g.weapons.join('+').padEnd(26)} ${g.armor.padEnd(11)} | ${pc(res.skilled.win)} ${pc(res.casual.win)} ${pc(res.naive.win)} ${pc(res.random.win)} | turns ${res.skilled.turns.toFixed(1).padStart(4)} vs ${res.naive.turns.toFixed(1).padStart(4)} | HP left ${pc(res.skilled.hp)} vs ${pc(res.naive.hp)} | same as naive ${pc(agree / Math.max(1, turnsSeen))}`);
  console.log(rows[rows.length - 1]);
}
const n = tot.turns, pc = (x: number) => `${Math.round(x * 100)}%`;
console.log(`\nAVERAGE  skilled ${pc(tot.skilled / n)}  casual ${pc(tot.casual / n)}  naive ${pc(tot.naive / n)}  random ${pc(tot.random / n)}  | skilled turns identical to naive: ${pc(tot.agree / n)}`);
