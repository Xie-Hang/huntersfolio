// The Archeron — a changed Duskheron: Spark, Frost. The Mirewood, changed (Tier 3.2, Nov 2026). The Blunt check.
// Two heads crackling with static. A Spear Thrust that lands leaves a Spark pip on you; a Twin Spear leaves two. In
// place of the Duskheron's Screech, a head gives a Static Cry that charges 2 of your dice: a charged die can only
// attack (guarding with it, or leaving it, sets it off). Dazing a head (Blunt) cancels its attack, so it sparks nothing;
// breaking a head stops it sparking for good. Same body, heads and Rear Up → Twin Spear chain as the Duskheron.
import type { Intent, MonsterDef } from '../../types';
import { choose, remember } from '../../behaviour';
import { sparkPlayer } from '../../status';
import { carries, carryingName } from '../../util';
import { duskheron, HEADS, parse, reeling, REAR_EVERY } from './duskheron';

const HIT = 1.2, CRY_DICE = 2;
const MIRE = ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass'];
const sparkHit = (h: Parameters<MonsterDef['resolve']>[0]) => (h.mon.enraged ? 74 : 64);
/** heads that will act this turn with this act: not reeling, not broken (a broken head's strikes carry no charge) */
const live = (h: Parameters<MonsterDef['resolve']>[0], acts: Record<string, string>, act: string) => HEADS.filter(x => acts[x] === act && !reeling(h, x) && !h.mon.parts[x].broken).length;

export const archeron: MonsterDef = {
  ...duskheron,
  id: 'archeron',
  variantOf: 'duskheron',
  inflicts: 'Spark',
  name: 'The Archeron',
  short: 'Archeron',
  kind: 'Two-headed wader',
  elem: 'Frost',
  elemental: ['Twin Spear'],
  weak: 'Ember',
  resist: 'Gale',
  hp: 800,
  tier: 3.2,
  requires: [...MIRE, 'arcmoth'],
  common: 'archplume',
  rarePart: 'wings',
  rare: 'stormquill',
  habits: 'A Duskheron from the frozen pools, both heads crackling. A spear that lands leaves Spark on you; at 3 it goes off, and block can’t stop it. Its cry charges your dice: a charged die can only attack. Daze a head and its strike carries nothing.',
  enragedHabit: 'Both heads cry together, a Static Field that charges three of your dice.',
  intro: 'Ice creaks in the reeds. Two heads rise, and the air between them snaps with static.',
  enrageText: 'Sparks run up both necks. The Archeron is enraged!',
  parts: [
    { id: 'upper', name: 'Upper Head', eff: { Cut: 0.5, Blunt: 1, Pierce: 0.5 }, hint: '**Daze** here stops its strike. Breaking it ends its **Spark** for good', mat: 'archbeak', hp: 280, brk: 'The upper beak cracks. Its charge is gone.' },
    { id: 'lower', name: 'Lower Head', eff: { Cut: 0.5, Blunt: 1, Pierce: 0.5 }, hint: '**Daze** here stops its strike. Breaking it ends its **Spark** for good', mat: 'archcrest', hp: 280, brk: 'The lower beak cracks. Its charge is gone.' },
    { id: 'wings', name: 'Wings', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Breaking them stops **Twin Spear**', mat: 'archpinion', hp: 300, brk: 'Its wings tear. It can’t rear up any more.' }
  ],

  intent(h, type): Intent {
    const r = duskheron.intent.call(this, h, type), acts = parse(type);
    const out = r.dmg ? { ...r, dmg: Math.round(r.dmg * HIT) } : { ...r };
    // enraged (Nov 2026): its cry turned up, a field that charges three of your dice
    if (type === 'field') return { name: 'Static Field', text: 'Both heads cry out together. The air crackles around your hands.', dmg: 18, threat: 1, isNew: !h.mon.newSeen, note: h.arm.chargeProof ? 'Your armour keeps the charge off' : 'Charges 3 of your dice next turn. A charged die can only attack' };
    if (type === 'twin') return { ...out, note: 'Each head that hits puts 1 **Spark** on you' };
    if (!acts) return out;
    const cry = live(h, acts, 'screech') > 0 && !h.arm.chargeProof, thrusts = live(h, acts, 'thrust');
    const notes = [thrusts ? `${thrusts} Spark pip${thrusts > 1 ? 's' : ''} on you if it lands` : '', cry ? `Charges ${CRY_DICE} of your dice next turn` : ''].filter(Boolean);
    return { ...out, name: out.name.replace(/Screech/g, 'Static Cry'), text: out.text.replace(/screeches\. Your block will be halved next turn\./g, 'gives a crackling cry.'), halfGuard: false, note: notes.join('. ') || undefined };
  },

  next(h, prev) {
    const m = h.mon;
    for (const x of HEADS) if ((m.reel?.[x] ?? 0) > 0) m.reel![x]--;
    if (prev === 'rear') { m.lastChain = h.turn; return remember(h, 'twin'); }
    if (prev === null) return remember(h, 'upper:peck|lower:thrust');
    const since = h.turn - (m.lastChain ?? -REAR_EVERY);
    const W: [string, number][] = [['peck', 3], ['thrust', 2], ['screech', 1]];
    const pool: [string, number][] = [];
    for (const [a, wa] of W) for (const [b, wb] of W) if (!(a === 'screech' && b === 'screech')) pool.push([`upper:${a}|lower:${b}`, wa * wb]);
    if (!m.parts.wings.broken && since >= REAR_EVERY) pool.push(['rear', 6]);
    if (m.enraged && prev !== 'field') pool.push(['field', 3]);
    return remember(h, choose(h, pool, a => this.intent(h, a).threat));
  },

  resolve(h, type, landed) {
    const lines: string[] = [];
    if (type === 'twin' && landed) { const n = HEADS.filter(x => !reeling(h, x) && !h.mon.parts[x].broken).length; if (n) lines.push(sparkPlayer(h, n, sparkHit(h))); }
    const acts = parse(type);
    if (acts) {
      const thrusts = live(h, acts, 'thrust');
      if (landed && thrusts) lines.push(sparkPlayer(h, thrusts, sparkHit(h)));
      if (live(h, acts, 'screech') && !h.arm.chargeProof) { h.mon.charge = CRY_DICE; lines.push(`The cry charges ${CRY_DICE} of your dice.`); }
    }
    if (type === 'field') { h.mon.newSeen = true; if (!h.arm.chargeProof) { h.mon.charge = 3; lines.push('The field charges 3 of your dice.'); } }
    if (type === 'dazed') lines.push('Both heads shake off the daze.');
    return lines.join(' ') || null;
  },

  tip(h, type) {
    if (h.dice.some(d => d.charged && !d.used)) return 'A charged die can only attack. Blocking with it or leaving it sets it off.';
    if ((h.mon.pSpark ?? 0) >= 2 && carries(h, 'Blunt')) return `2 **Spark** on you. **Daze** to the thrusting head from your ${carryingName(h, 'Blunt')} stops it, and any **Blunt** move grounds 1.`;
    return duskheron.tip!.call(this, h, type);
  }
};
