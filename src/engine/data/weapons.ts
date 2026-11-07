import type { DamageType, Move, WeaponDef } from '../types';
import { MAX_TIER } from '../edition';

/** Daze points per Blunt move. Fixed, so upgrades raise damage but not how often you stun. */
export const DZ = { light: 10, medium: 20, strong: 50 };

const BLADE: Move[] = [
  // Flow sits on the middle move (Mekkman, Nov 2026): useful, but a choice, not a free extra on every cheap swing
  { name: 'Slash', need: 'C', dmg: 12 },
  // each weapon type has its own dice pattern (Nov 2026 playtest: "the combinations are too similar"):
  // blades want Fangs, bows want Claws, mauls want a mix. Carry two and an awkward roll often suits the other one.
  { name: 'Cleave', need: 'CC', dmg: 26, flow: true },
  { name: 'Rend', need: 'CCT', dmg: 56, part: 2 }
];
const GALE: Move[] = [
  // curved blades cost what blades cost (they used to mirror them with Claws, which looked like the bow)
  { name: 'Gust Cut', need: 'C', dmg: 12 },
  { name: 'Shear', need: 'CC', dmg: 26, flow: true },
  { name: 'Tempest', need: 'CCT', dmg: 56, part: 2 }
];
const MAUL: Move[] = [
  // only the strongest move dazes (Mekkman, Nov 2026): Daze was the strongest of the three signatures
  { name: 'Thump', need: 'C', dmg: 12 },
  { name: 'Smash', need: 'CT', dmg: 28, part: 1.5 },
  { name: 'Skullcrack', need: 'CTT', dmg: 56, part: 2, daze: DZ.strong }
];
const BOW: Move[] = [
  { name: 'Quick Shot', need: 'T', dmg: 12, expose: true },
  // only the cheap shot exposes (Mekkman, Nov 2026): a one-die setup that weaker players lean on
  { name: 'Volley', need: 'TT', dmg: 28 },
  { name: 'Pinning Shot', need: 'TTC', dmg: 54, part: 1.5, pin: true }
];

// The Oath line (Mekkman, Nov 2026): no element, the weapon type's signature on every move, unlocked by bounties and
// paid for in coin, no monster parts. A reliable choice that keeps up to the Stormspire, never the best one: the
// right element still wins (×1.5 on a weakness). Daze on the light moves is small; Flow gives one reroll a turn.
const OATH_BLADE: Move[] = BLADE.map(m => ({ ...m, flow: true }));
const OATH_MAUL: Move[] = [
  { ...MAUL[0], daze: DZ.light },
  { ...MAUL[1], daze: DZ.medium },
  { ...MAUL[2] }
];
const OATH_BOW: Move[] = BOW.map(m => ({ ...m, expose: true }));
export const OATH = { step: [1.3, 1.5, 1.7], coin: [500, 900, 1500], bounties: [4, 10, 20] };

