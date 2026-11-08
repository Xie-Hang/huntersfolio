// The Foothills: the tutorial island (Nov 2026 playtest: four casual players were overwhelmed). New players start
// here with a Training Blade and one move, and each step adds one thing. Save.island is the step reached; absent
// means done (saves from before the island, and anyone who skipped it).
//
// Its monsters are the young of the Ridge's (Mekkman, Nov 2026); their ids predate that and are kept so saves carry
// over: scuttlehog = the Cragling, snapclaw = the Rimekit, burrowmole = the Cinderpup, gustmarmot = the Shrikelet.
//
// The steps (rebuilt 8 Nov 2026, Mekkman: "the tutorial is too long". Teach the core, then let them play. Charge,
// Capture, selling, tracking, charms, reinforcing and bounties moved to the Ridge, one per hunt):
//   0 hunt the Cragling            dice into a move, end the turn, its next move; turn 3 rolls blanks: Reroll
//   1 hunt the Rimekit             faces, one move with several dice (Slash ×3), Block
//   2 the Forge: the Hunter's Blade (and the lodge gives you the maul)
//   3 hunt the Tuskling            aim at a part, Swap to the maul for its Tusks. A win always pays 2 Tusk Hides
//   4 practice: the Cinderpup and the Shrikelet, no prompts, either order. Both wins open the next step
//   5 get ready: a Hide Vest at the Forge   (skipped if you already made it)
//   6 get ready: a salve at the Shop         (skipped if you already have one)
//   7 the Gorehorn: promotion hunt  no prompts; winning makes you a Hunter (rank F) and opens Ashfall Ridge
// Saves from the old 16-step island are moved onto these steps when loaded (migrateIsland).
import type { Save } from './types';
import { newSave } from './save';

export const ISLAND_DONE = 8;
export const ISLAND_MONSTERS = ['scuttlehog', 'snapclaw', 'tuskling', 'burrowmole', 'gustmarmot'];
/** the two practice hunts (step 4): no prompts, both needed */
export const PRACTICE = ['burrowmole', 'gustmarmot'];
/** the island's last step: the Gorehorn, as the promotion hunt that makes you a Hunter */
export const EXAM_STEP = 7;
/** the step each Foothills monster (and the exam) opens at */
export const ISLAND_OPENS: Record<string, number> = { scuttlehog: 0, snapclaw: 1, tuskling: 3, burrowmole: 4, gustmarmot: 4, gorehorn: EXAM_STEP };
export const onExam = (s: Save) => islandStep(s) === EXAM_STEP;

export const islandStep = (s: Save) => s.island ?? ISLAND_DONE;
export const islandDone = (s: Save) => islandStep(s) >= ISLAND_DONE;
/** the Forge opens at step 2 (back in town with Kit Scale); the Shop at step 5, with the vest ("get ready") */
export const forgeOpen = (s: Save) => islandStep(s) >= 2;
export const shopOpen = (s: Save) => islandStep(s) >= 5;
/** the loadout's second weapon slot (the maul comes with the blade, step 2), armour and charm (the practice hunts'
 *  Forge), and the item slot (the salve, step 6) */
export const twoWeapons = (s: Save) => islandStep(s) >= 3;
export const itemSlot = (s: Save) => islandStep(s) >= 6;
export const armorSlot = (s: Save) => islandStep(s) >= 4;
export const charmSlot = (s: Save) => islandStep(s) >= 4;
/** the town step the island is on, if any: where the result screen's gold button goes */
export const islandTown = (s: Save): 'forge' | 'shop' | null => {
  const st = islandStep(s);
  return st === 2 || st === 5 ? 'forge' : st === 6 ? 'shop' : null;
};
/** what the Forge holds on the island, by tab. From the practice hunts on, everything the island's monsters make:
 *  no prompts for the extras (the Whistling Blade, the Claw Charm), they're there if you want them */
export function islandForge(s: Save): { w: string[]; a: string[]; c: string[] } {
  const st = islandStep(s);
  return { w: [...(st >= 2 ? ['blade'] : []), ...(st >= 4 ? ['whistle'] : [])], a: st >= 4 ? ['hidevest'] : [], c: st >= 4 ? ['clawcharm'] : [] };
}
/** what the Shop sells on the island */
export const islandShop = (_s: Save) => ['salve'];
/** the Shop's Craft tab opens with "get ready": Tufts make a salve */
export const islandCraft = (s: Save) => islandStep(s) >= 5;

/** What a Foothills hunt shows, by the step it's hunted at: each hunt adds what it teaches. */
const SHOW: [number, string[]][] = [
  [0, ['intent', 'reroll']], // its next move and Reroll from the first hunt; Block comes with the Rimekit
  [1, ['block']],
  [3, ['parts', 'undo', 'swap']],
  // the practice hunts: no prompts. Daze, Enraged, elements and Flow show up, and Hunter's Notes says what they are
  [4, ['daze', 'rend', 'enraged', 'elements', 'flow']],
  [6, ['item']]
];
export const islandShow = (s: Save): string[] => SHOW.filter(([st]) => islandStep(s) >= st).flatMap(([, k]) => k);

