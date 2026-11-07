// The Squallhorn — a Gale Gorehorn, one of the four changed Ashfall Ridge monsters (variants, Nov 2026).
// The Gorehorn taught "read the wind-up and guard"; this one gathers wind over several turns, so the answer is to
// interrupt it before it lets go. The Blunt check.
// Pattern: Jab → Gathering Wind (a pip each turn, still swiping) until full → Cyclone Charge → winded, repeating.
//   Dazing it (Blunt on the tusks) scatters the wind: back to 0. Breaking the hind legs knocks a pip off and caps
//   it at 2. A Pinning Shot during the gathering knocks a pip off. Below 70% it rides a Tailwind once (mane intact):
//   its next charge ignores half your guard.
// Parts: Tusks (Blunt; daze part; weaker charge), Mane (Cut; stops the Tailwind), Hind Legs (Pierce; cap 2).
import type { Intent, MonsterDef } from '../../types';
import { carries, carryingName, dazeTag } from '../../util';

type H = Parameters<MonsterDef['resolve']>[0];
export const windCap = (h: H) => (h.mon.parts.legs.broken ? 2 : 3);

export const squallhorn: MonsterDef = {
  id: 'squallhorn',
  variantOf: 'gorehorn',
  name: 'The Squallhorn',
  short: 'Squallhorn',
  kind: 'Storm boar',
  elem: 'Gale',
  elemental: ['Cyclone Charge'],
  weak: 'Frost',
  resist: 'Stone',
  hp: 800,
  tier: 2.5,
  requires: ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass'],
  head: 'tusks',
  common: 'squallhide',
  rarePart: 'tusks',
  rare: 'galeheart',
  habits: 'A Gorehorn that gathers the wind before it charges, a little more each turn, and lets go when it’s full. Dazing it scatters the wind. With its hind legs broken it can’t gather as much.',
  enragedHabit: 'Every other jab is a Squall Jab that gathers wind as it lands.',
  intro: 'The wind turns on the ridge. A Gorehorn with a mane like a storm cloud paws at the ash.',
  enrageText: 'The wind howls around it. The Squallhorn is enraged!',
  parts: [
    { id: 'tusks', name: 'Tusks', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'Daze it here to scatter the wind. Break to weaken the charge', mat: 'galetusk', hp: 400, brk: 'A tusk snaps! Its charge will never hit as hard again.' },
    { id: 'hide', name: 'Mane', eff: { Cut: 1, Blunt: 0, Pierce: 0.5 }, hint: 'Break to stop the Tailwind', mat: 'squallmane', hp: 350, brk: 'You shear through the mane. The wind can’t catch in it now.' },
    { id: 'legs', name: 'Hind Legs', eff: { Cut: 0.5, Blunt: 0.5, Pierce: 1 }, hint: 'Break and it can only gather 2', mat: 'squallsinew', hp: 240, brk: 'Its hind leg buckles. It can’t brace to gather a full storm now.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, tb = m.parts.tusks.broken, cap = windCap(h), w = m.wind ?? 0;
    switch (type) {
      case 'jab': return { name: 'Tusk Jab', text: 'It snorts and hooks a tusk at you.', dmg: enr ? 42 : 32, threat: 2 };
      case 'gather': {
        const after = Math.min(cap, w + (enr && w === 0 ? 2 : 1));
        return { name: 'Gathering Wind', text: 'Its mane streams out as the wind gathers.', dmg: enr ? 32 : 25, threat: 1, note: after >= cap ? `**Wind** ${after} of ${cap} after this. Charges next turn` : `**Wind** ${after} of ${cap} after this. At ${cap} it charges` };
      }
      case 'cyclone': {
        const base = cap >= 3 ? (enr ? 118 : 106) : (enr ? 93 : 84);
        const dmg = Math.round(base * (tb ? 0.75 : 1));
        return { name: 'Cyclone Charge', text: 'It lets go of the storm and comes at you inside it!', dmg, threat: enr ? 4 : 3, halfGuard: !!m.tailwind, note: m.tailwind ? '**Tailwind**. Your **Block** is ½' : undefined };
      }
      // enraged (Nov 2026): its wind turned up, a jab that gathers the storm as it lands
      case 'squall': return { name: 'Squall Jab', text: 'It hooks a tusk at you, and the wind rises with it.', dmg: enr ? 42 : 32, threat: 2, isNew: !m.newSeen, note: `Also gathers **Wind** (${Math.min(cap, w + 1)} of ${cap}). **Daze** scatters it` };
      case 'tailwind': return { name: 'Tailwind', text: 'It turns its mane into the wind and lets it fill.', dmg: 0, threat: 0, note: 'Your **Block** is ½ against its next **Cyclone Charge**' };
      case 'winded': return { name: 'Winded', text: 'The storm drops away. It stands blowing, sides heaving.', dmg: 0, threat: 0, note: 'A free turn' };
      case 'pinned': return { name: 'Pinned', text: 'An arrow through the foreleg breaks its stance. Some of the wind slips away.', dmg: 0, threat: 0, note: 'Loses 1 **Wind**' };
      case 'dazed': return { name: 'Dazed', text: 'It reels, and the gathered wind tears loose around it.', dmg: 0, threat: 0, note: 'It loses its turn and its **Wind**' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon, w = m.wind ?? 0;
    if (prev === 'cyclone') return 'winded';
    if (!m.usedWallow && !m.parts.hide.broken && m.hp < m.max * 0.7 && w === 0) { m.usedWallow = true; return 'tailwind'; }
    if (w >= windCap(h)) return 'cyclone';
    if (w > 0) return 'gather';
    let t = ['jab', 'gather'][m.seq % 2]; m.seq++;
    if (t === 'jab' && m.enraged) { const x = (m.extra ??= {}); x.sq = ((x.sq ?? 0) + 1) % 2; if (x.sq) t = 'squall'; }
    return t;
  },

  resolve(h, type) {
    const m = h.mon, cap = windCap(h);
    switch (type) {
      case 'gather': { const w = m.wind ?? 0; m.wind = Math.min(cap, w + (m.enraged && w === 0 ? 2 : 1)); return `The wind gathers: ${m.wind} of ${cap}.`; }
      case 'cyclone': m.wind = 0; m.tailwind = false; return null;
      case 'tailwind': m.tailwind = true; return 'The wind is at its back.';
      case 'squall': m.newSeen = true; m.wind = Math.min(cap, (m.wind ?? 0) + 1); return `The wind gathers: ${m.wind} of ${cap}.`;
      case 'winded': return 'It gets its breath back.';
      case 'pinned': return 'It shakes the arrow loose.';
      case 'dazed':
        if ((m.wind ?? 0) >= 2) (h.feats ??= []).includes('windbreak') || h.feats.push('windbreak');
        m.wind = 0; return 'It shakes its head. The storm has blown itself out.';
    }
    return null;
  },

  onBreak(h, partId) {
    const m = h.mon;
    if (partId === 'legs' && (m.wind ?? 0) > 0) { m.wind = Math.min(2, Math.max(0, (m.wind ?? 0) - 1)); return `A pip of wind slips away: ${m.wind} of 2.`; }
    if (partId === 'hide' && m.tailwind) { m.tailwind = false; return 'The Tailwind falls away.'; }
    return null;
  },

  onPin(h) {
    const m = h.mon;
    if (h.intent === 'gather' && (m.wind ?? 0) > 0) { m.wind = (m.wind ?? 0) - 1; return `Pin: it staggers, and a pip of wind slips away (${m.wind} of ${windCap(h)}).`; }
    return null;
  },

  meter(h) {
    const cap = windCap(h);
    return { label: 'Gathered wind', value: Math.min(cap, h.mon.wind ?? 0), max: cap, tone: 'gale', pips: true, note: `${h.mon.wind ?? 0} of ${cap}${h.mon.tailwind ? ' · Tailwind' : ''}` };
  },

  badges(h) {
    return h.mon.tailwind ? [{ key: 'tail', label: 'Tailwind', short: '**Block** ½ on **Cyclone Charge**', cls: 'gale', desc: 'The wind is behind it.\nBreaking its mane ends it for good.' }] : [];
  },

  tip(h, type) {
    const m = h.mon;
    if (type === 'cyclone' && carries(h, 'Blunt') && m.daze >= m.dazeMax * 0.6) return `${dazeTag} A full **Daze** meter now stops this charge.`;
    return null;
  }
};
