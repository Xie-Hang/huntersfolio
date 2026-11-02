import type { ArmorDef, ItemDef, MaterialDef } from '../types';

const armors: ArmorDef[] = [
  { id: 'jerkin', name: 'Leather Jerkin', hp: 180, guard: 8, rerolls: 3, resist: null, perk: 'Start each hunt with 3 rerolls instead of 2.', craft: { coin: 80 } },
  { id: 'vest', name: 'Bristlehide Vest', hp: 200, guard: 8, rerolls: 2, resist: 'Stone', perk: 'Resists Stone (−30%). Blank dice guard for double.', blankx2: true, craft: { coin: 300, pelt: 2, hide: 3 } },
  { id: 'coat', name: 'Galeweave Coat', hp: 170, guard: 7, rerolls: 2, resist: 'Gale', perk: 'Resists Gale (−30%). Breaking a part heals 25 and gives a reroll.', breakHeal: true, craft: { coin: 250, pinion: 2, plume: 3 } }
];
export const ARMORS: Record<string, ArmorDef> = Object.fromEntries(armors.map(a => [a.id, a]));

const items: ItemDef[] = [
  { id: 'salve', name: 'Bitterroot Salve', max: 3, price: 30, desc: 'Heal 30.', effect: 'heal30' },
  { id: 'smoke', name: 'Smoke Pouch', max: 2, price: 50, desc: "The monster's next attack misses.", effect: 'smoke' },
  { id: 'whet', name: 'Whetstone', max: 2, price: 40, desc: 'Your next hit deals +50%.', effect: 'whet50' },
  { id: 'net', name: 'Weighted Net', max: 2, price: 50, desc: 'Brings an airborne monster down. It loses its action.', effect: 'net' },
  { id: 'tuskwhet', name: 'Tusk Whetstone', max: 2, craft: { tusk: 1, coin: 20 }, yields: 2, desc: 'Your next hit deals +100%.', effect: 'whet100' }
];
export const ITEMS: Record<string, ItemDef> = Object.fromEntries(items.map(i => [i.id, i]));

const mats: MaterialDef[] = [
  { id: 'hide', base: 'Hide', src: 'Gorehorn', sell: 20, how: 'Every Gorehorn hunt' },
  { id: 'tusk', base: 'Tusk', src: 'Gorehorn', sell: 60, how: 'Break the Gorehorn’s tusks (Blunt best)' },
  { id: 'pelt', base: 'Bristled Pelt', src: 'Gorehorn', sell: 60, how: 'Break the Gorehorn’s hide (Cut best)' },
  { id: 'sinew', base: 'Thick Sinew', src: 'Gorehorn', sell: 50, how: 'Break the Gorehorn’s hind legs (Pierce best)' },
  { id: 'heartstone', base: 'Heartstone', src: 'Gorehorn', rare: true, sell: 300, how: 'Rare from Gorehorn tusk breaks; capture raises the chance' },
  { id: 'plume', base: 'Plume', src: 'Galeshrike', sell: 20, how: 'Every Galeshrike hunt' },
  { id: 'pinion', base: 'Wing Pinion', src: 'Galeshrike', sell: 60, how: 'Break the Galeshrike’s wings (Pierce best)' },
  { id: 'talon', base: 'Hooked Talon', src: 'Galeshrike', sell: 60, how: 'Break the Galeshrike’s talons (Cut best)' },
  { id: 'crest', base: 'Storm Crest', src: 'Galeshrike', sell: 60, how: 'Break the Galeshrike’s crest (Blunt best, only while grounded)' },
  { id: 'tempesteye', base: 'Tempest Eye', src: 'Galeshrike', rare: true, sell: 300, how: 'Rare from Galeshrike crest breaks; capture raises the chance' }
];
export const MATERIALS: Record<string, MaterialDef> = Object.fromEntries(mats.map(m => [m.id, m]));

/** Display name: base + source monster in brackets, rares flagged. */
export function matName(id: string): string {
  const m = MATERIALS[id];
  return `${m.base} (${m.src}${m.rare ? ', rare' : ''})`;
}
