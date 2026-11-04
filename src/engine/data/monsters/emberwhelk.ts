// The Emberwhelk — T2 Ember regenerator of the Mirewood. The Pierce check.
// A giant snail with a molten shell. While its gills are intact it heals every turn, so the fight is a race to
// break the gills: Pierce's Expose (×2 toward breaks) gets there fastest.
//   Spit Cinders; Molten Slime (a hit, then the slime burns you for 2 turns); Shell Retreat (it pulls in: your hits
//   deal half until its next action, and it heals); Rears Back → Shell Lunge (the big hit).
// Tuned by simulation (6 Nov 2026, casual): neutral gear 87% with a Pierce weapon (bow + maul), 52% without
// (regen softened from 18 to 15 after a Tier 1+2 campaign sim showed casual players stalling here).
// Parts: Gills (Pierce; stops the healing), Shell (Blunt; the daze part; stops Shell Retreat; rare Ember Pearl),
// Foot (Cut; stops Molten Slime).
import type { Intent, MonsterDef } from '../../types';
import { choose, remember } from '../../behaviour';
import { carries, carryingName } from '../../util';

const REAR_EVERY = 4, SLIME_TURNS = 2;

export const emberwhelk: MonsterDef = {
  id: 'emberwhelk',
  name: 'The Emberwhelk',
  short: 'Emberwhelk',
  kind: 'Regenerator',
  elem: 'Ember',
  weak: 'Stone',
  resist: 'Frost',
  hp: 460,
  tier: 2,
  requires: ['gorehorn', 'galeshrike', 'cinderback', 'rimetail'],
  head: 'shell',
  common: 'whelkscale',
  rarePart: 'shell',
  rare: 'emberpearl',
  habits: 'A snail the size of a cart, its shell glowing like a forge. Frilled gills behind its head heal it every turn, so a long fight is a losing one. Break the gills first. It pulls into its shell when hurt, and its slime burns.',
  intro: 'Steam rises from the bog. A glowing shell slides out of the mist on a trail of hissing slime.',
  enrageText: 'Its shell flares white-hot. The Emberwhelk is enraged!',
  parts: [
    { id: 'gills', name: 'Gills', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Break them to stop it healing', mat: 'whelkgill', hp: 150, brk: 'The gills tear and go grey. It can’t heal any more.' },
    { id: 'shell', name: 'Shell', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'The daze part. Break it to stop Shell Retreat', mat: 'whelkshell', hp: 260, brk: 'The shell cracks open. It has nowhere left to hide.' },
    { id: 'foot', name: 'Foot', eff: { Cut: 1, Blunt: 0.5, Pierce: 0 }, hint: 'Break it to stop the Molten Slime', mat: 'whelkfoot', hp: 220, brk: 'Its foot splits. The slime stops flowing.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged;
    switch (type) {
      case 'spit': return { name: 'Spit Cinders', text: 'It hawks a gob of glowing cinders.', dmg: enr ? 28 : 22, threat: 1 };
      case 'slime': return { name: 'Molten Slime', text: 'It surges forward on a wave of burning slime.', dmg: enr ? 20 : 16, threat: 2, note: `Then the slime burns you for ${SLIME_TURNS} turns` };
      case 'retreat': return { name: 'Shell Retreat', text: 'It pulls back into its shell, hissing.', dmg: 0, threat: 0, note: 'Your hits deal half until it comes out. It heals 30' };
      case 'rear': return { name: 'Rears Back', text: 'It rears up, shell tilted forward like a battering ram.', dmg: 0, threat: 0, note: 'Shell Lunge next turn' };
      case 'lunge': return { name: 'Shell Lunge', text: 'It throws the whole molten shell at you!', dmg: enr ? 48 : 40, threat: 3 };
      case 'dazed': return { name: 'Dazed', text: 'It sways, its eye stalks drooping.', dmg: 0, threat: 0, note: 'Its action is lost' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon;
    if ((m.shell ?? 0) > 0 && prev !== 'retreat') m.shell = 0; // it comes back out after one of your turns
    if (prev === 'rear') { m.lastChain = h.turn; return remember(h, 'lunge'); }
    if (prev === null) return remember(h, 'spit');
    const since = h.turn - (m.lastChain ?? -REAR_EVERY);
    const hurt = m.hp < m.max * 0.7;
    return remember(h, choose(h, [
      ['spit', 3],
      ['slime', m.parts.foot.broken ? 0 : 2],
      ['retreat', !m.parts.shell.broken && hurt && prev !== 'retreat' ? 2 : 0],
      ['rear', since >= REAR_EVERY ? 3 : 0]
    ], a => this.intent(h, a).threat));
  },

  resolve(h, type, landed) {
    const m = h.mon, lines: string[] = [];
    if (type === 'slime' && landed) { m.slime = SLIME_TURNS; lines.push('Burning slime clings to you.'); }
    else if ((m.slime ?? 0) > 0) {
      // the slime keeps burning after the turn it landed; it never knocks you out on its own
      const burn = Math.min(h.arm.burnproof ? 4 : 8, h.php - 1);
      if (burn > 0) { h.php -= burn; h.stats.taken += burn; lines.push(`The slime burns you for ${burn}.`); }
      m.slime!--;
    }
    if (type === 'retreat') { m.shell = 1; const heal = Math.min(30, m.max - m.hp); m.hp += heal; lines.push(`It heals ${heal} inside its shell.`); }
    if (!m.parts.gills.broken && m.hp > 0) {
      const heal = Math.min(m.enraged ? 22 : 15, m.max - m.hp);
      if (heal > 0) { m.hp += heal; lines.push(`Its gills flare. It heals ${heal}.`); }
    }
    if (type === 'dazed') lines.push('Its eye stalks lift again.');
    return lines.join(' ') || null;
  },

  hitMod(h) {
    return (h.mon.shell ?? 0) > 0 ? { mult: 0.5, note: 'in its shell ½' } : null;
  },

  tip(h, type) {
    const m = h.mon;
    if (!m.parts.gills.broken) return carries(h, 'Pierce')
      ? `It heals every turn while its gills are intact. Expose them with your ${carryingName(h, 'Pierce')} and break them fast.`
      : 'It heals every turn while its gills are intact. Break the gills first.';
    if (type === 'retreat') return 'It’s pulling into its shell: your hits deal half next turn. A good turn to guard or charge.';
    if (type === 'rear') return 'A Shell Lunge is coming. Guard, or daze it through the shell.';
    return null;
  }
};
