// The Slagwyrm — T3 Ember serpent of the Stormspire. The Blunt check.
// Molten armour soaks the first 20 damage you deal each turn, refilling after its action. Spreading damage over
// many small hits is wasted: one Blunt hit of 30+ (after Charge, whetstones and weakness) shatters the armour for
// 2 turns. Breaking its spine plates lowers the soak to 10 for good.
//   Bite; Magma Spit (then a burn for 2 turns); Tail Lash; Stoke (armour doubles) → Eruption, the big hit.
//   Shattering the armour while it stokes or erupts quenches the Eruption.
// Phase 2 at half HP, Meltdown: the armour stops reforming, but the first Cut or Blunt hit each turn burns you (Pierce is safe).
// Tuned by simulation (5 Nov 2026, casual, Mirewood gear +2 it doesn't resist, non-resisting armor): with Blunt 81%,
// without 53%; skilled 100%. Note: it resists Frost, and resisting armor (Ember) makes it far easier.
// Parts: Spine Plates (Blunt; the daze part; lower soak; rare Slagheart), Jaw (Pierce; stops the spit's burn),
// Tail (Cut; stops the Tail Lash).
import type { Hunt, Intent, MonsterDef } from '../../types';
import { choose, remember } from '../../behaviour';
import { carries, carryingName } from '../../util';

export const SOAK = 38, SOAK_BROKEN = 10, SHATTER_AT = 30, SHATTER_TURNS = 2, BURN = 8, SPIT_TURNS = 2, MELT_BURN = 8;
const STOKE_EVERY = 4;
export const soakMax = (h: Hunt) => (h.mon.parts.spine.broken ? SOAK_BROKEN : SOAK) * (h.mon.stoked ? 2 : 1);
const armourUp = (h: Hunt) => !h.mon.melt && !((h.mon.shatter ?? 0) > 0);

