// The Rimeshrike — a Frost Galeshrike, one of the four changed Ashfall Ridge monsters (variants, Nov 2026).
// The Galeshrike taught "bring a bow for the flight"; this one also locks ice over its feathers when it lands, and
// arrows glance off. So the fight alternates: bow while it flies, melee while it's shrouded. The Swap check.
// Pattern as the Galeshrike: Rake → Take off → Hail Buffet → Circle → Frost Dive → Stuck, repeating.
//   In the air (2 turns, 1 with wings broken): only Pierce reaches it.
//   Frost Shroud: when it dives and lands, its next 2 ground actions only Cut and Blunt reach it. Breaking the crest
//   ends the shroud for good. Brought down by a Net or a Pinning Shot, it lands unshrouded.
// Parts: Wings (Pierce; shorter flights), Talons (Cut; weaker rake and dive), Crest (Blunt, ground only; no shroud).
import type { Intent, MonsterDef } from '../../types';
import { carries, carryingName, dazeTag } from '../../util';
import { airTurns } from './galeshrike';

export const SHROUD_TURNS = 3;

export const rimeshrike: MonsterDef = {
  id: 'rimeshrike',
  variantOf: 'galeshrike',
  name: 'The Rimeshrike',
  short: 'Rimeshrike',
  flier: true,
  kind: 'Hail raptor',
  elem: 'Frost',
  elemental: ['Frost Dive'],
  weak: 'Ember',
  resist: 'Gale',
  hp: 870,
  tier: 2.5,
  requires: ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass'],
  head: 'crest',
  common: 'rimeplume',
  rarePart: 'crest',
  rare: 'haileye',
  habits: 'A Galeshrike iced over from crest to tail. In the air only bows reach it. When it dives and lands, ice locks over its feathers for two of its actions and arrows glance off: only Cut and Blunt reach it then.',
  enragedHabit: 'On the ground under its ice, it sheds a Frost Flare and the ice grows back: arrows glance off for longer.',
  intro: 'Hail rattles across the ridge. A pale shrike settles on a frozen boulder, feathers clinking like glass.',
  enrageText: 'Sleet whirls off its wings. The Rimeshrike is enraged!',
  parts: [
    { id: 'wings', name: 'Wings', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Breaking them shortens its time in the air', mat: 'rimepinion', hp: 310, brk: 'A wing cracks! It can’t stay aloft for long now.' },
    { id: 'talons', name: 'Talons', eff: { Cut: 1, Blunt: 0.5, Pierce: 0.5 }, hint: 'Breaking them weakens its rake and dive', mat: 'icetalon', hp: 360, brk: 'An icy talon shatters. Its strikes lose their bite.' },
    { id: 'crest', name: 'Crest', eff: { Cut: 0, Blunt: 1, Pierce: 0.5 }, hint: 'On the ground only. Breaking it ends **Frost-shrouded** for good', mat: 'rimecrest', hp: 340, brk: 'The crest splits and the frost drains out of its feathers. No more shroud.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged, tb = m.parts.talons.broken;
    switch (type) {
      case 'rake': return { name: 'Icicle Rake', text: tb ? 'It hops forward, slashing with its one good foot.' : 'It hops forward, iced talons spread wide.', dmg: tb ? 26 : 37, threat: 2 };
      case 'takeoff': { const n = airTurns(h); return { name: 'Taking off', text: 'It shakes the ice off its wings and leaps into the wind.', dmg: 0, threat: 0, note: `Still on the ground now. After your turn it's airborne for ${n} turn${n > 1 ? 's' : ''}: only bows reach it then` }; }
      case 'gust': return { name: 'Hail Buffet', text: 'It beats its wings and drives a sheet of hail at you.', dmg: enr ? 48 : 39, threat: 2, halfGuard: true, note: 'Your **Block** is ½' };
      case 'circle': return { name: 'Circling high', text: 'It climbs into a wide circle, frost trailing from its wings.', dmg: 0, threat: 0, note: 'Dives next turn' };
      case 'dive': return { name: 'Frost Dive', text: 'It folds its wings and drops, wrapped in freezing air!', dmg: tb ? (enr ? 88 : 78) : (enr ? 112 : 100), threat: enr ? 4 : 3, note: m.parts.crest.broken ? 'Then it’s stuck for a turn' : 'Then it’s stuck, and **Frost-shrouded**' };
      // enraged (Nov 2026): its ice shroud turned up, shed as shards and grown back thicker
      case 'flare': return { name: 'Frost Flare', text: 'It shrugs, and ice shards burst off its feathers.', dmg: 30, threat: 2, isNew: !m.newSeen, note: 'Its ice regrows and it stays down a turn longer. **Cut**/**Blunt** only' };
      case 'stuck': return { name: 'Beak stuck', text: 'Its beak is buried in the frozen ground. It thrashes to pull free.', dmg: 0, threat: 0, note: 'On the ground' };
      case 'crashed': return { name: 'Brought down', text: 'It crashes to the ground in a spray of ice.', dmg: 0, threat: 0, note: 'On the ground, shroud gone. It loses its turn' };
      case 'dazed': return { name: 'Dazed', text: 'It reels, eyes unfocused, swaying on its feet.', dmg: 0, threat: 0, note: 'It loses its turn' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon;
    if (prev === 'circle') return 'dive';
    if (prev === 'dive') return 'stuck';
    if (prev === 'flare') return 'rake'; // it stays down under the fresh ice a turn longer
    if (m.air) { if (m.airLeft > 1) { m.airLeft--; return 'gust'; } return 'circle'; }
    let t = ['rake', 'takeoff'][m.seq % 2]; m.seq++;
    if (t === 'rake' && m.enraged && (m.shroud ?? 0) > 0 && !m.parts.crest.broken) t = 'flare';
    return t;
  },

  resolve(h, type) {
    const m = h.mon;
    // a ground action uses up a turn of the shroud
    const thaw = () => { if ((m.shroud ?? 0) > 0) { m.shroud = (m.shroud ?? 0) - 1; if (!m.shroud) return ' The ice on its feathers thaws.'; } return ''; };
    switch (type) {
      case 'takeoff': m.shroud = 0; m.air = true; m.airLeft = airTurns(h); return 'It climbs into the wind. It’s airborne!';
      case 'circle': return 'It wheels overhead, lining up a dive.';
      case 'dive':
        m.air = false; m.airLeft = 0;
        if (!m.parts.crest.broken) { m.shroud = SHROUD_TURNS; return 'Ice locks over its feathers: arrows will glance off.'; }
        return null;
      case 'stuck': return 'It wrenches its beak free.' + thaw();
      case 'rake': { const t = thaw(); return t ? t.trim() : null; }
      case 'flare': m.newSeen = true; m.shroud = SHROUD_TURNS; return 'Fresh ice locks over its feathers.';
      case 'crashed': return 'It scrambles back to its feet.' + thaw();
      case 'dazed': return 'It shakes its head, slowly coming back to its senses.' + thaw();
    }
    return null;
  },

  onBreak(h, partId) {
    if (partId === 'crest' && (h.mon.shroud ?? 0) > 0) { h.mon.shroud = 0; return 'The shroud falls away in sheets.'; }
    return null;
  },

  canHit(h, w) {
    if (h.mon.air) return w.type === 'Pierce';
    if ((h.mon.shroud ?? 0) > 0) return w.type !== 'Pierce';
    return true;
  },
  cantHitReason(h) {
    return h.mon.air
      ? 'It’s in the air: only Pierce (a bow) reaches it. Swap to a bow, throw a Net, or block until it comes down.'
      : 'Frost-shrouded: arrows glance off its iced feathers. Only Cut and Blunt reach it until the ice thaws.';
  },

  reachable(h, partId, w) {
    return !(partId === 'crest' && h.mon.air && w.type !== 'Pierce');
  },

  onPin(h) {
    if (h.mon.air) { h.mon.air = false; h.mon.airLeft = 0; h.intent = 'crashed'; return 'Pin: the arrow punches through a wing. It comes crashing down!'; }
    return null;
  },

  badges(h) {
    const s = h.mon.shroud ?? 0;
    return s > 0 ? [{ key: 'shroud', n: s, label: 'Frost-shrouded', short: `**Cut**/**Blunt** only · ${s} action${s > 1 ? 's' : ''}`, cls: 'ice', desc: 'Ice covers its feathers.\nThe ice melts after it acts twice on the ground.\nBreaking its crest ends it for good.' }] : [];
  },

  tip(h, type) {
    const m = h.mon;
    if (m.air && carries(h, 'Pierce')) return `**Pinning Shot** brings it down without its shroud (${carryingName(h, 'Pierce')}).`;
    if (m.air && h.item === 'net' && h.itemCharges > 0) return 'A **Weighted Net** brings it down without its shroud.';
    if ((m.shroud ?? 0) > 0 && carries(h, 'Blunt')) return `${dazeTag} It’s on the ground, dazed and **Frost-shrouded**. Its crest is open.`;
    if (m.air) return 'It’s airborne. **Pierce** only.';
    if (type === 'takeoff') return 'Its shroud is gone. Every weapon reaches it this turn.';
    return null;
  },

  canCapture(h) { return !h.mon.air; }
};
