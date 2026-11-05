// The Gravefang — a changed Hollowfang: Drain, Gale. The Gloamhollow, deeper (Tier 3.2, Nov 2026). The Pierce check.
// It flies between latches, and every turn it drinks gives it a frenzy pip. At 3 it uses Exsanguinate, a huge bite
// that heals it by what it takes. Its throat sac now hangs where only Pierce reaches; breaking it ends the frenzy for
// good and bursts what it drank. A 2-dice Cut move still tears it off.
// Pattern: Bite → Latch On → Drinking (up to 3) → Taking off → (air) Shriek → Plunge → Bite → …
import type { Intent, MonsterDef } from '../../types';
import { latchPlayer } from '../../status';
import { groundFlier } from './galeshrike';
import { LATCH_TURNS, burstSac, drink, tearOff } from './hollowfang';

const MIRE = ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass'];
export const FRENZY_MAX = 3;

export const gravefang: MonsterDef = {
  id: 'gravefang',
  inflicts: 'Drain',
  variantOf: 'hollowfang',
  name: 'The Gravefang',
  short: 'Gravefang',
  flier: true,
  kind: 'Cave leech',
  elem: 'Gale',
  elemental: ['Shriek', 'Plunge'],
  weak: 'Frost',
  resist: 'Stone',
  hp: 840,
  tier: 3.2,
  requires: [...MIRE, 'hollowfang'],
  head: 'fangs',
  common: 'gravehide',
  rarePart: 'fangs',
  rare: 'gravepearl',
  habits: 'A Hollowfang grown huge in the deep caves. It flies between feeds, and every time it drinks it works itself into a frenzy, until it bites to kill. Its throat sac hangs where only an arrow reaches; breaking it ends the frenzy.',
  intro: 'Wings the size of sails fold down from the dark. It drops onto the rock and turns its blind face to you.',
  enrageText: 'It shrieks until the cave rings. The Gravefang is enraged!',
  parts: [
    { id: 'fangs', name: 'Fangs', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'The daze part. Break and it can’t latch', mat: 'gravetooth', hp: 330, brk: 'Its fangs crack off. It can’t hold on to you now.' },
    { id: 'sac', name: 'Throat Sac', eff: { Cut: 0, Blunt: 0, Pierce: 1 }, hint: 'Only Pierce reaches it. Break it to end the frenzy', mat: 'gravesac', hp: 260, brk: 'An arrow splits the throat sac! The frenzy drains out of it.' },
    { id: 'wings', name: 'Wings', eff: { Cut: 0.5, Blunt: 0.5, Pierce: 1 }, hint: 'Break and it can’t fly any more', mat: 'gravewing', hp: 290, brk: 'Its wing membranes tear. It’s grounded for good.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, f = m.frenzy ?? 0;
    switch (type) {
      case 'bite': return { name: 'Grave Bite', text: 'It lunges, all teeth.', dmg: enr ? 42 : 34, threat: 1 };
      case 'latch': return { name: 'Latch On', text: 'It gathers itself to leap onto you.', dmg: enr ? 32 : 26, threat: 2, note: `If it lands, it drinks for ${Math.min(LATCH_TURNS, h.arm.latchMax ?? LATCH_TURNS)} turns and each turn it drinks is a frenzy pip (${f} of ${FRENZY_MAX}). A 2-dice Cut move tears it off` };
      case 'drink': return { name: 'Drinking', text: 'It’s clamped on, drinking.', dmg: enr ? 30 : 26, threat: 2, noGuard: true, note: `It heals what it drinks · ${m.latch} turn${(m.latch ?? 0) > 1 ? 's' : ''} left. A 2-dice Cut move tears it off` };
      case 'exsang': return { name: 'Exsanguinate', text: 'Frenzied, it comes for your throat!', dmg: enr ? 112 : 96, threat: 4, halfGuard: true, note: 'Half your guard · it heals 70. Breaking the throat sac ends the frenzy' };
      case 'takeoff': return { name: 'Taking off', text: 'It unfolds and beats up into the dark.', dmg: 0, threat: 0, note: 'Airborne after your turn: only bows reach it then' };
      case 'shriek': return { name: 'Shriek', text: 'It screams down at you from the roof.', dmg: enr ? 36 : 30, threat: 1, halfGuard: true, note: 'Ignores half your guard' };
      case 'plunge': return { name: 'Plunge', text: 'It drops out of the dark onto you!', dmg: enr ? 68 : 58, threat: 3, note: 'Then it’s on the ground' };
      case 'gorged': return { name: 'Gorged', text: 'It sprawls on the rock, bloated.', dmg: 0, threat: 0, note: 'A free turn to attack' };
      case 'torn': return { name: 'Torn off', text: 'It flops on the rock, winded.', dmg: 0, threat: 0, note: 'Its action is lost' };
      case 'crashed': return { name: 'Brought down', text: 'It crashes to the rock in a tangle of wings.', dmg: 0, threat: 0, note: 'On the ground. Its action is lost' };
      case 'dazed': return { name: 'Dazed', text: 'It twitches, mouth working at nothing.', dmg: 0, threat: 0, note: 'Its action is lost' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon, grounded = m.parts.wings.broken;
    if ((m.latch ?? 0) > 0) return 'drink';
    if (m.air) return prev === 'shriek' ? 'plunge' : 'shriek';
    if (prev === 'drink') { m.seq = 0; return grounded ? 'gorged' : 'takeoff'; }
    let t = ['bite', 'latch', 'takeoff'][m.seq % 3]; m.seq++;
    if (t === 'takeoff' && grounded) t = 'bite';
    if (t === 'latch' && (m.frenzy ?? 0) >= FRENZY_MAX && !m.parts.sac.broken) t = 'exsang';
    else if (t === 'latch' && m.parts.fangs.broken) t = 'bite';
    return t;
  },

  resolve(h, type, landed) {
    const m = h.mon;
    switch (type) {
      case 'latch': return landed ? latchPlayer(h, LATCH_TURNS) : null;
      case 'drink': {
        if (!landed) { m.latch = 0; return 'It loses its grip.'; }
        if (!m.parts.sac.broken) m.frenzy = Math.min(FRENZY_MAX, (m.frenzy ?? 0) + 1);
        return drink(h, m.enraged ? 30 : 26) + (m.parts.sac.broken ? '' : ` Frenzy ${m.frenzy} of ${FRENZY_MAX}.`);
      }
      case 'exsang': {
        m.frenzy = 0; if (!landed) return 'The frenzy breaks.';
        const heal = Math.min(m.max - m.hp, 70); m.hp += heal; return `It gorges on you: +${heal}. The frenzy breaks.`;
      }
      case 'takeoff': m.air = true; m.drank = 0; return 'It’s up in the dark. Only bows reach it now.';
      case 'plunge': m.air = false; return null;
      case 'gorged': m.drank = 0; return 'It stirs, heavy.';
      case 'torn': m.drank = 0; return 'It rights itself.';
      case 'crashed': return 'It drags itself upright.';
      case 'dazed': return 'It shakes its head.';
    }
    return null;
  },

  onHit(h, mv, w) { return tearOff(h, mv, w); },

  onBreak(h, partId) {
    const m = h.mon;
    if (partId === 'sac') { m.frenzy = 0; if (h.intent === 'exsang') h.intent = 'gorged'; return burstSac(h) ?? 'The frenzy is gone for good.'; }
    if (partId === 'fangs' && (m.latch ?? 0) > 0) { m.latch = 0; h.intent = 'torn'; return 'With its fangs gone it drops off you.'; }
    if (partId === 'wings' && m.air) { groundFlier(h); return 'It falls out of the dark.'; }
    return null;
  },

  canHit(h, w) { return !h.mon.air || w.type === 'Pierce'; },
  cantHitReason() { return 'It’s up in the dark: only Pierce (a bow) reaches it. Swap to a bow, throw a Net, or guard until it plunges.'; },
  // close to a frenzy, the throat sac is the part to hit (only a bow reaches it): flagged on the parts row
  partNote(h, partId) {
    return partId === 'sac' && !h.mon.parts.sac.broken && (h.mon.frenzy ?? 0) >= 2 ? { chip: 'Frenzy near', hint: 'Breaking it ends the frenzy for good. Only Pierce reaches it.' } : null;
  },
  priority(h, w) { return (h.mon.frenzy ?? 0) >= 2 && w.type === 'Pierce' && !h.mon.parts.sac.broken ? 'sac' : null; },
  reachable(h, partId, w) { return partId !== 'sac' || w.type === 'Pierce'; },
  onPin(h) { if (h.mon.air) { groundFlier(h); return 'Pin: an arrow through the wing. It crashes down!'; } return null; },

  meter(h) {
    const m = h.mon; if (m.parts.sac.broken) return null;
    return { label: 'Frenzy', value: m.frenzy ?? 0, max: FRENZY_MAX, tone: 'ember', pips: true, note: `${m.frenzy ?? 0} of ${FRENZY_MAX}` };
  },

  badges(h) {
    const l = h.mon.latch ?? 0;
    return l > 0 ? [{ key: 'latch', label: 'Latched on', short: `${l} turn${l > 1 ? 's' : ''}`, cls: 'ember', desc: 'It’s clamped on and drinking: guard can’t stop it, and it heals what it drinks. A 2-dice Cut move tears it off.' }] : [];
  },

  // no tip: the telegraphs say how to answer, and the sac is flagged on the parts row near a frenzy
  tip() { return null; },

  canCapture(h) { return !h.mon.air; }
};
