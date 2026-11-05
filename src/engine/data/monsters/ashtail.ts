// The Ashtail — an Ember Rimetail, one of the four changed Ashfall Ridge monsters (variants, Nov 2026).
// The Rimetail taught "Cut clears its ice"; the Ashtail's plating is glowing cinder scales: a Cut hit only clears
// one layer and burns you, while Pierce finds the gaps and clears two. The Pierce check.
// Pattern: Flare Pounce → Flare Pounce → Cinder Sweep → Kindle, repeating. It starts the hunt already scaled.
//   Cinder scales (2 layers; 1 once the Ember Mantle breaks): every hit breaks scales instead of dealing damage.
//   Pierce clears 2, Cut and Blunt 1. While any scale stands, a Cut hit burns you (burnproof armor stops it).
//   A Frost weapon hit clears every layer at once (quench), though it resists Frost damage. A Firepot does nothing.
// Parts: Tail (Cut; no Cinder Sweep), Ember Mantle (Blunt; thinner scales; rare Ashheart), Jaw (Pierce; daze part).
import type { Intent, MonsterDef } from '../../types';
import { carries, carryingName } from '../../util';

export const ASH_LAYERS = 2, ASH_LAYERS_BROKEN = 1;
const layers = (h: { mon: { parts: Record<string, { broken: boolean }> } }) => (h.mon.parts.mantle.broken ? ASH_LAYERS_BROKEN : ASH_LAYERS);
const scorch = (enraged: boolean) => (enraged ? 10 : 8);

export const ashtail: MonsterDef = {
  id: 'ashtail',
  variantOf: 'rimetail',
  name: 'The Ashtail',
  short: 'Ashtail',
  plated: ASH_LAYERS,
  plateWord: 'scale',
  plateHot: true,
  plateBreak(w) { return w.elem === 'Frost' ? 9 : w.type === 'Pierce' ? 2 : 1; },
  kind: 'Cinder stalker',
  elem: 'Ember',
  elemental: ['Cinder Sweep'],
  weak: 'Stone',
  resist: 'Frost',
  hp: 580,
  tier: 2.5,
  requires: ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass'],
  head: 'jaw',
  common: 'ashscale',
  rarePart: 'mantle',
  rare: 'ashheart',
  habits: 'Wears glowing cinder scales across its back. Every hit breaks scales before it can do damage: Pierce clears two layers, anything else one, and a Cut through hot scales burns you. A Frost hit quenches them all at once. It rekindles them every few turns.',
  intro: 'Ash drifts up instead of down. The Ashtail slinks out of a smoking crack, its back glowing like coals.',
  enrageText: 'Its scales flare white. The Ashtail is enraged!',
  parts: [
    { id: 'tail', name: 'Tail', eff: { Cut: 1, Blunt: 0, Pierce: 0.5 }, hint: 'Sever it to stop the Cinder Sweep', mat: 'emberbarb', hp: 250, brk: 'The tail parts in a shower of sparks. It thrashes the stump.' },
    { id: 'mantle', name: 'Ember Mantle', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'Break it and its scales grow back thinner', mat: 'ashmantle', hp: 270, brk: 'The ember mantle cracks and dims! Its scales will grow back thin.' },
    { id: 'jaw', name: 'Jaw', eff: { Cut: 0.5, Blunt: 0.5, Pierce: 1 }, hint: 'Break to weaken its Flare Pounce', mat: 'ashfang', hp: 205, brk: 'A glowing fang snaps off. Its bite loses its heat.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, jb = m.parts.jaw.broken, tb = m.parts.tail.broken;
    switch (type) {
      case 'pounce': return { name: 'Flare Pounce', text: jb ? 'It crouches low, its broken jaw smoking.' : 'It crouches low in the ash, haunches twitching.', dmg: jb ? (enr ? 23 : 19) : (enr ? 34 : 27), threat: enr ? 2 : 1 };
      case 'sweep': return tb
        ? { name: 'Stump Swipe', text: 'It swings round, lashing out with the stump of its tail.', dmg: enr ? 34 : 27, threat: 1 }
        : { name: 'Cinder Sweep', text: 'It coils its glowing tail behind it, low to the ground.', dmg: enr ? 69 : 59, threat: enr ? 4 : 3, note: 'Sever the tail to stop this' };
      case 'kindle': return { name: 'Kindle', text: 'It goes still. Its back glows brighter as new scales flare up.', dmg: 0, threat: 0, note: `Regrows ${layers(h)} layers of cinder scales` };
      case 'dazed': return { name: 'Dazed', text: 'It reels, eyes unfocused, swaying on its feet.', dmg: 0, threat: 0, note: 'Its action is lost' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h) {
    const m = h.mon;
    const t = ['pounce', 'pounce', 'sweep', 'kindle'][m.seq % 4]; m.seq++; return t;
  },

  resolve(h, type) {
    const m = h.mon;
    switch (type) {
      case 'kindle': m.plating = layers(h); return `The scales flare back: ${m.plating} layers.`;
      case 'dazed': return 'It shakes its head, slowly coming back to its senses.';
    }
    return null;
  },

  // a Cut through hot scales burns the hand that holds the blade
  burn(h, w) { return h.mon.plating > 0 && w.type === 'Cut' ? scorch(h.mon.enraged) : 0; },

  badges(h) {
    const m = h.mon;
    return m.plating > 0 ? [{ key: 'scales', label: `Scales ×${m.plating}`, short: 'hits break scales, not HP', cls: 'hot', desc: `Each hit breaks cinder scales instead of dealing damage, and uses up a charge or whetstone bonus. Pierce clears two layers, Cut and Blunt one, and a Cut hit burns you ${scorch(m.enraged)}. A Frost hit quenches them all. A Firepot does nothing.` }] : [];
  },

  tip(h, type) {
    const m = h.mon;
    if (m.plating > 0) {
      if (carries(h, 'Pierce')) return `Cinder scales: your ${carryingName(h, 'Pierce')} clears two layers a hit, without the burn.`;
      return `Cinder scales: hits break scales instead of dealing damage.${carries(h, 'Cut') ? ` A Cut hit burns you ${scorch(m.enraged)}.` : ''}`;
    }
    if (type === 'sweep' && !m.parts.tail.broken && carries(h, 'Cut')) return `Its scales are down: sever the tail with your ${carryingName(h, 'Cut')}.`;
    if (type === 'kindle') return 'It’s about to rekindle its scales. Hit hard now.';
    return null;
  }
};
