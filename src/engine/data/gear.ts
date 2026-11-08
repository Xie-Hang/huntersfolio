import type { ArmorDef, CharmDef, ItemDef, MaterialDef } from '../types';
import { MAX_TIER } from '../edition';
const inEdition = <T extends { tier?: number }>(x: T) => (x.tier ?? 1) <= MAX_TIER;

const armors: ArmorDef[] = [
  // the Foothills (the tutorial island, Nov 2026): the first armor you make
  { id: 'hidevest', tier: 0.5, foothills: true, name: 'Tuskling Hide Vest', hp: 200, guard: 9, rerolls: 3, resist: null, perk: 'Sturdier than the jerkin. 200 HP and **Block** 9 a die.', short: '200 HP · **Block** 9 a die', craft: { coin: 60, tuskhide: 2 } },
  { id: 'jerkin', name: 'Leather Jerkin', hp: 180, guard: 8, rerolls: 3, resist: null, perk: 'Start each hunt with 3 **Rerolls** instead of 2.', short: '3 **Rerolls**', craft: { coin: 80 } },
  { id: 'vest', name: 'Bristlehide Vest', hp: 200, guard: 8, rerolls: 2, resist: 'Stone', perk: 'Resists **Stone** (−30%). Blanks **Block** 2.5× instead of 1.5×.', short: 'Blanks **Block** 2.5×', blankx2: true, craft: { coin: 300, pelt: 2, hide: 3 } },
  { id: 'coat', name: 'Galeweave Coat', hp: 170, guard: 7, rerolls: 2, resist: 'Gale', perk: 'Resists **Gale** (−30%). Breaking a part heals you 25 and gives +1 **Reroll**.', short: 'Breaks heal 25, +1 **Reroll**', breakHeal: true, craft: { coin: 250, pinion: 2, plume: 3 } },
  { id: 'kilnplate', name: 'Kilnplate Mail', hp: 190, guard: 9, rerolls: 2, resist: 'Ember', perk: 'Resists **Ember** (−30%). Protects you from molten shells.', short: 'Molten-proof', burnproof: true, craft: { coin: 300, ventgland: 2, digclaw: 1, cinderscale: 3 } },
  { id: 'rimehide', name: 'Rimehide Cloak', hp: 185, guard: 8, rerolls: 3, resist: 'Frost', perk: 'Resists **Frost** (−30%). Start each hunt with 3 **Rerolls** instead of 2.', short: '3 **Rerolls**', craft: { coin: 300, frostfang: 1, barbtail: 1, rimescale: 3 } }
];
armors.push({ id: 'cragmail', tier: 1.5, name: 'Cragslate Mail', hp: 200, guard: 9, rerolls: 2, resist: 'Gale', perk: 'Resists **Gale** (−30%). Your first **Swap** each hunt is free.', short: 'First **Swap** each hunt free', swapOnce: true, craft: { coin: 450, cragslate: 4, cragpinion: 2 } });
armors.push({ id: 'fencoat', tier: 2.4, name: 'Fenhide Coat', hp: 225, guard: 10, rerolls: 2, resist: 'Ember', perk: 'Resists **Ember** (−30%). When swallowed, you cut free twice as fast.', short: 'Cut free 2× as fast', slick: true, craft: { coin: 700, fenhide: 4, fensac: 2 } });
armors.push({ id: 'bogcoat', tier: 2, name: 'Bogskin Coat', hp: 220, guard: 9, rerolls: 2, resist: 'Stone', perk: 'Resists **Stone** (−30%). When swallowed, you cut free twice as fast.', short: 'Cut free 2× as fast', slick: true, craft: { coin: 600, bogskin: 4, throatsac: 2 } });
armors.push({ id: 'duskcoat', tier: 2, name: 'Duskweave Coat', hp: 200, guard: 9, rerolls: 3, resist: 'Gale', perk: 'Resists **Gale** (−30%). Your **Block** always counts in full.', short: '**Block** always in full', steady: true, craft: { coin: 600, duskplume: 4, duskcrest: 2 } });
armors.push({ id: 'whelkplate', tier: 2, name: 'Whelkshell Plate', hp: 210, guard: 10, rerolls: 2, resist: 'Ember', perk: 'Resists **Ember** (−30%). Heals you 6 after each of its moves.', short: 'Heal 6 after each move', mend: true, craft: { coin: 600, whelkscale: 4, whelkshell: 2 } });
armors.push({ id: 'glassmantle', tier: 2, name: 'Glassmist Mantle', hp: 195, guard: 9, rerolls: 3, resist: 'Frost', perk: 'Resists **Frost** (−30%). **Charge** also gives you **Block** 12.', short: '**Charge** gives **Block** 12', braced: true, craft: { coin: 600, glassdust: 4, glassfacet: 2 } });
armors.push({ id: 'wardenmail', tier: 3, name: 'Wardenstone Mail', hp: 240, guard: 11, rerolls: 2, resist: 'Stone', perk: 'Resists **Stone** (−30%). Your first **Swap** each turn is free.', short: 'First **Swap** each turn free', quickswap: true, craft: { coin: 900, wardenstone: 5, wardenplate: 2 } });
armors.push({ id: 'stormcloak', tier: 3, name: 'Stormfeather Cloak', hp: 225, guard: 10, rerolls: 3, resist: 'Gale', perk: 'Resists **Gale** (−30%). **Thunderhead** is ½ against you.', short: '**Thunderhead** ½', rod: true, craft: { coin: 900, rocplume: 5, rocpinion: 2 } });
armors.push({ id: 'slagplate', tier: 3, name: 'Slagforged Plate', hp: 250, guard: 10, rerolls: 2, resist: 'Ember', perk: 'Resists **Ember** (−30%). Every hit on you is 6 less.', short: 'Hits on you −6', ward: 6, craft: { coin: 900, slagscale: 5, slagspine: 2 } });
armors.push({ id: 'hydracoat', tier: 3, name: 'Hydrascale Coat', hp: 235, guard: 10, rerolls: 3, resist: 'Frost', perk: 'Resists **Frost** (−30%). Protects your dice from freezing.', short: 'Freeze-proof dice', thaw: true, craft: { coin: 900, hydrascale: 5, hydrafang: 2 } });
// the changed Ashfall Ridge (variants): between Mirewood and Stormspire
armors.push({ id: 'squallcoat', tier: 2.5, name: 'Squallhide Coat', hp: 225, guard: 10, rerolls: 2, resist: 'Gale', perk: 'Resists **Gale** (−30%). **Blunt** hits that fill **Daze** fill 5 more.', short: '**Blunt** **Daze** +5', dazeUp: true, craft: { coin: 750, squallhide: 4, squallmane: 2 } });
armors.push({ id: 'rimemantle', tier: 2.5, name: 'Rimeplume Mantle', hp: 210, guard: 10, rerolls: 3, resist: 'Frost', perk: 'Resists **Frost** (−30%). Your first **Swap** each hunt is free.', short: 'First **Swap** each hunt free', swapOnce: true, craft: { coin: 750, rimeplume: 4, rimepinion: 2 } });
armors.push({ id: 'quakemail', tier: 2.5, name: 'Quakestone Plate', hp: 235, guard: 10, rerolls: 2, resist: 'Stone', perk: 'Resists **Stone** (−30%). Protects your dice from tremors.', short: 'Tremor-proof dice', steadyfoot: true, craft: { coin: 750, quakescale: 4, quakeclaw: 2 } });
armors.push({ id: 'ashcoat', tier: 2.5, name: 'Ashscale Coat', hp: 220, guard: 10, rerolls: 2, resist: 'Ember', perk: 'Resists **Ember** (−30%). Protects you from burning scales and molten shells.', short: 'Burn-proof', burnproof: true, craft: { coin: 750, ashscale: 4, ashfang: 2 } });
// the Gloamhollow (status monsters, Nov 2026): tier 2.2 beside the Mirewood; the Mirewood, changed (3.2) beside the Stormspire
armors.push(
  { id: 'sporecoat', tier: 2.2, name: 'Sporecap Coat', hp: 215, guard: 9, rerolls: 2, resist: 'Stone', perk: 'Resists **Stone** (−30%). **Infect** on you lasts 1 turn less.', short: '**Infect** on you −1 turn', infectLess: 1, craft: { coin: 650, rotspore: 4, rootleg: 2 } },
  { id: 'arccloak', tier: 2.2, name: 'Arcdust Cloak', hp: 200, guard: 9, rerolls: 3, resist: 'Gale', perk: 'Resists **Gale** (−30%). **Spark** going off on you is ⅓ less.', short: '**Spark** on you ⅓ less', sparkLess: 0.35, craft: { coin: 650, arcdust: 4, arcwing: 2 } },
  { id: 'palemail', tier: 2.2, name: 'Palehide Mail', hp: 210, guard: 10, rerolls: 2, resist: 'Frost', perk: 'Resists **Frost** (−30%). **Latched on** lasts 2 turns at most.', short: 'Latch 2 turns at most', latchMax: 2, craft: { coin: 650, palehide: 4, bloodsac: 2 } },
  { id: 'fevercoat', tier: 3.2, name: 'Feverskin Coat', hp: 245, guard: 11, rerolls: 2, resist: 'Ember', perk: 'Resists **Ember** (−30%). **Infect** on you lasts 2 turns less.', short: '**Infect** on you −2 turns', infectLess: 2, craft: { coin: 950, feverskin: 5, feversac: 2 } },
  { id: 'heroncloak', tier: 3.2, name: 'Archeron Cloak', hp: 230, guard: 10, rerolls: 3, resist: 'Frost', perk: 'Resists **Frost** (−30%). Protects your dice from its static, and **Spark** going off on you is ⅓ less.', short: '**Static**-proof, **Spark** ⅓ less', chargeProof: true, sparkLess: 0.35, craft: { coin: 950, archplume: 5, archpinion: 2 } },
  { id: 'bloodplate', tier: 3.2, name: 'Bloodshell Plate', hp: 250, guard: 11, rerolls: 2, resist: 'Stone', perk: 'Resists **Stone** (−30%). Protects you from **Leeching**.', short: 'Leech-proof', leechProof: true, craft: { coin: 950, bloodscale: 5, bloodshell: 2 } }
);
// the apex
armors.push({ id: 'sovmantle', tier: 4, name: 'Sovereign Mantle', hp: 260, guard: 12, rerolls: 3, resist: null, perk: 'Resists whatever element it attacks with (−30%).', short: 'Resists its element', adaptive: true, craft: { coin: 1400, sovgel: 6, sovheart: 1 } });
export const ARMORS: Record<string, ArmorDef> = Object.fromEntries(armors.filter(inEdition).map(a => [a.id, a]));

