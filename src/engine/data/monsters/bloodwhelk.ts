// The Bloodwhelk — a changed Emberwhelk: Drain, Stone. The Mirewood, changed (Tier 3.2, Nov 2026). The Pierce check.
// Its slime drinks instead of burning: for 3 turns after Leeching Slime lands, it takes HP from you (guard can't stop
// it) and heals that much, on top of the healing from its gills. Breaking the gills stops both its healing and the
// slime's drinking (the slime still stings); breaking the foot stops the slime. Same body, shell and Rear → Lunge chain
// as the Emberwhelk (emberwhelk.ts).
import type { Intent, MonsterDef } from '../../types';
import { carries, carryingName } from '../../util';
import { emberwhelk } from './emberwhelk';

const HIT = 1.35, LEECH_TURNS = 3;
const MIRE = ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass'];

export const bloodwhelk: MonsterDef = {
  ...emberwhelk,
  id: 'bloodwhelk',
  variantOf: 'emberwhelk',
  inflicts: 'Drain',
  name: 'The Bloodwhelk',
  short: 'Bloodwhelk',
  kind: 'Regenerator',
  elem: 'Stone',
  elemental: ['Spit Grit', 'Shell Lunge'],
  weak: 'Gale',
  resist: 'Ember',
  hp: 760,
  tier: 3.2,
  requires: [...MIRE, 'hollowfang'],
  common: 'bloodscale',
  rarePart: 'shell',
  rare: 'heartpearl',
  habits: 'An Emberwhelk whose fire has gone out and whose slime has turned red. The slime clings and drains you for a few turns, through your **Block**, and heals the snail. Its gills heal it too. Breaking its gills stops all its healing.',
  enragedHabit: 'Its slime comes as a **Blood Tide** that drains you for longer.',
  intro: 'A dark shell slides out of the reeds on a trail of red slime.',
  enrageText: 'Its slime runs thick and dark. The Bloodwhelk is enraged!',
  parts: [
    { id: 'gills', name: 'Gills', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Breaking them stops all its healing', mat: 'bloodgill', hp: 210, brk: 'The gills tear and go grey. It can’t heal any more, and the slime can’t feed it.' },
    { id: 'shell', name: 'Shell', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: '**Daze** part. Breaking it stops **Shell Retreat**', mat: 'bloodshell', hp: 360, brk: 'The shell cracks open. It has nowhere left to hide.' },
    { id: 'foot', name: 'Foot', eff: { Cut: 1, Blunt: 0.5, Pierce: 0 }, hint: 'Breaking it stops **Leeching Slime**', mat: 'bloodfoot', hp: 300, brk: 'Its foot splits. The slime stops flowing.' }
  ],

  intent(h, type): Intent {
    const r = emberwhelk.intent.call(this, h, type);
    const out = r.dmg ? { ...r, dmg: Math.round(r.dmg * HIT) } : r;
    if (type === 'spit') return { ...out, name: 'Spit Grit', text: 'It hawks a gob of grit and red slime.' };
    // enraged (Nov 2026): its slime turned up, a tide that drinks for longer
    if (type === 'tide') { const s = emberwhelk.intent.call(this, h, 'slime'); return { name: 'Blood Tide', text: 'A wave of red slime rolls over you.', dmg: Math.round(s.dmg * HIT), threat: 2, isNew: !h.mon.newSeen, note: h.arm.leechProof ? 'Your armour keeps the slime off' : `Then drains you ${LEECH_TURNS + 2} turns, through your **Block**. Breaking its gills stops the healing` }; }
    if (type === 'slime') return { ...out, name: 'Leeching Slime', text: 'It surges forward on a wave of red slime.', note: h.arm.leechProof ? 'Your armour keeps the slime off' : `Then drains you ${LEECH_TURNS} turns, through your **Block**` };
    return out;
  },

  // its own turn order is the Emberwhelk's, except that enraged, its slime comes as a Blood Tide (never two in a row)
  next(h, prev) {
    const BASE = ['spit', 'slime', 'retreat', 'rear', 'lunge', 'dazed'];
    let t = emberwhelk.next.call(this, h, prev);
    if (!BASE.includes(t)) t = 'spit'; // (only the Emberwhelk's own moves: any newer ones of its are its own)
    return t === 'slime' && h.mon.enraged && prev !== 'tide' ? 'tide' : t;
  },

  resolve(h, type, landed) {
    const m = h.mon, lines: string[] = [];
    if (type === 'tide') m.newSeen = true;
    if (type === 'tide' && landed && !h.arm.leechProof) { m.slime = LEECH_TURNS + 2; (h.feats ??= []).includes('leeched') || h.feats.push('leeched'); lines.push('Red slime washes over you and clings.'); }
    else if (type === 'slime' && landed && !h.arm.leechProof) { m.slime = LEECH_TURNS; (h.feats ??= []).includes('leeched') || h.feats.push('leeched'); lines.push('Red slime clings to you.'); }
    else if ((m.slime ?? 0) > 0) {
      // the slime drinks; it never knocks you out on its own. Broken gills: it still stings, but feeds nothing back
      const take = Math.min(m.enraged ? 16 : 12, h.php - 1);
      if (take > 0) {
        h.php -= take; h.stats.taken += take;
        const heal = m.parts.gills.broken ? 0 : Math.min(take, m.max - m.hp); m.hp += heal;
        lines.push(heal ? `The slime drinks ${take} from you. It heals ${heal}.` : `The slime stings you for ${take}.`);
      }
      m.slime!--;
    }
    if (type === 'retreat') { m.shell = 1; const heal = Math.min(40, m.max - m.hp); m.hp += heal; lines.push(`It heals ${heal} inside its shell.`); }
    if (!m.parts.gills.broken && m.hp > 0) {
      const heal = Math.min(m.enraged ? 26 : 18, m.max - m.hp);
      if (heal > 0) { m.hp += heal; lines.push(`Its gills flare. It heals ${heal}.`); }
    }
    if (type === 'dazed') lines.push('Its eye stalks lift again.');
    return lines.join(' ') || null;
  },

  badges(h) {
    const s = h.mon.slime ?? 0;
    return s > 0 ? [{ key: 'leech', n: s, label: 'Leeching', short: `drains through **Block** · ${s} turn${s > 1 ? 's' : ''}`, cls: 'ember', desc: 'It heals what it drains.\nBreaking its gills stops the healing for good.' }] : [];
  },

  tip(h, type) {
    if (!h.mon.parts.gills.broken && carries(h, 'Pierce')) return `Breaking its gills with your ${carryingName(h, 'Pierce')} stops the healing.`;
    return emberwhelk.tip!.call(this, h, type);
  }
};
