// The Duskheron — T2 Gale two-headed wader of the Mirewood. The Blunt check.
// Two heads, two telegraphs, two attacks a turn. Each head picks its own move (Peck, Spear Thrust, Screech);
// every few turns both Rear Up together, then strike with a Twin Spear.
//   Each head has its own daze meter (Blunt hits to that head). A dazed head reels: its attack is cancelled this
//   turn and next. Screech halves your guard on its next turn. Breaking a head weakens its attacks; breaking the
//   wings stops it rearing up.
// Tuned by simulation (5 Nov 2026, casual): element-neutral gear 96% with Blunt, 52% without; Frost gear (its
// weakness) ~97% either way, the reward for preparing.
// The action is stored as one string: 'upper:peck|lower:thrust', or 'rear', or 'twin'.
import type { Intent, MonsterDef, Hunt } from '../../types';
import { choose, remember } from '../../behaviour';
import { carries, carryingName } from '../../util';
import { HEAD_DAZE_MAX } from '../../combat';

export const HEADS = ['upper', 'lower'] as const;
export const REEL = 2, REAR_EVERY = 4;
type Act = 'peck' | 'thrust' | 'screech' | 'reel';
const NAME: Record<string, string> = { upper: 'upper head', lower: 'lower head' };

export const parse = (type: string): Record<string, Act> | null => {
  if (!type.includes(':')) return null;
  return Object.fromEntries(type.split('|').map(p => p.split(':'))) as Record<string, Act>;
};
export const reeling = (h: Hunt, head: string) => (h.mon.reel?.[head] ?? 0) > 0;

function headAct(h: Hunt, head: string, act: Act) {
  const enr = h.mon.enraged, broke = h.mon.parts[head].broken, n = NAME[head];
  switch (act) {
    case 'peck': return { name: 'Peck', text: `The ${n} jabs down.`, dmg: broke ? 10 : enr ? 18 : 14 };
    case 'thrust': return { name: 'Spear Thrust', text: `The ${n} draws back its neck to spear you.`, dmg: broke ? 18 : enr ? 32 : 26 };
    case 'screech': return { name: 'Screech', text: `The ${n} screeches. Your Block is ½ next turn.`, dmg: 0 };
    case 'reel': return { name: 'Reeling', text: `The ${n} reels, dazed.`, dmg: 0 };
  }
}
const band = (dmg: number) => (dmg <= 0 ? 0 : dmg <= 20 ? 1 : dmg <= 40 ? 2 : dmg <= 60 ? 3 : 4);

