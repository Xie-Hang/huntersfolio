// The Foothills: the tutorial island (Nov 2026 playtest: four casual players were overwhelmed). New players start
// here with a Training Blade and one move, and each step adds one thing. Save.island is the step reached; absent
// means done (saves from before the island, and anyone who skipped it). See the island plan doc for the full ladder.
//
// Its monsters are the young of the Ridge's (Mekkman, Nov 2026); their ids predate that and are kept so saves carry
// over: scuttlehog = the Cragling, snapclaw = the Rimekit, burrowmole = the Cinderpup, gustmarmot = the Shrikelet.
// The steps (all three slices built, Nov 2026):
//   0 hunt the Cragling            dice into a move, end the turn
//   1 hunt the Rimekit             faces, its next move, Block (Undo, no prompt)
//   2 the Forge: the Hunter's Blade
//   3 hunt the Tuskling            aim at a part, breaks drop materials
//   4 the lodge: take the maul     two weapons
//   5 hunt the Cinderpup           swap, Reroll, Daze (and Rend, the reason to reroll)
//   6 the Shop: buy a salve        items (selling is offered once you have one)
//   7 hunt the Tuskling again      use an item, Snare capture, Flow
//   8 the Forge: a Hide Vest        armor (and bounties, in the full game)
//   9 hunt the Shrikelet           wind-ups, Charge, Enraged
//  10 the Forge: track a recipe     elements (the Whistling Blade is Gale; the Gorehorn is weak to Gale), tracking
//  11 hunt the Shrikelet again     a rare drop (its Gale Gland, always, this once)
//  12 the Forge: make it            the blade, a charm, reinforcing (the vest)
//  13 hunt the Rimekit again       nothing new: practice, on your own
//  14 the Shop                      Smoke Pouch and Whetstone
//  15 the Gorehorn: promotion hunt  no prompts; winning makes you a Hunter (rank F) and opens Ashfall Ridge
import type { Save } from './types';
import { newSave } from './save';

export const ISLAND_DONE = 16;
export const ISLAND_MONSTERS = ['scuttlehog', 'snapclaw', 'tuskling', 'burrowmole', 'gustmarmot'];
/** the island's last step: the Gorehorn, as the promotion hunt that makes you a Hunter */
export const EXAM_STEP = 15;
/** the step each Foothills monster (and the exam) opens at */
export const ISLAND_OPENS: Record<string, number> = { scuttlehog: 0, snapclaw: 1, tuskling: 3, burrowmole: 4, gustmarmot: 9, gorehorn: 15 };
export const onExam = (s: Save) => islandStep(s) === EXAM_STEP;

export const islandStep = (s: Save) => s.island ?? ISLAND_DONE;
export const islandDone = (s: Save) => islandStep(s) >= ISLAND_DONE;
/** the Forge opens at step 2 (back in town with Shell); the Shop at step 6 */
export const forgeOpen = (s: Save) => islandStep(s) >= 2;
export const shopOpen = (s: Save) => islandStep(s) >= 6;
/** the loadout's second weapon slot (the maul arrives at step 4), and its item slot (the salve, step 7) */
export const twoWeapons = (s: Save) => islandStep(s) >= 4;
export const itemSlot = (s: Save) => islandStep(s) >= 7;
export const armorSlot = (s: Save) => islandStep(s) >= 8;
export const charmSlot = (s: Save) => islandStep(s) >= 12;
/** the town step the island is on, if any: where the result screen's gold button goes */
export const islandTown = (s: Save): 'forge' | 'shop' | null => {
  const st = islandStep(s);
  return [2, 8, 10, 12].includes(st) ? 'forge' : [6, 14].includes(st) ? 'shop' : null;
};
/** what the Forge holds on the island, by tab, step by step */
export function islandForge(s: Save): { w: string[]; a: string[]; c: string[] } {
  const st = islandStep(s);
  return { w: [...(st >= 2 ? ['blade'] : []), ...(st >= 10 ? ['whistle'] : [])], a: st >= 8 ? ['hidevest'] : [], c: st >= 12 ? ['clawcharm'] : [] };
}
/** what the Shop sells on the island */
export const islandShop = (s: Save) => (islandStep(s) >= 14 ? ['salve', 'smoke', 'whetstone'] : ['salve']);

/** What a Foothills hunt shows, by the step it's hunted at: each hunt adds what it teaches. The town steps (2, 4, 6)
 *  show what the hunt before them did. */
const SHOW: [number, string[]][] = [
  [1, ['intent', 'block', 'undo']],
  [3, ['parts']],
  [5, ['swap', 'reroll', 'daze', 'rend']],
  [7, ['item', 'capture', 'flow']],
  [9, ['charge']],
  [11, ['elements']]
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
  const L = s.loadout;
  // finished properly, you keep the loadout you built (the Whistling Blade, the vest, the Claw Charm)
  s.loadout = { ...L, weapons: L.weapons.length === 2 ? L.weapons : ['blade', 'maul'], item: L.item ?? 'salve', target: 'gorehorn' };
}

/** "Skip tutorial": straight to the Ridge, kitted out as the island would leave you. */
export function skipIsland(s: Save) { if (!islandDone(s)) graduate(s); }

/** Move the island on. Returns true when the step changed. */
export function advanceIsland(s: Save, ev: { won?: string; made?: string; loadout?: boolean; bought?: string; tracked?: string; reinforced?: string; shop?: boolean }): boolean {
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
  if (st === 7 && ev.won === 'tuskling') return go(8);
  // the vest is worn as soon as it's made
  if (st === 8 && ev.made === 'hidevest') { s.loadout.armor = 'hidevest'; return go(9, 'gustmarmot'); }
  if (st === 9 && ev.won === 'gustmarmot') return go(10);
  if (st === 10 && ev.tracked === 'w:whistle') return go(11, 'gustmarmot');
  if (st === 11 && ev.won === 'gustmarmot') return go(12);
  // the Forge, three things: the tracked blade, the charm, and reinforcing the vest (in any order)
  if (st === 12 && (ev.made || ev.reinforced)) {
    if (ev.made === 'whistle' && !s.loadout.weapons.includes('whistle')) s.loadout.weapons = ['whistle', ...s.loadout.weapons.filter(w => w !== 'blade')].slice(0, 2);
    if (ev.made === 'clawcharm') s.loadout.charm = 'clawcharm';
    if (s.weapons.whistle && s.charms.clawcharm && (s.armors.hidevest?.lv ?? 0) >= 1) return go(13, 'snapclaw');
    return false;
  }
  if (st === 13 && ev.won === 'snapclaw') return go(14);
  if (st === 14 && ev.shop) return go(EXAM_STEP, 'gorehorn');
  if (st === EXAM_STEP && ev.won === 'gorehorn') { graduate(s); return true; }
  return false;
}
