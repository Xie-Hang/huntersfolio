// The Stormcrown Roc — T3 Gale sky tyrant of the Stormspire. The Pierce check: the Galeshrike, grown up.
// It flies (in the air only Pierce reaches it) and lands after each Stoop Dive.
// A storm builds in its crown: one pip a turn, and at three it casts Thunderhead. A Pierce hit on the Crown drains
// a pip, and one landed while Thunderhead is telegraphed snuffs it out.
// Phase 2 at half HP: it never lands again (a net or Pinning Shot grounds it for one turn), so melee deals half
// in the air, except the turn after each swooping Rake (it's low) and the turn it lands to recover after a Thunderhead.
// Tuned by simulation (5 Nov 2026, casual, Mirewood gear +2, armor that doesn't resist it): with a Pierce weapon 83%,
// without 23% (the hardest wall in the game for melee, by design); skilled 100% either way.
// Parts: Wings (Pierce; breaking them in phase 2 forces one landing), Crown (Pierce; the daze part; drains the
// storm; rare Stormheart), Talons (Cut; weaker Rake and Dive).
import type { Hunt, Intent, MonsterDef } from '../../types';
import { choose, remember } from '../../behaviour';
import { carries, carryingName } from '../../util';

export const STORM_MAX = 3;
const AIR_TURNS = 2;

function ground(h: Hunt) { h.mon.air = false; h.mon.airLeft = 0; h.intent = 'crashed'; }

