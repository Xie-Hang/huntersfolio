// The Arcmoth — Spark, Gale. The Gloamhollow (Nov 2026). The Blunt check.
// A huge pale moth whose wing dust crackles. Every wingbeat puts a Spark pip on you; at 3 you Discharge, and guard
// can't stop it. Any Blunt move grounds a pip, so the maul earns its slot by what it protects you from, even while
// it can't reach the moth in the air.
// Pattern: Wing Rake → Taking off → (air) Wingbeat → Wingbeat → Static Dive → Settled (a free turn). The rake and the
//   wingbeats each leave a pip: ground them while it's down (you can't swing at it in the air), or you go off.
//   In the air only Pierce reaches it. A Pinning Shot or a Net brings it down.
// The Glarewing (its deeper version) reuses this body: see glarewing.ts.
// Parts: Wings (Pierce; grounded for good), Antennae (Cut; only every other wingbeat sparks you), Thorax (Blunt; the
// daze part; your Discharge is weaker).
import type { Hunt, Intent, MonsterDef } from '../../types';
import { sparkPlayer } from '../../status';
import { carries, carryingName } from '../../util';
import { groundFlier } from './galeshrike';

export const MOTH_AIR = 2;
/** a Discharge on you: weaker once the thorax that stores the charge is broken */
export const mothHit = (h: Hunt, base: number) => Math.round(base * (h.mon.parts.thorax.broken ? 0.65 : 1));
const RIDGE = ['gorehorn', 'galeshrike', 'cinderback', 'rimetail'];

export const arcmoth: MonsterDef = {
  id: 'arcmoth',
  inflicts: 'Spark',
  name: 'The Arcmoth',
  short: 'Arcmoth',
  flier: true,
  kind: 'Static moth',
  elem: 'Gale',
  elemental: ['Static Dive'],
  weak: 'Frost',
  resist: 'Stone',
  hp: 560,
  tier: 2.2,
  requires: RIDGE,
  head: 'thorax',
  common: 'arcdust',
  rarePart: 'thorax',
  rare: 'sparkgland',
  habits: 'A moth as wide as a wagon, its dust crackling. Each wingbeat leaves a Spark pip on you; at 3 the charge goes off through you and guard can’t stop it. Any Blunt move grounds a pip. In the air only bows reach it.',
  intro: 'Pale dust drifts down in the dark and snaps against your armour. Wings unfold above you.',
  enrageText: 'Its dust glows white. The Arcmoth is enraged!',
  parts: [
    { id: 'wings', name: 'Wings', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Break and it can’t fly any more', mat: 'arcwing', hp: 200, brk: 'A wing tears through. It will never get off the ground again.' },
    { id: 'feelers', name: 'Antennae', eff: { Cut: 1, Blunt: 0.5, Pierce: 0.5 }, hint: 'Break and only every other wingbeat sparks you', mat: 'arcfeeler', hp: 170, brk: 'Its antennae snap. The dust loses half its charge.' },
    { id: 'thorax', name: 'Thorax', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'The daze part. Break to weaken your Discharge', mat: 'arcthorax', hp: 240, brk: 'The thorax plate cracks. The charge it stores leaks away.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, spark = !m.parts.feelers.broken || m.charges % 2 === 0;
    switch (type) {
      case 'rake': return { name: 'Wing Rake', text: 'It beats low and drags a dusty wing edge across you.', dmg: enr ? 30 : 24, threat: 1, note: spark ? 'If it hits: a Spark pip on you' : 'The dust is dead this time' };
      case 'dust': return { name: 'Dust Cloud', text: 'It shakes its torn wings and the dust pours off it.', dmg: enr ? 14 : 10, threat: 1, note: spark ? 'If it hits: a Spark pip on you' : 'The dust is dead this time' };
      case 'takeoff': return { name: 'Taking off', text: 'Its wings snap open.', dmg: 0, threat: 0, note: `Still on the ground now. After your turn it’s airborne for ${MOTH_AIR} wingbeats: only bows reach it then` };
      case 'beat': return { name: 'Wingbeat', text: 'It hangs above you, fanning dust down.', dmg: enr ? 20 : 16, threat: 1, note: spark ? 'If it hits: a Spark pip on you' : 'The dust is dead this time' };
      case 'dive': return { name: 'Static Dive', text: 'It folds and drops, crackling!', dmg: enr ? 72 : 62, threat: enr ? 4 : 3, note: 'Then it’s on the ground' };
      case 'settle': return { name: 'Settled', text: 'It sits stunned on the cave floor, wings spread.', dmg: 0, threat: 0, note: 'On the ground: a free turn' };
      case 'crashed': return { name: 'Brought down', text: 'It flutters to the ground, tangled.', dmg: 0, threat: 0, note: 'On the ground. Its action is lost' };
      case 'dazed': return { name: 'Dazed', text: 'Its wings droop and twitch.', dmg: 0, threat: 0, note: 'Its action is lost' };
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
    const m = h.mon, base = m.enraged ? 75 : 65;
    switch (type) {
      case 'takeoff': m.air = true; m.airLeft = MOTH_AIR; return 'It lifts into the dark. It’s airborne!';
      case 'beat': case 'dust': case 'rake': {
        const spark = !m.parts.feelers.broken || m.charges % 2 === 0; m.charges++;
        return landed && spark ? sparkPlayer(h, 1, mothHit(h, base)) : null;
      }
      case 'dive': m.air = false; m.airLeft = 0; return null;
      case 'settle': return 'It shakes the dust from its wings.';
      case 'crashed': return 'It scrabbles upright.';
      case 'dazed': return 'It shakes itself, coming back to its senses.';
    }
    return null;
  },

  onBreak(h, partId) {
    if (partId === 'wings' && h.mon.air) { groundFlier(h); return 'It spirals down and hits the cave floor.'; }
    return null;
  },

  canHit(h, w) { return !h.mon.air || w.type === 'Pierce'; },
  cantHitReason() { return 'It’s in the air: only Pierce (a bow) reaches it. Swap to a bow, throw a Net, or guard until it dives.'; },
  onPin(h) { if (h.mon.air) { groundFlier(h); return 'Pin: the arrow pins a wing. It comes fluttering down!'; } return null; },

  tip(h) {
    const m = h.mon;
    if ((m.pSpark ?? 0) >= 2 && !m.air && carries(h, 'Blunt')) return `Any ${carryingName(h, 'Blunt')} move grounds a Spark pip.`;
    if (m.air && carries(h, 'Pierce')) return `Pinning Shot brings it down (${carryingName(h, 'Pierce')}).`;
    return null;
  },

  canCapture(h) { return !h.mon.air; }
};
