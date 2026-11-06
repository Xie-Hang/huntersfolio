// The Foothills: the tutorial island (Nov 2026 playtest: four casual players were overwhelmed). New players start
// here with a Training Blade and one move, and each step adds one thing. Save.island is the step reached; absent
// means done (saves from before the island, and anyone who skipped it). See the island plan doc for the full ladder.
//
// Steps built so far (slice 1): 0 hunt the Scuttlehog → 1 hunt the Snapclaw → 2 make the Hunter's Blade at the Forge
// → done. Finishing (for now) hands over the maul and the starting items and opens Ashfall Ridge. Later slices add
// the Tuskling, the Burrowmole, the Gustmarmot and the Gorehorn exam, and move ISLAND_DONE up.
import type { Save } from './types';
import { newSave } from './save';

export const ISLAND_DONE = 3;
export const ISLAND_MONSTERS = ['scuttlehog', 'snapclaw'];

export const islandStep = (s: Save) => s.island ?? ISLAND_DONE;
export const islandDone = (s: Save) => islandStep(s) >= ISLAND_DONE;
/** the Forge opens at step 2 (back in town with Shell); the Shop, coin and the rest once the island is done */
export const forgeOpen = (s: Save) => islandStep(s) >= 2;
export const shopOpen = (s: Save) => islandDone(s);

/** A brand-new player: the Training Blade, leather armor, no items, the Scuttlehog first. */
export function newPlayerSave(): Save {
  const s = newSave();
  s.island = 0;
  s.weapons = { training: { lv: 0 } };
  s.items = Object.fromEntries(Object.keys(s.items).map(k => [k, 0]));
  s.loadout = { ...s.loadout, weapons: ['training'], item: null, target: 'scuttlehog' };
  return s;
}

/** The island is over (finished or skipped): the starting kit everyone on the Ridge has, and the Gorehorn next. */
function graduate(s: Save) {
  s.island = ISLAND_DONE;
  s.weapons.blade ??= { lv: 0 };
  s.weapons.maul ??= { lv: 0 };
  if (!(s.items.salve ?? 0)) s.items.salve = 3;
  if (!(s.items.snare ?? 0)) s.items.snare = 2;
  s.loadout = { ...s.loadout, weapons: ['blade', 'maul'], item: 'salve', target: 'gorehorn' };
}

/** "Skip tutorial": straight to the Ridge, kitted out as the island would leave you. */
export function skipIsland(s: Save) { if (!islandDone(s)) graduate(s); }

/** Move the island on after a hunt is settled or something is made. Returns true when the step changed. */
export function advanceIsland(s: Save, ev: { won?: string; made?: string }): boolean {
  const st = islandStep(s);
  if (st >= ISLAND_DONE) return false;
  if (st === 0 && ev.won === 'scuttlehog') { s.island = 1; s.loadout.target = 'snapclaw'; return true; }
  if (st === 1 && ev.won === 'snapclaw') { s.island = 2; return true; }
  if (st === 2 && ev.made === 'blade') { graduate(s); return true; }
  return false;
}
