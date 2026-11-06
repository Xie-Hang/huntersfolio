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
  habits: 'An Emberwhelk whose fire has gone out and whose slime has turned red. The slime clings and drinks: for a few turns it takes HP from you, past your block, and heals the snail. Its gills heal it too. Break the gills and it can’t keep anything it takes.',
  intro: 'A dark shell slides out of the reeds on a trail of red slime.',
  enrageText: 'Its slime runs thick and dark. The Bloodwhelk is enraged!',
  parts: [
    { id: 'gills', name: 'Gills', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Break them: it stops healing, and the slime can’t feed it', mat: 'bloodgill', hp: 210, brk: 'The gills tear and go grey. It can’t heal any more, and the slime can’t feed it.' },
    { id: 'shell', name: 'Shell', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'The daze part. Break it to stop Shell Retreat', mat: 'bloodshell', hp: 360, brk: 'The shell cracks open. It has nowhere left to hide.' },
    { id: 'foot', name: 'Foot', eff: { Cut: 1, Blunt: 0.5, Pierce: 0 }, hint: 'Break it to stop the Leeching Slime', mat: 'bloodfoot', hp: 300, brk: 'Its foot splits. The slime stops flowing.' }
  ],

  intent(h, type): Intent {
    const r = emberwhelk.intent.call(this, h, type);
    const out = r.dmg ? { ...r, dmg: Math.round(r.dmg * HIT) } : r;
    if (type === 'spit') return { ...out, name: 'Spit Grit', text: 'It hawks a gob of grit and red slime.' };
    if (type === 'slime') return { ...out, name: 'Leeching Slime', text: 'It surges forward on a wave of red slime.', note: h.arm.leechProof ? 'Your armor keeps the slime off' : `Then it drinks ${LEECH_TURNS} turns, past your block` };
    return out;
  },

  resolve(h, type, landed) {
    const m = h.mon, lines: string[] = [];
    if (type === 'slime' && landed && !h.arm.leechProof) { m.slime = LEECH_TURNS; (h.feats ??= []).includes('leeched') || h.feats.push('leeched'); lines.push('Red slime clings to you.'); }
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
    return s > 0 ? [{ key: 'leech', label: 'Leeching', short: `${s} turn${s > 1 ? 's' : ''}`, cls: 'ember', desc: 'Its slime is drinking from you each turn, past your block, and healing it. Breaking the gills stops it feeding.' }] : [];
  },

  tip(h, type) {
    if (!h.mon.parts.gills.broken && carries(h, 'Pierce')) return `Break the gills (${carryingName(h, 'Pierce')}): no more healing.`;
    return emberwhelk.tip!.call(this, h, type);
  }
};
