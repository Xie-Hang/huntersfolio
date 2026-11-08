// The Feverjaw — a changed Bogjaw: Infect, Ember. The Mirewood, changed (Tier 3.2, Nov 2026). The Cut check.
// Its gut is septic: a Swallow infects you, every turn inside keeps the infection going, and a Spore Belch infects you
// from outside. Cutting your way out fast is the answer (Cut counts double), or breaking the throat sac so it can't
// swallow at all. Same body, parts and Gape → Swallow chain as the Bogjaw (bogjaw.ts); hits harder.
import type { Intent, MonsterDef } from '../../types';
import { choose, remember } from '../../behaviour';
import { infectPlayer } from '../../status';
import { carries, carryingName } from '../../util';
import { bogjaw } from './bogjaw';

const GAPE_EVERY = 3, HIT = 1.35;
const MIRE = ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass'];

export const feverjaw: MonsterDef = {
  ...bogjaw,
  id: 'feverjaw',
  variantOf: 'bogjaw',
  inflicts: 'Infect',
  name: 'The Feverjaw',
  short: 'Feverjaw',
  kind: 'Grappler',
  elem: 'Ember',
  elemental: ['Body Slam', 'Spore Belch'],
  weak: 'Stone',
  resist: 'Frost',
  hp: 820,
  tier: 3.2,
  requires: [...MIRE, 'rotcap'],
  common: 'feverskin',
  rarePart: 'warts',
  rare: 'feverstone',
  habits: 'A Bogjaw gone feverish, steaming in the warm mud. Its gut is rotten. Swallowed, you get **Infect**, and every turn inside keeps it going after you’re out. It belches spores, too. Breaking its throat sac stops the swallow.',
  enragedHabit: 'Its belches become **Spore Bursts**. **Infect** on you for 5 turns.',
  intro: 'The mud here is warm, and it stinks. A swollen, steaming jaw rises out of it.',
  enrageText: 'It belches a cloud of hot spores. The Feverjaw is enraged!',
  parts: [
    { id: 'jaw', name: 'Jaw', eff: { Cut: 0.5, Blunt: 1, Pierce: 0.5 }, hint: '**Daze** part. **Daze** here while it gapes stops the **Swallow**', mat: 'fevermolar', hp: 360, brk: 'Its jaw cracks. The bite goes slack.' },
    { id: 'sac', name: 'Throat Sac', eff: { Cut: 1, Blunt: 0, Pierce: 0.5 }, hint: 'Breaking it stops **Swallow**', mat: 'feversac', hp: 300, brk: 'The throat sac splits! It can’t swallow you any more.' },
    { id: 'warts', name: 'Fever Warts', eff: { Cut: 0, Blunt: 0.5, Pierce: 1 }, hint: 'Breaking them stops **Spore Belch**', mat: 'feverwart', hp: 280, brk: 'The swollen warts burst. No more spores.' }
  ],

  intent(h, type): Intent {
    const enr = h.mon.enraged;
    // enraged (Nov 2026): its belch turned up, a cloud that keeps you infected longer
    if (type === 'burst') return { name: 'Spore Burst', text: 'Every wart bursts at once in a hot, choking cloud.', dmg: enr ? 28 : 24, threat: 2, isNew: !h.mon.newSeen, note: 'If it hits, **Infect** on you for 5 turns. Breaking its warts stops it' };
    if (type === 'belch') return { name: 'Spore Belch', text: 'Its warts swell, and it belches a hot cloud of spores at you.', dmg: enr ? 28 : 22, threat: 1, note: 'If it hits, **Infect** on you for 3 turns' };
    const r = bogjaw.intent.call(this, h, type);
    const out = r.dmg ? { ...r, dmg: Math.round(r.dmg * HIT) } : r;
    if (type === 'swallow') return { ...out, note: 'Swallowed. 2 dice stuck, and **Infect** on you until you’re out' };
    if (type === 'digest') return { ...out, note: `${Math.max(0, h.mon.gutHp ?? 0)} left to cut free. **Infect** stays on you inside` };
    return out;
  },

  next(h, prev) {
    const m = h.mon, threat = (a: string) => this.intent(h, a).threat;
    if ((m.gut ?? 0) > 0) return remember(h, 'digest');
    if (prev === 'gape') { m.lastChain = h.turn; return remember(h, m.parts.sac.broken ? 'snap' : 'swallow'); }
    if (prev === null) return remember(h, 'belch');
    const sinceGape = h.turn - (m.lastChain ?? -GAPE_EVERY);
    const pick = choose(h, [['lash', 2], ['slam', 2], ['belch', m.parts.warts.broken ? 0 : 2], ['gape', sinceGape >= GAPE_EVERY ? 3 : 0]], threat);
    // enraged: its belches become Spore Bursts (never two in a row)
    return remember(h, pick === 'belch' && m.enraged && prev !== 'burst' ? 'burst' : pick);
  },

  resolve(h, type, landed) {
    const enr = h.mon.enraged;
    if (type === 'belch') return landed ? infectPlayer(h, 3, enr ? 12 : 10) : null;
    if (type === 'burst') { h.mon.newSeen = true; return landed ? infectPlayer(h, 5, enr ? 12 : 10) : null; }
    if (type === 'digest') return infectPlayer(h, 2, enr ? 14 : 12);
    const line = bogjaw.resolve.call(this, h, type, landed);
    if (type === 'swallow' && landed) return `${line} ${infectPlayer(h, 3, enr ? 14 : 12) ?? ''}`.trim();
    return line;
  },

  tip(h, type) {
    if ((h.mon.gut ?? 0) > 0) return carries(h, 'Cut') ? `**Cut** counts double toward cutting free (${carryingName(h, 'Cut')}).` : 'Every hit counts toward cutting free. **Cut** counts double.';
    return bogjaw.tip!.call(this, h, type);
  }
};
