import type { ArmorDef, CharmDef, ItemDef, MaterialDef } from '../types';
import { MAX_TIER } from '../edition';
const inEdition = <T extends { tier?: number }>(x: T) => (x.tier ?? 1) <= MAX_TIER;

const armors: ArmorDef[] = [
  { id: 'jerkin', name: 'Leather Jerkin', hp: 180, guard: 8, rerolls: 3, resist: null, perk: 'Start each hunt with 3 rerolls instead of 2.', craft: { coin: 80 } },
  { id: 'vest', name: 'Bristlehide Vest', hp: 200, guard: 8, rerolls: 2, resist: 'Stone', perk: 'Resists Stone (−30%). Blank dice guard for double.', blankx2: true, craft: { coin: 300, pelt: 2, hide: 3 } },
  { id: 'coat', name: 'Galeweave Coat', hp: 170, guard: 7, rerolls: 2, resist: 'Gale', perk: 'Resists Gale (−30%). Breaking a part heals 25 and gives a reroll.', breakHeal: true, craft: { coin: 250, pinion: 2, plume: 3 } },
  { id: 'kilnplate', name: 'Kilnplate Mail', hp: 190, guard: 9, rerolls: 2, resist: 'Ember', perk: 'Resists Ember (−30%). Molten shells can’t burn you.', burnproof: true, craft: { coin: 300, ventgland: 2, digclaw: 1, cinderscale: 3 } },
  { id: 'rimehide', name: 'Rimehide Cloak', hp: 185, guard: 8, rerolls: 3, resist: 'Frost', perk: 'Resists Frost (−30%). Start each hunt with 3 rerolls instead of 2.', craft: { coin: 300, frostfang: 1, barbtail: 1, rimescale: 3 } }
];
armors.push({ id: 'bogcoat', tier: 2, name: 'Bogskin Coat', hp: 220, guard: 9, rerolls: 2, resist: 'Stone', perk: 'Resists Stone (−30%). When swallowed, you cut free twice as fast.', slick: true, craft: { coin: 600, bogskin: 4, throatsac: 2 } });
export const ARMORS: Record<string, ArmorDef> = Object.fromEntries(armors.filter(inEdition).map(a => [a.id, a]));

const items: ItemDef[] = [
  { id: 'salve', name: 'Bitterroot Salve', max: 3, price: 30, desc: 'Heal 30.', effect: 'heal30' },
  { id: 'smoke', name: 'Smoke Pouch', max: 2, price: 50, desc: "The monster's next attack misses.", effect: 'smoke' },
  { id: 'whet', name: 'Whetstone', max: 2, price: 40, desc: 'Your next hit deals +50%.', effect: 'whet50' },
  { id: 'net', name: 'Weighted Net', max: 2, price: 50, desc: 'Brings an airborne monster down. It loses its action.', effect: 'net' },
  { id: 'firepot', name: 'Firepot', max: 2, price: 50, desc: 'Melts all of a monster’s ice plating at once.', effect: 'thaw' },
  { id: 'blast', name: 'Blast Powder', max: 2, price: 50, desc: 'Forces a burrowed monster to the surface. It loses its action.', effect: 'blast' },
  { id: 'tuskwhet', name: 'Tusk Whetstone', max: 2, craft: { tusk: 1, coin: 20 }, yields: 2, desc: 'Your next hit deals +100%.', effect: 'whet100' }
];
export const ITEMS: Record<string, ItemDef> = Object.fromEntries(items.map(i => [i.id, i]));

