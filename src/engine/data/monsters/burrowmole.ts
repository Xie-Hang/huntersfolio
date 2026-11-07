// The Burrowmole — the Foothills, step 5 (the tutorial island, Nov 2026). A mole that digs under the trail.
// It teaches swapping: it scratches twice, then digs in, and while it's underground only a Blunt weapon reaches it.
// Any maul hit drives it back up (stunned, its tunnel bite lost). Its Snout breaks to a maul. Reroll and Daze are
// taught here too: four dice, and Rend appears on the blade as the reason to reroll.
import type { Intent, MonsterDef } from '../../types';

export const burrowmole: MonsterDef = {
  id: 'burrowmole',
  name: 'The Burrowmole',
  short: 'Burrowmole',
  kind: 'Trail mole',
  burrower: true,
  elem: 'Stone',
  weak: 'Gale',
  resist: 'Ember',
  hp: 120,
  tier: 0.5,
  requires: 'tuskling',
  island: { dice: 4, faces: ['C', 'C', 'T', 'T', 'B', 'B'] },
  head: 'snout',
  common: 'moleclaw',
  rarePart: 'snout',
  rare: 'moleclaw',
  habits: 'Scratches twice, then digs under the trail and bites from below. Underground, only a maul reaches it, and a maul hit drives it back up.',
  intro: 'The trail heaves. A Burrowmole pokes its snout out.',
  enrageText: 'It chitters angrily.',
  parts: [{ id: 'snout', name: 'Snout', eff: { Cut: 0.5, Blunt: 1, Pierce: 0.5 }, hint: 'Break it for a claw', mat: 'moleclaw', hp: 70, brk: 'Its snout is bruised flat.' }],

  intent(h, type): Intent {
    switch (type) {
      case 'scratch': return { name: 'Scratch', text: 'It rakes at you with its claws.', dmg: 10, threat: 1 };
      case 'dig': return { name: 'Digging', text: 'It tears into the trail.', dmg: 0, threat: 0, note: 'After your turn it’s underground: only a maul reaches it' };
      case 'bite': return { name: 'Tunnel Bite', text: 'The ground bulges under your feet.', dmg: 14, threat: 2, note: 'Hit it with a maul to drive it up' };
      case 'stunned': return { name: 'Stunned', text: 'It blinks in the daylight.', dmg: 0, threat: 0, note: 'Its bite is lost' };
      case 'dazed': return { name: 'Dazed', text: 'It wobbles, dizzy.', dmg: 0, threat: 0, note: 'Its action is lost' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },
  next(h, prev) {
    if (prev === 'dig' || h.mon.under) return 'bite';
    const t = ['scratch', 'scratch', 'dig'][h.mon.seq % 3]; h.mon.seq++; return t;
  },
  resolve(h, type) {
    if (type === 'dig') { h.mon.under = true; return 'It’s underground.'; }
    if (type === 'bite') { h.mon.under = false; return 'It pops back up.'; }
    return null;
  },
  canHit(h, w) { return !h.mon.under || w.type === 'Blunt'; },
  cantHitReason() { return 'Underground: only a maul reaches it.'; },
  onHit(h, _mv, w) {
    if (h.mon.under && w.type === 'Blunt') { h.mon.under = false; h.intent = 'stunned'; return 'Your maul shakes the ground. It pops up, stunned!'; }
    return null;
  },
  canCapture(h) { return !h.mon.under; }
};
