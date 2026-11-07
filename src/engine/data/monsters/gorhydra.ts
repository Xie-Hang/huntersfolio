// The Gorhydra — T3 Frost three-headed serpent of the Stormspire. The Cut check.
// Three heads, three telegraphs: each head is a part with its own move every turn (the Duskheron's engine, for
// three). A broken head leaves a stump that regrows in 2 turns (back at half HP, and the body heals 20) unless you
// SEAL it: a Cut hit on the stump, or any Ember hit. A sealed head is gone for good. With every head sealed it has
// only its Tail Slam left, and its body takes +25%.
//   Left and right heads: Bite, or Frost Breath (freezes one of your dice next turn). Middle head: Crush, or Snap.
//   Blunt dazes a head (each has its own meter): a dazed head reels, missing this turn and the next.
// Phase 2 at half HP: stumps regrow in 1 turn and heads come back at full HP. Sealing is a must.
// Tuned by simulation (5 Nov 2026, casual, Mirewood gear +2, non-resisting armor): with a Cut weapon 76%, without
// 39%; skilled 100%; Ember (its weakness, and it seals) ~97%. The sim bot follows `priority` to seal stumps.
// The action is stored as one string: 'left:bite|middle:crush|right:breath', or 'slam'.
import type { Hunt, Intent, MonsterDef } from '../../types';
import { choose, remember } from '../../behaviour';
import { carries, carryingName } from '../../util';
import { HEAD_DAZE_MAX } from '../../combat';

export const HYDRA_HEADS = ['left', 'middle', 'right'] as const;
const REEL = 2, REGROW_HEAL = 20, BARE = 1.25;
type Act = 'bite' | 'breath' | 'crush' | 'snap' | 'reel' | 'stump';
const NAME: Record<string, string> = { left: 'left head', middle: 'middle head', right: 'right head' };
const regrowTurns = (h: Hunt) => (h.mon.enraged ? 1 : 2);

const parse = (type: string): Record<string, Act> | null => (type.includes(':') ? Object.fromEntries(type.split('|').map(p => p.split(':'))) as Record<string, Act> : null);
const sealed = (h: Hunt, x: string) => !!h.mon.sealed?.[x];
const stumped = (h: Hunt, x: string) => (h.mon.stump?.[x] ?? 0) > 0;
const reeling = (h: Hunt, x: string) => (h.mon.reel?.[x] ?? 0) > 0;
/** heads still on their necks (not stumps, not sealed) */
const live = (h: Hunt) => HYDRA_HEADS.filter(x => !h.mon.parts[x].broken && !sealed(h, x));

function headAct(h: Hunt, head: string, act: Act) {
  const enr = h.mon.enraged, n = NAME[head];
  switch (act) {
    case 'bite': return { name: 'Bite', text: `The ${n} snaps at you.`, dmg: enr ? 13 : 10 };
    case 'breath': return { name: 'Frost Breath', text: `The ${n} breathes a cloud of frost.`, dmg: enr ? 10 : 8 };
    case 'crush': return { name: 'Crush', text: `The ${n} rears up and slams down.`, dmg: enr ? 22 : 18 };
    case 'snap': return { name: 'Snap', text: `The ${n} lunges.`, dmg: enr ? 15 : 12 };
    case 'reel': return { name: 'Reeling', text: `The ${n} reels, dazed.`, dmg: 0 };
    case 'stump': return { name: 'Stump', text: '', dmg: 0 };
  }
}
const band = (d: number) => (d <= 0 ? 0 : d <= 20 ? 1 : d <= 40 ? 2 : d <= 60 ? 3 : 4);

