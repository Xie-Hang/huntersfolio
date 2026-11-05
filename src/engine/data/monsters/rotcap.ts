// The Rotcap — Infect, Stone. The Gloamhollow (caves under the Mirewood, Nov 2026). The Pierce check.
// A squat cave beast under a fungus cap the size of a cart. Its spores infect you: a few HP lost every turn.
// Pattern: Slam → Spore Puff (infects you 3 turns) → Bloom (the cap swells, 2 turns) → Spore Burst (a big hit that
//   gets through half your guard and infects you 4 turns) → Wilting (a free turn).
//   A 2-dice Pierce hit on the swollen cap pops it: the Burst never comes. Breaking the cap ends the Blooms.
// Parts: Cap (Pierce; no more Bloom), Jaw (Blunt; the daze part), Root Legs (Cut; weaker Slam).
import type { Hunt, Intent, MonsterDef, Move, WeaponInst } from '../../types';
import { infectPlayer } from '../../status';

export const BLOOM_TURNS = 2, ROT_BLOOM_HEAL = 25;
const RIDGE = ['gorehorn', 'galeshrike', 'cinderback', 'rimetail'];

/** a Pierce hit of 2+ dice on the swollen cap pops it (shared with nothing: the Blightcrown's cap is crusted) */
export function popCap(h: Hunt, mv: Move, w: WeaponInst): string | null {
  const swollen = h.intent === 'bloom' || h.intent === 'burst';
  if (!swollen || w.type !== 'Pierce' || mv.need.length < 2 || h.target !== 'cap') return null;
  h.mon.bloom = 0; h.intent = 'popped'; (h.feats ??= []).includes('popped') || h.feats.push('popped');
  return 'The arrow bursts the swollen cap! The spores puff out harmlessly.';
}

export const rotcap: MonsterDef = {
  id: 'rotcap',
  inflicts: 'Infect',
  name: 'The Rotcap',
  short: 'Rotcap',
  kind: 'Spore beast',
  elem: 'Stone',
  elemental: ['Spore Burst'],
  weak: 'Gale',
  resist: 'Ember',
  hp: 560,
  tier: 2.2,
  requires: RIDGE,
  head: 'jaw',
  common: 'rotspore',
  rarePart: 'cap',
  rare: 'sporeheart',
  habits: 'A squat cave beast under a fungus cap the size of a cart. Its spores infect you: a few HP every turn until it clears or you cure it. Every few turns the cap swells, then bursts. A solid arrow into the swollen cap pops it first.',
  intro: 'The cave smells of wet earth and rot. Something heaves itself up out of the dark under a great pale cap.',
  enrageText: 'Its cap darkens and weeps spores. The Rotcap is enraged!',
  parts: [
    { id: 'cap', name: 'Cap', eff: { Cut: 0.25, Blunt: 0, Pierce: 1 }, hint: 'Pop it while it swells. Break it to stop the Bloom', mat: 'capflesh', hp: 240, brk: 'The cap tears open and slumps. It can’t bloom any more.' },
    { id: 'jaw', name: 'Jaw', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'The daze part', mat: 'rotjaw', hp: 260, brk: 'Its jaw cracks and hangs loose.' },
    { id: 'legs', name: 'Root Legs', eff: { Cut: 1, Blunt: 0.5, Pierce: 0 }, hint: 'Break to weaken the Slam', mat: 'rootleg', hp: 200, brk: 'You hack through its root legs. It can’t throw its weight now.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, lb = m.parts.legs.broken, b = m.bloom ?? 0;
    switch (type) {
      case 'slam': return { name: 'Cap Slam', text: 'It rears up and brings the whole cap down on you.', dmg: Math.round((enr ? 30 : 24) * (lb ? 0.7 : 1)), threat: 1 };
      case 'puff': return { name: 'Spore Puff', text: 'It shudders, and a cloud of spores rolls out from under the cap.', dmg: enr ? 18 : 14, threat: 1, note: 'If it hits, you’re infected for 3 turns' };
      case 'bloom': return { name: 'Bloom', text: 'The cap swells and splits along its gills.', dmg: 0, threat: 0, note: `It heals ${ROT_BLOOM_HEAL}, then bursts${b + 1 < BLOOM_TURNS ? ' after next turn' : ' next turn'}. A 2-dice Pierce hit on the cap pops it` };
      case 'burst': return { name: 'Spore Burst', text: 'The cap is fit to burst!', dmg: enr ? 82 : 72, threat: enr ? 4 : 3, halfGuard: true, note: 'Half your guard, then infected 4 turns. A 2-dice Pierce hit on the cap pops it' };
      case 'wilt': return { name: 'Wilting', text: 'The cap sags, emptied.', dmg: 0, threat: 0, note: 'A free turn to attack' };
      case 'popped': return { name: 'Popped', text: 'Spores drift out of the burst cap. It reels.', dmg: 0, threat: 0, note: 'Its action is lost' };
      case 'dazed': return { name: 'Dazed', text: 'It sways, its cap lolling.', dmg: 0, threat: 0, note: 'Its action is lost' };
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
      case 'puff': return landed ? infectPlayer(h, 3, m.enraged ? 10 : 8) : null;
      case 'bloom': { m.bloom = (m.bloom ?? 0) + 1; const heal = Math.min(ROT_BLOOM_HEAL, m.max - m.hp); m.hp += heal; return heal ? `The swelling cap feeds it: +${heal}.` : null; }
      case 'burst': m.bloom = 0; return landed ? infectPlayer(h, 4, m.enraged ? 14 : 12) : null;
      case 'wilt': return 'It straightens, slowly.';
      case 'popped': return 'It shakes the last spores loose.';
      case 'dazed': m.bloom = 0; return 'It shakes itself. The swelling has gone down.';
    }
    return null;
  },

  onHit(h, mv, w) { return popCap(h, mv, w); },
  // the swollen cap is the part to hit right now: the parts row flags it (partNote) and the sim aims there
  priority(h, w) { return (h.intent === 'bloom' || h.intent === 'burst') && w.type === 'Pierce' && !h.mon.parts.cap.broken ? 'cap' : null; },

  onBreak(h, partId) {
    if (partId === 'cap' && (h.intent === 'bloom' || h.intent === 'burst')) { h.mon.bloom = 0; h.intent = 'popped'; return 'The bloom collapses with it.'; }
    return null;
  },

  badges(h) {
    const m = h.mon;
    return (m.bloom ?? 0) > 0 || h.intent === 'burst' ? [{ key: 'bloom', label: 'Swollen', short: 'pop it', cls: 'stone', desc: 'Its cap is swelling to burst. A 2-dice Pierce hit on the cap pops it, and the Spore Burst never comes.' }] : [];
  },

  partNote(h, partId) {
    return partId === 'cap' && !h.mon.parts.cap.broken && (h.intent === 'bloom' || h.intent === 'burst') ? { chip: 'Swollen', hint: 'A 2-dice Pierce hit here pops it before it bursts.' } : null;
  },
  // no tip: the Bloom's telegraph already says how to pop it, and the cap is flagged on the parts row
  tip() { return null; }
};
