// The Mistglass — T2 Frost trickster of the Mirewood. The Charge check.
// A fox of living glass. Every few turns it Splits into mirror images for 3 turns: while they last, only the FIRST
// hit each turn lands (the rest shatter an image). So the answer is one big hit a turn: Charge, then strike.
//   Glass Rake; Freezing Mist (freezes one of your dice next turn); Split (the images); Pounce (only from the
//   images, the big hit).
// Tuned by simulation (6 Nov 2026): casual players never charge: neutral gear 80% with Blunt + bow, 45% with Cut +
// bow; skilled (charges) 100%; Ember gear (its weakness) ~97% casual.
// Parts: Tail Shards (Cut; fewer images: 2 turns instead of 3), Facets (Blunt; the daze part), Eyes (Pierce; stops
// the Freezing Mist; rare Mirror Heart).
import type { Intent, MonsterDef } from '../../types';
import { choose, remember } from '../../behaviour';
import { carries, carryingName } from '../../util';

const SPLIT_EVERY = 4;

export const mistglass: MonsterDef = {
  id: 'mistglass',
  name: 'The Mistglass',
  short: 'Mistglass',
  kind: 'Trickster',
  elem: 'Frost',
  // its elemental attacks: only these are reduced by armor that resists Frost; the rest are physical
  elemental: ['Freezing Mist'],
  weak: 'Ember',
  resist: 'Gale',
  hp: 580,
  tier: 2,
  requires: ['cragwing'], // rank E: the Cragwing promotion opens the Mirewood (Nov 2026)
  head: 'facets',
  common: 'glassdust',
  rarePart: 'eyes',
  rare: 'mirrorheart',
  habits: 'A fox of living glass that walks in its own mist. It splits into mirror images: while they stand, only your first hit each turn finds the real one. Make that hit count. Charge, then strike.',
  intro: 'The mist thickens and catches the light. Something glassy steps out of it, and then there are three of it.',
  enrageText: 'Cracks of cold light race across its facets. The Mistglass is enraged!',
  parts: [
    { id: 'tail', name: 'Tail Shards', eff: { Cut: 1, Blunt: 0.5, Pierce: 0 }, hint: 'Break them and its images fade sooner', mat: 'glasstail', hp: 180, brk: 'The tail shards shatter. Its images will fade sooner.' },
    { id: 'facets', name: 'Facets', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'The daze part', mat: 'glassfacet', hp: 240, brk: 'Its facets crack and cloud over.' },
    { id: 'eyes', name: 'Eyes', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Break them to stop the Freezing Mist', mat: 'glasseye', hp: 160, brk: 'Its eyes go dark. The mist stops freezing.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged;
    switch (type) {
      case 'rake': return { name: 'Glass Rake', text: 'It rakes at you with claws like broken panes.', dmg: enr ? 32 : 26, threat: 2 };
      case 'mist': return { name: 'Freezing Mist', text: 'It breathes out a cloud of freezing mist.', dmg: enr ? 20 : 16, threat: 1, note: 'Freezes one of your dice next turn' };
      case 'split': return { name: 'Split', text: 'It shivers and splits into mirror images.', dmg: 0, threat: 0, note: `For ${splitTurns(h)} turns, only your first hit each turn lands` };
      case 'pounce': return { name: 'Pounce', text: 'All the images leap at once. One of them is real!', dmg: enr ? 64 : 54, threat: 3, steady: true };
      case 'dazed': return { name: 'Dazed', text: 'Its facets flicker. The images waver.', dmg: 0, threat: 0, note: 'Its action is lost' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon;
    if (prev === null) return remember(h, 'rake');
    const since = h.turn - (m.lastChain ?? 0);
    const images = (m.mirage ?? 0) > 0;
    const pounced = (h.mon.recent ?? []).slice(-3).includes('pounce');
    const pick = choose(h, [
      ['rake', 3],
      ['mist', m.parts.eyes.broken ? 0 : 2],
      ['split', !images && since >= SPLIT_EVERY ? 6 : 0],
      ['pounce', images && !pounced ? 4 : 0]
    ], a => this.intent(h, a).threat);
    if (pick === 'split') m.lastChain = h.turn;
    return remember(h, pick);
  },

  resolve(h, type, landed) {
    const m = h.mon, lines: string[] = [];
    m.hits = 0;
    if ((m.mirage ?? 0) > 0) { m.mirage!--; if (!m.mirage) lines.push('The images fade back into the mist.'); }
    if (type === 'split') { m.mirage = splitTurns(h); lines.push(`Mirror images surround you. For ${m.mirage} turns, only your first hit each turn lands.`); }
    if (type === 'mist' && landed) { m.frost = 1; lines.push('Frost creeps over one of your dice.'); }
    if (type === 'dazed') lines.push('It shakes the light out of its facets.');
    return lines.join(' ') || null;
  },

  dodge(h) {
    const m = h.mon;
    if ((m.mirage ?? 0) > 0 && (m.hits ?? 0) > 0) return 'Your blow shatters an image. The real one is elsewhere.';
    m.hits = (m.hits ?? 0) + 1;
    return null;
  },

  tip(h, type) {
    const m = h.mon;
    if ((m.mirage ?? 0) > 0) return h.chargeReady
      ? 'Your charge is ready. Make it your first hit this turn: only the first one lands.'
      : 'Only your first hit each turn lands. Charge this turn and strike once, hard, the next. Guard with the rest.';
    if (type === 'split') return carries(h, 'Cut') ? `Images are coming. Break its tail shards with your ${carryingName(h, 'Cut')} and they fade sooner.` : 'Images are coming: from next turn, only your first hit each turn lands.';
    if (type === 'mist' && carries(h, 'Pierce')) return `Break its eyes with your ${carryingName(h, 'Pierce')} to stop the Freezing Mist.`;
    return null;
  }
};

function splitTurns(h: Parameters<MonsterDef['intent']>[0]) { return h.mon.parts.tail.broken ? 2 : 3; }
