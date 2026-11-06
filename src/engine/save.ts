// Saves are versioned. Every time the save shape changes, bump SAVE_VERSION
// and add a migration step, so players never lose progress to an update.
import type { Save } from './types';
import { MATERIALS, ITEMS, CHARMS } from './data/gear';
import { WEAPONS } from './data/weapons';
import { ARMORS } from './data/gear';
import { MONSTERS } from './data/monsters';
import { BOUNTIES } from './data/bounties';

export const SAVE_VERSION = 9;

export function newSave(): Save {
  return {
    version: SAVE_VERSION,
    coin: 100,
    mats: Object.fromEntries(Object.keys(MATERIALS).map(k => [k, 0])),
    weapons: { blade: { lv: 0 }, maul: { lv: 0 } },
    armors: { jerkin: { lv: 0 } },
    items: { ...Object.fromEntries(Object.keys(ITEMS).map(k => [k, 0])), salve: 3, snare: 2 },
    loadout: { weapons: ['blade', 'maul'], armor: 'jerkin', charm: null, item: 'salve', target: 'gorehorn' },
    pity: {},
    hunts: 0,
    record: {},
    tracked: null,
    charms: {},
    tips: [],
    endSeen: false,
    achievements: [],
    bounties: {}
  };
}

/** Migration steps: index n upgrades a save from version n to n + 1. */
const MIGRATIONS: ((s: any) => any)[] = [
  // v0 → v1: saves from the browser prototype (no version field). Shape is compatible; just stamp it.
  s => ({ ...s, version: 1 }),
  // v1 → v2: the Cinderack was renamed the Cinderback (4 Nov 2026). Carry its record and the Hunt Board selection over.
  s => {
    const rec = { ...(s.record || {}) };
    if (rec.cinderack) { rec.cinderback = rec.cinderack; delete rec.cinderack; }
    const loadout = { ...(s.loadout || {}) };
    if (loadout.target === 'cinderack') loadout.target = 'cinderback';
    return { ...s, record: rec, loadout, version: 2 };
  },
  // v2 → v3: charms (4 Nov 2026). Nothing to convert; the charm slot starts empty.
  s => ({ ...s, charms: s.charms || {}, loadout: { ...(s.loadout || {}), charm: null }, version: 3 }),
  // v3 → v4: tutorial tips (4 Nov 2026). Existing saves start with none seen; tips only show when they fit.
  s => ({ ...s, tips: [], version: 4 }),
  // v4 → v5: the end-of-content card (4 Nov 2026). Not seen yet; it shows if every monster is already beaten.
  s => ({ ...s, endSeen: false, version: 5 }),
  // v5 → v6: achievements (4 Nov 2026). Start empty; the ones a save already qualifies for are awarded on load.
  s => ({ ...s, achievements: [], version: 6 }),
  // v6 → v7: the bounty board (5 Nov 2026). None done yet, none taken.
  s => ({ ...s, bounties: {}, loadout: { ...(s.loadout || {}), bounty: null }, version: 7 }),
  // v7 → v8: weapon rework (5 Nov 2026). Crafting the next weapon no longer consumes the one before it, so give
  // back every earlier weapon in the line of each weapon owned, at +0 (levels on owned weapons are kept).
  s => {
    const weapons = { ...(s.weapons || {}) };
    for (const id of Object.keys(weapons)) { let f = WEAPONS[id]?.from; while (f) { weapons[f] ??= { lv: 0 }; f = WEAPONS[f]?.from; } }
    return { ...s, weapons, version: 8 };
  },
  // v8 → v9: Hunter's Seals removed (5 Nov 2026); bounty charms unlock by bounties completed. Leftover seals are
  // paid out as coin (40 each) so nobody loses what they earned. Charms already crafted stay.
  s => {
    const mats = { ...(s.mats || {}) }, seals = typeof mats.seal === 'number' ? mats.seal : 0; delete mats.seal;
    return { ...s, mats, coin: (typeof s.coin === 'number' ? s.coin : 0) + 40 * seals, version: 9 };
  }
];

/** Turn anything loaded from storage into a valid, current Save. Unknown or broken data gives a fresh save. */
/** A save written by a NEWER build (e.g. the full game, opened later in the demo). The caller must not overwrite it. */
/** A save the full game wrote, opened in the demo: it may hold gear the demo doesn't have, so the demo mustn't write it. */
export function isFullSaveInDemo(raw: unknown, edition: 'demo' | 'full'): boolean {
  return edition === 'demo' && !!raw && typeof raw === 'object' && (raw as { edition?: unknown }).edition === 'full';
}

