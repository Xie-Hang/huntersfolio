import type { DamageType, Move, WeaponDef } from '../types';

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
  { id: 'maul', name: 'Ironhead Maul', type: 'Blunt', elem: null, kind: 'Maul', note: 'Slow, heavy, and made for breaking things.', moves: MAUL, mult: 1, craft: { coin: 150 } },
  { id: 'tusk', name: 'Tuskbreaker', type: 'Blunt', elem: null, kind: 'Maul', note: 'A maul head set with a Gorehorn tusk.', moves: MAUL, mult: 1.25, from: 'maul', cost: { coin: 300, tusk: 3, hide: 2 } },
  { id: 'crusher', name: 'Gorehorn Crusher', type: 'Blunt', elem: null, kind: 'Maul', note: 'A Heartstone hums in the haft.', moves: MAUL, mult: 1.5, from: 'tusk', cost: { coin: 600, heartstone: 1, tusk: 3 } },
  { id: 'ember', name: 'Emberhead Maul', type: 'Blunt', elem: 'Ember', kind: 'Maul', note: 'A slab of Cinderback plate, still warm, bolted to the head.', moves: MAUL, mult: 1.1, from: 'maul', cost: { coin: 300, slagplate: 2, cinderscale: 3 } },
  { id: 'kiln', name: 'Kilnheart Hammer', type: 'Blunt', elem: 'Ember', kind: 'Maul', note: 'A Kilnheart burns behind a grate in the head.', moves: MAUL, mult: 1.35, from: 'ember', cost: { coin: 500, kilnheart: 1, slagplate: 3 } },
  { id: 'bow', name: 'Ashwood Bow', type: 'Pierce', elem: null, kind: 'Bow', note: 'Finds the gaps in any hide.', moves: BOW, mult: 1, craft: { coin: 200, hide: 2 } },
  { id: 'sinewbow', name: 'Sinewstring Bow', type: 'Pierce', elem: null, kind: 'Bow', note: 'Strung with Gorehorn sinew. Draws harder.', moves: BOW, mult: 1.2, from: 'bow', cost: { coin: 300, sinew: 2, pelt: 1 } },
  { id: 'windbow', name: 'Windpiercer Bow', type: 'Pierce', elem: 'Gale', kind: 'Bow', note: 'Fletched with storm pinions.', moves: BOW, mult: 1.1, from: 'bow', cost: { coin: 300, pinion: 2, plume: 2 } },
  { id: 'ridgebow', name: 'Ridgestone Bow', type: 'Pierce', elem: 'Stone', kind: 'Bow', note: 'Arrowheads knapped from Ashfall Ridge stone. Heavy, and they shatter on impact.', moves: BOW, mult: 1.1, from: 'bow', cost: { coin: 300, sinew: 1, pelt: 2, hide: 2 } }
];

export const WEAPONS: Record<string, WeaponDef> = Object.fromEntries(list.map(w => [w.id, w]));

/** Forge trees: [weapon id, depth] in display order */
export const TREES: { type: DamageType; nodes: [string, number][] }[] = [
  { type: 'Cut', nodes: [['blade', 0], ['saber', 1], ['gale', 1], ['storm', 2]] },
  { type: 'Blunt', nodes: [['maul', 0], ['tusk', 1], ['crusher', 2], ['ember', 1], ['kiln', 2]] },
  { type: 'Pierce', nodes: [['bow', 0], ['sinewbow', 1], ['windbow', 1], ['ridgebow', 1]] }
];

export const SIGNATURES: Record<DamageType, { tag: 'flow' | 'daze' | 'expose'; name: string; text: string }> = {
  Cut: { tag: 'flow', name: 'Flow', text: 'Light moves give you a reroll.' },
  Blunt: { tag: 'daze', name: 'Daze', text: 'Hits to the head part fill a daze meter. Full meter: the monster loses its action, then recovers for a turn.' },
  Pierce: { tag: 'expose', name: 'Expose', text: 'Hits expose the part for 2 turns: every hit there, from either weapon, deals +15% and counts double toward breaking it.' }
};
