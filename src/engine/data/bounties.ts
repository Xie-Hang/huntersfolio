// The bounty board: hunts with a condition and a unique reward. A length lever that adds goals, not grind.
// Three per monster (two ordinary, one hard). Take one at the Hunt Board before you set out; it pays only if
// you WIN that hunt and meet every condition. Each pays coin and Hunter's Seals; a hard one also pays the
// monster's rare material, guaranteed (an answer to unlucky rare drops). Seals craft the bounty charms.
// Tuned by simulation (5 Nov 2026) with end-of-Ashfall gear at +2 in the monster's counter element: skilled bot
// hard bounties ~50–90%, casual bot ~15–75%. Bounties that ask for something done on purpose (get swallowed and
// cut free, reel both heads) score low in the sim because the bot doesn't try; a player who does, gets them.
// Note: breaking every part in one hunt is impossible by design (part HP adds up to more than the monster's).
import type { DamageType } from '../types';
import { MONSTERS } from './monsters';

export type Goal =
  | { k: 'break'; part: string }
  | { k: 'capture' }
  | { k: 'turns'; n: number }
  | { k: 'taken'; n: number }
  | { k: 'noItem' }
  | { k: 'without'; type: DamageType }
  | { k: 'feat'; f: string; text: string }
  | { k: 'never'; f: string; text: string }
  | { k: 'cracks'; part: string; n: number };

export interface BountyDef {
  id: string; mon: string; name: string; hard?: boolean;
  goals: Goal[];
  reward: { coin: number; seals: number; mat?: string };
}

const easy = { coin: 120, seals: 1 }, hard = (mat: string) => ({ coin: 250, seals: 2, mat });
// Stormspire pays more: its gear costs more
const easy3 = { coin: 180, seals: 1 }, hard3 = (mat: string) => ({ coin: 360, seals: 2, mat });