export function isNewerSave(raw: unknown): boolean {
  return !!raw && typeof raw === 'object' && typeof (raw as { version?: unknown }).version === 'number' && (raw as { version: number }).version > SAVE_VERSION;
}

/** A count: a whole number ≥ 0, else the fallback (hand-edited or damaged saves). */
const count = (x: unknown, fallback = 0) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : fallback);
const counts = (o: unknown) => Object.fromEntries(Object.entries(o && typeof o === 'object' ? o : {}).map(([k, v]) => [k, count(v)]));

export function loadSave(raw: unknown): Save {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return newSave();
  let s: any = { ...(raw as object) };
  let v = typeof s.version === 'number' ? s.version : 0;
  if (v > SAVE_VERSION) return newSave(); // from a newer build; don't guess
  while (v < SAVE_VERSION) { s = MIGRATIONS[v](s); v++; }
  // Normalise: fill anything new, drop anything that no longer exists.
  const base = newSave();
  const out: Save = {
    ...base,
    ...s,
    coin: count(s.coin, base.coin),
    hunts: count(s.hunts),
    mats: { ...base.mats, ...counts(s.mats) },
    items: { ...base.items, ...counts(s.items) },
    loadout: { ...base.loadout, ...(s.loadout && typeof s.loadout === 'object' ? s.loadout : {}) },
    pity: { ...(typeof s.pity === 'number' ? { heartstone: s.pity } : s.pity || {}) },
    record: Object.fromEntries(Object.entries(s.record && typeof s.record === 'object' ? s.record : {})
      .filter(([, r]) => r && typeof r === 'object')
      .map(([k, r]: [string, any]) => [k, { ...r, hunts: count(r.hunts), wins: count(r.wins), captures: count(r.captures), breaks: r.breaks && typeof r.breaks === 'object' ? r.breaks : {} }])),
    weapons: Object.fromEntries(Object.entries(s.weapons || base.weapons).filter(([k]) => WEAPONS[k])) as Save['weapons'],
    armors: Object.fromEntries(Object.entries(s.armors || base.armors).filter(([k]) => ARMORS[k])) as Save['armors'],
    endSeen: s.endSeen === true,
    achievements: Array.isArray(s.achievements) ? s.achievements.filter((x: unknown) => typeof x === 'string') : [],
    tips: Array.isArray(s.tips) ? s.tips.filter((x: unknown) => typeof x === 'string') : [],
    charms: Object.fromEntries(Object.keys(s.charms || {}).filter(k => CHARMS[k]).map(k => [k, true])) as Save['charms'],
    bounties: Object.fromEntries(Object.keys(s.bounties && typeof s.bounties === 'object' ? s.bounties : {}).filter(k => BOUNTIES[k]).map(k => [k, true])) as Save['bounties']
  };
  // A hunt takes two weapons; only a damaged save can have fewer, so give back the starter pair.
  if (Object.keys(out.weapons).length < 2) out.weapons = { ...base.weapons, ...out.weapons };
  if (!Object.keys(out.armors).length) out.armors = base.armors;
  if (!MONSTERS[out.loadout.target]) out.loadout.target = 'gorehorn';
  if (!Array.isArray(out.loadout.weapons)) out.loadout.weapons = [...base.loadout.weapons];
  out.loadout.weapons = out.loadout.weapons.filter((id: unknown) => typeof id === 'string' && out.weapons[id as string]).slice(0, 2);
  for (const id of Object.keys(out.weapons)) { if (out.loadout.weapons.length >= 2) break; if (!out.loadout.weapons.includes(id)) out.loadout.weapons.push(id); }
  if (!out.armors[out.loadout.armor]) out.loadout.armor = Object.keys(out.armors)[0];
  if (out.loadout.charm && !out.charms[out.loadout.charm]) out.loadout.charm = null;
  // only a bounty that no longer exists is dropped: done ones can be taken again (Nov 2026 bug hunt: a repeat you'd
  // taken vanished when the game restarted)
  if (out.loadout.bounty && !BOUNTIES[out.loadout.bounty]) out.loadout.bounty = null;
  out.version = SAVE_VERSION;
  return out;
}
