// The Cragwing — the rank F → E promotion hunt (Nov 2026, Mekkman's rank ladder). Gale; weak to Frost.
// An exam, not a new trick: it asks for everything Ashfall Ridge taught, one lesson at a time.
//   Winds up a Shale Charge like the Gorehorn (guard it).
//   Takes to the air like the Galeshrike: only Pierce reaches it; Pinning Shot or the Weighted Net bring it down.
//   Burrows into the scree like the Cinderback: only Blunt reaches it (half damage); a Blunt move of 2+ dice
//   drives it up dazed; Blast Powder too.
//   Wears slate plating like the Rimetail: 2 layers, a Cut hit clears both, anything else 1, a Firepot all of it.
//   Coming up out of the scree packs fresh slate onto its back (unless the Slate Back is broken).
// It never flies and burrows back to back, so there's always a turn to swap weapons.
// Pattern: Lash → Wind-up → Shale Charge → Take off → (Gust) → Talon Dive → Perched → Lash → Burrow → Rockburst, repeating.
// Parts: Wings (Pierce; it stays up 1 turn), Digging Horn (Blunt; the daze part; it can't burrow), Slate Back (Cut;
// no more plating). Rare Cragheart from the horn.
import type { Intent, MonsterDef } from '../../types';
import { carries, carryingName, dazeTag } from '../../util';

export const CRAG_LAYERS = 2;
const CYCLE = ['lash', 'windup', 'takeoff', 'lash', 'burrow'] as const;
const airTurns = (h: { mon: { parts: Record<string, { broken: boolean }> } }) => (h.mon.parts.wings.broken ? 1 : 2);

