// The Fenmother — the rank E → D promotion hunt (Nov 2026, the rank ladder). Ember; weak to Stone.
// The oldest thing in the Mirewood: a vast steaming hot-spring toad. An exam of the Mirewood's lessons at once:
//   Gape → Swallow like the Bogjaw: two dice stuck until you cut free (Cut counts double); breaking the Throat
//   Sac (Cut) stops it; a Smoke Pouch makes it miss.
//   Gills heal it every turn like the Emberwhelk, until the Gills (Pierce) break.
//   The Head (Blunt) is the daze part, like the Duskheron's heads: a daze during the Gape cancels the Swallow.
//   At half HP the steam rises, like the Mistglass's images: for 3 turns only your first hit each turn lands;
//   afterwards it raises the steam again every few turns (2 turns).
// With two weapons you can't shut all three down, so you choose which threat to stop first.
import type { Intent, MonsterDef } from '../../types';
import { choose, remember } from '../../behaviour';
import { swallowPlayer } from '../../combat';
import { carries, carryingName } from '../../util';

const GAPE_EVERY = 3, STEAM_EVERY = 5, HEAL = 18, HEAL_ENR = 24, HIT = 1.15;
const MIRE = ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass'];

export const fenmother: MonsterDef = {
  id: 'fenmother',
  name: 'The Fenmother',
  short: 'Fenmother',
  kind: 'Hot-spring toad · Promotion hunt',
  elem: 'Ember',
  elemental: ['Scalding Belch'],
  weak: 'Stone',
  resist: 'Frost',
  hp: 940,
  tier: 2.4,
  promotion: 'D',
  requires: MIRE,
  head: 'head',
  common: 'fenhide',
  rarePart: 'head',
  rare: 'fenpearl',
  habits: 'The test of every Mirewood lesson. It swallows you whole (cut your way out, or break its throat sac), its gills heal it every turn (break them), a blow to its head while it gapes stops the swallow, and at half HP its steam rises: then only your first hit each turn lands. Two weapons can’t answer all of it. Choose.',
  intro: 'The hot spring heaves. A toad the size of a hut rises out of the steam, gills fanning.',
  enrageText: 'It roars, and the spring boils over. The Fenmother is enraged!',
  parts: [
    { id: 'sac', name: 'Throat Sac', eff: { Cut: 1, Blunt: 0, Pierce: 0.5 }, hint: 'Break it to stop the Swallow', mat: 'fensac', hp: 300, brk: 'The throat sac splits! It can’t swallow you any more.' },
    { id: 'gills', name: 'Gills', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Break them to stop it healing', mat: 'fengill', hp: 260, brk: 'The gills tear and go grey. It can’t heal any more.' },
    { id: 'head', name: 'Head', eff: { Cut: 0.5, Blunt: 1, Pierce: 0.5 }, hint: 'The daze part. A daze during the Gape stops the Swallow', mat: 'fenskull', hp: 320, brk: 'Its skull cracks. Its bellow turns to a wheeze.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, sac = m.parts.sac.broken;
    switch (type) {
      case 'lash': return { name: 'Tongue Lash', text: 'Its tongue whips out of the steam.', dmg: enr ? 32 : 26, threat: 1 };
      case 'belch': return { name: 'Scalding Belch', text: 'Its throat swells and glows. It belches boiling water at you.', dmg: enr ? 52 : 42, threat: 2 };
      case 'gape': return { name: 'Gape', text: 'It opens its jaws wide. The spring pours into its throat.', dmg: 0, threat: 0, note: sac ? 'A Snap is coming next turn' : 'Swallows you next turn. Daze the head to stop it' };
      case 'swallow': return { name: 'Swallow', text: 'It lunges to swallow you whole!', dmg: enr ? 48 : 40, threat: 3, note: 'Two of your dice get stuck inside until you cut free' };
      case 'snap': return { name: 'Snap', text: 'It snaps its torn throat shut on empty steam.', dmg: enr ? 34 : 28, threat: 2 };
      case 'digest': return { name: 'Digest', text: 'You’re inside, in the heat. The walls squeeze.', dmg: enr ? 20 : 16, threat: 1, note: `Cut your way out: ${Math.max(0, m.gutHp ?? 0)} left (Cut counts double, Blunt half)` };
      case 'steam': return { name: 'Steam Cloud', text: 'It sinks into the spring and the steam rolls over everything.', dmg: 0, threat: 0, note: 'For 2 turns, only your first hit each turn lands' };
      case 'dazed': return { name: 'Dazed', text: 'It sways, eyes rolling, steam leaking from its jaws.', dmg: 0, threat: 0, note: 'Its action is lost' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon, threat = (a: string) => this.intent(h, a).threat;
    if ((m.gut ?? 0) > 0) return remember(h, 'digest');
    if (prev === 'gape') { m.lastChain = h.turn; return remember(h, m.parts.sac.broken ? 'snap' : 'swallow'); }
    if (prev === null) return remember(h, 'lash');
    const sinceGape = h.turn - (m.lastChain ?? -GAPE_EVERY), sinceSteam = h.turn - (m.lastSplit ?? -STEAM_EVERY);
    const steaming = (m.mirage ?? 0) > 0;
    return remember(h, choose(h, [['lash', 3], ['belch', 2], ['gape', sinceGape >= GAPE_EVERY ? 3 : 0], ['steam', m.enraged && !steaming && sinceSteam >= STEAM_EVERY ? 4 : 0]], threat));
  },

  resolve(h, type, landed) {
    const m = h.mon, lines: string[] = [];
    m.hits = 0;
    if ((m.mirage ?? 0) > 0) { m.mirage!--; if (!m.mirage) lines.push('The steam thins. You can see it clearly again.'); }
    if (type === 'swallow') {
      if (!landed) lines.push('Its jaws close on smoke. You slip away.');
      else { swallowPlayer(h, 2); lines.push('It swallows you whole! Two of your dice are stuck inside. Cut your way out.'); }
    }
    if (type === 'steam') { m.mirage = 2; m.lastSplit = h.turn; lines.push('Steam rolls over the spring. For 2 turns, only your first hit each turn lands.'); }
    if (!m.parts.gills.broken && m.hp > 0) {
      const heal = Math.min(m.enraged ? HEAL_ENR : HEAL, m.max - m.hp);
      if (heal > 0) { m.hp += heal; lines.push(`Its gills fan the steam. It heals ${heal}.`); }
    }
    if (type === 'dazed') lines.push('It shakes the steam from its head.');
    return lines.join(' ') || null;
  },

  // half HP: the steam rises for the first time
  onPhase(h) { h.mon.mirage = 3; h.mon.lastSplit = h.turn; return 'The spring boils and the steam rises. For 3 turns, only your first hit each turn lands.'; },

  dodge(h) {
    const m = h.mon;
    if ((m.mirage ?? 0) > 0 && (m.hits ?? 0) > 0) return 'Your blow cuts through steam. It’s gone deeper into the cloud.';
    m.hits = (m.hits ?? 0) + 1;
    return null;
  },

  badges(h) {
    const s = h.mon.mirage ?? 0;
    return s > 0 ? [{ key: 'steam', label: 'Steam', short: `only your 1st hit lands · ${s} turn${s > 1 ? 's' : ''}`, cls: 'ice', desc: 'The steam hides it: only your first hit each turn lands. Make that hit count (charge it).' }] : [];
  },

  tip(h, type) {
    const m = h.mon;
    if ((m.gut ?? 0) > 0) return carries(h, 'Cut') ? `You’re swallowed. Hit it with your ${carryingName(h, 'Cut')}: Cut counts double toward cutting free.` : 'You’re swallowed. Every hit counts toward cutting free: Cut counts double, Blunt only half.';
    if ((m.mirage ?? 0) > 0) return h.chargeReady ? 'Your charge is ready. Make it your first hit: only the first one lands in the steam.' : 'In the steam only your first hit each turn lands. Charge, then strike once, hard.';
    if (type === 'gape') {
      if (h.item === 'smoke' && h.itemCharges > 0) return 'Throw the Smoke Pouch now and the Swallow misses.';
      return carries(h, 'Blunt') ? `Daze the head with your ${carryingName(h, 'Blunt')} to stop the Swallow, or guard hard.` : 'It’s about to swallow you. Guard, or break the throat sac.';
    }
    if (!m.parts.gills.broken && carries(h, 'Pierce')) return `Its gills heal it every turn. Break them with your ${carryingName(h, 'Pierce')}.`;
    return null;
  }
};

// every hit tuned up by HIT (tuned in the sim: weakness gear at +2 should win most hunts, not all of them)
const rawIntent = fenmother.intent;
fenmother.intent = function (h, type) { const r = rawIntent.call(this, h, type); return r.dmg ? { ...r, dmg: Math.round(r.dmg * HIT) } : r; };