export const slagwyrm: MonsterDef = {
  id: 'slagwyrm',
  name: 'The Slagwyrm',
  short: 'Slagwyrm',
  kind: 'Armour reformer',
  elem: 'Ember',
  // its elemental attacks: only these are reduced by armor that resists Ember; the rest are physical
  elemental: ['Eruption'],
  weak: 'Stone',
  resist: 'Frost',
  hp: 680,
  tier: 3,
  requires: ['fenmother'], // rank D: the Fenmother promotion opens the Stormspire (Nov 2026)
  head: 'spine',
  common: 'slagscale',
  rarePart: 'spine',
  rare: 'slagheart',
  habits: 'A serpent of cooling slag. Its molten armour swallows the first blows each turn and reforms as fast as you chip it. One heavy hammer blow shatters it outright. Hurt badly, it melts down: no more armour, but it burns whatever touches it.',
  enragedHabit: 'Its spit becomes Slag Rain: a shower of slag that burns you a turn longer.',
  intro: 'The scree at the foot of the spire is glowing. Then it lifts its head.',
  enrageText: 'Its armour runs like wax. The Slagwyrm is enraged!',
  parts: [
    { id: 'spine', name: 'Spine Plates', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'The daze part. Break them and its armour soaks half as much', mat: 'slagspine', hp: 240, brk: 'Its spine plates crack apart. Its armour will never be as thick again.' },
    { id: 'jaw', name: 'Jaw', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Break it to stop the spit burning you', mat: 'slagjaw', hp: 200, brk: 'Its jaw splits. The spit cools as it leaves.' },
    { id: 'tail', name: 'Tail', eff: { Cut: 1, Blunt: 0.5, Pierce: 0 }, hint: 'Sever it to stop the Tail Lash', mat: 'slagtail', hp: 220, brk: 'The tail comes away in a gout of slag!' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged;
    switch (type) {
      case 'bite': return { name: 'Bite', text: 'It strikes with a mouth full of embers.', dmg: enr ? 26 : 22, threat: 2 };
      case 'spit': return { name: 'Magma Spit', text: 'It hawks a gob of molten rock.', dmg: enr ? 20 : 16, threat: 1, note: m.parts.jaw.broken ? undefined : `Then burns you for ${SPIT_TURNS} turns` };
      // enraged (Nov 2026): its spit turned up, a shower of slag that burns a turn longer, broken jaw or not
      case 'rain': return { name: 'Slag Rain', text: 'It rears and sprays molten slag across the ground.', dmg: 24, threat: 2, isNew: !m.newSeen, note: `Then burns you for ${SPIT_TURNS + 1} turns. Burn-proof armour takes it to ½` };
      case 'lash': return { name: 'Tail Lash', text: 'Its tail whips round, trailing slag.', dmg: enr ? 30 : 26, threat: 2 };
      case 'stoke': return { name: 'Stoke', text: 'It coils and glows brighter and brighter.', dmg: 0, threat: 0, note: 'Its armour doubles, then **Eruption**. Break the armour to stop it' };
      case 'eruption': return { name: 'Eruption', text: 'It bursts open in a fountain of fire!', dmg: enr ? 66 : 60, threat: 4, steady: true, note: 'Breaking its armour stops it' };
      case 'quenched': return { name: 'Quenched', text: 'Its armour cracks and the fire inside it gutters.', dmg: 0, threat: 0, note: '**Eruption** stopped' };
      case 'dazed': return { name: 'Dazed', text: 'It sways, slag dripping from its jaw.', dmg: 0, threat: 0, note: 'It loses its turn' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon;
    if (prev === 'stoke') return remember(h, 'eruption');
    if (prev === null) return remember(h, 'bite');
    const since = h.turn - (m.lastChain ?? 0);
    const pick = choose(h, [
      ['bite', 3],
      ['spit', 2],
      ['lash', m.parts.tail.broken ? 0 : 2],
      ['stoke', since >= STOKE_EVERY ? 6 : 0]
    ], a => this.intent(h, a).threat);
    if (pick === 'stoke') m.lastChain = h.turn;
    // enraged: its spits become Slag Rain (never two in a row)
    if (pick === 'spit' && m.enraged && prev !== 'rain') return remember(h, 'rain');
    return remember(h, pick);
  },

  resolve(h, type, landed) {
    const m = h.mon, lines: string[] = [];
    // the burn from an earlier spit
    if ((m.slime ?? 0) > 0 && type !== 'spit' && type !== 'rain') {
      const b = Math.min(h.arm.burnproof ? BURN / 2 : BURN, h.php - 1);
      if (b > 0) { h.php -= b; h.stats.taken += b; lines.push(`The magma burns you for ${b}.`); }
      m.slime!--;
    }
    if (type === 'spit' && landed && !m.parts.jaw.broken) { m.slime = SPIT_TURNS; lines.push('Molten rock clings to you.'); }
    if (type === 'rain') { m.newSeen = true; if (landed) { m.slime = SPIT_TURNS + 1; lines.push('Slag clings to you, burning.'); } }
    m.stoked = type === 'stoke';
    if ((m.shatter ?? 0) > 0) { m.shatter!--; if (!m.shatter && !m.melt) lines.push('Its armour flows back together.'); }
    if (armourUp(h)) m.armour = soakMax(h);
    if (type === 'stoke') lines.push(`Its armour swells: it soaks ${soakMax(h)} next turn.`);
    if (type === 'dazed') lines.push('It shakes off the daze.');
    return lines.join(' ') || null;
  },

  absorb(h, dmg, w) {
    const m = h.mon;
    if (!armourUp(h)) return null;
    if (w.type === 'Blunt' && dmg >= SHATTER_AT) {
      m.shatter = SHATTER_TURNS; m.armour = 0;
      if (h.intent === 'stoke' || h.intent === 'eruption') {
        h.intent = 'quenched';
        if (!(h.feats ??= []).includes('shatterslag')) h.feats.push('shatterslag');
      }
      return { dmg, note: 'armour shattered!' };
    }
    const soak = Math.min(m.armour ?? soakMax(h), dmg);
    m.armour = (m.armour ?? soakMax(h)) - soak;
    return soak ? { dmg: dmg - soak, note: `armour soaks ${soak}` } : null;
  },

  // Meltdown burns the first Cut or Blunt hit each turn (more would make melee hopeless)
  burn(h, w) {
    if (!h.mon.melt || w.type === 'Pierce' || h.mon.burnedTurn === h.turn) return 0;
    h.mon.burnedTurn = h.turn; return MELT_BURN;
  },

  onPhase(h) {
    h.mon.melt = true; h.mon.armour = 0;
    return 'Meltdown: its armour is gone for good, but your first Cut or Blunt hit each turn now burns you.';
  },

  meter(h) {
    const m = h.mon;
    if (m.melt) return { label: 'Meltdown · your first melee hit each turn burns you', value: 1, max: 1, tone: 'ember', note: 'Armour broken' };
    if ((m.shatter ?? 0) > 0) return { label: 'Armour shattered', value: m.shatter!, max: SHATTER_TURNS, tone: 'gold', pips: true, note: `${m.shatter} turn${m.shatter! > 1 ? 's' : ''}` };
    const max = soakMax(h), v = m.armour ?? max;
    return { label: `Molten armour · soaks ${v} more this turn`, value: v, max, tone: 'ember' };
  },

  tip(h, type) {
    const m = h.mon;
    if ((type === 'stoke' || type === 'eruption') && carries(h, 'Blunt')) return `One ${carryingName(h, 'Blunt')} hit of ${SHATTER_AT} or more breaks its armour and stops the **Eruption**.`;
    if (m.melt) return carries(h, 'Pierce') ? `**Cut** and **Blunt** hits burn you now. Your ${carryingName(h, 'Pierce')} doesn’t.` : '**Cut** and **Blunt** hits burn you now.';
    if (armourUp(h) && carries(h, 'Blunt')) return `Its armour takes the first ${soakMax(h)} each turn. One ${carryingName(h, 'Blunt')} hit of ${SHATTER_AT} or more breaks it.`;
    if (armourUp(h)) return `Its armour takes the first ${soakMax(h)} each turn. A heavy **Blunt** hit breaks it.`;
    return null;
  }
};
