// The Shrikelet (id gustmarmot: ids kept so saves carry over) — the Foothills, steps 9 and 11 (the tutorial island,
// Nov 2026). A Galeshrike chick, too young to fly (so no bows yet): its flapping is the young form of the parent's
// circling before a dive. It teaches wind-ups and Charge: it whistles (a safe turn: nothing hits you), then gusts hard the turn after,
// so the whistle is the moment to Charge. Below half HP it's Enraged and its gust hits harder. Its second hunt always
// drops a Gale Gland (rare), the last thing the Whistling Blade needs. Gale; weak to Stone.
import type { Intent, MonsterDef } from '../../types';

export const gustmarmot: MonsterDef = {
  id: 'gustmarmot',
  name: 'The Shrikelet',
  short: 'Shrikelet',
  kind: 'Galeshrike chick',
  youngOf: 'galeshrike',
  elem: 'Gale',
  weak: 'Frost',
  resist: 'Stone',
  hp: 170,
  tier: 0.5,
  requires: 'tuskling',
  island: { dice: 4, faces: ['C', 'C', 'T', 'T', 'B', 'B'] },
  head: 'cheeks',
  common: 'marmotfur',
  rarePart: 'cheeks',
  rare: 'galegland',
  habits: 'A Galeshrike chick, too young to fly. It pecks twice, then beats its wings, and the gust it whips up hits hard the turn after. Badly hurt, it gets angry and the gust hits harder.',
  intro: 'A Shrikelet hops onto a rock and spreads its wings. The grass flattens.',
  enrageText: 'It fluffs up, shrieking. The Shrikelet is enraged!',
  parts: [
    { id: 'cheeks', name: 'Beak', eff: { Cut: 0.5, Blunt: 1, Pierce: 0.5 }, hint: 'Breaking it can drop a Gale Gland (rare)', mat: 'marmotfur', hp: 70, brk: 'Its beak chips with a squawk.' },
    { id: 'fur', name: 'Down', eff: { Cut: 1, Blunt: 0.5, Pierce: 0.5 }, hint: 'Breaking it drops its down', mat: 'marmotfur', hp: 80, brk: 'A clump of down tears away.' }
  ],

  intent(h, type): Intent {
    const enr = h.mon.enraged;
    switch (type) {
      case 'nip': return { name: 'Peck', text: 'It darts in and pecks.', dmg: 16, threat: 1 };
      case 'whistle': return { name: 'Flapping', text: 'It beats its stubby wings hard. The wind gathers.', dmg: 0, threat: 0, note: 'A free turn. Gusts next turn' };
      case 'gust': return { name: enr ? 'Howling Gust' : 'Gust', text: enr ? 'The wind howls straight at you.' : 'A wall of wind hits you.', dmg: enr ? 50 : 40, threat: 3 };
      case 'dazed': return { name: 'Dazed', text: 'It wobbles, dizzy.', dmg: 0, threat: 0, note: 'It loses its turn' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },
  next(_h, prev) {
    if (prev === 'whistle') return 'gust';
    // it opens with Flapping, so the Charge lesson comes on turn 1, with nothing else going on (Nov 2026 playtest)
    const t = ['whistle', 'nip', 'nip'][_h.mon.seq % 3]; _h.mon.seq++; return t;
  },
  resolve(_h, type) { return type === 'whistle' ? 'The wind gathers around it.' : null; }
};
