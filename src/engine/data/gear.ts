import type { ArmorDef, CharmDef, ItemDef, MaterialDef } from '../types';
import { MAX_TIER } from '../edition';
const inEdition = <T extends { tier?: number }>(x: T) => (x.tier ?? 1) <= MAX_TIER;

const armors: ArmorDef[] = [
  { id: 'jerkin', name: 'Leather Jerkin', hp: 180, guard: 8, rerolls: 3, resist: null, perk: 'Start each hunt with 3 rerolls instead of 2.', craft: { coin: 80 } },
  { id: 'vest', name: 'Bristlehide Vest', hp: 200, guard: 8, rerolls: 2, resist: 'Stone', perk: 'Resists Stone (−30%). Blank dice guard for 2.5× instead of 1.5×.', blankx2: true, craft: { coin: 300, pelt: 2, hide: 3 } },
  { id: 'coat', name: 'Galeweave Coat', hp: 170, guard: 7, rerolls: 2, resist: 'Gale', perk: 'Resists Gale (−30%). Breaking a part heals 25 and gives a reroll.', breakHeal: true, craft: { coin: 250, pinion: 2, plume: 3 } },
  { id: 'kilnplate', name: 'Kilnplate Mail', hp: 190, guard: 9, rerolls: 2, resist: 'Ember', perk: 'Resists Ember (−30%). Molten shells can’t burn you.', burnproof: true, craft: { coin: 300, ventgland: 2, digclaw: 1, cinderscale: 3 } },
  { id: 'rimehide', name: 'Rimehide Cloak', hp: 185, guard: 8, rerolls: 3, resist: 'Frost', perk: 'Resists Frost (−30%). Start each hunt with 3 rerolls instead of 2.', craft: { coin: 300, frostfang: 1, barbtail: 1, rimescale: 3 } }
];
armors.push({ id: 'bogcoat', tier: 2, name: 'Bogskin Coat', hp: 220, guard: 9, rerolls: 2, resist: 'Stone', perk: 'Resists Stone (−30%). When swallowed, you cut free twice as fast.', slick: true, craft: { coin: 600, bogskin: 4, throatsac: 2 } });
armors.push({ id: 'duskcoat', tier: 2, name: 'Duskweave Coat', hp: 200, guard: 9, rerolls: 3, resist: 'Gale', perk: 'Resists Gale (−30%). Nothing can halve your guard.', steady: true, craft: { coin: 600, duskplume: 4, duskcrest: 2 } });
armors.push({ id: 'whelkplate', tier: 2, name: 'Whelkshell Plate', hp: 210, guard: 10, rerolls: 2, resist: 'Ember', perk: 'Resists Ember (−30%). Heal 6 at the end of every monster turn.', mend: true, craft: { coin: 600, whelkscale: 4, whelkshell: 2 } });
armors.push({ id: 'glassmantle', tier: 2, name: 'Glassmist Mantle', hp: 195, guard: 9, rerolls: 3, resist: 'Frost', perk: 'Resists Frost (−30%). Charging also gives you 12 guard.', braced: true, craft: { coin: 600, glassdust: 4, glassfacet: 2 } });
armors.push({ id: 'wardenmail', tier: 3, name: 'Wardenstone Mail', hp: 240, guard: 11, rerolls: 2, resist: 'Stone', perk: 'Resists Stone (−30%). Your first weapon swap each turn costs no die.', quickswap: true, craft: { coin: 900, wardenstone: 5, wardenplate: 2 } });
armors.push({ id: 'stormcloak', tier: 3, name: 'Stormfeather Cloak', hp: 225, guard: 10, rerolls: 3, resist: 'Gale', perk: 'Resists Gale (−30%). Lightning (Thunderhead) deals half.', rod: true, craft: { coin: 900, rocplume: 5, rocpinion: 2 } });
armors.push({ id: 'slagplate', tier: 3, name: 'Slagforged Plate', hp: 250, guard: 10, rerolls: 2, resist: 'Ember', perk: 'Resists Ember (−30%). Every hit you take is reduced by 6.', ward: 6, craft: { coin: 900, slagscale: 5, slagspine: 2 } });
armors.push({ id: 'hydracoat', tier: 3, name: 'Hydrascale Coat', hp: 235, guard: 10, rerolls: 3, resist: 'Frost', perk: 'Resists Frost (−30%). Your dice can’t be frozen.', thaw: true, craft: { coin: 900, hydrascale: 5, hydrafang: 2 } });
// the changed Ashfall Ridge (variants): between Mirewood and Stormspire
armors.push({ id: 'squallcoat', tier: 2.5, name: 'Squallhide Coat', hp: 225, guard: 10, rerolls: 2, resist: 'Gale', perk: 'Resists Gale (−30%). Blunt hits that build daze build 5 more.', dazeUp: true, craft: { coin: 750, squallhide: 4, squallmane: 2 } });
armors.push({ id: 'rimemantle', tier: 2.5, name: 'Rimeplume Mantle', hp: 210, guard: 10, rerolls: 3, resist: 'Frost', perk: 'Resists Frost (−30%). Your first weapon swap each hunt costs no die.', swapOnce: true, craft: { coin: 750, rimeplume: 4, rimepinion: 2 } });
armors.push({ id: 'quakemail', tier: 2.5, name: 'Quakestone Plate', hp: 235, guard: 10, rerolls: 2, resist: 'Stone', perk: 'Resists Stone (−30%). Tremors can’t shake your dice loose.', steadyfoot: true, craft: { coin: 750, quakescale: 4, quakeclaw: 2 } });
armors.push({ id: 'ashcoat', tier: 2.5, name: 'Ashscale Coat', hp: 220, guard: 10, rerolls: 2, resist: 'Ember', perk: 'Resists Ember (−30%). Hot scales and molten shells can’t burn you.', burnproof: true, craft: { coin: 750, ashscale: 4, ashfang: 2 } });
// the Gloamhollow (status monsters, Nov 2026): tier 2.2 beside the Mirewood, its deeper versions 3.2 beside the Stormspire
armors.push(
  { id: 'sporecoat', tier: 2.2, name: 'Sporecap Coat', hp: 215, guard: 9, rerolls: 2, resist: 'Stone', perk: 'Resists Stone (−30%). Being infected lasts 1 turn less.', infectLess: 1, craft: { coin: 650, rotspore: 4, rootleg: 2 } },
  { id: 'arccloak', tier: 2.2, name: 'Arcdust Cloak', hp: 200, guard: 9, rerolls: 3, resist: 'Gale', perk: 'Resists Gale (−30%). A Spark Discharge on you deals a third less.', sparkLess: 0.35, craft: { coin: 650, arcdust: 4, arcwing: 2 } },
  { id: 'palemail', tier: 2.2, name: 'Palehide Mail', hp: 210, guard: 10, rerolls: 2, resist: 'Frost', perk: 'Resists Frost (−30%). A latch lasts 2 turns at most.', latchMax: 2, craft: { coin: 650, palehide: 4, bloodsac: 2 } },
  { id: 'blightmail', tier: 3.2, name: 'Blightcrown Mail', hp: 245, guard: 11, rerolls: 2, resist: 'Ember', perk: 'Resists Ember (−30%). Being infected lasts 2 turns less.', infectLess: 2, craft: { coin: 950, blightspore: 5, blightroot: 2 } },
  { id: 'glarecloak', tier: 3.2, name: 'Glarewing Cloak', hp: 230, guard: 10, rerolls: 3, resist: 'Frost', perk: 'Resists Frost (−30%). Your dice can’t be charged, and a Discharge on you deals a third less.', chargeProof: true, sparkLess: 0.35, craft: { coin: 950, glaredust: 5, glarepinion: 2 } },
  { id: 'gravecoat', tier: 3.2, name: 'Gravehide Coat', hp: 240, guard: 11, rerolls: 2, resist: 'Gale', perk: 'Resists Gale (−30%). A latch lasts 1 turn at most.', latchMax: 1, craft: { coin: 950, gravehide: 5, gravesac: 2 } }
);
// the apex
armors.push({ id: 'sovmantle', tier: 4, name: 'Sovereign Mantle', hp: 260, guard: 12, rerolls: 3, resist: null, perk: 'Resists whatever element the monster is attacking with (−30%).', adaptive: true, craft: { coin: 1400, sovgel: 6, sovheart: 1 } });
export const ARMORS: Record<string, ArmorDef> = Object.fromEntries(armors.filter(inEdition).map(a => [a.id, a]));

