// The Scuttlehog — the Foothills, step 1 (the tutorial island, Nov 2026). A piglet that wandered off the Ridge.
// It teaches one thing: dice go into a move, then you end the turn. Two dice, both circles; the Training Blade has
// one move (Slash, one circle). It nudges you for a little every turn and its next move isn't shown yet (there's
// nothing to do about it until Block arrives on the Snapclaw). About 3 turns.
import type { Intent, MonsterDef } from '../../types';

export const scuttlehog: MonsterDef = {
  id: 'scuttlehog',
  name: 'The Scuttlehog',
  short: 'Scuttlehog',
  kind: 'Foothill piglet',
  elem: 'Stone',
  weak: 'Gale',
  resist: 'Ember',
  hp: 60,
  tier: 0.5,
  island: { dice: 2, faces: ['C'] },
  head: 'body',
  common: 'tuft',
  rarePart: 'body',
  rare: 'tuft',
  habits: 'A piglet that wandered down off the Ridge. It nudges anything in its way.',
  intro: 'A Scuttlehog snuffles out of the long grass.',
  enrageText: 'It squeals and stamps its little hooves.',
  // one target, its whole body (the parts row isn't shown until the Tuskling): it never breaks
  parts: [{ id: 'body', name: 'Body', eff: { Cut: 1, Blunt: 1, Pierce: 1 }, hint: '', mat: 'tuft', hp: 9999, brk: '' }],

  intent(_h, type): Intent {
    if (type === 'nudge') return { name: 'Nudge', text: 'It trots at you, snout first.', dmg: 10, threat: 1 };
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },
  next() { return 'nudge'; },
  resolve() { return null; }
};
