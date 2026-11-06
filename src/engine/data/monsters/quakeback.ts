// The Quakeback — a Stone Cinderback, one of the four changed Ashfall Ridge monsters (variants, Nov 2026).
// The Cinderback taught "drive it up with Blunt"; this one shakes the ground from below and knocks your dice loose,
// and the clean answer is to cut its digging claws before it ever goes under. The Cut check.
// Pattern: Swipe → Rockfall → Swipe → Swipe → Burrow → Tremor → Tremor → Rockburst → Settling, repeating.
//   Underground: only Blunt reaches it (half damage); it's deeper than the Cinderback, so only a 3-die Blunt move
//   drives it up.
//   Tremor: a hit, and one of your dice is shaken loose on your next roll (Quakestone Plate stops it).
//   Breaking the claws: it can't burrow at all any more. Breaking the back ridge: no more Rockfall.
// Parts: Head Plate (Blunt; daze part; weaker Rockburst), Digging Claws (Cut), Back Ridge (Pierce).
import type { Intent, MonsterDef } from '../../types';
import { carries, carryingName } from '../../util';
import { unearth } from './cinderback';

export const TREMORS = 2;

export const quakeback: MonsterDef = {
  id: 'quakeback',
  variantOf: 'cinderback',
  name: 'The Quakeback',
  short: 'Quakeback',
  burrower: true,
  kind: 'Quake burrower',
  elem: 'Stone',
  elemental: ['Rockfall', 'Tremor', 'Rockburst'],
  weak: 'Gale',
  resist: 'Ember',
  hp: 640,
  tier: 2.5,
  requires: ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass'],
  head: 'plate',
  common: 'quakescale',
  rarePart: 'plate',
  rare: 'quakeheart',
  habits: 'A Cinderback gone cold and hard. It burrows, then shakes the ground from below: each tremor knocks one of your dice loose. Underground only Blunt reaches it. With its digging claws broken it can’t burrow at all.',
  intro: 'The ridge shudders. A grey, rock-backed beast heaves itself out of a crack in the stone.',
  enrageText: 'The ground won’t stop shaking. The Quakeback is enraged!',
  parts: [
    { id: 'plate', name: 'Head Plate', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'Break to weaken the Rockburst', mat: 'quakeplate', hp: 280, brk: 'The head plate cracks in two! Its Rockburst loses its force.' },
    { id: 'claws', name: 'Digging Claws', eff: { Cut: 1, Blunt: 0.5, Pierce: 0 }, hint: 'Break and it can’t burrow any more', mat: 'quakeclaw', hp: 170, brk: 'Its digging claws shear off. It can’t get under the ground now.' },
    { id: 'vents', name: 'Back Ridge', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Break to stop the Rockfall', mat: 'backridge', hp: 200, brk: 'The rock ridge on its back crumbles. No more rockslides.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, pb = m.parts.plate.broken;
    switch (type) {
      case 'swipe': return { name: 'Stone Swipe', text: 'It scrapes forward, claws grinding on the rock.', dmg: enr ? 30 : 24, threat: 1 };
      case 'rockfall': return { name: 'Rockfall', text: 'It hunches and shrugs its back ridge: the slope above you starts to slide!', dmg: enr ? 68 : 58, threat: enr ? 4 : 3, note: 'Break the back ridge to stop this' };
      case 'burrow': return { name: 'Burrowing', text: 'It claws into the ground and vanishes in a burst of grit.', dmg: 0, threat: 0, note: 'Still on the surface now: hit it while you can. After your turn it\'s underground' };
      case 'tremor': return { name: 'Tremor', text: 'The ground bucks under your feet.', dmg: enr ? 50 : 42, threat: 2, note: h.arm.steadyfoot ? 'Your boots hold: no die shaken loose' : 'A die is shaken loose next turn' };
      case 'rockburst': return { name: 'Rockburst', text: 'The ground splits open beneath you. It’s coming up!', dmg: Math.round((enr ? 96 : 84) * (pb ? 0.75 : 1)), threat: enr ? 4 : 3, note: 'Drive it up with a 3-dice Blunt move to cancel' };
      case 'settle': return { name: 'Settling', text: 'It shakes the dust off its back.', dmg: 0, threat: 0, note: 'A free turn to attack' };
      case 'unearthed': return { name: 'Driven up', text: 'It bursts out of the ground, dazed and blinking.', dmg: 0, threat: 0, note: 'Its action is lost' };
      case 'dazed': return { name: 'Dazed', text: 'It reels, eyes unfocused, swaying on its claws.', dmg: 0, threat: 0, note: 'Its action is lost' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon;
    if (prev === 'burrow') return 'tremor';
    // still underground after anything (a daze included: Nov 2026 bug hunt), it keeps to its tremors and bursts up
    if (m.under) return m.charges < TREMORS ? 'tremor' : 'rockburst';
    if (prev === 'rockburst') return 'settle';
    const cycle = m.parts.claws.broken ? ['swipe', 'rockfall', 'swipe', 'swipe', 'swipe'] : ['swipe', 'rockfall', 'swipe', 'swipe', 'burrow'];
    let t = cycle[m.seq % cycle.length]; m.seq++;
    if (t === 'rockfall' && m.parts.vents.broken) t = 'swipe';
    return t;
  },

  resolve(h, type, landed) {
    const m = h.mon;
    switch (type) {
      case 'burrow': m.under = true; m.charges = 0; m.usedWallow = true; return 'It’s underground.';
      case 'tremor':
        m.charges++;
        if (landed && !h.arm.steadyfoot) { m.shake = 1; return 'A die is shaken loose.'; }
        return null;
      case 'rockburst': m.under = false; m.charges = 0; return null;
      case 'settle': return 'It plants itself on the surface.';
      case 'unearthed': m.charges = 0; return 'It shakes the grit from its plate.';
      case 'dazed': return 'It shakes its head, slowly coming back to its senses.';
    }
    return null;
  },

  onBreak(h, partId) {
    // a bounty: cut its claws before it has ever gone under
    if (partId === 'claws' && !h.mon.usedWallow) (h.feats ??= []).includes('rooted') || h.feats.push('rooted');
    if (partId === 'claws' && !h.mon.under) return 'It scrabbles at the ground, but it can’t dig.';
    return null;
  },

  canHit(h, w) { return !h.mon.under || w.type === 'Blunt'; },
  cantHitReason() { return 'Underground: only Blunt reaches it.'; },
  hitMod(h) { return h.mon.under ? { mult: 0.5, note: 'through the ground ½' } : null; },
  onHit(h, mv, w) {
    // deeper than the Cinderback: only the heaviest Blunt move (3 dice) drives it up
    if (h.mon.under && w.type === 'Blunt' && mv.need.length >= 3) { unearth(h); return 'The blow shakes the ground. It bursts up, stunned!'; }
    return null;
  },

  tip(h, type) {
    const m = h.mon;
    if (m.under) {
      if (carries(h, 'Blunt')) return null; // the badge and the weapon panel already say only Blunt reaches it
      if (h.item === 'blast' && h.itemCharges > 0) return 'Throw the Blast Powder to force it up.';
      return 'Only Blunt reaches it underground. Block for the tremors.';
    }
    if (type === 'burrow' && !m.parts.claws.broken && carries(h, 'Cut')) return `Its claws dig it in. Your ${carryingName(h, 'Cut')} can take them off.`;
    return null;
  },

  canCapture(h) { return !h.mon.under; }
};
