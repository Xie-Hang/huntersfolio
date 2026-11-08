// The Cinderback — T1 Ember magma burrower. The Blunt-answer monster.
// Pattern: Swipe → Swipe → Burrow → Eruption → Venting, repeating (one more Swipe once its claws break).
//   Underground (after Burrow until it erupts): only Blunt reaches it, for half damage.
//   A 2-die Blunt move (Smash, Skullcrack) drives it up: the eruption is cancelled and it loses its action.
//   Blast Powder does the same for players without a Blunt weapon.
//   After erupting its shell is molten for two turns: every Cut or Blunt hit burns you. Pierce is ranged and safe.
// Breaking the claws: it burrows less often.
// Breaking the vents: no more molten shell. Breaking the head plate: weaker eruption.
import type { Intent, MonsterDef } from '../../types';
import { carries, carryingName, dazeTag } from '../../util';

export const MOLTEN_TURNS = 2;
const moltenBurn = (enraged: boolean) => (enraged ? 8 : 5);

type H = Parameters<MonsterDef['resolve']>[0];
/** Force a burrowed Cinderback to the surface; it loses its next action. */
export function unearth(h: H) {
  h.mon.under = false;
  h.intent = 'unearthed';
}

export const cinderback: MonsterDef = {
  id: 'cinderback',
  name: 'The Cinderback',
  short: 'Cinderback',
  burrower: true,
  kind: 'Magma burrower',
  elem: 'Ember',
  // its elemental attacks: only these are reduced by armor that resists Ember; the rest are physical
  elemental: ['Eruption'],
  weak: 'Stone',
  resist: 'Frost',
  hp: 400,
  tier: 1,
  requires: 'gorehorn',
  head: 'plate',
  common: 'cinderscale',
  rarePart: 'plate',
  rare: 'kilnheart',
  habits: 'Burrows every few turns, then erupts beneath you. Underground, only **Blunt** reaches it, and a heavy **Blunt** hit drives it back up. After erupting, its shell is molten for two turns, and **Cut** and **Blunt** hits burn you.',
  enragedHabit: 'Every other time it digs in, it sprays magma up through the ground. It goes through **Block**, and a heavy **Blunt** hit stops it.',
  intro: 'The ground splits with a hiss. The Cinderback heaves itself out of a seam of glowing rock.',
  enrageText: 'Its vents roar white-hot. The Cinderback is enraged!',
  parts: [
    { id: 'plate', name: 'Head Plate', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'Breaking it weakens **Eruption**', mat: 'slagplate', hp: 260, brk: 'The head plate cracks in two! Its eruptions lose their force.' },
    { id: 'claws', name: 'Digging Claws', eff: { Cut: 1, Blunt: 0.5, Pierce: 0 }, hint: 'Breaking them makes it burrow less often', mat: 'digclaw', hp: 220, brk: 'A digging claw shears off. Digging is harder for it now.' },
    { id: 'vents', name: 'Back Vents', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Breaking them stops the molten shell', mat: 'ventgland', hp: 160, brk: 'The vents collapse in a gout of ash. Its shell can’t melt any more.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, pb = m.parts.plate.broken;
    switch (type) {
      case 'swipe': return { name: enr ? 'Raking Swipes' : 'Claw Swipe', text: enr ? 'It rears up, claws glowing, and slashes twice.' : 'It scrapes forward, claws dragging sparks from the rock.', dmg: enr ? 34 : 26, threat: enr ? 2 : 1 };
      case 'burrow': return { name: 'Burrowing', text: 'It tears into the ground and vanishes in a spray of hot grit.', dmg: 0, threat: 0, note: 'After your turn it’s underground, then erupts. Only **Blunt** reaches it then' };
      case 'erupt': return { name: 'Eruption', text: 'The ground under your feet glows and bulges. Something is coming up!', dmg: pb ? (enr ? 60 : 48) : (enr ? 80 : 64), threat: enr ? 4 : 3, note: m.parts.vents.broken ? 'A heavy **Blunt** hit drives it up and stops it' : 'Driving it up stops it. Then its shell is molten for 2 turns' };
      // enraged (Nov 2026): every other time under, it sprays magma up through the cracks: Block can't stop it, but a
      // heavy Blunt hit drives it up and cancels it like an eruption
      case 'spray': return { name: 'Magma Spray', text: 'Molten rock jets up through every crack around you!', dmg: 42, threat: 3, noGuard: true, isNew: !m.newSeen, note: 'A heavy **Blunt** hit drives it up and stops it' };
      case 'venting': return { name: 'Venting', text: 'It squats on the surface, steam pouring from its back.', dmg: 0, threat: 0, note: 'A free turn' };
      case 'unearthed': return { name: 'Driven up', text: 'It bursts out of the ground, dazed and blinking.', dmg: 0, threat: 0, note: '**Eruption** stopped. It loses its turn' };
      case 'dazed': return { name: 'Dazed', text: 'It reels, eyes unfocused, swaying on its claws.', dmg: 0, threat: 0, note: 'It loses its turn' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon;
    // still underground after anything (a daze included: Nov 2026 bug hunt), it comes up next
    if (prev === 'burrow' || m.under) { if (m.enraged && m.sprayNext !== false) { m.sprayNext = false; return 'spray'; } m.sprayNext = true; return 'erupt'; }
    if (prev === 'erupt' || prev === 'spray') return 'venting';
    // m.seq counts swipes since the last burrow, so breaking the claws mid-cycle never makes it burrow early
    const swipes = m.parts.claws.broken ? 3 : 2;
    if (m.seq >= swipes) { m.seq = 0; return 'burrow'; }
    m.seq++; return 'swipe';
  },

  resolve(h, type) {
    const m = h.mon;
    switch (type) {
      case 'burrow': m.under = true; return 'It’s underground.';
      case 'erupt':
        m.under = false;
        // +1 because the shared end-of-turn tick runs right after this
        if (!m.parts.vents.broken) { m.molten = MOLTEN_TURNS + 1; return 'Its shell glows molten.'; }
        return null;
      case 'spray': m.under = false; m.newSeen = true; return 'It heaves up out of the steaming ground.';
      case 'venting': return 'It shakes off the last of the steam.';
      case 'unearthed': return 'It shakes the grit from its plate.';
      case 'dazed': return 'It shakes its head, slowly coming back to its senses.';
    }
    return null;
  },

  canHit(h, w) { return !h.mon.under || w.type === 'Blunt'; },
  cantHitReason() { return 'It’s underground. Only **Blunt** reaches it.'; },

  hitMod(h) {
    return h.mon.under ? { mult: 0.5, note: 'through the ground ½' } : null;
  },

  onHit(h, mv, w) {
    if (h.mon.under && w.type === 'Blunt' && mv.need.length >= 2) { unearth(h); return 'The blow shakes the ground. It bursts up, stunned!'; }
    return null;
  },

  burn(h, w) {
    return h.mon.molten > 0 && w.type !== 'Pierce' ? moltenBurn(h.mon.enraged) : 0;
  },

  tip(h, type) {
    const m = h.mon;
    if (m.under) {
      if (carries(h, 'Blunt')) return `${dazeTag} **Smash** or **Skullcrack** drives it up and stops the ${type === 'spray' ? 'spray' : 'eruption'} (${carryingName(h, 'Blunt')}).`;
      if (h.item && h.itemCharges > 0 && h.item === 'blast') return '**Blast Powder** forces it up.';
      return 'It’s underground. Only **Blunt** reaches it. It erupts next.';
    }
    if (m.molten > 0) return `Its shell is molten. **Cut** and **Blunt** hits burn you for ${moltenBurn(m.enraged)}.`;
    if (type === 'burrow' && carries(h, 'Blunt')) return `It digs in after this. Your ${carryingName(h, 'Blunt')} reaches it there.`;
    return null;
  },

  canCapture(h) { return !h.mon.under; }
};