const items: ItemDef[] = [
  { id: 'salve', name: 'Bitterroot Salve', max: 3, price: 30, craft: { tuft: 3, coin: 10 }, desc: 'Heals you 30.', short: 'Heal 30', effect: 'heal30' },
  // Playtest (Nov 2026): capture was free and safe. A snare costs coin, and it can be torn free.
  { id: 'snare', name: 'Snare', max: 2, price: 40, desc: 'Needed to capture. You carry **Snares** on every hunt, outside your item slot, and each try uses one.', short: 'Needed to capture', effect: 'snare', pouch: true },
  { id: 'smoke', name: 'Smoke Pouch', max: 2, price: 50, desc: 'Its next attack misses.', short: 'Its next attack misses', effect: 'smoke' },
  { id: 'whet', name: 'Whetstone', max: 2, price: 40, craft: { milktusk: 1, coin: 20 }, yields: 2, desc: 'Your next hit +50%.', short: 'Next hit +50%', effect: 'whet50' },
  { id: 'net', name: 'Weighted Net', max: 2, price: 50, desc: 'Brings an **Airborne** monster down, and it loses its turn.', short: 'Brings it down, loses a turn', effect: 'net' },
  { id: 'firepot', name: 'Firepot', max: 2, price: 50, desc: 'Melts all its ice, or cracks all its slate, at once.', short: 'Breaks all its ice or slate', effect: 'thaw' },
  { id: 'blast', name: 'Blast Powder', max: 2, price: 50, desc: 'Forces it up from underground, and it loses its turn.', short: 'Forces it up, loses a turn', effect: 'blast' },
  { id: 'purge', tier: 2.2, name: 'Purging Tonic', max: 2, price: 50, desc: 'Cures **Infect** on you.', short: 'Cures **Infect** on you', effect: 'cureInfect' },
  { id: 'groundsalt', tier: 2.2, name: 'Grounding Salt', max: 2, price: 50, desc: 'Clears the **Spark** on you and your **Static** dice.', short: 'Clears **Spark** and **Static**', effect: 'cureSpark' },
  // Traps (prototype, Nov 2026; working names): set this turn, they catch only the move they're built for
  { id: 'tripline', name: 'Tripline', max: 2, price: 60, desc: 'Catches a charge, lunge or pounce. No hit, and it loses 2 turns.\nIf it’s weak enough, that captures it.\nWasted on any other move.', short: 'Catches charge, lunge, pounce', effect: 'trapRush' },
  { id: 'stakebed', name: 'Stakebed', max: 2, price: 60, desc: 'Catches a dive, or a burst up from underground. No hit, and it loses 2 turns.\nIf it’s weak enough, that captures it.\nWasted on any other move.', short: 'Catches dives and bursts', effect: 'trapLand' },
  { id: 'tuskwhet', name: 'Tusk Whetstone', max: 2, craft: { tusk: 1, coin: 20 }, yields: 2, desc: 'Your next hit +100%.', short: 'Next hit +100%', effect: 'whet100' }
];
export const ITEMS: Record<string, ItemDef> = Object.fromEntries(items.filter(inEdition).map(i => [i.id, i]));