const items: ItemDef[] = [
  { id: 'salve', name: 'Bitterroot Salve', max: 3, price: 30, desc: 'Heal 30.', effect: 'heal30' },
  // Playtest (Nov 2026): capture was free and safe. A snare costs coin, and it can be torn free.
  { id: 'snare', name: 'Snare', max: 2, price: 40, desc: 'Needed to capture. Carried on every hunt outside your item slot; each attempt uses one.', effect: 'snare', pouch: true },
  { id: 'smoke', name: 'Smoke Pouch', max: 2, price: 50, desc: "The monster's next attack misses.", effect: 'smoke' },
  { id: 'whet', name: 'Whetstone', max: 2, price: 40, desc: 'Your next hit deals +50%.', effect: 'whet50' },
  { id: 'net', name: 'Weighted Net', max: 2, price: 50, desc: 'Brings an airborne monster down. It loses its action.', effect: 'net' },
  { id: 'firepot', name: 'Firepot', max: 2, price: 50, desc: 'Melts all of a monster’s ice plating at once.', effect: 'thaw' },
  { id: 'blast', name: 'Blast Powder', max: 2, price: 50, desc: 'Forces a burrowed monster to the surface. It loses its action.', effect: 'blast' },
  { id: 'purge', tier: 2.2, name: 'Purging Tonic', max: 2, price: 50, desc: 'Cures an infection on you.', effect: 'cureInfect' },
  { id: 'groundsalt', tier: 2.2, name: 'Grounding Salt', max: 2, price: 50, desc: 'Clears the Spark pips on you and your charged dice.', effect: 'cureSpark' },
  { id: 'tuskwhet', name: 'Tusk Whetstone', max: 2, craft: { tusk: 1, coin: 20 }, yields: 2, desc: 'Your next hit deals +100%.', effect: 'whet100' }
];
export const ITEMS: Record<string, ItemDef> = Object.fromEntries(items.filter(inEdition).map(i => [i.id, i]));