/** One charm per monster: a single small perk that deepens a playstyle. Crafted, never reinforced. */
const charms: CharmDef[] = [
  { id: 'tuskcharm', name: 'Tusk Charm', src: 'Gorehorn', perk: 'When you daze the monster, you heal 20.', effect: 'dazeHeal', craft: { coin: 150, tusk: 1, hide: 2 } },
  { id: 'plumecharm', name: 'Plume Charm', src: 'Galeshrike', perk: 'The hit that exposes a part gets Expose’s bonus too.', effect: 'exposeSelf', craft: { coin: 150, pinion: 1, plume: 2 } },
  { id: 'kilncharm', name: 'Kiln Charm', src: 'Cinderback', perk: 'Charge costs 1 die instead of 2.', effect: 'charge1', craft: { coin: 150, ventgland: 1, cinderscale: 2 } },
  { id: 'rimecharm', name: 'Rime Charm', src: 'Rimetail', perk: 'Light Cut moves deal 4 more damage.', effect: 'lightCut', craft: { coin: 150, barbtail: 1, rimescale: 2 } }
];
charms.push({ id: 'bogcharm', tier: 2, name: 'Bog Charm', src: 'Bogjaw', perk: 'When you cut your way out of a monster, you heal 20.', effect: 'escapeHeal', craft: { coin: 150, bogmolar: 1, bogskin: 2 } });
export const CHARMS: Record<string, CharmDef> = Object.fromEntries(charms.filter(inEdition).map(c => [c.id, c]));

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
  { id: 'tempesteye', base: 'Tempest Eye', src: 'Galeshrike', rare: true, sell: 300, how: 'Rare from Galeshrike crest breaks; capture raises the chance' },
  { id: 'cinderscale', base: 'Cinder Scale', src: 'Cinderback', sell: 20, how: 'Every Cinderback hunt' },
  { id: 'slagplate', base: 'Slag Plate', src: 'Cinderback', sell: 60, how: 'Break the Cinderback’s head plate (Blunt best)' },
  { id: 'digclaw', base: 'Digging Claw', src: 'Cinderback', sell: 60, how: 'Break the Cinderback’s claws (Cut best)' },
  { id: 'ventgland', base: 'Vent Gland', src: 'Cinderback', sell: 60, how: 'Break the Cinderback’s back vents (Pierce best)' },
  { id: 'kilnheart', base: 'Kilnheart', src: 'Cinderback', rare: true, sell: 300, how: 'Rare from Cinderback head plate breaks; capture raises the chance' },
  { id: 'rimescale', base: 'Rime Scale', src: 'Rimetail', sell: 20, how: 'Every Rimetail hunt' },
  { id: 'barbtail', base: 'Barbed Tail', src: 'Rimetail', sell: 60, how: 'Sever the Rimetail’s tail (Cut best)' },
  { id: 'mantleshard', base: 'Mantle Shard', src: 'Rimetail', sell: 60, how: 'Break the Rimetail’s ice mantle (Blunt best)' },
  { id: 'frostfang', base: 'Frost Fang', src: 'Rimetail', sell: 60, how: 'Break the Rimetail’s jaw (Pierce best)' },
  { id: 'frostheart', base: 'Frostheart', src: 'Rimetail', rare: true, sell: 300, how: 'Rare from Rimetail ice mantle breaks; capture raises the chance' }
];
mats.push(
  { id: 'bogskin', tier: 2, base: 'Bogskin', src: 'Bogjaw', sell: 30, how: 'Every Bogjaw hunt' },
  { id: 'bogmolar', tier: 2, base: 'Bog Molar', src: 'Bogjaw', sell: 90, how: 'Break the Bogjaw’s jaw (Blunt best)' },
  { id: 'throatsac', tier: 2, base: 'Throat Sac', src: 'Bogjaw', sell: 90, how: 'Break the Bogjaw’s throat sac (Cut best)' },
  { id: 'wartstone', tier: 2, base: 'Wart Stone', src: 'Bogjaw', sell: 90, how: 'Break the Bogjaw’s stone warts (Pierce best)' },
  { id: 'mirestone', tier: 2, base: 'Mirestone', src: 'Bogjaw', rare: true, sell: 450, how: 'Rare from Bogjaw stone warts' }
);
export const MATERIALS: Record<string, MaterialDef> = Object.fromEntries(mats.filter(inEdition).map(m => [m.id, m]));

/** Display name: base + source monster in brackets, rares flagged. */
export function matName(id: string): string {
  const m = MATERIALS[id];
  return `${m.base} (${m.src}${m.rare ? ', rare' : ''})`;
}
