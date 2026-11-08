// The Tuskling — the Foothills, step 3 (the tutorial island, rebuilt 8 Nov 2026). A Gorehorn calf: the island's exam
// is its parent. It teaches aim and Swap: its Hide (blades break it) and its Tusks (only Blunt), so you aim at the
// Hide with the blade, then Swap to the maul for the Tusks. A win always pays 2 Tusk Hides (its common drop): the vest.
// It tires when badly hurt (a capture window, for re-hunts on the Ridge rules). Four dice, any face.
import type { Intent, MonsterDef } from '../../types';

export const tuskling: MonsterDef = {
  id: 'tuskling',
  name: 'The Tuskling',
  short: 'Tuskling',
  kind: 'Gorehorn calf',
  youngOf: 'gorehorn',
  elem: 'Stone',
  weak: 'Gale',
  resist: 'Ember',
  hp: 130,
  tier: 0.5,
  requires: 'snapclaw',
  island: { dice: 4, faces: ['C', 'C', 'T', 'T', 'B', 'B'] },
  head: 'tusks',
  common: 'tuskhide',
  rarePart: 'tusks',
  rare: 'milktusk',
  habits: 'A Gorehorn calf, all hide and little tusks. It jabs twice, then bites. When it’s badly hurt it tires and stands still.',
  intro: 'A Tuskling trots out of the ferns, little tusks first.',
  enrageText: 'It squeals and stamps.',
  // the tusks come first: the hunt opens aimed at the part a blade can't break, so aiming is the thing to learn
  parts: [
    { id: 'tusks', name: 'Tusks', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'Breaking it drops a Milk Tusk', mat: 'milktusk', hp: 60, brk: 'A little tusk snaps off!' },
    { id: 'hide', name: 'Hide', eff: { Cut: 1, Blunt: 0, Pierce: 0.5 }, hint: 'Breaking it drops its hide', mat: 'tuskhide', hp: 90, brk: 'Its hide tears. It drops a strip of it.' }
  ],

  intent(_h, type): Intent {
    switch (type) {
      case 'jab': return { name: 'Jab', text: 'It lowers its little tusks.', dmg: 14, threat: 1 };
      case 'bite': return { name: 'Bite', text: 'It opens its jaws wide.', dmg: 28, threat: 2 };
      case 'tired': return { name: 'Tired', text: 'It stands still, sides heaving.', dmg: 0, threat: 0, note: 'A free turn' };
      case 'dazed': return { name: 'Dazed', text: 'It wobbles on its feet.', dmg: 0, threat: 0, note: 'It loses its turn' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },
  next(h) {
    // badly hurt, it tires every other turn: the Snare's window
    if (h.mon.hp <= h.mon.max * 0.25 && h.intent !== 'tired') return 'tired';
    const t = ['jab', 'jab', 'bite'][h.mon.seq % 3]; h.mon.seq++; return t;
  },
  resolve(_h, type) { return type === 'tired' ? 'It catches its breath.' : null; }
};
