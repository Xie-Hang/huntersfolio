import type { DamageType, Move, WeaponDef } from '../types';
import { MAX_TIER } from '../edition';

/** Daze points per Blunt move. Fixed, so upgrades raise damage but not how often you stun. */
export const DZ = { light: 10, medium: 20, strong: 35 };

const BLADE: Move[] = [
  { name: 'Slash', need: 'C', dmg: 12, flow: true },
  { name: 'Cleave', need: 'CT', dmg: 26 },
  { name: 'Rend', need: 'CCT', dmg: 56, part: 2 }
];
const GALE: Move[] = [
  { name: 'Gust Cut', need: 'T', dmg: 12, flow: true },
  { name: 'Shear', need: 'TC', dmg: 26 },
  { name: 'Tempest', need: 'TTC', dmg: 56, part: 2 }
];
const MAUL: Move[] = [
  { name: 'Thump', need: 'C', dmg: 12, daze: DZ.light },
  { name: 'Smash', need: 'CT', dmg: 28, part: 1.5, daze: DZ.medium },
  { name: 'Skullcrack', need: 'CTT', dmg: 56, part: 2, daze: DZ.strong }
];
const BOW: Move[] = [
  { name: 'Quick Shot', need: 'C', dmg: 12, expose: true },
  { name: 'Volley', need: 'CC', dmg: 28, expose: true },
  { name: 'Pinning Shot', need: 'CTT', dmg: 54, part: 1.5, pin: true, expose: true }
];

const list: WeaponDef[] = [
  { id: 'blade', name: "Hunter's Blade", type: 'Cut', elem: null, kind: 'Longsword', note: 'Plain steel. Never wrong, never the best.', moves: BLADE, mult: 1, craft: { coin: 100 } },
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
  { id: 'kiln', name: 'Kilnheart Hammer', type: 'Blunt', elem: 'Ember', kind: 'Maul', note: 'A Kilnheart burns behind a grate in the head.', moves: MAUL, mult: 1.35, from: 'ember', cost: { coin: 500, kilnheart: 1, slagplate: 3 } },
  { id: 'bow', name: 'Ashwood Bow', type: 'Pierce', elem: null, kind: 'Bow', note: 'Finds the gaps in any hide.', moves: BOW, mult: 1, craft: { coin: 200, hide: 2 } },
  { id: 'sinewbow', name: 'Sinewstring Bow', type: 'Pierce', elem: null, kind: 'Bow', note: 'Strung with Gorehorn sinew. Draws harder.', moves: BOW, mult: 1.2, from: 'bow', cost: { coin: 300, sinew: 2, pelt: 1 } },
  { id: 'windbow', name: 'Windpiercer Bow', type: 'Pierce', elem: 'Gale', kind: 'Bow', note: 'Fletched with storm pinions.', moves: BOW, mult: 1.1, from: 'bow', cost: { coin: 300, pinion: 2, plume: 2 } },
  { id: 'ventfire', name: 'Ventfire Bow', type: 'Pierce', elem: 'Ember', kind: 'Bow', note: 'Its arrows are tipped with Cinderback vent glands. They hiss in flight.', moves: BOW, mult: 1.1, from: 'bow', cost: { coin: 300, ventgland: 2, cinderscale: 2 } },
  { id: 'rimeshot', name: 'Rimeshot Bow', type: 'Pierce', elem: 'Frost', kind: 'Bow', note: 'Strung with frozen sinew. The arrowheads are Rimetail fangs.', moves: BOW, mult: 1.1, from: 'bow', cost: { coin: 300, frostfang: 2, rimescale: 2 } },
  { id: 'ridgebow', name: 'Ridgestone Bow', type: 'Pierce', elem: 'Stone', kind: 'Bow', note: 'Arrowheads knapped from Ashfall Ridge stone. Heavy, and they shatter on impact.', moves: BOW, mult: 1.1, from: 'bow', cost: { coin: 300, sinew: 1, pelt: 2, hide: 2 } }
];