/** One charm per monster: a single small perk that deepens a playstyle. Crafted, never reinforced. */
const charms: CharmDef[] = [
  // the Foothills' charm (Mekkman, Nov 2026: 'deal small damage when you block')
  { id: 'tuskcharm', name: 'Tusk Charm', src: 'Gorehorn', short: 'Heal 20 on a **Daze**', perk: 'When you **Daze** it, you heal 20.', effect: 'dazeHeal', craft: { coin: 150, tusk: 1, hide: 2 } },
  { id: 'plumecharm', name: 'Plume Charm', src: 'Galeshrike', short: 'Exposing hit gets +20%', perk: 'The hit that **Exposes** a part gets the +20% too.', effect: 'exposeSelf', craft: { coin: 150, pinion: 1, plume: 2 } },
  { id: 'kilncharm', name: 'Kiln Charm', src: 'Cinderback', short: '**Charge** costs 1 die', perk: '**Charge** costs 1 die instead of 2.', effect: 'charge1', craft: { coin: 150, ventgland: 1, cinderscale: 2 } },
  { id: 'rimecharm', name: 'Rime Charm', src: 'Rimetail', short: '**Slash** and **Gust Cut** +4', perk: '**Slash** and **Gust Cut** hit for 4 more.', effect: 'lightCut', craft: { coin: 150, barbtail: 1, rimescale: 2 } }
];
charms.push({ id: 'cragcharm', tier: 1.5, name: 'Crag Charm', src: 'Cragwing', short: 'Next hit +50% after grounding', perk: 'Bringing it down or driving it up makes your next hit +50%.', effect: 'landWhet', craft: { coin: 175, craghorn: 1, cragslate: 2 } });
charms.push({ id: 'fencharm', tier: 2.4, name: 'Fen Charm', src: 'Fenmother', short: 'First hit each turn +15%', perk: 'Your first hit each turn +15%.', effect: 'firstHit', craft: { coin: 200, fengill: 1, fenhide: 2 } });
charms.push({ id: 'bogcharm', tier: 2, name: 'Bog Charm', src: 'Bogjaw', short: 'Heal 20 when you cut free', perk: 'When you cut free of a swallow, you heal 20.', effect: 'escapeHeal', craft: { coin: 150, bogmolar: 1, bogskin: 2 } });
charms.push({ id: 'duskcharm', tier: 2, name: 'Dusk Charm', src: 'Duskheron', short: 'Next hit +50% after a **Daze**', perk: 'When you **Daze** it, your next hit +50%.', effect: 'dazeWhet', craft: { coin: 150, duskbeak: 1, duskplume: 2 } });
charms.push({ id: 'whelkcharm', tier: 2, name: 'Whelk Charm', src: 'Emberwhelk', short: '**Expose** lasts 3 turns', perk: '**Expose** lasts 3 turns instead of 2.', effect: 'longExpose', craft: { coin: 150, whelkgill: 1, whelkscale: 2 } });
charms.push({ id: 'glasscharm', tier: 2, name: 'Glass Charm', src: 'Mistglass', short: '**Charged** hits break ×2', perk: '**Charged** hits count double toward breaking parts.', effect: 'chargeBreak', craft: { coin: 150, glasstail: 1, glassdust: 2 } });
// bounty charms: unlocked by completing 3 / 6 / 10 different bounties, then crafted for coin (full game)
charms.push(
  { id: 'scoutcharm', tier: 2, name: 'Tracker’s Charm', src: 'Bounty board', short: '+1 **Reroll** each hunt', perk: 'Start every hunt with 1 extra **Reroll**.', effect: 'scout', craft: { coin: 100 }, bounties: 3 },
  { id: 'salvagecharm', tier: 2, name: 'Salvager’s Charm', src: 'Bounty board', short: 'Breaks heal 15, +1 **Reroll**', perk: 'Breaking a part heals you 15 and gives +1 **Reroll**.', effect: 'salvage', craft: { coin: 150 }, bounties: 6 },
  { id: 'finishercharm', tier: 2, name: 'Finisher’s Charm', src: 'Bounty board', short: '+25% once **Capturable**', perk: 'Your hits +25% once it’s **Capturable**.', effect: 'finisher', craft: { coin: 200 }, bounties: 10 }
);
charms.push({ id: 'corecharm', tier: 3, name: 'Core Charm', src: 'Monolith Warden', short: 'Next hit +30% after a **Swap**', perk: 'After a **Swap**, your next hit +30%.', effect: 'swapWhet', craft: { coin: 200, coreshard: 1, wardenstone: 2 } });
charms.push({ id: 'crowncharm', tier: 3, name: 'Crown Charm', src: 'Stormcrown Roc', short: '**Pierce** on **Airborne** +20%', perk: '**Pierce** hits on it while **Airborne** +20%.', effect: 'airPierce', craft: { coin: 200, stormcrown: 1, rocplume: 2 } });
charms.push({ id: 'slagcharm', tier: 3, name: 'Slag Charm', src: 'Slagwyrm', short: '40+ **Blunt** hit heals 10', perk: 'A **Blunt** hit of 40 or more heals you 10.', effect: 'bigHeal', craft: { coin: 200, slagspine: 1, slagscale: 2 } });
charms.push({ id: 'stumpcharm', tier: 3, name: 'Stump Charm', src: 'Gorhydra', short: 'Sealing a stump heals 20', perk: 'Sealing a stump heals you 20.', effect: 'sealHeal', craft: { coin: 200, hydrafang: 1, hydrascale: 2 } });
charms.push({ id: 'squallcharm', tier: 2.5, name: 'Squall Charm', src: 'Squallhorn', short: '**Charge** fills 10 **Daze**', perk: '**Charge** also fills 10 **Daze**.', effect: 'chargeDaze', craft: { coin: 175, galetusk: 1, squallhide: 2 } });
charms.push({ id: 'shroudcharm', tier: 2.5, name: 'Shroud Charm', src: 'Rimeshrike', short: 'Fliers on the ground +15%', perk: 'Hits on a flier while it’s on the ground +15%.', effect: 'groundHit', craft: { coin: 175, rimecrest: 1, rimeplume: 2 } });
charms.push({ id: 'quakecharm', tier: 2.5, name: 'Quake Charm', src: 'Quakeback', short: 'Breaks get back 1 lost die', perk: 'Breaking a part gets back 1 die lost to ice or tremors.', effect: 'breakFree', craft: { coin: 175, backridge: 1, quakescale: 2 } });
charms.push({ id: 'ashcharm', tier: 2.5, name: 'Ash Charm', src: 'Ashtail', short: '**Pierce** breaks 1 more layer', perk: '**Pierce** hits break 1 more layer of ice or scales.', effect: 'pierceStrip', craft: { coin: 175, emberbarb: 1, ashscale: 2 } });
charms.push(
  { id: 'sporecharm', tier: 2.2, name: 'Spore Charm', src: 'Rotcap', short: '**Infect** fills 1 more', perk: '**Infect** weapons fill the meter 1 more per hit.', effect: 'infectBuild', craft: { coin: 175, rotjaw: 1, rotspore: 2 } },
  { id: 'arccharm', tier: 2.2, name: 'Arc Charm', src: 'Arcmoth', short: '**Spark** fills 1 more', perk: '**Spark** weapons fill the meter 1 more per hit.', effect: 'sparkBuild', craft: { coin: 175, arcfeeler: 1, arcdust: 2 } },
  { id: 'fangcharm', tier: 2.2, name: 'Fang Charm', src: 'Hollowfang', short: '**Drain** heals 5% more', perk: '**Drain** heals 5% more of your max HP.', effect: 'drainUp', craft: { coin: 175, palefang: 1, palehide: 2 } },
  { id: 'fevercharm', tier: 3.2, name: 'Fever Charm', src: 'Feverjaw', short: '**Infect** lasts 5 turns', perk: 'Your **Infect** lasts 5 turns instead of 3.', effect: 'infectLong', craft: { coin: 225, fevermolar: 1, feverskin: 2 } },
  { id: 'heroncharm', tier: 3.2, name: 'Heron Charm', src: 'Archeron', short: 'Your **Spark** +40%', perk: 'Your **Spark** going off +40%.', effect: 'sparkBig', craft: { coin: 225, archcrest: 1, archplume: 2 } },
  { id: 'bloodcharm', tier: 3.2, name: 'Blood Charm', src: 'Bloodwhelk', short: '**Drain** meter grows slower', perk: '**Drain**’s meter grows by 3 each time instead of 6.', effect: 'drainTol', craft: { coin: 225, bloodfoot: 1, bloodscale: 2 } }
);
charms.push({ id: 'sovcharm', tier: 4, name: 'Sovereign Charm', src: 'Wanderer Sovereign', short: 'Next hit +50% after a break', perk: 'Breaking a part makes your next hit +50%.', effect: 'breakWhet', craft: { coin: 300, sovgel: 4 } });
export const CHARMS: Record<string, CharmDef> = Object.fromEntries(charms.filter(inEdition).map(c => [c.id, c]));

