// The Wanderer Sovereign — the apex (designed and built 6 Nov 2026). A vast slime that has eaten its way across the
// ridges and wears what it swallowed: Gorehorn tusks, Galeshrike wings, Cinderback vents and claws, a Rimetail tail.
// It fights in four stances, each using one of those parts and borrowing that monster's lesson:
//   Stone (tusks): a slam, a wind-up, then the Sovereign Charge. A daze or a Pinning Shot on the wind-up cancels it.
//   Gale (wings): takes off; in the air only Pierce reaches it; a dive brings it down. A Net or a Pin grounds it.
//   Ember (vents): burrows; underground only Blunt reaches it (a 2-dice Blunt move drives it up); it erupts, then its
//     body is molten for 2 turns (melee burns).
//   Frost (tail): coats itself in 2 layers of ice (a Cut hit clears both; a Firepot melts them), then sweeps.
// Its element, weakness and resistance follow the stance. After each stance it shifts into another one at random
// (never the same twice, never a broken one), and the next-move card names it a turn ahead (Mekkman's call).
// Breaking a stance's part tears it out: that stance is gone for good, and if it's in it, it drops out on the spot.
// Each part breaks best with a weapon that isn't its stance's answer. At half HP stances get shorter.
// Tuned in the sim (scratch/sovtune.ts): an average player with a maul and a bow at Stormspire +1 ~70%, a strong
// player ~90-95% with any pair of types, ~18-25 turns.
import type { Element, Hunt, Intent, MonsterDef } from '../../types';
import { carries, dazeTag } from '../../util';
import { nextRandom } from '../../rng';

export type Stance = 'stone' | 'gale' | 'ember' | 'frost';
export const STANCES: Stance[] = ['stone', 'gale', 'ember', 'frost'];
export const STANCE_PART: Record<Stance, string> = { stone: 'tusks', gale: 'wings', ember: 'vents', frost: 'tail' };
export const STANCE_ELEM: Record<Stance, Element> = { stone: 'Stone', gale: 'Gale', ember: 'Ember', frost: 'Frost' };
const NAME: Record<Stance | 'bare', string> = { stone: 'Stone', gale: 'Gale', ember: 'Ember', frost: 'Frost', bare: 'Bare' };
/** the actions of each stance, in order: the full set, and the shorter one once it's enraged (half HP) */
const STEPS: Record<Stance | 'bare', string[]> = {
  stone: ['slam', 'windup', 'charge'], gale: ['takeoff', 'gust', 'dive'], ember: ['burrow', 'erupt', 'swipe'], frost: ['coat', 'sweep', 'bite'], bare: ['slam', 'crush']
};
const STEPS2: Record<Stance | 'bare', string[]> = {
  stone: ['windup', 'charge'], gale: ['takeoff', 'dive'], ember: ['burrow', 'erupt'], frost: ['coat', 'sweep'], bare: ['slam', 'crush']
};
export const MOLTEN_SOV = 2;

const alive = (h: Hunt) => STANCES.filter(s => !h.mon.parts[STANCE_PART[s]].broken);
/** pick the stance it shifts into: random among the ones it still has, never the one it's in */
function pickNext(h: Hunt): Stance | 'bare' {
  const pool = alive(h).filter(s => s !== h.mon.stance);
  if (!pool.length) return alive(h)[0] ?? 'bare';
  return pool[Math.floor(nextRandom(h) * pool.length) % pool.length];
}
/** end the stance it's in on the spot (its part just broke): clear what that stance was doing */
function dropStance(h: Hunt) {
  const m = h.mon;
  m.air = false; m.airLeft = 0; m.under = false; m.plating = 0; m.molten = 0;
  m.nextStance = pickNext(h); m.stanceStep = 99;
  h.intent = 'shift';
}

