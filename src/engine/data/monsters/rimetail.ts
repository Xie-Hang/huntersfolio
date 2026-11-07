// The Rimetail — T1 Frost ambush stalker. The Cut check.
// Pattern: Pounce → Pounce → Tail Sweep → Rime Coat, repeating. It starts the hunt already plated.
//   Ice plating (2 layers): every hit breaks ice instead of dealing damage. Cut breaks 2 layers (all of it), anything else 1.
//   Rime Coat regrows the plating (1 layer once the Ice Mantle breaks). A Firepot melts all of it.
//   Tuned by simulation (4 Nov 2026): with Cut 97% casual wins, without 62%.
// Parts: Tail (Cut; severing it turns Tail Sweep into a weak Stump Swipe), Ice Mantle (Blunt; rare Frostheart;
// fewer layers), Jaw (Pierce; the Daze target; weaker Pounce). Each part rewards a different second weapon.
import type { Intent, MonsterDef } from '../../types';
import { carries, carryingName } from '../../util';
import { stanceHurt } from '../../combat';

export const RIME_LAYERS = 2, RIME_LAYERS_BROKEN = 1;
const layers = (h: { mon: { parts: Record<string, { broken: boolean }> } }) => (h.mon.parts.mantle.broken ? RIME_LAYERS_BROKEN : RIME_LAYERS);

export const rimetail: MonsterDef = {
  id: 'rimetail',
  name: 'The Rimetail',
  short: 'Rimetail',
  plated: RIME_LAYERS,
  kind: 'Ambush stalker',
  elem: 'Frost',
  // its elemental attacks: only these are reduced by armor that resists Frost; the rest are physical
  elemental: ['Tail Sweep'],
  weak: 'Ember',
  resist: 'Gale',
  hp: 330,
  tier: 1,
  requires: 'gorehorn',
  head: 'jaw',
  common: 'rimescale',
  rarePart: 'mantle',
  rare: 'frostheart',
  habits: 'Wears plates of ice across its back. Every hit breaks the ice before it can do damage: one Cut hit clears it, anything else takes two. It regrows the plating every few turns. Its barbed tail sweeps hard.',
  enragedHabit: 'Breathes a freezing mist that ices one of your dice for a turn: the Frost Lock.',
  intro: 'Frost spreads across the rocks. The Rimetail slides out from behind a drift, plated in ice.',
  enrageText: 'Its breath turns to sleet. The Rimetail is enraged!',
  parts: [
    { id: 'tail', name: 'Tail', eff: { Cut: 1, Blunt: 0, Pierce: 0.5 }, hint: 'Sever it to stop the Tail Sweep', mat: 'barbtail', hp: 220, brk: 'The tail parts in a spray of frost. It thrashes the stump.' },
    { id: 'mantle', name: 'Ice Mantle', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'Break it and its plating grows back thinner', mat: 'mantleshard', hp: 240, brk: 'The ice mantle shatters! Its plating will grow back thin.' },
    { id: 'jaw', name: 'Jaw', eff: { Cut: 0.5, Blunt: 0.5, Pierce: 1 }, hint: 'Break to weaken its Pounce', mat: 'frostfang', hp: 180, brk: 'A fang snaps off. Its bite loses its grip.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, jb = m.parts.jaw.broken, tb = m.parts.tail.broken;
    switch (type) {
      case 'pounce': return { name: 'Pounce', text: jb ? 'It crouches low, its broken jaw hanging open.' : 'It crouches low in the snow, haunches twitching.', dmg: jb ? (enr ? 18 : 14) : (enr ? 24 : 18), threat: enr ? 2 : 1 };
      case 'sweep': return tb
        ? { name: 'Stump Swipe', text: 'It swings round, lashing out with the stump of its tail.', dmg: enr ? 28 : 22, threat: 1 }
        : { name: 'Tail Sweep', text: 'It coils its barbed tail behind it, low to the ground.', dmg: enr ? 60 : 48, threat: enr ? 4 : 3, note: 'Breaking its tail stops this' };
      // enraged (Nov 2026): a freezing breath that ices one of your dice for your next turn
      case 'frostlock': return { name: 'Frost Lock', text: 'It breathes a freezing mist across your hands.', dmg: 16, threat: 1, isNew: !m.newSeen, note: '1 fewer die next turn' };
      case 'rimecoat': return { name: 'Rime Coat', text: 'It goes still. Frost creeps across its back, hardening into plates.', dmg: 0, threat: 0, note: `Regrows ${layers(h)} layers of ice` };
      case 'mirror': return { name: 'Ice Mirror', text: 'It turns its iced back to you, smooth as glass, and flicks its tail at you.', dmg: 14, threat: 1, note: 'Hits of 40 or more take ½ this turn, and its shards hit you back for 12' };
      case 'dazed': return { name: 'Dazed', text: 'It reels, eyes unfocused, swaying on its feet.', dmg: 0, threat: 0, note: 'It loses its turn' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h) {
    const m = h.mon;
    let t = ['pounce', 'pounce', 'sweep', 'mirror', 'rimecoat'][m.seq % 5]; m.seq++;
    if (m.enraged && t === 'pounce' && m.seq % 5 === 2) t = 'frostlock'; // enraged: the second pounce becomes a Frost Lock
    return t;
  },

  resolve(h, type) {
    const m = h.mon;
    switch (type) {
      case 'rimecoat': m.plating = layers(h); return `Ice plating regrows: ${m.plating} layers.`;
      case 'mirror': return 'The ice dulls again.';
      case 'frostlock': m.frost = Math.max(m.frost ?? 0, 1); m.newSeen = true; return 'Frost creeps over one of your dice.';
      case 'dazed': return 'It shakes its head, slowly coming back to its senses.';
    }
    return null;
  },

  absorb(h, dmg) {
    if (h.intent !== 'mirror' || dmg < 40) return null;
    stanceHurt(h, 12, 'Ice shards fly back at you');
    return { dmg: Math.round(dmg / 2), note: 'ice mirror ½' };
  },

  tip(h, type) {
    const m = h.mon;
    if (m.plating > 0) {
      if (h.item === 'firepot' && h.itemCharges > 0 && m.plating >= 2) return 'A **Firepot** melts all of its ice.';
      return carries(h, 'Cut')
        ? `The ice takes your hits before its HP does. Your ${carryingName(h, 'Cut')} breaks it in one hit.`
        : 'The ice takes your hits before its HP does. Each hit breaks a layer.';
    }
    if (type === 'sweep' && !m.parts.tail.broken && carries(h, 'Cut')) return `Breaking its tail with your ${carryingName(h, 'Cut')} stops the **Tail Sweep**.`;
    if (type === 'rimecoat') return 'It regrows its ice after this.';
    return null;
  }
};