/** One charm per monster: a single small perk that deepens a playstyle. Crafted, never reinforced. */
const charms: CharmDef[] = [
  { id: 'tuskcharm', name: 'Tusk Charm', src: 'Gorehorn', perk: 'When you daze the monster, you heal 20.', effect: 'dazeHeal', craft: { coin: 150, tusk: 1, hide: 2 } },
  { id: 'plumecharm', name: 'Plume Charm', src: 'Galeshrike', perk: 'The hit that exposes a part gets Expose’s bonus too.', effect: 'exposeSelf', craft: { coin: 150, pinion: 1, plume: 2 } },
  { id: 'kilncharm', name: 'Kiln Charm', src: 'Cinderback', perk: 'Charge costs 1 die instead of 2.', effect: 'charge1', craft: { coin: 150, ventgland: 1, cinderscale: 2 } },
  { id: 'rimecharm', name: 'Rime Charm', src: 'Rimetail', perk: 'Light Cut moves deal 4 more damage.', effect: 'lightCut', craft: { coin: 150, barbtail: 1, rimescale: 2 } }
];
charms.push({ id: 'bogcharm', tier: 2, name: 'Bog Charm', src: 'Bogjaw', perk: 'When you cut your way out of a monster, you heal 20.', effect: 'escapeHeal', craft: { coin: 150, bogmolar: 1, bogskin: 2 } });
charms.push({ id: 'duskcharm', tier: 2, name: 'Dusk Charm', src: 'Duskheron', perk: 'When you daze a monster, your next hit deals +50%.', effect: 'dazeWhet', craft: { coin: 150, duskbeak: 1, duskplume: 2 } });
charms.push({ id: 'whelkcharm', tier: 2, name: 'Whelk Charm', src: 'Emberwhelk', perk: 'Expose lasts 3 turns instead of 2.', effect: 'longExpose', craft: { coin: 150, whelkgill: 1, whelkscale: 2 } });
charms.push({ id: 'glasscharm', tier: 2, name: 'Glass Charm', src: 'Mistglass', perk: 'Charged hits count double toward breaking parts.', effect: 'chargeBreak', craft: { coin: 150, glasstail: 1, glassdust: 2 } });
// bounty charms: unlocked by completing 3 / 6 / 10 different bounties, then crafted for coin (full game)
charms.push(
  { id: 'scoutcharm', tier: 2, name: 'Tracker’s Charm', src: 'Bounty board', perk: 'Start every hunt with 1 extra reroll.', effect: 'scout', craft: { coin: 100 }, bounties: 3 },
  { id: 'salvagecharm', tier: 2, name: 'Salvager’s Charm', src: 'Bounty board', perk: 'Breaking a part heals 15 and gives a reroll.', effect: 'salvage', craft: { coin: 150 }, bounties: 6 },
  { id: 'finishercharm', tier: 2, name: 'Finisher’s Charm', src: 'Bounty board', perk: 'Hits deal +25% once the monster can be captured.', effect: 'finisher', craft: { coin: 200 }, bounties: 10 }
);
charms.push({ id: 'corecharm', tier: 3, name: 'Core Charm', src: 'Monolith Warden', perk: 'After you swap weapons, your next hit deals +30%.', effect: 'swapWhet', craft: { coin: 200, coreshard: 1, wardenstone: 2 } });
charms.push({ id: 'crowncharm', tier: 3, name: 'Crown Charm', src: 'Stormcrown Roc', perk: 'Pierce hits on an airborne monster deal +20%.', effect: 'airPierce', craft: { coin: 200, stormcrown: 1, rocplume: 2 } });
charms.push({ id: 'slagcharm', tier: 3, name: 'Slag Charm', src: 'Slagwyrm', perk: 'A Blunt hit of 40 or more heals you 10.', effect: 'bigHeal', craft: { coin: 200, slagspine: 1, slagscale: 2 } });
charms.push({ id: 'stumpcharm', tier: 3, name: 'Stump Charm', src: 'Gorhydra', perk: 'Sealing a stump heals you 20.', effect: 'sealHeal', craft: { coin: 200, hydrafang: 1, hydrascale: 2 } });
charms.push({ id: 'squallcharm', tier: 2.5, name: 'Squall Charm', src: 'Squallhorn', perk: 'Charging also adds 10 daze.', effect: 'chargeDaze', craft: { coin: 175, galetusk: 1, squallhide: 2 } });
charms.push({ id: 'shroudcharm', tier: 2.5, name: 'Shroud Charm', src: 'Rimeshrike', perk: 'Hits on a flier while it’s on the ground deal +15%.', effect: 'groundHit', craft: { coin: 175, rimecrest: 1, rimeplume: 2 } });
charms.push({ id: 'quakecharm', tier: 2.5, name: 'Quake Charm', src: 'Quakeback', perk: 'Breaking a part frees a frozen or shaken die.', effect: 'breakFree', craft: { coin: 175, backridge: 1, quakescale: 2 } });
charms.push({ id: 'ashcharm', tier: 2.5, name: 'Ash Charm', src: 'Ashtail', perk: 'Pierce hits clear 1 more layer of ice or scales.', effect: 'pierceStrip', craft: { coin: 175, emberbarb: 1, ashscale: 2 } });
charms.push(
  { id: 'sporecharm', tier: 2.2, name: 'Spore Charm', src: 'Rotcap', perk: 'Infect weapons fill the meter 1 faster per hit.', effect: 'infectBuild', craft: { coin: 175, rotjaw: 1, rotspore: 2 } },
  { id: 'arccharm', tier: 2.2, name: 'Arc Charm', src: 'Arcmoth', perk: 'Spark weapons fill the meter 1 faster per hit.', effect: 'sparkBuild', craft: { coin: 175, arcfeeler: 1, arcdust: 2 } },
  { id: 'fangcharm', tier: 2.2, name: 'Fang Charm', src: 'Hollowfang', perk: 'Drain heals 5% more of your max HP.', effect: 'drainUp', craft: { coin: 175, palefang: 1, palehide: 2 } },
  { id: 'blightcharm', tier: 3.2, name: 'Blight Charm', src: 'Blightcrown', perk: 'Your Infect lasts 5 turns instead of 3.', effect: 'infectLong', craft: { coin: 225, blightjaw: 1, blightspore: 2 } },
  { id: 'glarecharm', tier: 3.2, name: 'Glare Charm', src: 'Glarewing', perk: 'Your Spark Discharge deals +40%.', effect: 'sparkBig', craft: { coin: 225, glarefeeler: 1, glaredust: 2 } },
  { id: 'gravecharm', tier: 3.2, name: 'Grave Charm', src: 'Gravefang', perk: 'Drain’s meter grows by 3 each time instead of 6.', effect: 'drainTol', craft: { coin: 225, gravetooth: 1, gravehide: 2 } }
);
charms.push({ id: 'sovcharm', tier: 4, name: 'Sovereign Charm', src: 'Wanderer Sovereign', perk: 'Breaking a part makes your next hit deal +50%.', effect: 'breakWhet', craft: { coin: 300, sovgel: 4 } });
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
  { id: 'duskplume', tier: 2, base: 'Dusk Plume', src: 'Duskheron', sell: 30, how: 'Every Duskheron hunt' },
  { id: 'duskbeak', tier: 2, base: 'Dusk Beak', src: 'Duskheron', sell: 90, how: 'Break the Duskheron’s upper head (Blunt best)' },
  { id: 'duskcrest', tier: 2, base: 'Dusk Crest', src: 'Duskheron', sell: 90, how: 'Break the Duskheron’s lower head (Blunt best)' },
  { id: 'duskpinion', tier: 2, base: 'Dusk Pinion', src: 'Duskheron', sell: 90, how: 'Break the Duskheron’s wings (Pierce best)' },
  { id: 'twilightquill', tier: 2, base: 'Twilight Quill', src: 'Duskheron', rare: true, sell: 450, how: 'Rare from Duskheron wings' },
  { id: 'whelkscale', tier: 2, base: 'Whelk Scale', src: 'Emberwhelk', sell: 30, how: 'Every Emberwhelk hunt' },
  { id: 'whelkgill', tier: 2, base: 'Whelk Gill', src: 'Emberwhelk', sell: 90, how: 'Break the Emberwhelk’s gills (Pierce best)' },
  { id: 'whelkshell', tier: 2, base: 'Whelk Shell', src: 'Emberwhelk', sell: 90, how: 'Break the Emberwhelk’s shell (Blunt best)' },
  { id: 'whelkfoot', tier: 2, base: 'Whelk Foot', src: 'Emberwhelk', sell: 90, how: 'Break the Emberwhelk’s foot (Cut best)' },
  { id: 'emberpearl', tier: 2, base: 'Ember Pearl', src: 'Emberwhelk', rare: true, sell: 450, how: 'Rare from Emberwhelk shell breaks' },
  { id: 'glassdust', tier: 2, base: 'Glass Dust', src: 'Mistglass', sell: 30, how: 'Every Mistglass hunt' },
  { id: 'glasstail', tier: 2, base: 'Tail Shard', src: 'Mistglass', sell: 90, how: 'Break the Mistglass’s tail shards (Cut best)' },
  { id: 'glassfacet', tier: 2, base: 'Glass Facet', src: 'Mistglass', sell: 90, how: 'Break the Mistglass’s facets (Blunt best)' },
  { id: 'glasseye', tier: 2, base: 'Glass Eye', src: 'Mistglass', sell: 90, how: 'Break the Mistglass’s eyes (Pierce best)' },
  { id: 'mirrorheart', tier: 2, base: 'Mirror Heart', src: 'Mistglass', rare: true, sell: 450, how: 'Rare from Mistglass eye breaks' },
  { id: 'wardenstone', tier: 3, base: 'Wardenstone', src: 'Monolith Warden', sell: 45, how: 'Every Monolith Warden hunt' },
  { id: 'wardenplate', tier: 3, base: 'Warden Plate', src: 'Monolith Warden', sell: 130, how: 'Break the Warden’s stone plates (Blunt only)' },
  { id: 'wardenarm', tier: 3, base: 'Boulder Fist', src: 'Monolith Warden', sell: 130, how: 'Break the Warden’s boulder arms (Cut best)' },
  { id: 'coreshard', tier: 3, base: 'Core Shard', src: 'Monolith Warden', sell: 130, how: 'Break the Warden’s core while it’s exposed (Pierce best)' },
  { id: 'wardencore', tier: 3, base: 'Warden Core', src: 'Monolith Warden', rare: true, sell: 650, how: 'Rare from Monolith Warden core breaks' },
  { id: 'rocplume', tier: 3, base: 'Storm Plume', src: 'Stormcrown Roc', sell: 45, how: 'Every Stormcrown Roc hunt' },
  { id: 'rocpinion', tier: 3, base: 'Roc Pinion', src: 'Stormcrown Roc', sell: 130, how: 'Break the Roc’s wings (Pierce best)' },
  { id: 'stormcrown', tier: 3, base: 'Crown Shard', src: 'Stormcrown Roc', sell: 130, how: 'Break the Roc’s storm crown (Pierce best)' },
  { id: 'roctalon', tier: 3, base: 'Roc Talon', src: 'Stormcrown Roc', sell: 130, how: 'Break the Roc’s talons (Cut best)' },
  { id: 'stormheart', tier: 3, base: 'Stormheart', src: 'Stormcrown Roc', rare: true, sell: 650, how: 'Rare from Stormcrown Roc crown breaks' },
  { id: 'slagscale', tier: 3, base: 'Slag Scale', src: 'Slagwyrm', sell: 45, how: 'Every Slagwyrm hunt' },
  { id: 'slagspine', tier: 3, base: 'Spine Plate', src: 'Slagwyrm', sell: 130, how: 'Break the Slagwyrm’s spine plates (Blunt best)' },
  { id: 'slagjaw', tier: 3, base: 'Slag Fang', src: 'Slagwyrm', sell: 130, how: 'Break the Slagwyrm’s jaw (Pierce best)' },
  { id: 'slagtail', tier: 3, base: 'Slag Tail', src: 'Slagwyrm', sell: 130, how: 'Sever the Slagwyrm’s tail (Cut best)' },
  { id: 'slagheart', tier: 3, base: 'Slagheart', src: 'Slagwyrm', rare: true, sell: 650, how: 'Rare from Slagwyrm spine breaks' },
  { id: 'hydrascale', tier: 3, base: 'Hydra Scale', src: 'Gorhydra', sell: 45, how: 'Every Gorhydra hunt' },
  { id: 'hydrafang', tier: 3, base: 'Hydra Fang', src: 'Gorhydra', sell: 130, how: 'Break the Gorhydra’s left head (Cut best)' },
  { id: 'hydracrown', tier: 3, base: 'Hydra Crown', src: 'Gorhydra', sell: 130, how: 'Break the Gorhydra’s middle head (Cut best)' },
  { id: 'hydrahorn', tier: 3, base: 'Hydra Horn', src: 'Gorhydra', sell: 130, how: 'Break the Gorhydra’s right head (Cut best)' },
  { id: 'hydraheart', tier: 3, base: 'Hydraheart', src: 'Gorhydra', rare: true, sell: 650, how: 'Rare from the Gorhydra’s middle head' },
  { id: 'mirestone', tier: 2, base: 'Mirestone', src: 'Bogjaw', rare: true, sell: 450, how: 'Rare from Bogjaw stone warts' }
);
mats.push(
  { id: 'squallhide', tier: 2.5, base: 'Squall Hide', src: 'Squallhorn', sell: 35, how: 'Every Squallhorn hunt' },
  { id: 'galetusk', tier: 2.5, base: 'Gale Tusk', src: 'Squallhorn', sell: 110, how: 'Break the Squallhorn’s tusks (Blunt best)' },
  { id: 'squallmane', tier: 2.5, base: 'Squall Mane', src: 'Squallhorn', sell: 110, how: 'Break the Squallhorn’s mane (Cut best)' },
  { id: 'squallsinew', tier: 2.5, base: 'Squall Sinew', src: 'Squallhorn', sell: 110, how: 'Break the Squallhorn’s hind legs (Pierce best)' },
  { id: 'galeheart', tier: 2.5, base: 'Galeheart', src: 'Squallhorn', rare: true, sell: 550, how: 'Rare from Squallhorn tusk breaks' },
  { id: 'rimeplume', tier: 2.5, base: 'Rime Plume', src: 'Rimeshrike', sell: 35, how: 'Every Rimeshrike hunt' },
  { id: 'rimepinion', tier: 2.5, base: 'Rime Pinion', src: 'Rimeshrike', sell: 110, how: 'Break the Rimeshrike’s wings (Pierce best)' },
  { id: 'icetalon', tier: 2.5, base: 'Ice Talon', src: 'Rimeshrike', sell: 110, how: 'Break the Rimeshrike’s talons (Cut best)' },
  { id: 'rimecrest', tier: 2.5, base: 'Rime Crest', src: 'Rimeshrike', sell: 110, how: 'Break the Rimeshrike’s crest (Blunt best, only on the ground)' },
  { id: 'haileye', tier: 2.5, base: 'Hail Eye', src: 'Rimeshrike', rare: true, sell: 550, how: 'Rare from Rimeshrike crest breaks' },
  { id: 'quakescale', tier: 2.5, base: 'Quake Scale', src: 'Quakeback', sell: 35, how: 'Every Quakeback hunt' },
  { id: 'quakeplate', tier: 2.5, base: 'Quake Plate', src: 'Quakeback', sell: 110, how: 'Break the Quakeback’s head plate (Blunt best)' },
  { id: 'quakeclaw', tier: 2.5, base: 'Quake Claw', src: 'Quakeback', sell: 110, how: 'Break the Quakeback’s claws (Cut best)' },
  { id: 'backridge', tier: 2.5, base: 'Ridge Stone', src: 'Quakeback', sell: 110, how: 'Break the Quakeback’s back ridge (Pierce best)' },
  { id: 'quakeheart', tier: 2.5, base: 'Quakeheart', src: 'Quakeback', rare: true, sell: 550, how: 'Rare from Quakeback head plate breaks' },
  { id: 'ashscale', tier: 2.5, base: 'Ash Scale', src: 'Ashtail', sell: 35, how: 'Every Ashtail hunt' },
  { id: 'emberbarb', tier: 2.5, base: 'Ember Barb', src: 'Ashtail', sell: 110, how: 'Sever the Ashtail’s tail (Cut best)' },
  { id: 'ashmantle', tier: 2.5, base: 'Mantle Ember', src: 'Ashtail', sell: 110, how: 'Break the Ashtail’s ember mantle (Blunt best)' },
  { id: 'ashfang', tier: 2.5, base: 'Ash Fang', src: 'Ashtail', sell: 110, how: 'Break the Ashtail’s jaw (Pierce best)' },
  { id: 'ashheart', tier: 2.5, base: 'Ashheart', src: 'Ashtail', rare: true, sell: 550, how: 'Rare from Ashtail ember mantle breaks' }
);
mats.push(
  { id: 'rotspore', tier: 2.2, base: 'Rot Spore', src: 'Rotcap', sell: 30, how: 'Every Rotcap hunt' },
  { id: 'capflesh', tier: 2.2, base: 'Cap Flesh', src: 'Rotcap', sell: 90, how: 'Break the Rotcap’s cap (Pierce best)' },
  { id: 'rotjaw', tier: 2.2, base: 'Rot Jaw', src: 'Rotcap', sell: 90, how: 'Break the Rotcap’s jaw (Blunt best)' },
  { id: 'rootleg', tier: 2.2, base: 'Root Leg', src: 'Rotcap', sell: 90, how: 'Break the Rotcap’s root legs (Cut best)' },
  { id: 'sporeheart', tier: 2.2, base: 'Sporeheart', src: 'Rotcap', rare: true, sell: 450, how: 'Rare from Rotcap cap breaks' },
  { id: 'arcdust', tier: 2.2, base: 'Arc Dust', src: 'Arcmoth', sell: 30, how: 'Every Arcmoth hunt' },
  { id: 'arcwing', tier: 2.2, base: 'Arc Wing', src: 'Arcmoth', sell: 90, how: 'Break the Arcmoth’s wings (Pierce best)' },
  { id: 'arcfeeler', tier: 2.2, base: 'Feeler', src: 'Arcmoth', sell: 90, how: 'Break the Arcmoth’s antennae (Cut best)' },
  { id: 'arcthorax', tier: 2.2, base: 'Thorax Plate', src: 'Arcmoth', sell: 90, how: 'Break the Arcmoth’s thorax (Blunt best, on the ground)' },
  { id: 'sparkgland', tier: 2.2, base: 'Spark Gland', src: 'Arcmoth', rare: true, sell: 450, how: 'Rare from Arcmoth thorax breaks' },
  { id: 'palehide', tier: 2.2, base: 'Pale Hide', src: 'Hollowfang', sell: 30, how: 'Every Hollowfang hunt' },
  { id: 'palefang', tier: 2.2, base: 'Pale Fang', src: 'Hollowfang', sell: 90, how: 'Break the Hollowfang’s fangs (Blunt best)' },
  { id: 'bloodsac', tier: 2.2, base: 'Blood Sac', src: 'Hollowfang', sell: 90, how: 'Break the Hollowfang’s throat sac (Cut best)' },
  { id: 'palewing', tier: 2.2, base: 'Pale Wing', src: 'Hollowfang', sell: 90, how: 'Break the Hollowfang’s wings (Pierce best)' },
  { id: 'bloodpearl', tier: 2.2, base: 'Blood Pearl', src: 'Hollowfang', rare: true, sell: 450, how: 'Rare from Hollowfang fang breaks' },
  { id: 'blightspore', tier: 3.2, base: 'Blight Spore', src: 'Blightcrown', sell: 45, how: 'Every Blightcrown hunt' },
  { id: 'crustcap', tier: 3.2, base: 'Crusted Cap', src: 'Blightcrown', sell: 130, how: 'Break the Blightcrown’s cap (Pierce best)' },
  { id: 'blightjaw', tier: 3.2, base: 'Blight Jaw', src: 'Blightcrown', sell: 130, how: 'Break the Blightcrown’s jaw (Blunt best)' },
  { id: 'blightroot', tier: 3.2, base: 'Blight Root', src: 'Blightcrown', sell: 130, how: 'Break the Blightcrown’s root legs (Cut best)' },
  { id: 'blightheart', tier: 3.2, base: 'Blightheart', src: 'Blightcrown', rare: true, sell: 650, how: 'Rare from Blightcrown jaw breaks' },
  { id: 'glaredust', tier: 3.2, base: 'Glare Dust', src: 'Glarewing', sell: 45, how: 'Every Glarewing hunt' },
  { id: 'glarepinion', tier: 3.2, base: 'Glare Wing', src: 'Glarewing', sell: 130, how: 'Break the Glarewing’s wings (Pierce best)' },
  { id: 'glarefeeler', tier: 3.2, base: 'Glare Feeler', src: 'Glarewing', sell: 130, how: 'Break the Glarewing’s antennae (Cut best)' },
  { id: 'glarethorax', tier: 3.2, base: 'Glare Thorax', src: 'Glarewing', sell: 130, how: 'Break the Glarewing’s thorax (Blunt best, on the ground)' },
  { id: 'glaregland', tier: 3.2, base: 'Glare Gland', src: 'Glarewing', rare: true, sell: 650, how: 'Rare from Glarewing thorax breaks' },
  { id: 'gravehide', tier: 3.2, base: 'Grave Hide', src: 'Gravefang', sell: 45, how: 'Every Gravefang hunt' },
  { id: 'gravetooth', tier: 3.2, base: 'Grave Fang', src: 'Gravefang', sell: 130, how: 'Break the Gravefang’s fangs (Blunt best)' },
  { id: 'gravesac', tier: 3.2, base: 'Grave Sac', src: 'Gravefang', sell: 130, how: 'Break the Gravefang’s throat sac (Pierce only)' },
  { id: 'gravewing', tier: 3.2, base: 'Grave Wing', src: 'Gravefang', sell: 130, how: 'Break the Gravefang’s wings (Pierce best)' },
  { id: 'gravepearl', tier: 3.2, base: 'Grave Pearl', src: 'Gravefang', rare: true, sell: 650, how: 'Rare from Gravefang fang breaks' }
);
mats.push(
  { id: 'sovgel', tier: 4, base: 'Sovereign Gel', src: 'Wanderer Sovereign', sell: 60, how: 'Every Wanderer Sovereign hunt' },
  { id: 'sovtusk', tier: 4, base: 'Swallowed Tusk', src: 'Wanderer Sovereign', sell: 180, how: 'Tear out the Sovereign’s tusks (Pierce best)' },
  { id: 'sovwing', tier: 4, base: 'Swallowed Wing', src: 'Wanderer Sovereign', sell: 180, how: 'Tear out the Sovereign’s wings (Blunt best, on the ground)' },
  { id: 'sovvent', tier: 4, base: 'Swallowed Vent', src: 'Wanderer Sovereign', sell: 180, how: 'Cut out the Sovereign’s vents (Cut best, on the surface)' },
  { id: 'sovtail', tier: 4, base: 'Swallowed Tail', src: 'Wanderer Sovereign', sell: 180, how: 'Shatter the Sovereign’s tail (Blunt best)' },
  { id: 'sovheart', tier: 4, base: 'Sovereign Heart', src: 'Wanderer Sovereign', rare: true, sell: 900, how: 'Rare from Sovereign tusk breaks' }
);
export const MATERIALS: Record<string, MaterialDef> = Object.fromEntries(mats.filter(inEdition).map(m => [m.id, m]));

/** Display name: base + source monster in brackets, rares flagged. */
export function matName(id: string): string {
  const m = MATERIALS[id];
  return `${m.base} (${m.src}${m.rare ? ', rare' : ''})`;
}