const ALL: BountyDef[] = [
  // Ashfall Ridge
  { id: 'gore1', mon: 'gorehorn', name: 'Tusk collector', goals: [{ k: 'break', part: 'tusks' }, { k: 'noItem' }], reward: easy },
  { id: 'gore2', mon: 'gorehorn', name: 'Quick work', goals: [{ k: 'turns', n: 8 }], reward: easy },
  { id: 'gore3', mon: 'gorehorn', name: 'No hammer needed', hard: true, goals: [{ k: 'without', type: 'Blunt' }, { k: 'break', part: 'tusks' }, { k: 'taken', n: 60 }], reward: hard('heartstone') },
  { id: 'gale1', mon: 'galeshrike', name: 'Out of the sky', goals: [{ k: 'feat', f: 'grounded', text: 'Shoot it out of the sky' }, { k: 'noItem' }], reward: easy },
  { id: 'gale2', mon: 'galeshrike', name: 'Featherweight', goals: [{ k: 'taken', n: 100 }], reward: easy },
  { id: 'gale3', mon: 'galeshrike', name: 'Storm chaser', hard: true, goals: [{ k: 'capture' }, { k: 'break', part: 'wings' }, { k: 'noItem' }], reward: hard('tempesteye') },
  { id: 'cind1', mon: 'cinderback', name: 'Unearthed', goals: [{ k: 'feat', f: 'unearthed', text: 'Drive it out of the ground with a hammer blow' }], reward: easy },
  { id: 'cind2', mon: 'cinderback', name: 'Cold hands', goals: [{ k: 'without', type: 'Pierce' }, { k: 'noItem' }], reward: easy },
  { id: 'cind3', mon: 'cinderback', name: 'Slag breaker', hard: true, goals: [{ k: 'break', part: 'plate' }, { k: 'turns', n: 7 }], reward: hard('kilnheart') },
  { id: 'rime1', mon: 'rimetail', name: 'Shatter', goals: [{ k: 'feat', f: 'shatter', text: 'Clear all its ice with one hit' }], reward: easy },
  { id: 'rime2', mon: 'rimetail', name: 'No blades', goals: [{ k: 'without', type: 'Cut' }], reward: easy },
  { id: 'rime3', mon: 'rimetail', name: 'Frostbite', hard: true, goals: [{ k: 'break', part: 'mantle' }, { k: 'taken', n: 70 }, { k: 'noItem' }], reward: hard('frostheart') },
  // Mirewood
  { id: 'bog1', mon: 'bogjaw', name: 'Not on the menu', goals: [{ k: 'never', f: 'swallowed', text: 'Never get swallowed' }], reward: easy },
  { id: 'bog2', mon: 'bogjaw', name: 'Gut check', goals: [{ k: 'feat', f: 'escape', text: 'Cut your way out of it' }, { k: 'noItem' }], reward: easy },
  { id: 'bog3', mon: 'bogjaw', name: 'Mire trophy', hard: true, goals: [{ k: 'capture' }, { k: 'break', part: 'warts' }, { k: 'taken', n: 100 }], reward: hard('mirestone') },
  { id: 'dusk1', mon: 'duskheron', name: 'Two heads down', goals: [{ k: 'feat', f: 'reelboth', text: 'Set both heads reeling' }], reward: easy },
  { id: 'dusk2', mon: 'duskheron', name: 'Light feet', goals: [{ k: 'taken', n: 110 }], reward: easy },
  { id: 'dusk3', mon: 'duskheron', name: 'Wingclipper', hard: true, goals: [{ k: 'break', part: 'wings' }, { k: 'turns', n: 7 }, { k: 'noItem' }], reward: hard('twilightquill') },
  { id: 'whelk1', mon: 'emberwhelk', name: 'Gill cutter', goals: [{ k: 'break', part: 'gills' }, { k: 'turns', n: 12 }], reward: easy },
  { id: 'whelk2', mon: 'emberwhelk', name: 'Shellshock', goals: [{ k: 'feat', f: 'daze', text: 'Daze it' }, { k: 'noItem' }], reward: easy },
  { id: 'whelk3', mon: 'emberwhelk', name: 'Pearl diver', hard: true, goals: [{ k: 'break', part: 'shell' }, { k: 'break', part: 'gills' }, { k: 'taken', n: 80 }], reward: hard('emberpearl') },
  { id: 'mist1', mon: 'mistglass', name: 'Clear sight', goals: [{ k: 'break', part: 'eyes' }, { k: 'noItem' }], reward: easy },
  { id: 'mist2', mon: 'mistglass', name: 'Through the mirror', goals: [{ k: 'without', type: 'Blunt' }], reward: easy },
  { id: 'mist3', mon: 'mistglass', name: 'Shatterpoint', hard: true, goals: [{ k: 'break', part: 'tail' }, { k: 'turns', n: 8 }], reward: hard('mirrorheart') },
  // Stormspire
  { id: 'mono1', mon: 'monolith', name: 'Crack it twice', goals: [{ k: 'cracks', part: 'plates', n: 2 }], reward: easy3 },
  { id: 'mono2', mon: 'monolith', name: 'Hold the mountain', goals: [{ k: 'feat', f: 'interrupt', text: 'Stop a Quake before it lands' }], reward: easy3 },
  { id: 'mono3', mon: 'monolith', name: 'Heart of the mountain', hard: true, goals: [{ k: 'break', part: 'core' }, { k: 'turns', n: 12 }], reward: hard3('wardencore') },
  { id: 'roc1', mon: 'stormroc', name: 'Lightning rod', goals: [{ k: 'feat', f: 'interrupt', text: 'Snuff out a Thunderhead' }], reward: easy3 },
  { id: 'roc2', mon: 'stormroc', name: 'No nets', goals: [{ k: 'noItem' }], reward: easy3 },
  { id: 'roc3', mon: 'stormroc', name: 'Stormbreaker', hard: true, goals: [{ k: 'break', part: 'crown' }, { k: 'break', part: 'wings' }, { k: 'taken', n: 80 }], reward: hard3('stormheart') },
  { id: 'slag1', mon: 'slagwyrm', name: 'Quench', goals: [{ k: 'feat', f: 'shatterslag', text: 'Shatter its armour while it stokes' }], reward: easy3 },
  { id: 'slag2', mon: 'slagwyrm', name: 'Toe to toe', goals: [{ k: 'without', type: 'Pierce' }], reward: easy3 },
  { id: 'slag3', mon: 'slagwyrm', name: 'Slagbreaker', hard: true, goals: [{ k: 'break', part: 'spine' }, { k: 'turns', n: 8 }], reward: hard3('slagheart') },
  { id: 'hyd1', mon: 'gorhydra', name: 'Seared shut', goals: [{ k: 'feat', f: 'seal2', text: 'Seal two stumps' }], reward: easy3 },
  { id: 'hyd2', mon: 'gorhydra', name: 'Bare hands', goals: [{ k: 'noItem' }], reward: easy3 },
  { id: 'hyd3', mon: 'gorhydra', name: 'Three crowns', hard: true, goals: [{ k: 'break', part: 'middle' }, { k: 'taken', n: 90 }], reward: hard3('hydraheart') }
];

/** the bounties of the monsters in this edition */
export const BOUNTIES: Record<string, BountyDef> = Object.fromEntries(ALL.filter(b => MONSTERS[b.mon]).map(b => [b.id, b]));
export const bountiesFor = (mon: string) => Object.values(BOUNTIES).filter(b => b.mon === mon);