// Tier 2 · Mirewood: the Bogjaw's Stone weapons (step 3 of the Stone lines, ×1.6). For now they grow straight from
// step 1; the step-2 rare weapons can slot in between later.
list.push(
  { id: 'bogcleaver', tier: 2, name: 'Bogtooth Cleaver', type: 'Cut', elem: 'Stone', kind: 'Longsword', note: 'A Bogjaw molar set along the edge like a row of teeth.', moves: BLADE, mult: 1.6, from: 'ridgecleaver', cost: { coin: 700, bogmolar: 2, throatsac: 1, bogskin: 3 } },
  { id: 'miremaul', tier: 2, name: 'Mirestone Maul', type: 'Blunt', elem: 'Stone', kind: 'Maul', note: 'A Mirestone still slick with bog water, bound to the head.', moves: MAUL, mult: 1.6, from: 'boulder', cost: { coin: 700, mirestone: 1, wartstone: 2, bogskin: 3 } },
  { id: 'duskblade', tier: 2, name: 'Duskstorm Blade', type: 'Cut', elem: 'Gale', kind: 'Curved blade', note: 'A Duskheron beak ground into a hooked edge.', moves: BLADE, mult: 1.6, from: 'storm', cost: { coin: 700, duskbeak: 2, duskpinion: 1, duskplume: 3 } },
  { id: 'twilightbow', tier: 2, name: 'Twilight Bow', type: 'Pierce', elem: 'Gale', kind: 'Bow', note: 'Fletched with a Twilight Quill. Its arrows fly in pairs.', moves: BOW, mult: 1.6, from: 'windbow', cost: { coin: 700, twilightquill: 1, duskpinion: 2, duskplume: 3 } },
  { id: 'wartbow', tier: 2, name: 'Wartstone Bow', type: 'Pierce', elem: 'Stone', kind: 'Bow', note: 'Arrowheads chipped from the Bogjaw’s stone warts.', moves: BOW, mult: 1.6, from: 'ridgebow', cost: { coin: 700, wartstone: 2, throatsac: 1, bogskin: 3 } },
  { id: 'whelkedge', tier: 2, name: 'Whelkfire Edge', type: 'Cut', elem: 'Ember', kind: 'Longsword', note: 'A spiral of whelk shell, still glowing along the edge.', moves: BLADE, mult: 1.6, from: 'cinderedge', cost: { coin: 700, whelkfoot: 2, whelkgill: 1, whelkscale: 3 } },
  { id: 'pearlhammer', tier: 2, name: 'Pearlforge Hammer', type: 'Blunt', elem: 'Ember', kind: 'Maul', note: 'An Ember Pearl set in a whelk-shell head. It never cools.', moves: MAUL, mult: 1.6, from: 'kiln', cost: { coin: 700, emberpearl: 1, whelkshell: 2, whelkscale: 3 } },
  { id: 'mirrorblade', tier: 2, name: 'Mirrorglass Blade', type: 'Cut', elem: 'Frost', kind: 'Longsword', note: 'Tail shards fused into one cold edge. It shows you a second blade.', moves: BLADE, mult: 1.6, from: 'rimefang', cost: { coin: 700, glasstail: 2, glasseye: 1, glassdust: 3 } },
  { id: 'facethammer', tier: 2, name: 'Facet Hammer', type: 'Blunt', elem: 'Frost', kind: 'Maul', note: 'A block of clouded glass facets that rings like a bell.', moves: MAUL, mult: 1.6, from: 'rimehammer', cost: { coin: 700, glassfacet: 2, glasstail: 1, glassdust: 3 } },
  { id: 'mirrorbow', tier: 2, name: 'Mirror Heart Bow', type: 'Pierce', elem: 'Frost', kind: 'Bow', note: 'A Mirror Heart in the grip. You can see the arrow land before it flies.', moves: BOW, mult: 1.6, from: 'rimeshot', cost: { coin: 700, mirrorheart: 1, glasseye: 2, glassdust: 3 } },
  // step 4 (Tier 3, Stormspire): ×1.9
  { id: 'monolithblade', tier: 3, name: 'Monolith Blade', type: 'Cut', elem: 'Stone', kind: 'Greatsword', note: 'A slab of Warden plate with one edge ground sharp.', moves: BLADE, mult: 1.9, from: 'bogcleaver', cost: { coin: 1100, wardenarm: 2, wardenplate: 1, wardenstone: 4 } },
  { id: 'monolithhammer', tier: 3, name: 'Monolith Hammer', type: 'Blunt', elem: 'Stone', kind: 'Maul', note: 'A Warden Core, still faintly lit, sealed inside a block of its own plate.', moves: MAUL, mult: 1.9, from: 'miremaul', cost: { coin: 1100, wardencore: 1, wardenplate: 2, wardenstone: 4 } },
  { id: 'monolithbow', tier: 3, name: 'Monolith Bow', type: 'Pierce', elem: 'Stone', kind: 'Bow', note: 'Core shards for arrowheads. They hum when drawn.', moves: BOW, mult: 1.9, from: 'wartbow', cost: { coin: 1100, coreshard: 2, wardenarm: 1, wardenstone: 4 } },
  { id: 'gillbow', tier: 2, name: 'Gillfire Bow', type: 'Pierce', elem: 'Ember', kind: 'Bow', note: 'Strung with dried whelk gill. Its arrows smoulder.', moves: BOW, mult: 1.6, from: 'ventfire', cost: { coin: 700, whelkgill: 2, whelkshell: 1, whelkscale: 3 } }
);
export const WEAPONS: Record<string, WeaponDef> = Object.fromEntries(list.filter(w => (w.tier ?? 1) <= MAX_TIER).map(w => [w.id, w]));

/** Forge trees: [weapon id, depth] in display order. Built from each weapon's `from`, so every weapon in this
 *  edition shows up (a hand-kept list once left the Mirewood weapons out of the Forge). Children follow their
 *  parent, in the order they're listed above. */
export const TREES: { type: DamageType; nodes: [string, number][] }[] = (['Cut', 'Blunt', 'Pierce'] as DamageType[]).map(type => {
  const ws = Object.values(WEAPONS).filter(w => w.type === type);
  const nodes: [string, number][] = [];
  const walk = (id: string, depth: number) => { nodes.push([id, depth]); for (const c of ws) if (c.from === id) walk(c.id, depth + 1); };
  for (const w of ws) if (!w.from || !WEAPONS[w.from]) walk(w.id, 0);
  return { type, nodes };
});

export const SIGNATURES: Record<DamageType, { tag: 'flow' | 'daze' | 'expose'; name: string; text: string }> = {
  Cut: { tag: 'flow', name: 'Flow', text: 'Light moves give you a reroll.' },
  Blunt: { tag: 'daze', name: 'Daze', text: 'Hits to the head part fill a daze meter. Full meter: the monster loses its action, then recovers for a turn.' },
  Pierce: { tag: 'expose', name: 'Expose', text: 'Hits expose the part for 2 turns: every hit there, from either weapon, deals +15% and counts double toward breaking it.' }
};
