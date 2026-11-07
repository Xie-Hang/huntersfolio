// The Foothills: the tutorial island (Nov 2026 playtest: four casual players were overwhelmed). New players start
// here with a Training Blade and one move, and each step adds one thing. Save.island is the step reached; absent
// means done (saves from before the island, and anyone who skipped it). See the island plan doc for the full ladder.
//
// Steps built so far (slices 1 and 2):
//   0 hunt the Scuttlehog          dice into a move, end the turn
//   1 hunt the Snapclaw            faces, its next move, Block (Undo, no prompt)
//   2 the Forge: the Hunter's Blade
//   3 hunt the Tuskling            aim at a part, breaks drop materials
//   4 the lodge: take the maul     two weapons
//   5 hunt the Burrowmole          swap, Reroll, Daze (and Rend, the reason to reroll)
//   6 the Shop: buy a salve        items (selling is offered once you have one)
//   7 hunt the Tuskling again      use an item, Snare capture, Flow
// Finishing step 7 (for now) opens Ashfall Ridge. Slice 3 adds the Gustmarmot and the Gorehorn exam.
import type { Save } from './types';
import { newSave } from './save';

export const ISLAND_DONE = 8;
export const ISLAND_MONSTERS = ['scuttlehog', 'snapclaw', 'tuskling', 'burrowmole'];

export const islandStep = (s: Save) => s.island ?? ISLAND_DONE;
export const islandDone = (s: Save) => islandStep(s) >= ISLAND_DONE;
/** the Forge opens at step 2 (back in town with Shell); the Shop at step 6 */
export const forgeOpen = (s: Save) => islandStep(s) >= 2;
export const shopOpen = (s: Save) => islandStep(s) >= 6;
/** the loadout's second weapon slot (the maul arrives at step 4), and its item slot (the salve, step 7) */
export const twoWeapons = (s: Save) => islandStep(s) >= 4;
export const itemSlot = (s: Save) => islandStep(s) >= 7;

/** What a Foothills hunt shows, by the step it's hunted at: each hunt adds what it teaches. The town steps (2, 4, 6)
 *  show what the hunt before them did. */
const SHOW: [number, string[]][] = [
  [1, ['intent', 'block', 'undo']],
  [3, ['parts']],
  [5, ['swap', 'reroll', 'daze', 'rend']],
  [7, ['item', 'capture', 'flow']]
];
export const islandShow = (s: Save): string[] => SHOW.filter(([st]) => islandStep(s) >= st).flatMap(([, k]) => k);

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
  delete s.weapons.training;
  s.weapons.blade ??= { lv: 0 };
  s.weapons.maul ??= { lv: 0 };
  s.items.salve = Math.max(s.items.salve ?? 0, 3);
  s.items.snare = Math.max(s.items.snare ?? 0, 2);
  s.loadout = { ...s.loadout, weapons: ['blade', 'maul'], item: 'salve', target: 'gorehorn' };
}

/** "Skip tutorial": straight to the Ridge, kitted out as the island would leave you. */
export function skipIsland(s: Save) { if (!islandDone(s)) graduate(s); }

/** Move the island on. Returns true when the step changed. */
export function advanceIsland(s: Save, ev: { won?: string; made?: string; loadout?: boolean; bought?: string }): boolean {
  const st = islandStep(s);
  if (st >= ISLAND_DONE) return false;
  const go = (n: number, target?: string) => { s.island = n; if (target) s.loadout.target = target; return true; };
  if (st === 0 && ev.won === 'scuttlehog') return go(1, 'snapclaw');
  if (st === 1 && ev.won === 'snapclaw') return go(2);
  if (st === 2 && ev.made === 'blade') {
    // the Training Blade goes back to the lodge
    delete s.weapons.training;
    s.loadout.weapons = ['blade'];
    return go(3, 'tuskling');
  }
  // the lodge's gift: the maul is yours; carrying it is the step
  if (st === 3 && ev.won === 'tuskling') { s.weapons.maul ??= { lv: 0 }; return go(4, 'burrowmole'); }
  if (st === 4 && ev.loadout && s.loadout.weapons.length === 2) return go(5);
  if (st === 5 && ev.won === 'burrowmole') return go(6, 'tuskling');
  // a salve bought: it goes in the item slot, and the lodge gives one Snare for the next hunt
  if (st === 6 && ev.bought === 'salve') { s.loadout.item = 'salve'; s.items.snare = Math.max(s.items.snare ?? 0, 1); return go(7, 'tuskling'); }
  if (st === 7 && ev.won === 'tuskling') { graduate(s); return true; }
  return false;
}