const list: WeaponDef[] = [
  // the Foothills' first weapon (the tutorial island, Nov 2026): one move, no Flow. Never made at the Forge.
  // the Foothills' last weapon (tracked at step 10, made at step 12): the Hunter's Blade's moves, with Gale.
  // The Gorehorn (the island's exam) is weak to Gale.
  { id: 'whistle', tier: 0.5, foothills: true, name: 'Whistling Blade', type: 'Cut', elem: 'Gale', kind: 'Longsword', note: 'Hums when you swing it.', moves: BLADE, mult: 1, craft: { coin: 120, marmotfur: 2, galegland: 1 } },
  { id: 'training', name: 'Training Blade', type: 'Cut', elem: null, kind: 'Practice sword', note: 'Blunt-tipped, for learning on.', moves: [{ name: 'Slash', need: 'C', dmg: 12 }], mult: 1, starter: true },
  { id: 'blade', name: "Hunter's Blade", type: 'Cut', elem: null, kind: 'Longsword', note: 'Plain steel. Never wrong, never the best.', moves: BLADE, mult: 1, craft: { coin: 100, shell: 2 } },
  { id: 'saber', name: 'Bristle Saber', type: 'Cut', elem: null, kind: 'Longsword', note: 'Edged with Gorehorn bristles. Bites deeper.', moves: BLADE, mult: 1.2, from: 'blade', cost: { coin: 300, pelt: 2, hide: 3 } },
  { id: 'gale', name: 'Galecutter', type: 'Cut', elem: 'Gale', kind: 'Curved blade', note: 'Hooked with Galeshrike talons. Sings when swung.', moves: GALE, mult: 1.1, from: 'blade', cost: { coin: 300, talon: 2, plume: 3 } },
  { id: 'storm', name: 'Stormcleaver', type: 'Cut', elem: 'Gale', kind: 'Curved blade', note: 'A Tempest Eye spins in the guard.', moves: GALE, mult: 1.35, from: 'gale', cost: { coin: 500, tempesteye: 1, talon: 3 } },
  { id: 'ridgecleaver', name: 'Ridgecleaver', type: 'Cut', elem: 'Stone', kind: 'Longsword', note: 'Ground from a Gorehorn tusk. Heavy for a blade.', moves: BLADE, mult: 1.1, from: 'blade', cost: { coin: 300, tusk: 1, pelt: 1, hide: 3 } },
  { id: 'cinderedge', name: 'Cinderedge', type: 'Cut', elem: 'Ember', kind: 'Longsword', note: 'A Cinderback claw, honed. It stays warm in the cold.', moves: BLADE, mult: 1.1, from: 'blade', cost: { coin: 300, digclaw: 2, cinderscale: 3 } },
  { id: 'rimefang', name: 'Rimefang Blade', type: 'Cut', elem: 'Frost', kind: 'Longsword', note: 'Edged with barbs from a Rimetail’s tail.', moves: BLADE, mult: 1.1, from: 'blade', cost: { coin: 300, barbtail: 2, rimescale: 3 } },
  { id: 'maul', name: 'Ironhead Maul', type: 'Blunt', elem: null, kind: 'Maul', note: 'Slow, heavy, and made for breaking things.', moves: MAUL, mult: 1, craft: { coin: 150 } },
  { id: 'tusk', name: 'Tuskbreaker', type: 'Blunt', elem: null, kind: 'Maul', note: 'A maul head set with a Gorehorn tusk.', moves: MAUL, mult: 1.25, from: 'maul', cost: { coin: 300, tusk: 3, hide: 2 } },
  { id: 'crusher', name: 'Gorehorn Crusher', type: 'Blunt', elem: null, kind: 'Maul', note: 'A Heartstone hums in the haft.', moves: MAUL, mult: 1.5, from: 'tusk', cost: { coin: 600, heartstone: 1, tusk: 3 } },
  { id: 'ember', name: 'Emberhead Maul', type: 'Blunt', elem: 'Ember', kind: 'Maul', note: 'A slab of Cinderback plate, still warm, bolted to the head.', moves: MAUL, mult: 1.1, from: 'maul', cost: { coin: 300, slagplate: 2, cinderscale: 3 } },
  { id: 'boulder', name: 'Boulderhead Maul', type: 'Blunt', elem: 'Stone', kind: 'Maul', note: 'A river boulder bound to the haft with Gorehorn sinew.', moves: MAUL, mult: 1.1, from: 'maul', cost: { coin: 300, tusk: 2, sinew: 1, hide: 2 } },
  { id: 'rimehammer', name: 'Rimehammer', type: 'Blunt', elem: 'Frost', kind: 'Maul', note: 'A shard of Rimetail mantle that never thaws.', moves: MAUL, mult: 1.1, from: 'maul', cost: { coin: 300, mantleshard: 2, rimescale: 3 } },
  // step 2 of every elemental line (6 Nov 2026, Mekkman: four steps everywhere): ×1.35, the Ashfall monster's rare
  // plus 3 of the part that weapon type breaks best. Only the Stormcleaver and Kilnheart Hammer existed before.
  { id: 'ridgeheartblade', name: 'Ridgeheart Cleaver', type: 'Cut', elem: 'Stone', kind: 'Longsword', note: 'A Heartstone set in the guard. The edge hums against rock.', moves: BLADE, mult: 1.35, from: 'ridgecleaver', cost: { coin: 500, heartstone: 1, pelt: 3 } },
  { id: 'ridgeheartmaul', name: 'Ridgeheart Maul', type: 'Blunt', elem: 'Stone', kind: 'Maul', note: 'A Heartstone in a cage of tusk. It thuds like a second heartbeat.', moves: MAUL, mult: 1.35, from: 'boulder', cost: { coin: 500, heartstone: 1, tusk: 3 } },
  { id: 'ridgeheartbow', name: 'Ridgeheart Bow', type: 'Pierce', elem: 'Stone', kind: 'Bow', note: 'Heartstone chips for arrowheads, strung with Gorehorn sinew.', moves: BOW, mult: 1.35, from: 'ridgebow', cost: { coin: 500, heartstone: 1, sinew: 3 } },
  { id: 'tempestmaul', name: 'Tempest Maul', type: 'Blunt', elem: 'Gale', kind: 'Maul', note: 'A Tempest Eye spins in the head. The air goes still before it lands.', moves: MAUL, mult: 1.35, from: 'galemaul', cost: { coin: 500, tempesteye: 1, crest: 3 } },
  { id: 'tempestbow', name: 'Tempest Bow', type: 'Pierce', elem: 'Gale', kind: 'Bow', note: 'A Tempest Eye in the grip. Its arrows curve with the wind.', moves: BOW, mult: 1.35, from: 'windbow', cost: { coin: 500, tempesteye: 1, pinion: 3 } },
  { id: 'kilnedge', name: 'Kilnheart Edge', type: 'Cut', elem: 'Ember', kind: 'Longsword', note: 'A Kilnheart burns in the pommel. The blade is never cold.', moves: BLADE, mult: 1.35, from: 'cinderedge', cost: { coin: 500, kilnheart: 1, digclaw: 3 } },
  { id: 'kilnbow', name: 'Kilnheart Bow', type: 'Pierce', elem: 'Ember', kind: 'Bow', note: 'Arrows lit from a Kilnheart in the grip.', moves: BOW, mult: 1.35, from: 'ventfire', cost: { coin: 500, kilnheart: 1, ventgland: 3 } },
  { id: 'frostheartblade', name: 'Frostheart Blade', type: 'Cut', elem: 'Frost', kind: 'Longsword', note: 'A Frostheart frozen into the guard. Frost spreads along the edge.', moves: BLADE, mult: 1.35, from: 'rimefang', cost: { coin: 500, frostheart: 1, barbtail: 3 } },
  { id: 'frosthearthammer', name: 'Frostheart Hammer', type: 'Blunt', elem: 'Frost', kind: 'Maul', note: 'A Frostheart in a head of mantle ice. It never thaws.', moves: MAUL, mult: 1.35, from: 'rimehammer', cost: { coin: 500, frostheart: 1, mantleshard: 3 } },
  { id: 'frostheartbow', name: 'Frostheart Bow', type: 'Pierce', elem: 'Frost', kind: 'Bow', note: 'A Frostheart in the grip. The string frosts as you draw.', moves: BOW, mult: 1.35, from: 'rimeshot', cost: { coin: 500, frostheart: 1, frostfang: 3 } },
  // Gale maul line (6 Nov 2026, Mekkman: every element in every weapon type before the apex; it was the one gap)
  { id: 'galemaul', name: 'Galebreaker Maul', type: 'Blunt', elem: 'Gale', kind: 'Maul', note: 'A Galeshrike crest bound to the head. The wind follows the swing.', moves: MAUL, mult: 1.1, from: 'maul', cost: { coin: 300, crest: 2, plume: 2 } },
  { id: 'kiln', name: 'Kilnheart Hammer', type: 'Blunt', elem: 'Ember', kind: 'Maul', note: 'A Kilnheart burns behind a grate in the head.', moves: MAUL, mult: 1.35, from: 'ember', cost: { coin: 500, kilnheart: 1, slagplate: 3 } },
  { id: 'bow', name: 'Ashwood Bow', type: 'Pierce', elem: null, kind: 'Bow', note: 'Finds the gaps in any hide.', moves: BOW, mult: 1, craft: { coin: 200, hide: 2 } },
  { id: 'sinewbow', name: 'Sinewstring Bow', type: 'Pierce', elem: null, kind: 'Bow', note: 'Strung with Gorehorn sinew. Draws harder.', moves: BOW, mult: 1.2, from: 'bow', cost: { coin: 300, sinew: 2, pelt: 1 } },
  { id: 'windbow', name: 'Windpiercer Bow', type: 'Pierce', elem: 'Gale', kind: 'Bow', note: 'Fletched with storm pinions.', moves: BOW, mult: 1.1, from: 'bow', cost: { coin: 300, pinion: 2, plume: 2 } },
  { id: 'ventfire', name: 'Ventfire Bow', type: 'Pierce', elem: 'Ember', kind: 'Bow', note: 'Its arrows are tipped with Cinderback vent glands. They hiss in flight.', moves: BOW, mult: 1.1, from: 'bow', cost: { coin: 300, ventgland: 2, cinderscale: 2 } },
  { id: 'rimeshot', name: 'Rimeshot Bow', type: 'Pierce', elem: 'Frost', kind: 'Bow', note: 'Strung with frozen sinew. The arrowheads are Rimetail fangs.', moves: BOW, mult: 1.1, from: 'bow', cost: { coin: 300, frostfang: 2, rimescale: 2 } },
  { id: 'ridgebow', name: 'Ridgestone Bow', type: 'Pierce', elem: 'Stone', kind: 'Bow', note: 'Arrowheads knapped from Ashfall Ridge stone. Heavy, and they shatter on impact.', moves: BOW, mult: 1.1, from: 'bow', cost: { coin: 300, sinew: 1, pelt: 2, hide: 2 } }
];

