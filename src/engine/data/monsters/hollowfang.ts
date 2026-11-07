// The Hollowfang — Drain, Frost. The Gloamhollow (Nov 2026). The Cut check.
// A pale, eyeless cave bat-leech the size of a dog. It latches on and drinks: what you lose, it heals. The answer is
// a part, not an item: a 2-dice Cut move tears it off, and breaking its throat sac bursts what it drank.
// Pattern: Bite → Latch On → Drinking (up to 3 turns, guard can't stop it) → Gorged (a free turn).
// Parts: Fangs (Blunt; the daze part; it can't latch), Throat Sac (Cut; bursts what it drank), Wings (Pierce; weaker bite).
import type { Hunt, Intent, MonsterDef, Move, WeaponInst } from '../../types';
import { latchPlayer } from '../../status';

export const LATCH_TURNS = 3;
// rank E (Nov 2026): opens with the Cragwing promotion
const RIDGE = ['cragwing'];

/** a Cut move of 2+ dice tears a latched monster off: it loses its action */
export function tearOff(h: Hunt, mv: Move, w: WeaponInst): string | null {
  if ((h.mon.latch ?? 0) <= 0 || w.type !== 'Cut' || mv.need.length < 2) return null;
  h.mon.latch = 0; h.intent = 'torn'; (h.feats ??= []).includes('tornoff') || h.feats.push('tornoff');
  return 'You cut it loose! It drops off you and flops on the rock.';
}
/** It drinks: heals what it took, and remembers it (a broken sac gives it back) */
export function drink(h: Hunt, amount: number) {
  const m = h.mon, heal = Math.min(amount, m.max - m.hp);
  m.hp += heal; m.drank = (m.drank ?? 0) + heal; m.latch = Math.max(0, (m.latch ?? 0) - 1);
  return `It drinks ${amount} and heals ${heal}.${m.latch ? '' : ' It lets go, gorged.'}`;
}
/** the sac bursts: it loses what it drank this latch */
export function burstSac(h: Hunt): string | null {
  const m = h.mon, d = Math.min(m.drank ?? 0, m.hp - 1); m.drank = 0;
  if (d <= 0) return null;
  m.hp -= d; h.stats.dealt += d;
  return `What it drank pours out of the sac: it loses ${d}.`;
}

