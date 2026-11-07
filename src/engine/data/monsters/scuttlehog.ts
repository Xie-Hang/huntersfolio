// The Cragling (id scuttlehog: ids kept so saves carry over) — the Foothills, step 1 (the tutorial island, Nov 2026).
// A Cragwing hatchling, wings still stubs: the Ridge's last test, met first as the island's first hunt (Mekkman, Nov
// 2026: the Foothills monsters are the young of the Ridge's).
// It teaches one thing: dice go into a move, then you end the turn. Two dice, both circles; the Training Blade has
// one move (Slash, one circle). It nudges you for a little every turn and its next move isn't shown yet (there's
// nothing to do about it until Block arrives on the Snapclaw). About 3 turns.
import type { Intent, MonsterDef } from '../../types';

export const scuttlehog: MonsterDef = {
  id: 'scuttlehog',
  name: 'The Cragling',
  short: 'Cragling',
  kind: 'Cragwing hatchling',
  youngOf: 'cragwing',
  elem: 'Gale',
  weak: 'Frost',
  resist: 'Stone',
  hp: 60,
  tier: 0.5,
  island: { dice: 2, faces: ['C'] },
  head: 'body',
  common: 'tuft',
  rarePart: 'body',
  rare: 'tuft',
  habits: 'A Cragwing hatchling, its wings still stubs. It scuttles about and butts anything in its way.',
  intro: 'A Cragling scuttles out from the scree, flapping its stubby wings.',
  enrageText: 'It squawks and flaps its little wings.',
  // one target, its whole body (the parts row isn't shown until the Tuskling): it never breaks
  parts: [{ id: 'body', name: 'Body', eff: { Cut: 1, Blunt: 1, Pierce: 1 }, hint: '', mat: 'tuft', hp: 9999, brk: '' }],

  intent(_h, type): Intent {
    if (type === 'nudge') return { name: 'Headbutt', text: 'It scuttles at you, head down.', dmg: 10, threat: 1 };
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },
  next() { return 'nudge'; },
  resolve() { return null; }
};
