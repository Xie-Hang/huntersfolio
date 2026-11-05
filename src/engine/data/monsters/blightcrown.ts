// The Blightcrown — a changed Rotcap: Infect, Ember. The Gloamhollow, deeper (Tier 3.2, Nov 2026). The Blunt check.
// The cap has crusted over, so arrows can't pop the Bloom any more: daze it (Blunt on the jaw) to stop the Burst.
// While you're infected, each turn of the Bloom heals it: cure yourself first, or daze it.
// Pattern: Slam → Spore Puff (infects 3 turns) → Bloom ×2 (heals 30 a turn while you're infected) → Spore Burst
//   (infects 4 turns) → Wilting.
import type { Intent, MonsterDef } from '../../types';
import { infectPlayer } from '../../status';
import { carries, carryingName, dazeTag } from '../../util';
import { BLOOM_TURNS } from './rotcap';

export const BLOOM_HEAL = 30;
const MIRE = ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass'];

export const blightcrown: MonsterDef = {
  id: 'blightcrown',
  inflicts: 'Infect',
  variantOf: 'rotcap',
  name: 'The Blightcrown',
  short: 'Blightcrown',
  kind: 'Spore beast',
  elem: 'Ember',
  elemental: ['Spore Burst', 'Spore Puff'],
  weak: 'Stone',
  resist: 'Frost',
  hp: 820,
  tier: 3.2,
  requires: [...MIRE, 'rotcap'],
  head: 'jaw',
  common: 'blightspore',
  rarePart: 'jaw',
  rare: 'blightheart',
  habits: 'A Rotcap from deeper down, its cap crusted hard and smouldering. Arrows can’t pop it any more. While you’re infected its Bloom feeds it. Daze it to stop the Burst.',
  intro: 'Deeper in, the air is warm and thick. A crusted, smouldering cap rises out of the dark.',
  enrageText: 'Embers glow in the cracks of its crust. The Blightcrown is enraged!',
  parts: [
    { id: 'cap', name: 'Crusted Cap', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Break it to stop the Bloom', mat: 'crustcap', hp: 340, brk: 'The crust shatters and the cap caves in. No more Blooms.' },
    { id: 'jaw', name: 'Jaw', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'The daze part. Daze it to stop the Burst', mat: 'blightjaw', hp: 360, brk: 'Its jaw cracks and hangs loose.' },
    { id: 'legs', name: 'Root Legs', eff: { Cut: 1, Blunt: 0.5, Pierce: 0 }, hint: 'Break to weaken the Slam', mat: 'blightroot', hp: 290, brk: 'You hack through its root legs. It can’t throw its weight now.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, lb = m.parts.legs.broken, b = m.bloom ?? 0;
    switch (type) {
      case 'slam': return { name: 'Cap Slam', text: 'It rears up and brings the crusted cap down on you.', dmg: Math.round((enr ? 42 : 34) * (lb ? 0.7 : 1)), threat: 1 };
      case 'puff': return { name: 'Spore Puff', text: 'Hot spores roll out from under the crust.', dmg: enr ? 24 : 20, threat: 1, note: 'If it hits, you’re infected for 3 turns' };
      case 'bloom': return { name: 'Bloom', text: 'The crust cracks as the cap swells beneath it.', dmg: 0, threat: 0, note: `Bursts${b + 1 < BLOOM_TURNS ? ' after next turn' : ' next turn'}. While you’re infected it heals ${BLOOM_HEAL}. Daze it to stop it` };
      case 'burst': return { name: 'Spore Burst', text: 'The crust splits wide!', dmg: enr ? 96 : 84, threat: enr ? 4 : 3, halfGuard: true, note: 'Half your guard, then infected 4 turns. Daze it to stop it' };
      case 'wilt': return { name: 'Wilting', text: 'The cap sags under its crust.', dmg: 0, threat: 0, note: 'A free turn to attack' };
      case 'dazed': return { name: 'Dazed', text: 'It sways, its crusted cap lolling.', dmg: 0, threat: 0, note: 'Its action is lost' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon;
    if (prev === 'bloom' && (m.bloom ?? 0) < BLOOM_TURNS) return 'bloom';
    if (prev === 'bloom') return 'burst';
    if (prev === 'burst') return 'wilt';
    let t = ['slam', 'puff', 'bloom'][m.seq % 3]; m.seq++;
    if (t === 'bloom' && m.parts.cap.broken) t = 'puff';
    return t;
  },

  resolve(h, type, landed) {
    const m = h.mon;
    switch (type) {
      case 'puff': return landed ? infectPlayer(h, 3, m.enraged ? 15 : 12) : null;
      case 'bloom': {
        m.bloom = (m.bloom ?? 0) + 1;
        if ((m.pInf ?? 0) > 0) { const heal = Math.min(BLOOM_HEAL, m.max - m.hp); m.hp += heal; return heal ? `It feeds on your infection: +${heal}.` : null; }
        return null;
      }
      case 'burst': m.bloom = 0; return landed ? infectPlayer(h, 4, m.enraged ? 17 : 14) : null;
      case 'wilt': return 'It straightens, slowly.';
      case 'dazed': m.bloom = 0; return 'It shakes itself. The swelling has gone down.';
    }
    return null;
  },

  onBreak(h, partId) {
    if (partId === 'cap' && (h.intent === 'bloom' || h.intent === 'burst')) { h.mon.bloom = 0; h.intent = 'wilt'; return 'The bloom collapses with it.'; }
    return null;
  },

  badges(h) {
    const m = h.mon;
    return (m.bloom ?? 0) > 0 || h.intent === 'burst' ? [{ key: 'bloom', label: 'Swollen', short: 'daze it', cls: 'ember', desc: 'Its crusted cap is swelling to burst. Arrows can’t pop it: daze it to stop the Spore Burst. While you’re infected, each turn of the Bloom heals it.' }] : [];
  },

  tip(h, type) {
    const m = h.mon;
    if ((type === 'bloom' || type === 'burst') && carries(h, 'Blunt') && m.daze >= m.dazeMax * 0.5) return `${dazeTag} Daze it now to stop the Burst (${carryingName(h, 'Blunt')} on the jaw).`;
    return null;
  }
};
