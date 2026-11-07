// The Rimekit (id snapclaw: ids kept so saves carry over) — the Foothills, step 2 (the tutorial island, Nov 2026).
// A Rimetail kit, no ice on its back yet; its tail already sweeps hard.
// It teaches three things that belong together: the dice have faces (triangles and blanks arrive here), the monster
// shows its next move, and spare dice Block. It clicks twice, then pinches hard, on repeat: the Pinch is the moment
// the prompt asks you to Block. Three dice, any face. Its Shell makes the Hunter's Blade.
import type { Intent, MonsterDef } from '../../types';

export const snapclaw: MonsterDef = {
  id: 'snapclaw',
  name: 'The Rimekit',
  short: 'Rimekit',
  kind: 'Rimetail kit',
  youngOf: 'rimetail',
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
  habits: 'A Rimetail kit, no ice on its back yet. It snaps twice, then sweeps its tail hard. You can see the sweep coming.',
  intro: 'A Rimekit creeps out from under a frosted rock, tail twitching.',
  enrageText: 'It arches its back and hisses.',
  parts: [{ id: 'body', name: 'Body', eff: { Cut: 1, Blunt: 1, Pierce: 1 }, hint: '', mat: 'shell', hp: 9999, brk: '' }],

  intent(_h, type): Intent {
    if (type === 'click') return { name: 'Snap', text: 'It snaps at your ankles.', dmg: 8, threat: 1 };
    if (type === 'pinch') return { name: 'Tail Sweep', text: 'Its tail curls back, barbs bristling.', dmg: 36, threat: 2 };
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },
  next(h) { const t = ['click', 'click', 'pinch'][h.mon.seq % 3]; h.mon.seq++; return t; },
  resolve() { return null; }
};