export const hollowfang: MonsterDef = {
  id: 'hollowfang',
  inflicts: 'Drain',
  name: 'The Hollowfang',
  short: 'Hollowfang',
  kind: 'Cave leech',
  elem: 'Frost',
  elemental: ['Cold Bite'],
  weak: 'Ember',
  resist: 'Gale',
  hp: 640,
  tier: 2.2,
  requires: RIDGE,
  head: 'fangs',
  common: 'palehide',
  rarePart: 'fangs',
  rare: 'bloodpearl',
  habits: 'A pale, eyeless thing, half bat and half leech. It latches on and drinks, and heals what it takes. Block can’t stop a latch drinking. A blade move of 2 or more dice tears it off; with its fangs broken it can’t latch at all.',
  enragedHabit: 'Every other bite is a Blood Frenzy that heals it for half what it takes. Block starves it.',
  intro: 'Something drops from the cave roof without a sound and unfolds on the rock in front of you.',
  enrageText: 'It hisses, mouth wide. The Hollowfang is enraged!',
  parts: [
    { id: 'fangs', name: 'Fangs', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'The daze part. Break and it can’t latch', mat: 'palefang', hp: 240, brk: 'Its fangs crack off. It can’t hold on to you now.' },
    { id: 'sac', name: 'Throat Sac', eff: { Cut: 1, Blunt: 0, Pierce: 0.5 }, hint: 'Break it and it loses what it drank', mat: 'bloodsac', hp: 200, brk: 'The throat sac splits!' },
    { id: 'wings', name: 'Wings', eff: { Cut: 0.5, Blunt: 0.5, Pierce: 1 }, hint: 'Break to weaken the bite', mat: 'palewing', hp: 200, brk: 'Its wing membranes tear. It can’t lunge as hard.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, wb = m.parts.wings.broken;
    switch (type) {
      case 'bite': return { name: 'Cold Bite', text: 'It lunges, all teeth.', dmg: Math.round((enr ? 38 : 30) * (wb ? 0.75 : 1)), threat: 1 };
      case 'latch': return { name: 'Latch On', text: 'It gathers itself to leap onto you.', dmg: enr ? 26 : 20, threat: 2, note: `If it hits, it drains you for ${Math.min(LATCH_TURNS, h.arm.latchMax ?? LATCH_TURNS)} turns. A 2-dice **Cut** move tears it off` };
      case 'drink': return { name: 'Drinking', text: 'It’s clamped on, drinking.', dmg: enr ? 34 : 30, threat: 2, noGuard: true, note: `Heals what it drains · ${m.latch} turn${(m.latch ?? 0) > 1 ? 's' : ''} left. A 2-dice **Cut** move tears it off` };
      // enraged (Nov 2026): its drinking turned up, a bite that feeds it too; Block works (it isn't latched)
      case 'frenzy': return { name: 'Blood Frenzy', text: 'It lunges, jaws wide, already drinking.', dmg: Math.round((enr ? 38 : 30) * (wb ? 0.75 : 1)), threat: 2, isNew: !m.newSeen, note: 'Heals ½ of what it hits you for' };
      case 'gorged': return { name: 'Gorged', text: 'It sprawls on the rock, bloated.', dmg: 0, threat: 0, note: 'A free turn' };
      case 'torn': return { name: 'Torn off', text: 'It flops on the rock, winded.', dmg: 0, threat: 0, note: 'It loses its turn' };
      case 'dazed': return { name: 'Dazed', text: 'It twitches, mouth working at nothing.', dmg: 0, threat: 0, note: 'It loses its turn' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon;
    if ((m.latch ?? 0) > 0) return 'drink';
    if (prev === 'drink') return 'gorged';
    let t = ['bite', 'latch'][m.seq % 2]; m.seq++;
    if (t === 'latch' && m.parts.fangs.broken) t = 'bite';
    if (t === 'bite' && m.enraged) { const x = (m.extra ??= {}); x.fr = ((x.fr ?? 0) + 1) % 2; if (x.fr) { x.tk = h.stats.taken; t = 'frenzy'; } }
    return t;
  },

  resolve(h, type, landed) {
    const m = h.mon;
    switch (type) {
      case 'latch': return landed ? latchPlayer(h, LATCH_TURNS) : null;
      case 'drink': return landed ? drink(h, intentDmg(h)) : (m.latch = 0, 'It loses its grip.');
      case 'frenzy': { m.newSeen = true; const took = Math.max(0, h.stats.taken - (m.extra?.tk ?? h.stats.taken)), heal = Math.min(Math.floor(took / 2), m.max - m.hp); m.hp += heal; return heal ? `It feeds as it bites: +${heal}.` : null; }
      case 'gorged': m.drank = 0; return 'It stirs, heavy.';
      case 'torn': m.drank = 0; return 'It rights itself.';
      case 'dazed': return 'It shakes its head.';
    }
    return null;
  },

  onHit(h, mv, w) { return tearOff(h, mv, w); },

  onBreak(h, partId) {
    if (partId === 'sac') return burstSac(h);
    if (partId === 'fangs' && (h.mon.latch ?? 0) > 0) { h.mon.latch = 0; h.intent = 'torn'; return 'With its fangs gone it drops off you.'; }
    return null;
  },

  badges(h) {
    const l = h.mon.latch ?? 0;
    return l > 0 ? [{ key: 'latch', label: 'Latched on', short: `drains through **Block** · ${l} turn${l > 1 ? 's' : ''}`, cls: 'ember', desc: 'It’s clamped onto you and drains you every turn, through your **Block**, and heals what it drains. A 2-dice **Cut** move tears it off.' }] : [];
  },

  // no tip: the Drinking telegraph says how to tear it off
  tip() { return null; }
};

/** what the Drinking intent takes (the resolve needs the number it showed) */
function intentDmg(h: Hunt) { return h.mon.enraged ? 34 : 30; }
