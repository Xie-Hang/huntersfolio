// The Gorehorn — T1 Stone ridge boar. Tutorial monster: a fixed, learnable cycle.
// Pattern: Jab → Jab → Wind-up → Charge, repeating. Mud Wallow once below 70%, Root once below 30%.
import type { Intent, MonsterDef } from '../../types';
import { carries, carryingName, dazeTag } from '../../util';
import { stanceHurt } from '../../combat';

export const gorehorn: MonsterDef = {
  id: 'gorehorn',
  name: 'The Gorehorn',
  short: 'Gorehorn',
  kind: 'Ridge boar',
  elem: 'Stone',
  // its elemental attacks: only these are reduced by armor that resists Stone; the rest are physical
  elemental: ['Trampling Charge', 'Stumbling Rush'],
  weak: 'Gale',
  resist: 'Ember',
  hp: 360,
  tier: 1,
  head: 'tusks',
  common: 'hide',
  rarePart: 'tusks',
  rare: 'heartstone',
  habits: 'Winds up before every charge. Wallows in mud when hurt, which halves damage to its hide.',
  intro: 'The Gorehorn bursts out of the brush on Ashfall Ridge.',
  enrageText: 'It bellows and stamps. The Gorehorn is enraged!',
  parts: [
    { id: 'tusks', name: 'Tusks', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'Break to weaken the Trampling Charge', mat: 'tusk', hp: 280, brk: 'A tusk splinters and falls! Its charge will never hit as hard again.' },
    { id: 'hide', name: 'Hide', eff: { Cut: 1, Blunt: 0, Pierce: 0.5 }, hint: 'Break to stop the Mud Wallow', mat: 'pelt', hp: 240, brk: 'The hide tears open. Mud won’t protect it now.' },
    { id: 'legs', name: 'Hind Legs', eff: { Cut: 0.5, Blunt: 0.5, Pierce: 1 }, hint: 'Break and it tires after every charge', mat: 'sinew', hp: 140, brk: 'Its hind leg buckles. It limps and tires quickly.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, tb = m.parts.tusks.broken;
    switch (type) {
      case 'jab': return enr
        ? { name: 'Double Jab', text: 'It snorts twice, head low, tusks twitching.', dmg: 36, threat: 2 }
        : { name: 'Tusk Jab', text: 'It snorts and paws the ground once.', dmg: 25, threat: 1 };
      case 'windup': return { name: 'Winding up', text: tb ? 'It drags its broken tusks through the dirt, gathering itself.' : 'It lowers its tusks and scrapes the earth. The ground trembles.', dmg: 0, threat: 0, note: 'Charges next turn' };
      case 'charge': return tb
        ? { name: 'Stumbling Rush', text: 'It lurches forward on broken tusks.', dmg: enr ? 40 : 32, threat: 2 }
        : { name: 'Trampling Charge', text: 'It thunders forward, tusks first!', dmg: enr ? 85 : 70, threat: enr ? 4 : 3 };
      case 'wallow': return { name: 'Mud Wallow', text: 'It rolls in the wet earth, caking its hide in mud.', dmg: 0, threat: 0, note: 'Hide takes half damage for 2 turns' };
      case 'root': return { name: 'Root for Food', text: 'It noses the ground, distracted by roots.', dmg: 0, threat: 0, note: 'Heals 25. A free turn to attack' };
      case 'exhausted': return { name: 'Exhausted', text: 'It staggers, sides heaving.', dmg: 0, threat: 0, note: 'Wide open' };
      case 'pinned': return { name: 'Pinned', text: 'An arrow through the foreleg. It stumbles mid-stride, the charge spent.', dmg: 0, threat: 0, note: 'Charge cancelled' };
      // counter stance (Nov 2026): a turn where the obvious play, a big hit on its weakest part, is punished
      case 'bristle': return { name: 'Bristle Up', text: 'Its bristles stand up like iron nails. It shoulders forward, daring you to hit its back.', dmg: 10, threat: 1, note: 'Your first hit on its Hide this turn is struck back at you for 20 (it can’t knock you out). Its Tusks and Hind Legs are safe' };
      case 'dazed': return { name: 'Dazed', text: 'It reels, eyes unfocused, swaying on its feet.', dmg: 0, threat: 0, note: 'Its action is lost' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon;
    if (prev === 'windup') return 'charge';
    if (m.exhausted) { m.exhausted = false; return 'exhausted'; }
    const early = (h.lesson ?? 99) < 4; // the first hunts: no mud, no stance (one thing at a time)
    if (!early && !m.usedWallow && !m.parts.hide.broken && m.hp < m.max * 0.7) { m.usedWallow = true; return 'wallow'; }
    if (!m.usedRoot && m.hp < m.max * 0.3) { m.usedRoot = true; return 'root'; }
    let t = ['jab', 'bristle', 'jab', 'windup'][m.seq % 4]; m.seq++;
    if (t === 'bristle' && (m.parts.hide.broken || early)) t = 'jab';
    return t;
  },

  resolve(h, type) {
    const m = h.mon;
    switch (type) {
      case 'root': { const heal = Math.min(25, m.max - m.hp); m.hp += heal; return `It feeds and recovers ${heal} HP.`; }
      case 'wallow': m.wallow = 3; return 'Mud cakes its hide.';
      case 'bristle': m.stanceUsed = false; return 'Its bristles lie flat again.';
      case 'windup': return 'It gathers itself to charge.';
      case 'exhausted': return 'It catches its breath.';
      case 'pinned': return 'It shakes the arrow loose, snorting.';
      case 'dazed': return 'It shakes its head, slowly coming back to its senses.';
      case 'charge':
        m.charges++;
        if (m.parts.legs.broken || m.charges % 2 === 0) m.exhausted = true;
        return null;
    }
    return null;
  },

  onHit(h) {
    const m = h.mon;
    if (h.intent === 'bristle' && h.target === 'hide' && !m.stanceUsed) { m.stanceUsed = true; stanceHurt(h, 20, 'The bristles strike back'); }
    return null;
  },
  partNote(h, partId) {
    if (partId === 'hide' && h.intent === 'bristle' && !h.mon.stanceUsed && !h.mon.parts.hide.broken) return { chip: 'Hits back 20', hint: 'Bristling: your first hit here this turn is struck back at you for 20' };
    return null;
  },
  hitMod(h, partId, w) {
    if (partId === 'hide' && h.mon.wallow > 0 && !h.mon.parts.hide.broken) {
      return w.type === 'Pierce' ? { mult: 1, note: 'pierced the mud' } : { mult: 0.5, note: 'mud ½' };
    }
    return null;
  },

  onPin(h) {
    if (h.intent === 'windup') { h.intent = 'pinned'; return 'Pin: the arrow pins it mid-stride. The charge is cancelled!'; }
    return null;
  },

  tip(h, type) {
    if (type === 'windup' && carries(h, 'Pierce')) return `Pinning Shot now cancels the charge (${carryingName(h, 'Pierce')}).`;
    if (type === 'wallow' && carries(h, 'Pierce')) return `Pierce ignores the mud (${carryingName(h, 'Pierce')}).`;
    if (type === 'charge' && carries(h, 'Blunt') && h.mon.daze >= h.mon.dazeMax * 0.6) return `${dazeTag} Fill the daze meter now to stop this charge.`;
    return null;
  }
};