export const stormroc: MonsterDef = {
  id: 'stormroc',
  name: 'The Stormcrown Roc',
  short: 'Stormcrown Roc',
  flier: true,
  kind: 'Sky tyrant',
  elem: 'Gale',
  // its elemental attacks: only these are reduced by armor that resists Gale; the rest are physical
  elemental: ['Thunderhead'],
  weak: 'Frost',
  resist: 'Stone',
  hp: 800,
  tier: 3,
  requires: ['fenmother'], // rank D: the Fenmother promotion opens the Stormspire (Nov 2026)
  head: 'crown',
  common: 'rocplume',
  rarePart: 'crown',
  rare: 'stormheart',
  habits: 'A storm bird the size of a barn. It fights from the air and lands only after a dive. Lightning gathers in its crown every turn until it breaks as a Thunderhead; arrows into the crown bleed the storm away. Hurt badly, it takes to the sky for good.',
  enragedHabit: 'Once, it can’t hold the storm in: halfway to a Thunderhead, its crown flashes early as a Crown Flash.',
  intro: 'The clouds over the spire start to turn. Something in them is turning too, and it has a crown of lightning.',
  enrageText: 'Thunder rolls without a flash. The Stormcrown Roc is enraged!',
  parts: [
    { id: 'wings', name: 'Wings', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Breaking them makes it land once more', mat: 'rocpinion', hp: 220, brk: 'A wing tears from root to tip!' },
    { id: 'crown', name: 'Storm Crown', eff: { Cut: 0, Blunt: 0.5, Pierce: 1 }, hint: '**Pierce** hits drain its storm. **Cut** and **Blunt** reach it on the ground only', mat: 'stormcrown', hp: 200, brk: 'The crown shatters in a shower of sparks. Its storm builds slower now.' },
    { id: 'talons', name: 'Talons', eff: { Cut: 1, Blunt: 0.5, Pierce: 0.5 }, hint: 'Breaking them weakens its rake and dive', mat: 'roctalon', hp: 240, brk: 'Its talons crack. Its strikes lose their bite.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, tb = m.parts.talons.broken, half = (m.screech ?? 0) > 0;
    const rod = !!h.arm.rod;
    switch (type) {
      case 'rake': return { name: m.air ? 'Swooping Rake' : 'Talon Rake', text: m.air ? 'It swoops low, talons first.' : 'It lunges with its talons.', dmg: tb ? 20 : enr ? 32 : 26, threat: 2, halfGuard: half };
      case 'buffet': return { name: 'Gale Buffet', text: 'It drives a wall of wind at you.', dmg: enr ? 22 : 18, threat: 1, halfGuard: half, note: 'Your **Block** is ½ next turn' };
      case 'takeoff': return { name: 'Taking off', text: 'It spreads its wings and rises into the storm.', dmg: 0, threat: 0, note: 'After your turn it’s airborne. **Pierce** only then' };
      case 'dive': return { name: 'Stoop Dive', text: 'It folds its wings and falls on you like a thunderbolt!', dmg: tb ? 40 : enr ? 60 : 52, threat: 3, halfGuard: half, note: 'Then it lands for a turn' };
      case 'perched': return { name: 'Landed', text: 'It lands hard, spent, and shakes the rain from its wings.', dmg: 0, threat: 0, note: 'On the ground for a turn. Every weapon reaches the crown' };
      case 'thunder': { const d = enr ? 78 : 70; return { name: 'Thunderhead', text: 'Its crown blazes white. Lightning is coming down!', dmg: rod ? Math.round(d / 2) : d, threat: 4, halfGuard: half, steady: true, note: carries(h, 'Pierce') ? 'A **Pierce** hit on the crown stops it' : undefined }; }
      // enraged (Nov 2026): it can't hold the storm in; its crown flashes early, smaller, and the storm starts over
      case 'flash': { const d = enr ? 38 : 34; return { name: 'Crown Flash', text: 'Its crown flares too soon. Lightning forks down at you!', dmg: rod ? Math.round(d / 2) : d, threat: 3, halfGuard: half, isNew: !m.newSeen, note: carries(h, 'Pierce') ? 'An early **Thunderhead**. A **Pierce** hit on the crown stops it' : 'An early **Thunderhead**. It empties the storm' }; }
      case 'gutter': return { name: 'Storm snuffed', text: 'The light in its crown gutters and goes out.', dmg: 0, threat: 0, note: '**Thunderhead** stopped' };
      case 'crashed': return { name: 'Brought down', text: 'It crashes into the rocks in a tangle of wings.', dmg: 0, threat: 0, note: 'On the ground for a turn. It loses its turn' };
      case 'dazed': return { name: 'Dazed', text: 'It reels, its crown flickering.', dmg: 0, threat: 0, note: 'It loses its turn' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon;
    if (m.screech) m.screech--;
    if ((m.storm ?? 0) >= STORM_MAX && prev !== 'thunder') return remember(h, 'thunder');
    // enraged: halfway to a Thunderhead, it may flash early (once per storm)
    if (m.enraged && (m.storm ?? 0) >= 2 && prev !== 'flash' && prev !== 'thunder' && !m.extra?.flashed) { (m.extra ??= {}).flashed = 1; return remember(h, 'flash'); }
    // it lands after a dive, and after every Thunderhead it has to land to recover (melee's window)
    if (prev === 'dive' || prev === 'thunder' || prev === 'flash') { m.air = false; m.airLeft = 0; return remember(h, 'perched'); }
    if (prev === null) return remember(h, 'rake');
    if (m.skyLock) return remember(h, choose(h, [['rake', 3], ['buffet', 2]], a => this.intent(h, a).threat));
    if (m.air) {
      if (m.airLeft > 1) { m.airLeft--; return remember(h, choose(h, [['rake', 3], ['buffet', 2]], a => this.intent(h, a).threat)); }
      return remember(h, 'dive');
    }
    const since = h.turn - (m.lastChain ?? 0);
    const pick = choose(h, [['rake', 3], ['buffet', 2], ['takeoff', since >= 2 ? 6 : 0]], a => this.intent(h, a).threat);
    if (pick === 'takeoff') m.lastChain = h.turn;
    return remember(h, pick);
  },

  resolve(h, type) {
    const m = h.mon, lines: string[] = [];
    // phase 2: a swoop leaves it low for one of your turns; it climbs again on its next action
    if (m.skyLock && !m.air && type !== 'crashed' && type !== 'perched') m.air = true;
    if (type === 'thunder' || type === 'flash') { m.storm = 0; m.stormFull = false; if (type === 'flash') m.newSeen = true; } // (one Crown Flash a hunt)
    else if (type !== 'dazed' && type !== 'gutter' && type !== 'crashed') {
      // the storm builds every turn; a broken crown builds it every other turn
      m.stormTick = (m.stormTick ?? 0) + 1;
      if (!m.parts.crown.broken || m.stormTick % 2 === 0) m.storm = Math.min(STORM_MAX, (m.storm ?? 0) + 1);
      if (m.storm === STORM_MAX) { m.stormFull = true; lines.push('Its crown is crackling white. A Thunderhead is coming.'); }
    }
    switch (type) {
      case 'takeoff': m.air = true; m.airLeft = AIR_TURNS; lines.push('It’s airborne!'); break;
      case 'dive': m.air = false; m.airLeft = 0; break;
      case 'buffet': m.screech = 2; break;
      case 'rake': if (m.skyLock) { m.air = false; lines.push('It’s low after the swoop: every weapon reaches it this turn.'); } break;
      case 'crashed': if (m.skyLock) { m.air = true; lines.push('It beats its way back into the sky.'); } else lines.push('It scrambles back up.'); break;
      case 'perched': if (m.skyLock) { m.air = true; lines.push('It beats back up into the storm.'); } else lines.push('It gathers itself.'); break;
      case 'dazed': lines.push('It shakes off the daze.'); break;
    }
    return lines.join(' ') || null;
  },

  onHit(h, _mv, w) {
    const m = h.mon;
    if (h.target !== 'crown' || w.type !== 'Pierce' || !(m.storm ?? 0)) return null;
    m.storm!--;
    if (m.storm === 0 && m.stormFull) { m.stormFull = false; if (!(h.feats ??= []).includes('stormdrain')) h.feats.push('stormdrain'); }
    if (h.intent === 'thunder' || h.intent === 'flash') { h.intent = 'gutter'; return 'The arrow grounds the storm. Its Thunderhead fizzles out!'; }
    return `The arrow bleeds the storm from its crown (${m.storm} / ${STORM_MAX}).`;
  },

  onBreak(h, partId) {
    if (partId !== 'wings' || !h.mon.skyLock || !h.mon.air) return null;
    ground(h);
    return 'With one wing torn it spirals down into the rocks!';
  },

  onPhase(h) {
    const m = h.mon;
    m.skyLock = true;
    if (!m.air) { m.air = true; m.airLeft = 0; }
    return 'It climbs into the storm and won’t land again. Only Pierce reaches it while it’s up; hit it with anything when it swoops low.';
  },

  // In the air only Pierce reaches it (playtest, Nov 2026: a tester asked how a sword hits a bird in the sky;
  // it used to be half damage). Down on the ground, or low after a swoop, every weapon works.
  canHit(h, w) { return !h.mon.air || w.type === 'Pierce'; },
  cantHitReason() { return 'It’s airborne. **Pierce** only.'; },

  reachable(h, partId, w) {
    return !(partId === 'crown' && h.mon.air && w.type !== 'Pierce');
  },

  onPin(h) {
    if (h.mon.air) { ground(h); return 'Pin: the arrow punches through a wing. It comes crashing down!'; }
    return null;
  },

  meter(h) {
    const s = h.mon.storm ?? 0;
    return { label: 'Storm in its crown', value: s, max: STORM_MAX, tone: 'gale', pips: true, note: s >= STORM_MAX ? 'Thunderhead!' : `${s} / ${STORM_MAX}` };
  },

  tip(h, type) {
    const m = h.mon;
    if (type === 'thunder') return carries(h, 'Pierce') ? `Your ${carryingName(h, 'Pierce')} on its crown stops the **Thunderhead**.` : 'A **Thunderhead** is coming.';
    if (m.air && !carries(h, 'Pierce')) return h.item === 'net' && h.itemCharges > 0 ? 'A **Weighted Net** brings it down.' : 'It’s airborne. **Pierce** only. Every weapon reaches it when it swoops low or lands.';
    if (m.air && (m.storm ?? 0) > 0) return `**Pierce** hits on its crown drain the storm. Your ${carryingName(h, 'Pierce')} reaches it.`;
    if (type === 'perched') return 'It’s on the ground. Every weapon reaches the crown this turn.';
    return null;
  },

  canCapture(h) { return !h.mon.air; }
};