/** A brand-new player: the Training Blade, leather armor, no items, the Scuttlehog first. */
export function newPlayerSave(): Save {
  const s = newSave();
  s.island = 0;
  s.islandV = 2;
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

/** Steps that are already done move on by themselves: both practice wins, a vest already made, a salve already in
 *  hand (made from Tufts, or bought early). Also run on old saves after migrateIsland. */
function settle(s: Save) {
  const won = (id: string) => (s.record[id]?.wins ?? 0) > 0;
  for (;;) {
    const st = islandStep(s);
    if (st === 4 && PRACTICE.every(won)) { s.island = 5; continue; }
    if (st === 5 && s.armors.hidevest) { s.loadout.armor = 'hidevest'; s.island = 6; continue; }
    if (st === 6 && (s.items.salve ?? 0) > 0) { s.loadout.item ??= 'salve'; s.island = EXAM_STEP; s.loadout.target = 'gorehorn'; continue; }
    break;
  }
  // on the practice step the Hunt Board opens on whichever practice monster you haven't beaten yet
  if (islandStep(s) === 4) { const next = PRACTICE.find(id => !won(id)); if (next && (won(s.loadout.target) || !PRACTICE.includes(s.loadout.target))) s.loadout.target = next; }
}

/** Saves from the old 16-step island (before 8 Nov 2026): onto the new steps. Old 0–3 stay; 4 (take the maul) is
 *  the Tuskling again, for Swap; 5–13 are the practice step; 14 the Shop; 15 the exam; 16 done. Gear they made on the
 *  way is kept, and steps they've already done are skipped (settle). */
export function migrateIsland(s: Save) {
  if (typeof s.island !== 'number' || s.islandV === 2) { s.islandV = 2; return; }
  const o = s.island;
  s.island = o >= 16 ? ISLAND_DONE : o <= 2 ? o : o <= 4 ? 3 : o <= 13 ? 4 : o === 14 ? 6 : EXAM_STEP;
  s.islandV = 2;
  if (s.island >= ISLAND_DONE) return;
  // from step 3 on you carry the blade and the maul
  if (s.island >= 3) {
    delete s.weapons.training;
    s.weapons.blade ??= { lv: 0 }; s.weapons.maul ??= { lv: 0 };
    if (s.loadout.weapons.length < 2) s.loadout.weapons = ['blade', 'maul'];
  }
  if (s.island === 3) s.loadout.target = 'tuskling';
  settle(s);
}

/** Move the island on. Returns true when the step changed. */
export function advanceIsland(s: Save, ev: { won?: string; made?: string; bought?: string }): boolean {
  const st = islandStep(s);
  if (st >= ISLAND_DONE) return false;
  const go = (n: number, target?: string) => { s.island = n; if (target) s.loadout.target = target; settle(s); return true; };
  // gear made on the practice step is worn at once (the vest, the Claw Charm), so it's on for the next hunt
  if (ev.made === 'hidevest') s.loadout.armor = 'hidevest';
  if (st === 0 && ev.won === 'scuttlehog') return go(1, 'snapclaw');
  if (st === 1 && ev.won === 'snapclaw') return go(2);
  if (st === 2 && ev.made === 'blade') {
    // the Training Blade goes back to the lodge, and the lodge gives you a maul
    delete s.weapons.training;
    s.weapons.maul ??= { lv: 0 };
    s.loadout.weapons = ['blade', 'maul'];
    return go(3, 'tuskling');
  }
  if (st === 3 && ev.won === 'tuskling') return go(4, 'burrowmole');
  if (st === 4 && ev.won && PRACTICE.includes(ev.won)) { settle(s); return true; }
  if (st === 5 && ev.made === 'hidevest') return go(6);
  // a salve bought or made: it goes in the item slot
  if (st === 6 && ev.bought === 'salve') { s.loadout.item = 'salve'; return go(EXAM_STEP, 'gorehorn'); }
  if (st === EXAM_STEP && ev.won === 'gorehorn') { graduate(s); return true; }
  return false;
}

/** The island's lessons, to replay from Help (8 Nov 2026): each is played on a copy of a new player's save at that
 *  step, with its prompts, and nothing it does is kept. */
export const LESSONS: { name: string; teaches: string; hunt: boolean }[] = [
  { name: 'Your turn', teaches: 'Dice, moves, End turn, Reroll', hunt: true },
  { name: 'Faces and Block', teaches: 'Fangs, Claws, blanks, Block', hunt: true },
  { name: 'Aim and Swap', teaches: 'Parts, Swap', hunt: true },
  { name: 'Getting ready', teaches: 'The Forge and the Shop', hunt: false }
];
export function lessonSave(n: number): Save {
  const s = newPlayerSave();
  const won = (...ids: string[]) => { for (const id of ids) { s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} }; s.hunts++; } };
  if (n >= 1) { s.island = 1; s.loadout.target = 'snapclaw'; won('scuttlehog'); s.tips = ['i-begin', 'i-lessons']; }
  if (n >= 2) {
    s.island = 3; s.loadout.target = 'tuskling'; won('snapclaw');
    s.weapons = { blade: { lv: 0 }, maul: { lv: 0 } }; s.loadout.weapons = ['blade', 'maul'];
  }
  if (n >= 3) {
    s.island = 5; won('tuskling', 'burrowmole', 'gustmarmot');
    s.coin = 120; s.mats.tuskhide = 2; s.loadout.target = 'gorehorn';
  }
  return s;
}
