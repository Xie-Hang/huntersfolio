// The Glarewing — a changed Arcmoth: Spark, Frost. The Gloamhollow, deeper (Tier 3.2, Nov 2026). The Cut check.
// Its dust charges your dice: a charged die can only attack. Guarding with one, or leaving it unused, sets it off (15
// each). It lands just before the dive, so you have fewer dice to guard the big hit with. Cutting off its
// antennae (on the ground) stops the charging. Its dive puts 2 Spark pips on you; Blunt still grounds them.
// Pattern: Wing Rake → Taking off → (air) Glare Beat ×2 (charges 2 of your dice) → Static Dive (2 pips) → Settled.
import type { Intent, MonsterDef } from '../../types';
import { sparkPlayer } from '../../status';
import { groundFlier } from './galeshrike';
import { MOTH_AIR, mothHit } from './arcmoth';

const MIRE = ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass'];
export const CHARGE_DICE = 3;

export const glarewing: MonsterDef = {
  id: 'glarewing',
  inflicts: 'Spark',
  variantOf: 'arcmoth',
  name: 'The Glarewing',
  short: 'Glarewing',
  flier: true,
  kind: 'Static moth',
  elem: 'Frost',
  elemental: ['Static Dive'],
  weak: 'Ember',
  resist: 'Gale',
  hp: 800,
  tier: 3.2,
  requires: [...MIRE, 'arcmoth'],
  head: 'thorax',
  common: 'glaredust',
  rarePart: 'thorax',
  rare: 'glaregland',
  habits: 'An Arcmoth from deeper down, cold and glittering. Its dust charges your dice: a charged die can only attack, and guarding with one or leaving it sets it off. Its dive leaves Spark on you. With its antennae cut off, the dust goes dead.',
  intro: 'The cave glitters. Frost-white wings open across the dark like a sheet of ice.',
  enrageText: 'Its wings flare painfully bright. The Glarewing is enraged!',
  parts: [
    { id: 'wings', name: 'Wings', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Break and it can’t fly any more', mat: 'glarepinion', hp: 290, brk: 'A wing tears through. It will never get off the ground again.' },
    { id: 'feelers', name: 'Antennae', eff: { Cut: 1, Blunt: 0.5, Pierce: 0.5 }, hint: 'Break and its dust can’t charge your dice', mat: 'glarefeeler', hp: 250, brk: 'Its antennae snap. The dust goes dead.' },
    { id: 'thorax', name: 'Thorax', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'The daze part. Break to weaken your Discharge', mat: 'glarethorax', hp: 340, brk: 'The thorax plate cracks. The charge it stores leaks away.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, live = !m.parts.feelers.broken && !h.arm.chargeProof;
    switch (type) {
      case 'rake': return { name: 'Wing Rake', text: 'It beats low and drags a frozen wing edge across you.', dmg: enr ? 40 : 32, threat: 1 };
      case 'dust': return { name: 'Glare Dust', text: 'It shakes its torn wings and the dust pours off it.', dmg: enr ? 18 : 14, threat: 1, note: live ? `Charges ${CHARGE_DICE} of your dice next turn` : 'The dust is dead' };
      case 'takeoff': return { name: 'Taking off', text: 'Its wings snap open in a flash of light.', dmg: 0, threat: 0, note: `Still on the ground now. After your turn it’s airborne for ${MOTH_AIR} beats: only bows reach it then` };
      case 'beat': return { name: 'Glare Beat', text: 'It hangs above you, glittering dust falling.', dmg: enr ? 26 : 20, threat: 1, note: live ? `Charges ${CHARGE_DICE} of your dice next turn: attack with them, or they go off` : 'The dust is dead' };
      case 'dive': return { name: 'Static Dive', text: 'It folds and drops, crackling!', dmg: enr ? 98 : 86, threat: enr ? 4 : 3, note: 'If it hits: 2 Spark pips on you. Then it’s on the ground' };
      case 'settle': return { name: 'Settled', text: 'It sits stunned on the cave floor, wings spread.', dmg: 0, threat: 0, note: 'On the ground: a free turn' };
      case 'crashed': return { name: 'Brought down', text: 'It flutters to the ground, tangled.', dmg: 0, threat: 0, note: 'On the ground. Its action is lost' };
      case 'dazed': return { name: 'Dazed', text: 'Its wings droop and flicker.', dmg: 0, threat: 0, note: 'Its action is lost' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon;
    if (prev === 'dive') return 'settle';
    if (m.air) { if (m.airLeft > 0) { m.airLeft--; return 'beat'; } return 'dive'; }
    if (m.parts.wings.broken) { const t = ['rake', 'dust'][m.seq % 2]; m.seq++; return t; }
    const t = ['rake', 'takeoff'][m.seq % 2]; m.seq++; return t;
  },

  resolve(h, type, landed) {
    const m = h.mon;
    switch (type) {
      case 'takeoff': m.air = true; m.airLeft = MOTH_AIR; return 'It lifts into the dark. It’s airborne!';
      case 'beat': case 'dust':
        if (!landed || m.parts.feelers.broken || h.arm.chargeProof) return null;
        m.charge = CHARGE_DICE; return `The dust settles on your dice: ${CHARGE_DICE} will be charged.`;
      case 'dive': m.air = false; m.airLeft = 0; return landed ? sparkPlayer(h, 2, mothHit(h, m.enraged ? 92 : 80)) : null;
      case 'settle': return 'It shakes the dust from its wings.';
      case 'crashed': return 'It scrabbles upright.';
      case 'dazed': return 'It shakes itself, coming back to its senses.';
    }
    return null;
  },

  onBreak(h, partId) {
    if (partId === 'wings' && h.mon.air) { groundFlier(h); return 'It spirals down and hits the cave floor.'; }
    if (partId === 'feelers') { h.mon.charge = 0; return null; }
    return null;
  },

  canHit(h, w) { return !h.mon.air || w.type === 'Pierce'; },
  cantHitReason() { return 'It’s in the air: only Pierce (a bow) reaches it. Swap to a bow, throw a Net, or guard until it dives.'; },
  onPin(h) { if (h.mon.air) { groundFlier(h); return 'Pin: the arrow pins a wing. It comes fluttering down!'; } return null; },

  tip(h) {
    if (h.dice.some(d => d.charged && !d.used)) return 'Charged dice can only attack: guarding with one or leaving it sets it off.';
    return null;
  },

  canCapture(h) { return !h.mon.air; }
};
