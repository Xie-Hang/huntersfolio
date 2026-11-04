// Bounty rules: what each condition means in a hunt, how it reads, and whether a finished hunt met it.
import type { Hunt, Save } from './types';
import { BOUNTIES, type Goal } from './data/bounties';
import { MONSTERS } from './data/monsters';
import { EDITION } from './edition';

export { BOUNTIES, bountiesFor } from './data/bounties';
export type { BountyDef, Goal } from './data/bounties';

/** bounties are a full-game feature; the demo shows none */
export const BOUNTIES_ON = EDITION === 'full';

export function goalText(g: Goal, mon: string): string {
  const M = MONSTERS[mon];
  switch (g.k) {
    case 'break': return `Break its ${M?.parts.find(p => p.id === g.part)?.name.toLowerCase() ?? g.part}`;
    case 'capture': return 'Capture it';
    case 'turns': return `Win in ${g.n} turns or fewer`;
    case 'taken': return `Take ${g.n} damage or less`;
    case 'noItem': return 'Use no items';
    case 'without': return `Bring no ${g.type} weapon`;
    case 'feat': case 'never': return g.text;
  }
}

/** a goal's state during or after a hunt: met, failed (can no longer be met), or still open */
export function goalState(h: Hunt, g: Goal): 'met' | 'failed' | 'open' {
  const done = h.over === 'win';
  switch (g.k) {
    case 'break': return h.mon.parts[g.part]?.broken || (h.mon.parts[g.part]?.cracks ?? 0) > 0 ? 'met' : done ? 'failed' : 'open';
    case 'capture': return h.captured ? 'met' : done ? 'failed' : 'open';
    case 'turns': return h.turn > g.n ? 'failed' : done ? 'met' : 'open';
    case 'taken': return h.stats.taken > g.n ? 'failed' : done ? 'met' : 'open';
    case 'noItem': return h.carried - h.itemCharges > 0 ? 'failed' : done ? 'met' : 'open';
    case 'without': return h.weps.some(w => w.type === g.type) ? 'failed' : done ? 'met' : 'open';
    case 'feat': return h.feats?.includes(g.f) ? 'met' : done ? 'failed' : 'open';
    case 'never': return h.feats?.includes(g.f) ? 'failed' : done ? 'met' : 'open';
  }
}

/** Can this bounty be taken now? Its monster must be beaten once, and it must not be done already. */
export function bountyOpen(s: Save, id: string): boolean {
  const b = BOUNTIES[id];
  return BOUNTIES_ON && !!b && !s.bounties[id] && (s.record[b.mon]?.wins ?? 0) > 0;
}

/** The loadout breaks one of the bounty's rules before you start (e.g. it brings a weapon type it bans). */
export function loadoutBreaks(s: Save): string | null {
  const b = s.loadout.bounty ? BOUNTIES[s.loadout.bounty] : null; if (!b) return null;
  for (const g of b.goals) {
    if (g.k === 'without' && s.loadout.weapons.some(id => s.weapons[id] && weaponType(id) === g.type)) return `This bounty bans ${g.type} weapons`;
  }
  return null;
}
import { WEAPONS } from './data/weapons';
const weaponType = (id: string) => WEAPONS[id]?.type;

/** Settle the bounty on a finished hunt: pays on a win that met every goal. */
export function settleBounty(s: Save, h: Hunt) {
  const b = h.bounty ? BOUNTIES[h.bounty] : null;
  if (!b || !h.reward || h.reward.bounty) return;
  const missed = b.goals.find(g => goalState(h, g) !== 'met');
  const met = h.over === 'win' && !missed && !s.bounties[b.id];
  h.reward.bounty = { id: b.id, met, missed: met ? undefined : h.over === 'win' ? goalText(missed!, b.mon) : 'Win the hunt', coin: met ? b.reward.coin : 0, seals: met ? b.reward.seals : 0, mat: met ? b.reward.mat : undefined };
  if (!met) return;
  s.bounties[b.id] = true;
  s.coin += b.reward.coin;
  s.mats.seal = (s.mats.seal ?? 0) + b.reward.seals;
  if (b.reward.mat) s.mats[b.reward.mat] = (s.mats[b.reward.mat] ?? 0) + 1;
  if (s.loadout.bounty === b.id) s.loadout.bounty = null;
}