// the Oath line: three steps per weapon type
for (const [type, base, kind, moves, nm, note] of [
  ['Cut', 'oathblade', 'Longsword', OATH_BLADE, 'Oathblade', 'Plain guild steel, blessed at the board. Every cut flows.'],
  ['Blunt', 'oathmaul', 'Maul', OATH_MAUL, 'Oathmaul', 'A guild maul, banded in iron. Every blow rings the skull.'],
  ['Pierce', 'oathbow', 'Bow', OATH_BOW, 'Oathbow', 'A guild bow of seasoned ash. Every arrow finds the gap.']
] as const) {
  const names = [nm, `Sworn ${nm}`, `Grand ${nm}`];
  names.forEach((name, i) => list.push({
    id: i ? `${base}${i + 1}` : base, tier: [2, 2, 3][i], name, type: type as DamageType, elem: null, kind, note, moves: moves as Move[],
    mult: OATH.step[i], bounties: OATH.bounties[i],
    ...(i ? { from: i === 1 ? base : `${base}2`, cost: { coin: OATH.coin[i] } } : { craft: { coin: OATH.coin[i] } })
  }));
}

// Tier 2 · Mirewood: step 3 of each line (×1.6), grown from the step-2 rare weapon.
list.push(
  { id: 'bogcleaver', tier: 2, name: 'Bogtooth Cleaver', type: 'Cut', elem: 'Stone', kind: 'Longsword', note: 'A Bogjaw molar set along the edge like a row of teeth.', moves: BLADE, mult: 1.6, from: 'ridgeheartblade', cost: { coin: 700, bogmolar: 2, throatsac: 1, bogskin: 3 } },
  { id: 'miremaul', tier: 2, name: 'Mirestone Maul', type: 'Blunt', elem: 'Stone', kind: 'Maul', note: 'A Mirestone still slick with bog water, bound to the head.', moves: MAUL, mult: 1.6, from: 'ridgeheartmaul', cost: { coin: 700, mirestone: 1, wartstone: 2, bogskin: 3 } },
  { id: 'duskblade', tier: 2, name: 'Duskstorm Blade', type: 'Cut', elem: 'Gale', kind: 'Curved blade', note: 'A Duskheron beak ground into a hooked edge.', moves: BLADE, mult: 1.6, from: 'storm', cost: { coin: 700, duskbeak: 2, duskpinion: 1, duskplume: 3 } },
  { id: 'twilightbow', tier: 2, name: 'Twilight Bow', type: 'Pierce', elem: 'Gale', kind: 'Bow', note: 'Fletched with a Twilight Quill. Its arrows fly in pairs.', moves: BOW, mult: 1.6, from: 'tempestbow', cost: { coin: 700, twilightquill: 1, duskpinion: 2, duskplume: 3 } },
  { id: 'wartbow', tier: 2, name: 'Wartstone Bow', type: 'Pierce', elem: 'Stone', kind: 'Bow', note: 'Arrowheads chipped from the Bogjaw’s stone warts.', moves: BOW, mult: 1.6, from: 'ridgeheartbow', cost: { coin: 700, wartstone: 2, throatsac: 1, bogskin: 3 } },
  { id: 'whelkedge', tier: 2, name: 'Whelkfire Edge', type: 'Cut', elem: 'Ember', kind: 'Longsword', note: 'A spiral of whelk shell, still glowing along the edge.', moves: BLADE, mult: 1.6, from: 'kilnedge', cost: { coin: 700, whelkfoot: 2, whelkgill: 1, whelkscale: 3 } },
  { id: 'pearlhammer', tier: 2, name: 'Pearlforge Hammer', type: 'Blunt', elem: 'Ember', kind: 'Maul', note: 'An Ember Pearl set in a whelk-shell head. It never cools.', moves: MAUL, mult: 1.6, from: 'kiln', cost: { coin: 700, emberpearl: 1, whelkshell: 2, whelkscale: 3 } },
  { id: 'mirrorblade', tier: 2, name: 'Mirrorglass Blade', type: 'Cut', elem: 'Frost', kind: 'Longsword', note: 'Tail shards fused into one cold edge. It shows you a second blade.', moves: BLADE, mult: 1.6, from: 'frostheartblade', cost: { coin: 700, glasstail: 2, glasseye: 1, glassdust: 3 } },
  { id: 'facethammer', tier: 2, name: 'Facet Hammer', type: 'Blunt', elem: 'Frost', kind: 'Maul', note: 'A block of clouded glass facets that rings like a bell.', moves: MAUL, mult: 1.6, from: 'frosthearthammer', cost: { coin: 700, glassfacet: 2, glasstail: 1, glassdust: 3 } },
  { id: 'mirrorbow', tier: 2, name: 'Mirror Heart Bow', type: 'Pierce', elem: 'Frost', kind: 'Bow', note: 'A Mirror Heart in the grip. You can see the arrow land before it flies.', moves: BOW, mult: 1.6, from: 'frostheartbow', cost: { coin: 700, mirrorheart: 1, glasseye: 2, glassdust: 3 } },
  // step 4 (Tier 3, Stormspire): ×1.9
  { id: 'monolithblade', tier: 3, name: 'Monolith Blade', type: 'Cut', elem: 'Stone', kind: 'Greatsword', note: 'A slab of Warden plate with one edge ground sharp.', moves: BLADE, mult: 1.9, from: 'bogcleaver', cost: { coin: 1100, wardenarm: 2, wardenplate: 1, wardenstone: 4 } },
  { id: 'monolithhammer', tier: 3, name: 'Monolith Hammer', type: 'Blunt', elem: 'Stone', kind: 'Maul', note: 'A Warden Core, still faintly lit, sealed inside a block of its own plate.', moves: MAUL, mult: 1.9, from: 'miremaul', cost: { coin: 1100, wardencore: 1, wardenplate: 2, wardenstone: 4 } },
  { id: 'monolithbow', tier: 3, name: 'Monolith Bow', type: 'Pierce', elem: 'Stone', kind: 'Bow', note: 'Core shards for arrowheads. They hum when drawn.', moves: BOW, mult: 1.9, from: 'wartbow', cost: { coin: 1100, coreshard: 2, wardenarm: 1, wardenstone: 4 } },
  { id: 'thunderblade', tier: 3, name: 'Thunderhead Blade', type: 'Cut', elem: 'Gale', kind: 'Curved blade', note: 'Roc talons bound in a hooked arc. Sparks run down the edge in the rain.', moves: BLADE, mult: 1.9, from: 'duskblade', cost: { coin: 1100, roctalon: 2, rocpinion: 1, rocplume: 4 } },
  { id: 'stormbow', tier: 3, name: 'Stormcrown Bow', type: 'Pierce', elem: 'Gale', kind: 'Bow', note: 'A Stormheart in the grip. The string hums before lightning.', moves: BOW, mult: 1.9, from: 'twilightbow', cost: { coin: 1100, stormheart: 1, stormcrown: 2, rocplume: 4 } },
  { id: 'slagedge', tier: 3, name: 'Slagglass Edge', type: 'Cut', elem: 'Ember', kind: 'Longsword', note: 'A Slagwyrm tail-plate drawn into a blade. It cools from the hilt and never at the tip.', moves: BLADE, mult: 1.9, from: 'whelkedge', cost: { coin: 1100, slagtail: 2, slagjaw: 1, slagscale: 4 } },
  { id: 'slaghammer', tier: 3, name: 'Slagheart Hammer', type: 'Blunt', elem: 'Ember', kind: 'Maul', note: 'A Slagheart caged in its own spine plate. It beats.', moves: MAUL, mult: 1.9, from: 'pearlhammer', cost: { coin: 1100, slagheart: 1, slagspine: 2, slagscale: 4 } },
  { id: 'slagbow', tier: 3, name: 'Magmaspit Bow', type: 'Pierce', elem: 'Ember', kind: 'Bow', note: 'The arrowheads are dipped in the Slagwyrm’s spit while it’s still soft.', moves: BOW, mult: 1.9, from: 'gillbow', cost: { coin: 1100, slagjaw: 2, slagspine: 1, slagscale: 4 } },
  { id: 'hydrablade', tier: 3, name: 'Hydrafang Blade', type: 'Cut', elem: 'Frost', kind: 'Longsword', note: 'Three Gorhydra fangs set in a row. The edge is always cold.', moves: BLADE, mult: 1.9, from: 'mirrorblade', cost: { coin: 1100, hydrafang: 2, hydrahorn: 1, hydrascale: 4 } },
  { id: 'hydrahammer', tier: 3, name: 'Hydraheart Hammer', type: 'Blunt', elem: 'Frost', kind: 'Maul', note: 'A Hydraheart frozen into the head. It frosts the air when swung.', moves: MAUL, mult: 1.9, from: 'facethammer', cost: { coin: 1100, hydraheart: 1, hydracrown: 2, hydrascale: 4 } },
  { id: 'hydrabow', tier: 3, name: 'Three-Neck Bow', type: 'Pierce', elem: 'Frost', kind: 'Bow', note: 'Strung with neck sinew. It draws heavier than it looks.', moves: BOW, mult: 1.9, from: 'mirrorbow', cost: { coin: 1100, hydrahorn: 2, hydracrown: 1, hydrascale: 4 } },
  { id: 'duskmaul', tier: 2, name: 'Duskcrest Maul', type: 'Blunt', elem: 'Gale', kind: 'Maul', note: 'Two Duskheron crests locked back to back. It whistles on the way down.', moves: MAUL, mult: 1.6, from: 'tempestmaul', cost: { coin: 700, duskcrest: 2, duskbeak: 1, duskplume: 3 } },
  { id: 'stormmaul', tier: 3, name: 'Stormcrown Maul', type: 'Blunt', elem: 'Gale', kind: 'Maul', note: 'A shard of the Roc’s storm crown in the head. It cracks like thunder when it lands.', moves: MAUL, mult: 1.9, from: 'duskmaul', cost: { coin: 1100, stormcrown: 2, roctalon: 1, rocplume: 4 } },
  { id: 'gillbow', tier: 2, name: 'Gillfire Bow', type: 'Pierce', elem: 'Ember', kind: 'Bow', note: 'Strung with dried whelk gill. Its arrows smoulder.', moves: BOW, mult: 1.6, from: 'kilnbow', cost: { coin: 700, whelkgill: 2, whelkshell: 1, whelkscale: 3 } }
);
// The apex weapons (Mekkman, 6 Nov 2026): blade, maul and bow in each of the four elements, ×2.1. Each is crafted
// from the Stormspire weapon of the same type and element, plus the material of the Sovereign part that matches the
// element (tusks Stone, wings Gale, vents Ember, tail Frost), so which stance you tear out decides what you farm.
{
  const PART: Record<string, string> = { Stone: 'sovtusk', Gale: 'sovwing', Ember: 'sovvent', Frost: 'sovtail' };
  const BASE: Record<string, Record<DamageType, string>> = {
    Stone: { Cut: 'monolithblade', Blunt: 'monolithhammer', Pierce: 'monolithbow' },
    Gale: { Cut: 'thunderblade', Blunt: 'stormmaul', Pierce: 'stormbow' },
    Ember: { Cut: 'slagedge', Blunt: 'slaghammer', Pierce: 'slagbow' },
    Frost: { Cut: 'hydrablade', Blunt: 'hydrahammer', Pierce: 'hydrabow' }
  };
  const ADJ: Record<string, string> = { Stone: 'Tusked', Gale: 'Winged', Ember: 'Molten', Frost: 'Rimed' };
  const NOTE: Record<string, string> = { Stone: 'Set with a tusk torn from the Sovereign. It hits like a charge.', Gale: 'Feathered with a swallowed wing. It never seems to weigh anything.', Ember: 'A swallowed vent glows in it, breathing.', Frost: 'Bound with the Sovereign’s frozen tail. Frost creeps up your arm.' };
  for (const el of ['Stone', 'Gale', 'Ember', 'Frost'] as const) for (const [type, kind, moves, nm] of [['Cut', el === 'Gale' ? 'Curved blade' : 'Greatsword', el === 'Gale' ? GALE : BLADE, 'Sovereign Blade'], ['Blunt', 'Maul', MAUL, 'Sovereign Maul'], ['Pierce', 'Bow', BOW, 'Sovereign Bow']] as const)
    list.push({ id: `sov${type.toLowerCase()}${el.toLowerCase()}`, tier: 4, name: `${ADJ[el]} ${nm}`, type, elem: el, kind, note: NOTE[el], moves: moves as Move[], mult: 2.1, from: BASE[el][type], cost: { coin: 1600, [PART[el]]: 3, sovgel: 4 } });
}
// Status weapons (Nov 2026, the Gloamhollow): no element; their hits fill a status meter instead. Two steps: the
// Gloamhollow monster crafts step 1 (×1.4); the changed Mirewood monster with the same status upgrades it (×1.7). Against an element weakness
// (×1.6/×1.9 ×1.5) they lose; against a monster you haven't learned, or the Sovereign's shifting stances, they don't care.
{
  type Line = { st: 'Infect' | 'Spark' | 'Drain'; pow: [number, number]; ids: Record<DamageType, [string, string]>; names: Record<DamageType, [string, string]>; notes: Record<DamageType, [string, string]>; mats: Record<DamageType, [string, string]>; common: [string, string]; side: Record<DamageType, [string, string]> };
  const LINES: Line[] = [
    { st: 'Infect', pow: [20, 28],
      ids: { Cut: ['rotblade', 'feverblade'], Blunt: ['rotmaul', 'fevermaul'], Pierce: ['rotbow', 'feverbow'] },
      names: { Cut: ['Rotroot Cleaver', 'Feverjaw Cleaver'], Blunt: ['Sporeburst Maul', 'Feverjaw Maul'], Pierce: ['Sporeshot Bow', 'Feverjaw Bow'] },
      notes: { Cut: ['Root legs twisted into a blade. The cut festers.', 'A fever sac stitched along the spine. Every cut runs hot.'], Blunt: ['A Rotcap jaw for a head. Each blow leaves a puff of spores.', 'A Feverjaw molar for a head, still steaming.'], Pierce: ['The arrowheads are packed with cap flesh.', 'The arrowheads are fever warts. They burst inside the hide.'] },
      mats: { Cut: ['rootleg', 'feversac'], Blunt: ['rotjaw', 'fevermolar'], Pierce: ['capflesh', 'feverwart'] }, side: { Cut: ['rotjaw', 'fevermolar'], Blunt: ['capflesh', 'feverwart'], Pierce: ['rootleg', 'feversac'] }, common: ['rotspore', 'feverskin'] },
    { st: 'Spark', pow: [70, 100],
      ids: { Cut: ['arcblade', 'heronblade'], Blunt: ['arcmaul', 'heronmaul'], Pierce: ['arcbow', 'heronbow'] },
      names: { Cut: ['Feeler Blade', 'Archeron Blade'], Blunt: ['Arcmoth Maul', 'Archeron Maul'], Pierce: ['Arcdust Bow', 'Archeron Bow'] },
      notes: { Cut: ['Two Arcmoth feelers wound round the edge. Your hair stands up when you draw it.', 'An Archeron beak ground to an edge. Frost and sparks run along it.'], Blunt: ['A thorax plate for a head. It snaps with static on every swing.', 'A frozen crest for a head. It cracks like a storm when it lands.'], Pierce: ['The fletching is Arcmoth wing. The arrows spark in flight.', 'Fletched with Archeron pinions. Each shot leaves a white streak.'] },
      mats: { Cut: ['arcfeeler', 'archbeak'], Blunt: ['arcthorax', 'archcrest'], Pierce: ['arcwing', 'archpinion'] }, side: { Cut: ['arcwing', 'archpinion'], Blunt: ['arcfeeler', 'archbeak'], Pierce: ['arcthorax', 'archcrest'] }, common: ['arcdust', 'archplume'] },
    { st: 'Drain', pow: [0.15, 0.15],
      ids: { Cut: ['fangblade', 'whelkletter'], Blunt: ['fangmaul', 'whelkmaul'], Pierce: ['fangbow', 'whelkbow'] },
      names: { Cut: ['Bloodletter', 'Bloodwhelk Letter'], Blunt: ['Palefang Maul', 'Bloodwhelk Maul'], Pierce: ['Palewing Bow', 'Bloodwhelk Bow'] },
      notes: { Cut: ['A blood sac stretched along the spine of the blade. It fills as you fight.', 'A Bloodwhelk foot cured into a red edge. It drinks what it cuts.'], Blunt: ['A ring of Hollowfang fangs round the head. They grip on impact.', 'A chunk of dark whelk shell. It comes back heavier than it went in.'], Pierce: ['Strung with wing membrane. The arrows are hollow.', 'Strung with dried gill. The arrows come back to the string dark.'] },
      mats: { Cut: ['bloodsac', 'bloodfoot'], Blunt: ['palefang', 'bloodshell'], Pierce: ['palewing', 'bloodgill'] }, side: { Cut: ['palefang', 'bloodshell'], Blunt: ['palewing', 'bloodgill'], Pierce: ['bloodsac', 'bloodfoot'] }, common: ['palehide', 'bloodscale'] }
  ];
  for (const L of LINES) for (const [type, kind, moves] of [['Cut', 'Longsword', BLADE], ['Blunt', 'Maul', MAUL], ['Pierce', 'Bow', BOW]] as const) {
    const [a, b] = L.ids[type];
    list.push({ id: a, tier: 2.2, name: L.names[type][0], type, elem: null, status: L.st, statusPow: L.pow[0], kind, note: L.notes[type][0], moves: moves as Move[], mult: 1.4, craft: { coin: 700, [L.mats[type][0]]: 2, [L.side[type][0]]: 1, [L.common[0]]: 3 } });
    list.push({ id: b, tier: 3.2, name: L.names[type][1], type, elem: null, status: L.st, statusPow: L.pow[1], kind, note: L.notes[type][1], moves: moves as Move[], mult: 1.7, from: a, cost: { coin: 1100, [L.mats[type][1]]: 2, [L.side[type][1]]: 1, [L.common[1]]: 4 } });
  }
}
export const WEAPONS: Record<string, WeaponDef> = Object.fromEntries(list.filter(w => (w.tier ?? 1) <= MAX_TIER).map(w => [w.id, w]));