export const cragwing: MonsterDef = {
  id: 'cragwing',
  name: 'The Cragwing',
  short: 'Cragwing',
  flier: true,
  burrower: true,
  plated: CRAG_LAYERS,
  plateWord: 'slate',
  plateBreak: w => (w.type === 'Cut' ? 2 : 1),
  kind: 'Scree drake',
  elem: 'Gale',
  // its elemental attacks: only these are cut by armor that resists Gale; the rest are physical
  elemental: ['Gust Buffet', 'Talon Dive'],
  weak: 'Frost',
  resist: 'Stone',
  hp: 590,
  tier: 1.5,
  promotion: 'E',
  requires: ['gorehorn', 'galeshrike', 'cinderback', 'rimetail'],
  head: 'horn',
  common: 'cragslate',
  rarePart: 'horn',
  rare: 'cragheart',
  habits: 'The test of every Ashfall Ridge lesson. It winds up a charge, takes to the air (only bows reach it), burrows into the scree (only mauls reach it, and a heavy blow drives it up) and wears slate plating that a blade clears in one hit. It never flies and burrows back to back.',
  intro: 'Slate rattles down the scree. A drake with wings like split stone lands on the ridge and screams.',
  enrageText: 'The wind howls through its broken slates. The Cragwing is enraged!',
  parts: [
    { id: 'wings', name: 'Wings', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Break them and it stays up only 1 turn', mat: 'cragpinion', hp: 240, brk: 'A slate wing cracks across! It can’t stay up for long now.' },
    { id: 'horn', name: 'Digging Horn', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'The daze part. Break it and it can’t burrow', mat: 'craghorn', hp: 260, brk: 'The digging horn snaps! It can’t burrow any more.' },
    { id: 'back', name: 'Slate Back', eff: { Cut: 1, Blunt: 0.5, Pierce: 0 }, hint: 'Break it and its slate plating can’t grow back', mat: 'cragslab', hp: 220, brk: 'The slates on its back shear away. Its plating won’t grow back.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged;
    switch (type) {
      case 'lash': return { name: 'Tail Lash', text: 'It swings round, its tail scattering loose slate.', dmg: enr ? 34 : 28, threat: 1 };
      case 'windup': return { name: 'Winding up', text: 'It drops its horned head and scrapes the scree, gathering itself.', dmg: 0, threat: 0, note: 'Shale Charge next turn: guard for it' };
      case 'charge': return { name: 'Shale Charge', text: 'It hurls itself down the slope, horn first!', dmg: enr ? 84 : 70, threat: enr ? 4 : 3 };
      case 'takeoff': { const n = airTurns(h); return { name: 'Taking off', text: 'It spreads its stone wings and climbs into the ridge wind.', dmg: 0, threat: 0, note: `Still on the ground now. After your turn it's airborne for ${n} turn${n > 1 ? 's' : ''}: only bows reach it then` }; }
      case 'gust': return { name: 'Gust Buffet', text: 'It hangs in the wind and beats a gale down at you.', dmg: enr ? 38 : 30, threat: 1, halfGuard: true, note: 'Ignores half your guard. Dives next turn' };
      case 'dive': return { name: 'Talon Dive', text: 'It folds its wings and drops out of the sky, talons first!', dmg: enr ? 76 : 64, threat: enr ? 4 : 3, note: 'Then it sits perched for a turn' };
      case 'perched': return { name: 'Perched', text: 'It lands hard on a boulder, catching its breath.', dmg: 0, threat: 0, note: 'A free turn on the ground' };
      case 'burrow': return { name: 'Burrowing', text: 'It drives its horn into the scree and vanishes under the slate.', dmg: 0, threat: 0, note: 'Still on the surface now. After your turn it\'s underground: only Blunt reaches it' };
      case 'rockburst': return { name: 'Rockburst', text: 'The scree under you shifts and heaves. Something is coming up!', dmg: enr ? 74 : 62, threat: enr ? 4 : 3, note: m.parts.back.broken ? 'Drive it up with a heavy Blunt hit to cancel' : 'Drive it up to cancel. Coming up, it packs fresh slate onto its back' };
      case 'crashed': return { name: 'Brought down', text: 'It tumbles out of the air in a clatter of slate.', dmg: 0, threat: 0, note: 'Grounded. Its action is lost' };
      case 'unearthed': return { name: 'Driven up', text: 'It bursts out of the scree, dazed, shaking grit from its horn.', dmg: 0, threat: 0, note: 'Rockburst cancelled. Its action is lost' };
      case 'dazed': return { name: 'Dazed', text: 'It reels, wings drooping, swaying on the slope.', dmg: 0, threat: 0, note: 'Its action is lost' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon;
    if (m.under) return 'rockburst';
    if (prev === 'windup') return 'charge';
    if (prev === 'dive') return 'perched';
    if (m.air) { if (m.airLeft > 1) { m.airLeft--; return 'gust'; } return 'dive'; }
    let t: string = CYCLE[m.seq % CYCLE.length]; m.seq++;
    if (t === 'burrow' && m.parts.horn.broken) t = 'lash';
    return t;
  },

  resolve(h, type) {
    const m = h.mon;
    switch (type) {
      case 'takeoff': m.air = true; m.airLeft = airTurns(h); return 'It rides the wind. It’s airborne!';
      case 'dive': m.air = false; m.airLeft = 0; return null;
      case 'perched': return 'It shakes out its wings.';
      case 'burrow': m.under = true; return 'It’s under the scree.';
      case 'rockburst':
        m.under = false;
        if (!m.parts.back.broken && m.plating < CRAG_LAYERS) { m.plating = CRAG_LAYERS; return `It comes up packed with fresh slate: ${CRAG_LAYERS} layers.`; }
        return null;
      case 'crashed': return 'It scrambles back onto its feet.';
      case 'unearthed': return 'It shakes the grit from its horn.';
      case 'dazed': return 'It shakes its head, slowly coming back to its senses.';
    }
    return null;
  },

  // In the air only Pierce reaches it; under the scree only Blunt (for half damage)
  canHit(h, w) { return h.mon.air ? w.type === 'Pierce' : h.mon.under ? w.type === 'Blunt' : true; },
  cantHitReason(h) { return h.mon.air ? 'It’s in the air: only Pierce (a bow) reaches it. Swap to a bow, throw a Net, or guard for the dive.' : 'Under the scree: only Blunt reaches it.'; },
  hitMod(h) { return h.mon.under ? { mult: 0.5, note: 'through the scree ½' } : null; },
  onHit(h, mv, w) {
    if (h.mon.under && w.type === 'Blunt' && mv.need.length >= 2) { h.mon.under = false; h.intent = 'unearthed'; return 'The blow shakes the scree. It bursts up, stunned!'; }
    return null;
  },
  onPin(h) {
    if (h.mon.air) { h.mon.air = false; h.mon.airLeft = 0; h.intent = 'crashed'; return 'Pin: the arrow punches through a stone wing. It comes crashing down!'; }
    return null;
  },

  tip(h, type) {
    const m = h.mon;
    if (m.air) {
      if (carries(h, 'Pierce')) return `Only your ${carryingName(h, 'Pierce')} reaches it up there. Pinning Shot brings it down.`;
      if (h.item === 'net' && h.itemCharges > 0) return 'Throw the Weighted Net to bring it down.';
      return 'It’s airborne: only Pierce reaches it. Guard for the dive.';
    }
    if (m.under) {
      if (carries(h, 'Blunt')) return `${dazeTag} A Blunt move of 2+ dice drives it up and cancels the Rockburst (${carryingName(h, 'Blunt')}).`;
      if (h.item === 'blast' && h.itemCharges > 0) return 'Throw the Blast Powder to force it up.';
      return 'Only Blunt reaches it under the scree. Guard for the Rockburst.';
    }
    if (m.plating > 0) return carries(h, 'Cut') ? `Slate plating: your ${carryingName(h, 'Cut')} clears it in one hit.` : 'Slate plating: each hit breaks one layer before it does damage.';
    if (type === 'windup') return 'A Shale Charge is coming. Guard with your spare dice.';
    if (type === 'takeoff' && !carries(h, 'Pierce')) return 'It’s about to fly, and only bows reach it in the air.';
    if (type === 'burrow' && !carries(h, 'Blunt')) return 'It’s about to burrow, and only mauls reach it under the scree.';
    return null;
  },

  canCapture(h) { return !h.mon.air && !h.mon.under; }
};