export const gorhydra: MonsterDef = {
  id: 'gorhydra',
  name: 'The Gorhydra',
  short: 'Gorhydra',
  kind: 'Hydra',
  elem: 'Frost',
  // its elemental attacks: only these are reduced by armor that resists Frost; the rest are physical
  elemental: ['Frost Breath'],
  weak: 'Ember',
  resist: 'Gale',
  hp: 640,
  tier: 3,
  requires: ['fenmother'], // rank D: the Fenmother promotion opens the Stormspire (Nov 2026)
  head: 'middle',
  heads: [...HYDRA_HEADS],
  common: 'hydrascale',
  rarePart: 'middle',
  rare: 'hydraheart',
  habits: 'A three-headed frost serpent. Every head strikes on its own, so you face three attacks a turn. Cut one off and the stump grows a new head in two turns, unless you seal it with a blade, or with fire. Hurt badly, it regrows in one.',
  enragedHabit: 'Every third turn its heads breathe together, a Frost Chain that freezes two of your dice.',
  intro: 'Three shapes rise out of the frozen tarn, then lean together. They share one body.',
  enrageText: 'All three heads scream. The Gorhydra is enraged!',
  parts: [
    { id: 'left', name: 'Left Head', eff: { Cut: 1, Blunt: 0.5, Pierce: 0.5 }, hint: '**Cut** it off, then seal the stump with **Cut** or **Ember**', mat: 'hydrafang', hp: 130, brk: 'The left head comes off!' },
    { id: 'middle', name: 'Middle Head', eff: { Cut: 1, Blunt: 0.5, Pierce: 0.5 }, hint: '**Crush** hits hardest. **Cut** it off, then seal the stump', mat: 'hydracrown', hp: 160, brk: 'The middle head comes off!' },
    { id: 'right', name: 'Right Head', eff: { Cut: 1, Blunt: 0.5, Pierce: 0.5 }, hint: '**Cut** it off, then seal the stump with **Cut** or **Ember**', mat: 'hydrahorn', hp: 130, brk: 'The right head comes off!' }
  ],

  intent(h, type): Intent {
    if (type === 'slam') return { name: 'Tail Slam', text: 'Headless, it thrashes its tail at you.', dmg: h.mon.enraged ? 34 : 28, threat: 2 };
    if (type === 'dazed') return { name: 'Dazed', text: 'All three heads sway.', dmg: 0, threat: 0, note: 'It loses its turn' };
    // enraged (Nov 2026): its Frost Breath turned up, every head breathing at once
    if (type === 'chain') { const n = live(h).length, d = 16 * n; return { name: 'Frost Chain', text: 'Every head draws breath at once. The air goes white.', dmg: d, elemDmg: d, threat: band(d), isNew: !h.mon.newSeen, note: `${Math.min(2, n)} fewer dice next turn. Each head cut off makes it 1 less` }; }
    const acts = parse(type);
    if (!acts) return { name: '…', text: '', dmg: 0, threat: 0 };
    const parts = HYDRA_HEADS.filter(x => !h.mon.parts[x].broken && !sealed(h, x)).map(x => headAct(h, x, reeling(h, x) ? 'reel' : acts[x]));
    const dmg = parts.reduce((t, p) => t + p.dmg, 0);
    const breath = HYDRA_HEADS.some(x => acts[x] === 'breath' && !reeling(h, x) && live(h).includes(x as never));
    const stumps = HYDRA_HEADS.filter(x => stumped(h, x));
    const note = [breath ? '**Frost Breath** means 1 fewer die next turn' : '', stumps.length ? `${stumps.length === 1 ? 'A stump regrows' : 'Stumps regrow'} soon. **Cut** or **Ember** seals it` : ''].filter(Boolean).join('. ');
    const elemDmg = parts.filter(p => p.name === 'Frost Breath').reduce((t, p) => t + p.dmg, 0);
    return { name: parts.map(p => p.name).join(' + ') || 'Thrashing', text: parts.map(p => p.text).join(' '), dmg, elemDmg, threat: band(dmg), note: note || undefined };
  },

  next(h, prev) {
    const m = h.mon;
    for (const x of HYDRA_HEADS) if ((m.reel?.[x] ?? 0) > 0) m.reel![x]--;
    if (prev === null) return remember(h, 'left:bite|middle:snap|right:bite');
    const heads = live(h);
    if (!heads.length) return remember(h, 'slam');
    // enraged: every third turn, with two heads or more, they all breathe together
    if (m.enraged && heads.length >= 2 && prev !== 'chain' && ((m.extra ??= {}).hc = (m.extra.hc ?? 0) + 1) % 3 === 0) return remember(h, 'chain');
    const pool: [string, number][] = [];
    for (const l of ['bite', 'breath'] as Act[]) for (const mid of ['crush', 'snap'] as Act[]) for (const r of ['bite', 'breath'] as Act[]) {
      if (l === 'breath' && r === 'breath') continue;
      pool.push([`left:${l}|middle:${mid}|right:${r}`, (l === 'bite' ? 2 : 1) * (mid === 'snap' ? 2 : 1) * (r === 'bite' ? 2 : 1)]);
    }
    return remember(h, choose(h, pool, a => this.intent(h, a).threat));
  },

  resolve(h, type, landed) {
    const m = h.mon, lines: string[] = [], acts = parse(type);
    if (type === 'chain') { m.newSeen = true; if (landed) { m.frost = Math.min(2, live(h).length); lines.push('Frost locks over your dice.'); } }
    if (acts && landed && HYDRA_HEADS.some(x => acts[x] === 'breath' && !reeling(h, x) && live(h).includes(x as never)) ) { m.frost = 1; lines.push('Frost creeps over one of your dice.'); }
    // stumps count down, then regrow
    for (const x of HYDRA_HEADS) {
      if (!stumped(h, x)) continue;
      m.stump![x]--;
      if (m.stump![x] === 0) {
        const P = m.parts[x]; P.broken = false; P.hp = m.enraged ? P.max : Math.ceil(P.max / 2);
        const heal = Math.min(REGROW_HEAL, m.max - m.hp); m.hp += heal;
        lines.push(`The ${NAME[x]} grows back${heal ? `, and it heals ${heal}` : ''}!`);
      }
    }
    if (type === 'dazed') lines.push('The heads shake off the daze.');
    return lines.join(' ') || null;
  },

  onBreak(h, partId) {
    if (!HYDRA_HEADS.includes(partId as never)) return null;
    (h.mon.stump ??= {})[partId] = regrowTurns(h);
    h.mon.justCut = partId; // the blow that took the head off doesn't also seal it
    if (h.mon.reel) h.mon.reel[partId] = 0;
    return `Seal the stump with a Cut or Ember hit, or it grows back in ${regrowTurns(h)} turn${regrowTurns(h) > 1 ? 's' : ''}.`;
  },

  onHit(h, _mv, w) {
    const x = h.target;
    if (h.mon.justCut === x) { h.mon.justCut = undefined; return null; }
    if (!stumped(h, x) || !(w.type === 'Cut' || w.elem === 'Ember')) return null;
    h.mon.stump![x] = 0; (h.mon.sealed ??= {})[x] = true;
    const n = HYDRA_HEADS.filter(y => sealed(h, y)).length, feats = (h.feats ??= []);
    if (n >= 2 && !feats.includes('seal2')) feats.push('seal2');
    if (n === 3 && !feats.includes('sealall')) feats.push('sealall');
    if (h.charm === 'stumpcharm') { const heal = Math.min(20, h.pmax - h.php); h.php += heal; return `You seal the ${NAME[x]}'s stump. Stump Charm: +${heal} HP.`; }
    return `You seal the ${NAME[x]}'s stump. It won’t grow back.`;
  },

  onPhase(h) {
    for (const x of HYDRA_HEADS) if (stumped(h, x)) h.mon.stump![x] = Math.min(h.mon.stump![x], 1);
    return 'Its stumps steam: from now on they regrow in one turn, at full strength.';
  },

  hitMod(h) {
    return live(h).length === 0 && !HYDRA_HEADS.some(x => stumped(h, x)) ? { mult: BARE, note: 'bare body +25%' } : null;
  },

  dazeHead(h, partId, amount) {
    const m = h.mon;
    if (reeling(h, partId) || m.parts[partId].broken || sealed(h, partId)) return { line: null, dazed: false };
    const meters = (m.headDaze ??= { left: 0, middle: 0, right: 0 });
    meters[partId] = Math.min(HEAD_DAZE_MAX, (meters[partId] ?? 0) + amount);
    if (meters[partId] < HEAD_DAZE_MAX) return { line: null, dazed: false };
    meters[partId] = 0;
    (m.reel ??= {})[partId] = REEL;
    return { line: `Daze: the ${NAME[partId]} reels! Its attack is cancelled this turn and next.`, dazed: true };
  },

  priority(h, w) {
    if (!(w.type === 'Cut' || w.elem === 'Ember')) return null;
    return HYDRA_HEADS.filter(x => stumped(h, x)).sort((a, b) => h.mon.stump![a] - h.mon.stump![b])[0] ?? null;
  },

  partNote(h, partId) {
    if (sealed(h, partId)) return { chip: 'Sealed', hint: 'Gone for good. It still takes hits here.' };
    if (stumped(h, partId)) { const t = h.mon.stump![partId]; return { chip: `Stump · regrows in ${t}`, hint: '**Cut** or **Ember** here seals it.' }; }
    return null;
  },

  meter(h) {
    const stumps = HYDRA_HEADS.filter(x => stumped(h, x)), gone = HYDRA_HEADS.filter(x => sealed(h, x)).length;
    if (stumps.length) {
      const t = Math.min(...stumps.map(x => h.mon.stump![x]));
      return { label: `Stump${stumps.length > 1 ? 's' : ''} regrowing`, value: t, max: regrowTurns(h), tone: 'ice', pips: true, note: `in ${t} · seal with Cut or Ember` };
    }
    return gone ? { label: 'Heads sealed for good', value: gone, max: 3, tone: 'gold', pips: true, note: `${gone} / 3` } : null;
  },

  tip(h) {
    const stumps = HYDRA_HEADS.filter(x => stumped(h, x));
    if (stumps.length) return carries(h, 'Cut') ? `Your ${carryingName(h, 'Cut')} on the stump seals it before it grows back.` : h.weps.some(w => w.elem === 'Ember') ? 'Your **Ember** weapon on the stump seals it before it grows back.' : 'A stump is regrowing. **Cut** or **Ember** seals it.';
    if (carries(h, 'Cut')) return `Your ${carryingName(h, 'Cut')} cuts a head off. Seal the stump and it attacks less.`;
    return null;
  }
};
