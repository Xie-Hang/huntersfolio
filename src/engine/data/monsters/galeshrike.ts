// The Galeshrike — T1 Gale storm raptor. Spends half the fight airborne.
// Pattern: Rake → Take off → Gust → Circle → Dive → Stuck, repeating.
import type { Intent, MonsterDef } from '../../types';
import { carries, carryingName, dazeTag } from '../../util';

export function airTurns(h: { mon: { enraged: boolean; parts: Record<string, { broken: boolean }> } }): number {
  let n = 2; // since Nov 2026 melee can't reach it in the air at all, so it no longer stays up longer when enraged
  if (h.mon.parts.wings?.broken) n--;
  return Math.max(1, n);
}

function ground(h: Parameters<MonsterDef['resolve']>[0]) {
  h.mon.air = false;
  h.mon.airLeft = 0;
  h.intent = 'crashed';
}

export const galeshrike: MonsterDef = {
  id: 'galeshrike',
  name: 'The Galeshrike',
  short: 'Galeshrike',
  flier: true,
  kind: 'Storm raptor',
  elem: 'Gale',
  // its elemental attacks: only these are reduced by armor that resists Gale; the rest are physical
  elemental: ['Plunging Dive'],
  weak: 'Frost',
  resist: 'Stone',
  hp: 380,
  tier: 1,
  requires: 'gorehorn',
  head: 'crest',
  common: 'plume',
  rarePart: 'crest',
  rare: 'tempesteye',
  habits: 'Takes to the air every few turns. In the air only Pierce (bows) can hit it. It circles before every dive, then sits stuck for a turn.',
  intro: 'A shriek splits the wind. The Galeshrike drops onto a ridge-top boulder.',
  enrageText: 'Its feathers bristle with static. The Galeshrike is enraged!',
  parts: [
    { id: 'wings', name: 'Wings', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Break to shorten its time in the air', mat: 'pinion', hp: 200, brk: 'A wing tears! It can’t stay aloft for long now.' },
    { id: 'talons', name: 'Talons', eff: { Cut: 1, Blunt: 0.5, Pierce: 0.5 }, hint: 'Break to weaken its rake and dive', mat: 'talon', hp: 240, brk: 'A talon snaps clean off. Its strikes lose their bite.' },
    { id: 'crest', name: 'Crest', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'Only reachable while it’s on the ground', mat: 'crest', hp: 220, brk: 'The storm crest cracks and the wind around it falters.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, tb = m.parts.talons.broken;
    switch (type) {
      case 'rake': return { name: 'Talon Rake', text: tb ? 'It hops forward, slashing with its one good foot.' : 'It hops forward, talons spread wide.', dmg: tb ? 18 : 28, threat: 1 };
      case 'takeoff': { const n = airTurns(h); return { name: 'Taking off', text: 'It spreads its wings and leaps into the wind.', dmg: 0, threat: 0, note: `Still on the ground now. After your turn it's airborne for ${n} turn${n > 1 ? 's' : ''}: only bows reach it then` }; }
      case 'gust': return { name: enr ? 'Gale Storm' : 'Gust Buffet', text: enr ? 'It hammers the air with both wings, again and again.' : 'It beats its wings hard, driving a wall of wind at you.', dmg: enr ? 38 : 28, threat: enr ? 2 : 1, halfGuard: true, note: 'Ignores half your guard' };
      case 'circle': return { name: 'Circling high', text: 'It climbs into a wide circle overhead, watching you.', dmg: 0, threat: 0, note: 'Dives next turn' };
      case 'dive': return { name: 'Plunging Dive', text: 'It folds its wings and drops like a stone!', dmg: tb ? (enr ? 70 : 60) : (enr ? 95 : 80), threat: enr ? 4 : 3, note: 'Then it’s stuck for a turn' };
      case 'stuck': return { name: 'Beak stuck', text: 'Its beak is buried in the earth. It thrashes to pull free.', dmg: 0, threat: 0, note: 'Grounded. The crest is exposed' };
      case 'crashed': return { name: 'Brought down', text: 'It crashes to the ground in a tangle of feathers.', dmg: 0, threat: 0, note: 'Grounded. Its action is lost' };
      case 'dazed': return { name: 'Dazed', text: 'It reels, eyes unfocused, swaying on its feet.', dmg: 0, threat: 0, note: 'Its action is lost' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon;
    if (prev === 'circle') return 'dive';
    if (prev === 'dive') return 'stuck';
    if (m.air) { if (m.airLeft > 1) { m.airLeft--; return 'gust'; } return 'circle'; }
    const t = ['rake', 'takeoff'][m.seq % 2]; m.seq++; return t;
  },

  resolve(h, type) {
    const m = h.mon;
    switch (type) {
      case 'takeoff': m.air = true; m.airLeft = airTurns(h); return 'It climbs into the wind. It’s airborne!';
      case 'circle': return 'It wheels overhead, lining up a dive.';
      case 'stuck': return 'It wrenches its beak free.';
      case 'crashed': return 'It scrambles back to its feet.';
      case 'dazed': return 'It shakes its head, slowly coming back to its senses.';
      case 'dive': m.air = false; m.airLeft = 0; return null;
    }
    return null;
  },

  // In the air only Pierce reaches it (playtest, Nov 2026: a tester asked how a sword hits a bird in the sky;
  // it used to be half damage). Down on the ground, or low after a swoop, every weapon works.
  canHit(h, w) { return !h.mon.air || w.type === 'Pierce'; },
  cantHitReason() { return 'It\u2019s in the air: only Pierce (a bow) reaches it. Swap to a bow, throw a Net, or guard until it comes down.'; },

  reachable(h, partId, w) {
    return !(partId === 'crest' && h.mon.air && w.type !== 'Pierce');
  },

  onPin(h) {
    if (h.mon.air) { ground(h); return 'Pin: the arrow punches through a wing. It comes crashing down!'; }
    return null;
  },

  tip(h, type) {
    const m = h.mon;
    if (m.air && carries(h, 'Pierce')) return `Pinning Shot brings it down (${carryingName(h, 'Pierce')}).`;
    if (m.air && h.item === 'net' && h.itemCharges > 0) return 'Throw the Weighted Net to bring it down.';
    if ((type === 'stuck' || type === 'crashed') && carries(h, 'Blunt')) return `${dazeTag} It’s grounded. Hit the crest while you can.`;
    if (m.air) return 'It’s airborne: only Pierce reaches it. Guard until it dives, then hit it while it’s stuck.';
    return null;
  },

  canCapture(h) { return !h.mon.air; }
};

/** Used by the Weighted Net (and anything else that grounds a flier). */
export function groundFlier(h: Parameters<MonsterDef['resolve']>[0]) { ground(h); }