const mats: MaterialDef[] = [
  // the Foothills (the tutorial island, Nov 2026)
  { id: 'tuft', base: 'Hatchling Down', src: 'Cragling', sell: 5, how: 'Every Cragling hunt' },
  { id: 'shell', base: 'Kit Scale', src: 'Rimekit', sell: 10, how: 'Every Rimekit hunt' },
  { id: 'tuskhide', base: 'Tuskling Hide', src: 'Tuskling', sell: 10, how: 'Every Tuskling hunt, or break its hide' },
  { id: 'milktusk', base: 'Milk Tusk', src: 'Tuskling', sell: 20, how: 'Break the Tuskling\u2019s tusks (a maul)' },
  { id: 'moleclaw', base: 'Cinder Claw', src: 'Cinderpup', sell: 10, how: 'Every Cinderpup hunt' },
  { id: 'marmotfur', base: 'Shrike Down', src: 'Shrikelet', sell: 10, how: 'Every Shrikelet hunt' },
  { id: 'galegland', base: 'Gale Gland', src: 'Shrikelet', sell: 40, how: 'Rare: break the Shrikelet\u2019s beak (always, the first time you need one)' },
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
  { id: 'cragslate', tier: 1.5, base: 'Crag Slate', src: 'Cragwing', sell: 30, how: 'Every Cragwing hunt' },
  { id: 'cragpinion', tier: 1.5, base: 'Slate Pinion', src: 'Cragwing', sell: 90, how: 'Break the Cragwing’s wings (Pierce best)' },
  { id: 'craghorn', tier: 1.5, base: 'Digging Horn', src: 'Cragwing', sell: 90, how: 'Break the Cragwing’s digging horn (Blunt best)' },
  { id: 'cragslab', tier: 1.5, base: 'Back Slab', src: 'Cragwing', sell: 90, how: 'Break the Cragwing’s slate back (Cut best)' },
  { id: 'cragheart', tier: 1.5, base: 'Cragheart', src: 'Cragwing', rare: true, sell: 450, how: 'Rare from Cragwing horn breaks' }
);
mats.push(
  { id: 'fenhide', tier: 2.4, base: 'Fen Hide', src: 'Fenmother', sell: 35, how: 'Every Fenmother hunt' },
  { id: 'fensac', tier: 2.4, base: 'Fen Sac', src: 'Fenmother', sell: 110, how: 'Break the Fenmother’s throat sac (Cut best)' },
  { id: 'fengill', tier: 2.4, base: 'Fen Gill', src: 'Fenmother', sell: 110, how: 'Break the Fenmother’s gills (Pierce best)' },
  { id: 'fenskull', tier: 2.4, base: 'Fen Skull', src: 'Fenmother', sell: 110, how: 'Break the Fenmother’s head (Blunt best)' },
  { id: 'fenpearl', tier: 2.4, base: 'Fenpearl', src: 'Fenmother', rare: true, sell: 500, how: 'Rare from Fenmother head breaks' }
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
  { id: 'feverskin', tier: 3.2, base: 'Fever Skin', src: 'Feverjaw', sell: 45, how: 'Every Feverjaw hunt' },
  { id: 'fevermolar', tier: 3.2, base: 'Fever Molar', src: 'Feverjaw', sell: 130, how: 'Break the Feverjaw’s jaw (Blunt best)' },
  { id: 'feversac', tier: 3.2, base: 'Fever Sac', src: 'Feverjaw', sell: 130, how: 'Break the Feverjaw’s throat sac (Cut best)' },
  { id: 'feverwart', tier: 3.2, base: 'Fever Wart', src: 'Feverjaw', sell: 130, how: 'Break the Feverjaw’s warts (Pierce best)' },
  { id: 'feverstone', tier: 3.2, base: 'Feverstone', src: 'Feverjaw', rare: true, sell: 650, how: 'Rare from Feverjaw wart breaks' },
  { id: 'archplume', tier: 3.2, base: 'Arc Plume', src: 'Archeron', sell: 45, how: 'Every Archeron hunt' },
  { id: 'archbeak', tier: 3.2, base: 'Arc Beak', src: 'Archeron', sell: 130, how: 'Break the Archeron’s upper head (Blunt best)' },
  { id: 'archcrest', tier: 3.2, base: 'Arc Crest', src: 'Archeron', sell: 130, how: 'Break the Archeron’s lower head (Blunt best)' },
  { id: 'archpinion', tier: 3.2, base: 'Arc Pinion', src: 'Archeron', sell: 130, how: 'Break the Archeron’s wings (Pierce best)' },
  { id: 'stormquill', tier: 3.2, base: 'Storm Quill', src: 'Archeron', rare: true, sell: 650, how: 'Rare from Archeron wing breaks' },
  { id: 'bloodscale', tier: 3.2, base: 'Blood Scale', src: 'Bloodwhelk', sell: 45, how: 'Every Bloodwhelk hunt' },
  { id: 'bloodgill', tier: 3.2, base: 'Blood Gill', src: 'Bloodwhelk', sell: 130, how: 'Break the Bloodwhelk’s gills (Pierce best)' },
  { id: 'bloodshell', tier: 3.2, base: 'Blood Shell', src: 'Bloodwhelk', sell: 130, how: 'Break the Bloodwhelk’s shell (Blunt best)' },
  { id: 'bloodfoot', tier: 3.2, base: 'Blood Foot', src: 'Bloodwhelk', sell: 130, how: 'Break the Bloodwhelk’s foot (Cut best)' },
  { id: 'heartpearl', tier: 3.2, base: 'Heart Pearl', src: 'Bloodwhelk', rare: true, sell: 650, how: 'Rare from Bloodwhelk shell breaks' }
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
