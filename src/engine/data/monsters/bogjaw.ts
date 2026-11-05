// The Bogjaw — T2 Stone grappler of the Mirewood. The Cut check.
// Weighted behaviour (Tier 2): Tongue Lash and Body Slam, and every few turns Gape → Swallow.
//   Swallow: 30 damage and 2 of your dice are stuck in its gut until you cut free (60 damage; Cut counts double,
//   Blunt half). Each turn inside it Digests you (18). Answers: a Blunt daze on the jaw during Gape cancels the Swallow;
//   a Smoke Pouch makes the Swallow miss; breaking the Throat Sac turns the Swallow into a plain Snap.
// Parts: Jaw (Blunt; the daze part), Throat Sac (Cut; stops the Swallow), Stone Warts (Pierce; rare Mirestone).
// Tuned by simulation (5 Nov 2026, end-of-Ashfall gear): casual 93% with a Cut weapon, 72% without, 100% in its own gear.
import type { Intent, MonsterDef } from '../../types';
import { choose, remember } from '../../behaviour';
import { swallowPlayer } from '../../combat';
import { carries, carryingName } from '../../util';

const GAPE_EVERY = 3; // turns between Gapes (the chain is committed once it starts)

export const bogjaw: MonsterDef = {
  id: 'bogjaw',
  name: 'The Bogjaw',
  short: 'Bogjaw',
  kind: 'Grappler',
  elem: 'Stone',
  // its elemental attacks: only these are reduced by armor that resists Stone; the rest are physical
  elemental: ['Body Slam'],
  weak: 'Gale',
  resist: 'Ember',
  hp: 500,
  tier: 2,
  requires: ['cragwing'], // rank E: the Cragwing promotion opens the Mirewood (Nov 2026)
  head: 'jaw',
  common: 'bogskin',
  rarePart: 'warts',
  rare: 'mirestone',
  habits: 'Lies half-sunk in the mire with its mouth open. Every few turns it gapes wide and swallows its prey whole: two of your dice are stuck inside until you cut your way out. A heavy blow to the jaw while it gapes makes it choke on the swallow.',
  intro: 'The mire bubbles. Two eyes rise from the mud, then a mouth wide enough to swallow you.',
  enrageText: 'It bellows, and the whole bog shakes. The Bogjaw is enraged!',
  parts: [
    { id: 'jaw', name: 'Jaw', eff: { Cut: 0.5, Blunt: 1, Pierce: 0.5 }, hint: 'The daze part. Daze it while it gapes', mat: 'bogmolar', hp: 260, brk: 'Its jaw cracks. The bite goes slack.' },
    { id: 'sac', name: 'Throat Sac', eff: { Cut: 1, Blunt: 0, Pierce: 0.5 }, hint: 'Break it to stop the Swallow', mat: 'throatsac', hp: 220, brk: 'The throat sac splits! It can’t swallow you any more.' },
    { id: 'warts', name: 'Stone Warts', eff: { Cut: 0, Blunt: 0.5, Pierce: 1 }, hint: 'Break to weaken its Body Slam', mat: 'wartstone', hp: 200, brk: 'The stone warts crack off its back. Its slams lose their weight.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, sac = m.parts.sac.broken, warts = m.parts.warts.broken, jaw = m.parts.jaw.broken;
    switch (type) {
      case 'lash': return { name: 'Tongue Lash', text: 'Its tongue uncoils, slick with mud.', dmg: enr ? 26 : 20, threat: 1 };
      case 'slam': return { name: 'Body Slam', text: 'It heaves its bulk out of the mire to crush you.', dmg: warts ? (enr ? 48 : 38) : (enr ? 78 : 64), threat: 2 };
      case 'gape': return { name: 'Gape', text: 'It opens its jaws impossibly wide. The mire drains into its throat.', dmg: 0, threat: 0, note: sac ? 'A Snap is coming next turn' : 'Swallows you next turn. Daze the jaw to stop it' };
      case 'swallow': return { name: 'Swallow', text: 'It lunges, jaws wide open, to swallow you whole!', dmg: jaw ? (enr ? 28 : 22) : (enr ? 42 : 36), threat: 3, note: 'Two of your dice get stuck inside until you cut free' };
      case 'snap': return { name: 'Snap', text: 'It lunges and snaps its torn throat shut on empty air.', dmg: enr ? 30 : 24, threat: 2 };
      case 'digest': return { name: 'Digest', text: 'You’re inside. The walls of its gut squeeze.', dmg: enr ? 18 : 14, threat: 1, note: `Cut your way out: ${Math.max(0, m.gutHp ?? 0)} left (Cut counts double, Blunt half)` };
      case 'dazed': return { name: 'Dazed', text: 'It sways, jaw hanging, eyes rolling.', dmg: 0, threat: 0, note: 'Its action is lost' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon, threat = (a: string) => this.intent(h, a).threat;
    if ((m.gut ?? 0) > 0) return remember(h, 'digest');
    if (prev === 'gape') { m.lastChain = h.turn; return remember(h, m.parts.sac.broken ? 'snap' : 'swallow'); }
    if (prev === null) return remember(h, 'lash');
    const sinceGape = h.turn - (m.lastChain ?? -GAPE_EVERY);
    return remember(h, choose(h, [['lash', 3], ['slam', 2], ['gape', sinceGape >= GAPE_EVERY ? 3 : 0]], threat));
  },

  resolve(h, type, landed) {
    switch (type) {
      case 'swallow':
        if (!landed) return 'Its jaws close on smoke. You slip away.';
        swallowPlayer(h, 2);
        return 'It swallows you whole! Two of your dice are stuck inside. Cut your way out.';
      case 'gape': return null;
      case 'dazed': return 'It shakes the mud from its head.';
    }
    return null;
  },

  tip(h, type) {
    const m = h.mon;
    if ((m.gut ?? 0) > 0) return carries(h, 'Cut')
      ? `You’re swallowed. Hit it with your ${carryingName(h, 'Cut')}: Cut counts double toward cutting free.`
      : 'You’re swallowed. Every hit counts toward cutting free: Cut counts double, Blunt only half.';
    if (type === 'gape') {
      if (h.item === 'smoke' && h.itemCharges > 0) return 'Throw the Smoke Pouch now and the Swallow misses.';
      return carries(h, 'Blunt') ? `Daze the jaw with your ${carryingName(h, 'Blunt')} to stop the Swallow, or guard hard.` : 'It’s about to swallow you. Guard, or break the throat sac.';
    }
    if (!m.parts.sac.broken && carries(h, 'Cut')) return `Your ${carryingName(h, 'Cut')} can break the throat sac and end the Swallow for good.`;
    return null;
  }
};