export const duskheron: MonsterDef = {
  id: 'duskheron',
  name: 'The Duskheron',
  short: 'Duskheron',
  kind: 'Two-headed wader',
  elem: 'Gale',
  // its elemental attacks: only these are reduced by armor that resists Gale; the rest are physical
  elemental: ['Twin Spear'],
  weak: 'Frost',
  resist: 'Stone',
  hp: 505,
  tier: 2,
  requires: ['cragwing'], // rank E: the Cragwing promotion opens the Mirewood (Nov 2026)
  head: 'upper',
  heads: [...HEADS],
  common: 'duskplume',
  rarePart: 'wings',
  rare: 'twilightquill',
  habits: 'Wades the shallows on stilt legs, two necks rising from one body. Each head strikes on its own, so it attacks twice a turn. Every few turns both heads rear up together for a **Twin Spear**. **Daze** on a head sets it reeling.',
  enragedHabit: 'Both necks swing in from either side at once, the **Scissor Strike**. Your **Block** is ½ against it.',
  intro: 'Two long necks lift out of the reeds at once. The Duskheron turns both heads toward you.',
  enrageText: 'Both heads scream at once. The Duskheron is enraged!',
  parts: [
    { id: 'upper', name: 'Upper Head', eff: { Cut: 0.5, Blunt: 1, Pierce: 0.5 }, hint: '**Daze** here stops its attack', mat: 'duskbeak', hp: 200, brk: 'The upper beak cracks. Its strikes go weak.' },
    { id: 'lower', name: 'Lower Head', eff: { Cut: 0.5, Blunt: 1, Pierce: 0.5 }, hint: '**Daze** here stops its attack', mat: 'duskcrest', hp: 200, brk: 'The lower beak cracks. Its strikes go weak.' },
    { id: 'wings', name: 'Wings', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Breaking them stops **Twin Spear**', mat: 'duskpinion', hp: 220, brk: 'Its wings tear. It can’t rear up any more.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, halfGuard = (m.screech ?? 0) > 0;
    if (type === 'rear') return { name: 'Rear Up', text: 'Both heads rise high, necks coiled. Two spears are coming.', dmg: 0, threat: 0, note: '**Twin Spear** next turn. **Daze** on a head stops its half' };
    if (type === 'twin') {
      const live = HEADS.filter(x => !reeling(h, x)), each = enr ? 50 : 42;
      return { name: 'Twin Spear', text: live.length === 2 ? 'Both heads drive down at once!' : live.length ? 'The head still standing drives down!' : 'Both heads sway, dazed.', dmg: each * live.length, threat: band(each * live.length), halfGuard };
    }
    // enraged (Nov 2026): both heads cross from either side at once, half your block slips between them
    if (type === 'scissor') {
      const live = HEADS.filter(x => !reeling(h, x)), each = 30;
      return { name: 'Scissor Strike', text: live.length === 2 ? 'Both necks swing in from either side at once!' : 'The head still standing swings in alone.', dmg: each * live.length, threat: band(each * live.length), halfGuard: true, isNew: !m.newSeen, note: 'Your **Block** is ½. **Daze** on a head stops its half' };
    }
    if (type === 'dazed') return { name: 'Dazed', text: 'Both heads sway, eyes unfocused.', dmg: 0, threat: 0, note: 'It loses its turn' };
    const acts = parse(type);
    if (!acts) return { name: '…', text: '', dmg: 0, threat: 0 };
    const parts = HEADS.map(x => headAct(h, x, reeling(h, x) ? 'reel' : acts[x]));
    const dmg = parts.reduce((t, p) => t + p.dmg, 0);
    const names = parts.map(p => p.name).join(' + ');
    const screech = HEADS.some(x => acts[x] === 'screech' && !reeling(h, x));
    return { name: names, text: parts.map(p => p.text).join(' '), dmg, threat: band(dmg), halfGuard, note: screech ? 'Your **Block** is ½ next turn' : undefined };
  },

  next(h, prev) {
    const m = h.mon;
    // reeling heads count down once per monster action
    for (const x of HEADS) if ((m.reel?.[x] ?? 0) > 0) m.reel![x]--;
    if (m.screech) m.screech--;
    if (prev === 'rear') { m.lastChain = h.turn; return remember(h, 'twin'); }
    if (prev === null) return remember(h, 'upper:peck|lower:peck');
    const since = h.turn - (m.lastChain ?? -REAR_EVERY);
    // enraged: a Scissor Strike every few turns, never right after the Twin Spear
    const x = (m.extra ??= {});
    if (m.enraged && prev !== 'twin' && h.turn - (x.scissorAt ?? -99) >= 4) { x.scissorAt = h.turn; return remember(h, 'scissor'); }
    const W: [Act, number][] = [['peck', 3], ['thrust', 2], ['screech', 1]];
    const pool: [string, number][] = [];
    for (const [a, wa] of W) for (const [b, wb] of W) {
      if (a === 'screech' && b === 'screech') continue;
      pool.push([`upper:${a}|lower:${b}`, wa * wb]);
    }
    if (!m.parts.wings.broken && since >= REAR_EVERY) pool.push(['rear', 6]);
    return remember(h, choose(h, pool, a => this.intent(h, a).threat));
  },

  resolve(h, type) {
    const m = h.mon, acts = parse(type);
    if (acts && HEADS.some(x => acts[x] === 'screech' && !reeling(h, x))) m.screech = 2; // lasts through its next action
    if (type === 'scissor') m.newSeen = true;
    if (type === 'dazed') return 'Both heads shake off the daze.';
    return null;
  },

  dazeHead(h, partId, amount) {
    const m = h.mon;
    if (reeling(h, partId)) return { line: null, dazed: false };
    const meters = (m.headDaze ??= { upper: 0, lower: 0 });
    meters[partId] = Math.min(HEAD_DAZE_MAX, (meters[partId] ?? 0) + amount);
    if (meters[partId] < HEAD_DAZE_MAX) return { line: null, dazed: false };
    meters[partId] = 0;
    (m.reel ??= {})[partId] = REEL;
    return { line: `Daze: the ${NAME[partId]} reels! Its attack is cancelled this turn and next.`, dazed: true };
  },

  tip(h, type) {
    if (type === 'rear') return carries(h, 'Blunt') ? `**Daze** on a head from your ${carryingName(h, 'Blunt')} stops its spear.` : 'A **Twin Spear** is coming.';
    if (!h.mon.parts.wings.broken && carries(h, 'Pierce')) return `Breaking its wings with your ${carryingName(h, 'Pierce')} stops the **Twin Spear**.`;
    if (carries(h, 'Blunt')) return 'Each head has its own **Daze** meter. A dazed head loses this turn and the next.';
    return null;
  }
};