export const sovereign: MonsterDef = {
  id: 'sovereign',
  name: 'The Wanderer Sovereign',
  short: 'Sovereign',
  panelName: 'The Sovereign',
  kind: 'Apex devourer',
  elem: 'Stone',
  elemOf(h) { const s = h.mon.stance; return s && s !== 'bare' ? STANCE_ELEM[s] : 'Stone'; },
  elemental: ['Sovereign Charge', 'Wing Dive', 'Caldera Eruption', 'Glacier Sweep'],
  weak: 'Gale',
  resist: 'Ember',
  flier: true,
  burrower: true,
  hp: 1170,
  tier: 4,
  promotion: 'C', // the D → C promotion: finishing Low Rank (Nov 2026)
  requires: ['monolith', 'stormroc', 'slagwyrm', 'gorhydra'],
  head: 'tusks',
  common: 'sovgel',
  rarePart: 'tusks',
  rare: 'sovheart',
  habits: 'A vast slime wearing parts of the monsters it swallowed. It fights in four stances (Stone, Gale, Ember, Frost), each using one of those parts and fighting like that monster, and it shifts into a new one at random, a turn after it warns you. Its weakness changes with the stance. Tear a part out and that stance is gone for good.',
  enragedHabit: 'Each change of stance becomes a Lurching Shift that crashes into you as it changes.',
  intro: 'The ground sags. Something enormous slides over the crater rim, tusks and wings and tail bobbing in its body like driftwood.',
  enrageText: 'It heaves and quickens. The Sovereign wakes!',
  parts: [
    { id: 'tusks', name: 'Tusks', eff: { Cut: 0.5, Blunt: 0.5, Pierce: 1 }, hint: '**Stone** stance part. Breaking it ends that stance for good', mat: 'sovtusk', hp: 340, brk: 'You tear the swallowed tusks out of it! No more Stone stance.' },
    { id: 'wings', name: 'Wings', eff: { Cut: 0.5, Blunt: 1, Pierce: 0 }, hint: '**Gale** stance part, on the ground only. Breaking it ends that stance for good', mat: 'sovwing', hp: 340, brk: 'The wings rip free of the slime! No more Gale stance.' },
    { id: 'vents', name: 'Vents', eff: { Cut: 1, Blunt: 0, Pierce: 0.5 }, hint: '**Ember** stance part, on the surface only. Breaking it ends that stance for good', mat: 'sovvent', hp: 340, brk: 'You cut the vents out of its back! No more Ember stance.' },
    { id: 'tail', name: 'Tail', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: '**Frost** stance part. Breaking it ends that stance for good', mat: 'sovtail', hp: 340, brk: 'The frozen tail shatters off! No more Frost stance.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, k = enr ? 1.15 : 1, d = (n: number) => Math.round(n * k);
    const into = m.nextStance ? NAME[m.nextStance] : '';
    switch (type) {
      // enraged (Nov 2026): its stance change turned up: it crashes into you as it changes shape
      case 'shift': if (enr && m.nextStance !== 'bare') return { name: `Lurching Shift to ${into}`, text: 'It heaves into its new shape and crashes into you as it changes.', dmg: d(30), threat: 2, isNew: !m.newSeen, note: `Block it. After your turn: ${into} stance, weak to ${({ stone: 'Gale', gale: 'Frost', ember: 'Stone', frost: 'Ember', bare: '' } as const)[m.nextStance!]}` };
        return { name: `Shifting to ${into}`, text: m.nextStance === 'bare' ? 'It churns, but nothing it swallowed answers any more.' : 'It churns as a new shape rises through it.', dmg: d(24), threat: 1, note: m.nextStance === 'bare' ? 'After your turn it fights with what is left' : `After your turn: ${into} stance, weak to ${({ stone: 'Gale', gale: 'Frost', ember: 'Stone', frost: 'Ember', bare: '' } as const)[m.nextStance!]}` };
      case 'slam': return { name: 'Body Slam', text: 'It rears up and falls on you.', dmg: d(34), threat: 2 };
      case 'windup': return { name: 'Lowering its tusks', text: 'Rock crusts over it as the tusks swing forward.', dmg: 0, threat: 0, note: 'Charges next turn' };
      case 'charge': return { name: 'Sovereign Charge', text: 'The whole mass comes at you behind the tusks!', dmg: d(90), threat: 4 };
      case 'takeoff': return { name: 'Spreading its wings', text: 'The swallowed wings unfold from its back and beat.', dmg: 0, threat: 0, note: 'After your turn it’s airborne. **Pierce** only then' };
      case 'gust': return { name: 'Downdraft', text: 'It beats a gale down on you.', dmg: d(37), threat: 2, halfGuard: true, note: 'Your **Block** is ½' };
      case 'dive': return { name: 'Wing Dive', text: 'It folds the wings and drops!', dmg: d(83), threat: 4, note: 'Then it lands' };
      case 'burrow': return { name: 'Sinking', text: 'It melts down into the crater floor.', dmg: 0, threat: 0, note: 'After your turn it’s underground. **Blunt** only then' };
      case 'erupt': return { name: 'Caldera Eruption', text: 'The ground glows and swells under you!', dmg: d(83), threat: 4, note: 'A 2-dice **Blunt** move drives it up and stops it' };
      case 'swipe': return { name: 'Molten Lash', text: 'It lashes out, dripping fire.', dmg: d(35), threat: 2 };
      case 'coat': return { name: 'Freezing over', text: 'Frost runs along its tail and across its back.', dmg: 0, threat: 0, note: 'After your turn it has 2 layers of ice' };
      case 'sweep': return { name: 'Glacier Sweep', text: 'The frozen tail swings round, low and wide!', dmg: d(77), threat: 4 };
      case 'bite': return { name: 'Engulf', text: 'It surges forward and tries to swallow you.', dmg: d(34), threat: 2 };
      case 'crush': return { name: 'Crushing Weight', text: 'It rolls over you, all of it.', dmg: d(64), threat: 3 };
      case 'pinned': return { name: 'Pinned', text: 'An arrow pins its front. The charge spills apart.', dmg: 0, threat: 0, note: 'Its charge is stopped. It loses its turn' };
      case 'crashed': return { name: 'Brought down', text: 'It splatters to the ground.', dmg: 0, threat: 0, note: 'On the ground. It loses its turn' };
      case 'unearthed': return { name: 'Driven up', text: 'It bursts out of the ground, quivering.', dmg: 0, threat: 0, note: '**Eruption** stopped. It loses its turn' };
      case 'dazed': return { name: 'Dazed', text: 'Its whole body wobbles, eyes rolling.', dmg: 0, threat: 0, note: 'It loses its turn' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon;
    if (prev === 'shift' || !m.stance) { m.stance = (prev === 'shift' ? m.nextStance : pickNext(h)) ?? 'bare'; m.nextStance = undefined; m.stanceStep = 0; }
    // its stance part broke: it drops out (dropStance set up the shift)
    if (m.stance !== 'bare' && m.parts[STANCE_PART[m.stance as Stance]].broken && prev !== 'shift') { m.nextStance = pickNext(h); m.stanceStep = 99; return 'shift'; }
    const steps = (m.enraged ? STEPS2 : STEPS)[m.stance!];
    const i = m.stanceStep ?? 0;
    if (i >= steps.length) {
      m.nextStance = pickNext(h);
      // nothing left to shift into but the stance it's in: stay in it
      if (m.nextStance === m.stance) { m.stanceStep = 1; return steps[0]; }
      return 'shift';
    }
    m.stanceStep = i + 1;
    return steps[i];
  },

  resolve(h, type) {
    const m = h.mon;
    // a cancelled action takes what it was building to with it: no charge after a broken wind-up, no dive once it's
    // been brought down, no eruption once it's been driven up
    const steps = (m.enraged ? STEPS2 : STEPS)[m.stance ?? 'bare'];
    const skip = (names: string[]) => { while ((m.stanceStep ?? 0) < steps.length && names.includes(steps[m.stanceStep ?? 0])) m.stanceStep = (m.stanceStep ?? 0) + 1; };
    if (type === 'dazed' || type === 'pinned') skip(['charge']);
    // Nov 2026 bug hunt: a daze that replaced the dive left it in the air for the rest of the hunt, through other
    // stances; a daze that replaced the burrow still led to an eruption from the surface (which nothing could cancel)
    const fell = type === 'dazed' && m.air;
    if (fell) { m.air = false; m.airLeft = 0; skip(['gust', 'dive']); }
    if (type === 'dazed' && !m.under) skip(['erupt']);
    if (type === 'crashed') skip(['gust', 'dive']);
    if (type === 'unearthed') skip(['erupt']);
    switch (type) {
      // a new stance starts clean: what the old one was doing (flying, burrowing, ice) ends with it
      case 'shift': if (m.enraged) m.newSeen = true; m.air = false; m.airLeft = 0; m.under = false; m.plating = 0; return `It shifts into its ${NAME[m.nextStance ?? 'bare']} stance.`;
      case 'windup': return 'It braces to charge.';
      case 'takeoff': m.air = true; m.airLeft = 2; return 'It lifts into the air!';
      case 'dive': m.air = false; m.airLeft = 0; return 'It lands with a wet crash.';
      case 'burrow': m.under = true; return 'It’s underground.';
      case 'erupt': m.under = false; m.molten = MOLTEN_SOV + 1; return 'It surges up, molten.';
      case 'coat': m.plating = 2; return 'Ice plating: 2 layers.';
      case 'pinned': return 'It pulls itself back together.';
      case 'crashed': return 'It gathers itself up off the ground.';
      case 'unearthed': return 'It shakes the grit off.';
      case 'dazed': return fell ? 'Dazed, it drops out of the air and lands hard.' : 'It firms up again, slowly.';
    }
    return null;
  },

  onBreak(h, partId) {
    const m = h.mon, s = STANCES.find(x => STANCE_PART[x] === partId);
    if (!s) return null;
    if (m.stance === s && h.intent !== 'shift') {
      (h.feats ??= []).includes('unstance') || h.feats.push('unstance');
      dropStance(h);
      return `It drops out of its ${NAME[s]} stance!`;
    }
    if (m.nextStance === s) { m.nextStance = pickNext(h); return `It can’t take the ${NAME[s]} stance now: it shifts to ${NAME[m.nextStance]} instead.`; }
    return null;
  },

  canHit(h, w) { return h.mon.air ? w.type === 'Pierce' : h.mon.under ? w.type === 'Blunt' : true; },
  cantHitReason(h) { return h.mon.air ? 'It’s airborne. **Pierce** only.' : 'It’s underground. **Blunt** only.'; },
  reachable(h, partId, w) {
    if (partId === 'wings' && h.mon.air) return w.type === 'Pierce';
    return true;
  },
  hitMod(h) { return h.mon.under ? { mult: 0.5, note: 'through the ground ½' } : null; },
  onHit(h, mv, w) {
    if (h.mon.under && w.type === 'Blunt' && mv.need.length >= 2) { h.mon.under = false; h.intent = 'unearthed'; return 'The blow shakes the ground. It bursts up, quivering!'; }
    return null;
  },
  burn(h, w) { return h.mon.molten > 0 && w.type !== 'Pierce' ? (h.mon.enraged ? 10 : 8) : 0; },
  onPin(h) {
    const m = h.mon;
    if (m.air) { m.air = false; m.airLeft = 0; h.intent = 'crashed'; return 'Pin: the arrow tears through a wing. It comes down!'; }
    if (h.intent === 'windup') { h.intent = 'pinned'; return 'Pin: the arrow pins its front. The charge is cancelled!'; }
    return null;
  },

  meter(h) {
    const m = h.mon, s = m.stance ?? 'bare';
    const steps = (m.enraged ? STEPS2 : STEPS)[s];
    const left = Math.max(0, steps.length - Math.min(steps.length, m.stanceStep ?? 0));
    const tone = ({ stone: 'stone', gale: 'gale', ember: 'ember', frost: 'ice', bare: 'gold' } as const)[s];
    return { label: `${NAME[s]} stance`, value: left, max: steps.length, tone, pips: true, note: h.intent === 'shift' ? `to ${NAME[m.nextStance ?? 'bare']}` : `${left} left` };
  },

  tip(h, type) {
    const m = h.mon;
    if (m.air && carries(h, 'Pierce')) return '**Pinning Shot** brings it down.';
    if (type === 'windup' && carries(h, 'Pierce')) return '**Pinning Shot** now stops the charge.';
    if (type === 'charge' && carries(h, 'Blunt') && m.daze >= m.dazeMax * 0.6) return `${dazeTag} A full **Daze** meter now stops this charge.`;
    return null;
  },

  canCapture(h) { return !h.mon.air && !h.mon.under; }
};
