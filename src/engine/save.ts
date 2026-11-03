// Saves are versioned. Every time the save shape changes, bump SAVE_VERSION
// and add a migration step, so players never lose progress to an update.
import type { Save } from './types';
import { MATERIALS, ITEMS } from './data/gear';
import { WEAPONS } from './data/weapons';
import { ARMORS } from './data/gear';
import { MONSTERS } from './data/monsters';

export const SAVE_VERSION = 2;

export function newSave(): Save {
  return {
    version: SAVE_VERSION,
    coin: 100,
    mats: Object.fromEntries(Object.keys(MATERIALS).map(k => [k, 0])),
    weapons: { blade: { lv: 0 }, maul: { lv: 0 } },
    armors: { jerkin: { lv: 0 } },
    items: { ...Object.fromEntries(Object.keys(ITEMS).map(k => [k, 0])), salve: 3 },
    loadout: { weapons: ['blade', 'maul'], armor: 'jerkin', item: 'salve', target: 'gorehorn' },
    pity: {},
    hunts: 0,
    record: {},
    tracked: null
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
  }
];

/** Turn anything loaded from storage into a valid, current Save. Unknown or broken data gives a fresh save. */
export function loadSave(raw: unknown): Save {
  if (!raw || typeof raw !== 'object') return newSave();
  let s: any = { ...(raw as object) };
  let v = typeof s.version === 'number' ? s.version : 0;
  if (v > SAVE_VERSION) return newSave(); // from a newer build; don't guess
  while (v < SAVE_VERSION) { s = MIGRATIONS[v](s); v++; }
  // Normalise: fill anything new, drop anything that no longer exists.
  const base = newSave();
  const out: Save = {
    ...base,
    ...s,
    mats: { ...base.mats, ...(s.mats || {}) },
    items: { ...base.items, ...(s.items || {}) },
    loadout: { ...base.loadout, ...(s.loadout || {}) },
    pity: { ...(typeof s.pity === 'number' ? { heartstone: s.pity } : s.pity || {}) },
    record: { ...(s.record || {}) },
    weapons: Object.fromEntries(Object.entries(s.weapons || base.weapons).filter(([k]) => WEAPONS[k])) as Save['weapons'],
    armors: Object.fromEntries(Object.entries(s.armors || base.armors).filter(([k]) => ARMORS[k])) as Save['armors']
  };
  if (!Object.keys(out.weapons).length) out.weapons = base.weapons;
  if (!Object.keys(out.armors).length) out.armors = base.armors;
  if (!MONSTERS[out.loadout.target]) out.loadout.target = 'gorehorn';
  out.version = SAVE_VERSION;
  return out;
}
