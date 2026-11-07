// The Snapclaw — the Foothills, step 2 (the tutorial island, Nov 2026). A ridge crab, slow and loud.
// It teaches three things that belong together: the dice have faces (triangles and blanks arrive here), the monster
// shows its next move, and spare dice Block. It clicks twice, then pinches hard, on repeat: the Pinch is the moment
// the prompt asks you to Block. Three dice, any face. Its Shell makes the Hunter's Blade.
import type { Intent, MonsterDef } from '../../types';

export const snapclaw: MonsterDef = {
  id: 'snapclaw',
  name: 'The Snapclaw',
  short: 'Snapclaw',
  kind: 'Ridge crab',
  elem: 'Frost',
  weak: 'Ember',
  resist: 'Gale',
  hp: 60,
  tier: 0.5,
  requires: 'scuttlehog',
  island: { dice: 3, faces: ['C', 'T', 'B'] },
  head: 'body',
  common: 'shell',
  rarePart: 'body',
  rare: 'shell',
  habits: 'Clicks its claws twice, then pinches hard. You can see the pinch coming.',
  intro: 'A Snapclaw sidles out from under a rock, claws clicking.',
  enrageText: 'It raises both claws high.',
  parts: [{ id: 'body', name: 'Shell', eff: { Cut: 1, Blunt: 1, Pierce: 1 }, hint: '', mat: 'shell', hp: 9999, brk: '' }],

  intent(_h, type): Intent {
    if (type === 'click') return { name: 'Click', text: 'It clicks its claws at you.', dmg: 8, threat: 1 };
    if (type === 'pinch') return { name: 'Pinch', text: 'Its big claw creaks open.', dmg: 36, threat: 2 };
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },
  next(h) { const t = ['click', 'click', 'pinch'][h.mon.seq % 3]; h.mon.seq++; return t; },
  resolve() { return null; }
};