/** Forge trees: [weapon id, depth] in display order. Built from each weapon's `from`, so every weapon in this
 *  edition shows up (a hand-kept list once left the Mirewood weapons out of the Forge). Children follow their
 *  parent, in the order they're listed above. */
export const TREES: { type: DamageType; nodes: [string, number][] }[] = (['Cut', 'Blunt', 'Pierce'] as DamageType[]).map(type => {
  const ws = Object.values(WEAPONS).filter(w => w.type === type && !w.starter && !w.foothills);
  const nodes: [string, number][] = [];
  const walk = (id: string, depth: number) => { nodes.push([id, depth]); for (const c of ws) if (c.from === id) walk(c.id, depth + 1); };
  for (const w of ws) if (!w.from || !WEAPONS[w.from]) walk(w.id, 0);
  return { type, nodes };
});

export const SIGNATURES: Record<DamageType, { tag: 'flow' | 'daze' | 'expose'; name: string; text: string }> = {
  Cut: { tag: 'flow', name: 'Flow', text: 'The middle move adds 1 to your rerolls left, once a turn. Its dice are still spent.' },
  Blunt: { tag: 'daze', name: 'Daze', text: 'The strongest move, on the head, fills a daze meter. Full meter: the monster loses its action, then recovers for a turn.' },
  Pierce: { tag: 'expose', name: 'Expose', text: 'The light shot exposes the part for 2 turns: every hit there, from either weapon, deals +20% and counts double toward breaking it.' }
};
