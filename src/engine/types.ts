// Shared types for the rules engine. The engine never touches the DOM.

export type Face = 'C' | 'T' | 'B'; // circle, triangle, blank
export type DamageType = 'Cut' | 'Blunt' | 'Pierce';
export type Element = 'Ember' | 'Frost' | 'Gale' | 'Stone';
/** 'coin' or a material id → amount */
export type Cost = Record<string, number>;

export interface Move {
  name: string;
  /** dice recipe, e.g. 'CCT' = two circles and a triangle */
  need: string;
  dmg: number;
  /** multiplier toward part breaks */
  part?: number;
  flow?: boolean;
  /** daze points added when this hits the head part (Blunt) */
  daze?: number;
  /** Pinning Shot: interrupts wind-ups, grounds fliers (monster hooks) */
  pin?: boolean;
  /** Pierce signature: the hit leaves the part exposed */
  expose?: boolean;
}

export interface WeaponDef {
  /** monster tier it comes from (default 1); gear above the edition's top tier isn't in that build */
  tier?: number;
  id: string;
  name: string;
  type: DamageType;
  elem: Element | null;
  kind: string;
  note: string;
  moves: Move[];
  mult: number;
  /** base weapons: crafted from scratch */
  craft?: Cost;
  /** upgrades: grow from this weapon id */
  from?: string;
  cost?: Cost;
  /** recipe uses stand-in materials until a monster of this element exists */
  placeholder?: Element;
}

export interface ArmorDef {
  /** monster tier it comes from (default 1); gear above the edition's top tier isn't in that build */
  tier?: number;
  id: string;
  name: string;
  hp: number;
  guard: number;
  rerolls: number;
  resist: Element | null;
  perk: string;
  blankx2?: boolean;
  breakHeal?: boolean;
  /** immune to burns from hitting a molten monster */
  burnproof?: boolean;
  /** swallowed: you cut free in half the damage */
  slick?: boolean;
  /** your guard is never halved (gusts, screeches) */
  steady?: boolean;
  /** you heal a little at the end of every monster turn */
  mend?: boolean;
  /** charging also guards */
  braced?: boolean;
  /** your first swap each turn costs no die */
  quickswap?: boolean;
  /** lightning (Thunderhead) deals half */
  rod?: boolean;
  /** every monster hit on you is reduced by this much */
  ward?: number;
  /** your dice can't be frozen */
  thaw?: boolean;
  craft: Cost;
}

export type ItemEffect = 'heal30' | 'smoke' | 'whet50' | 'whet100' | 'net' | 'blast' | 'thaw';
export interface ItemDef {
  id: string;
  name: string;
  max: number;
  price?: number;
  craft?: Cost;
  yields?: number;
  desc: string;
  effect: ItemEffect;
}

export type CharmEffect = 'dazeHeal' | 'exposeSelf' | 'charge1' | 'lightCut' | 'escapeHeal' | 'dazeWhet' | 'longExpose' | 'chargeBreak' | 'scout' | 'finisher' | 'salvage' | 'swapWhet' | 'airPierce' | 'bigHeal' | 'sealHeal';
export interface CharmDef {
  /** monster tier it comes from (default 1); gear above the edition's top tier isn't in that build */
  tier?: number;
  id: string;
  name: string;
  /** monster whose materials make it */
  src: string;
  perk: string;
  effect: CharmEffect;
  craft: Cost;
}

export interface MaterialDef {
  /** monster tier it comes from (default 1); gear above the edition's top tier isn't in that build */
  tier?: number;
  id: string;
  /** base name, e.g. 'Tusk' */
  base: string;
  /** source monster, e.g. 'Gorehorn' */
  src: string;
  rare?: boolean;
  sell: number;
  how: string;
}

export interface PartDef {
  id: string;
  name: string;
  eff: Record<DamageType, number>;
  hint: string;
  mat: string;
  hp: number;
  /** log line when it breaks */
  brk: string;
}

export interface Intent {
  name: string;
  text: string;
  dmg: number;
  /** 0–4 */
  threat: number;
  note?: string;
  /** attack ignores half the player's guard */
  halfGuard?: boolean;
}

export type Tone = '' | 'gold' | 'ember' | 'daze';
export interface LogEntry { t: string; tone: Tone }

export interface Die { face: Face; used: string | null }

/** exposed: turns left on a Pierce exposure (+15% damage, ×2 toward the break, from any weapon) */
export interface PartState { hp: number; max: number; broken: boolean; exposed: number; /** times broken this hunt, for parts that reform (the Warden's plates); rewards count it */ cracks?: number }

export interface MonsterState {
  hp: number;
  max: number;
  parts: Record<string, PartState>;
  enraged: boolean;
  daze: number;
  dazeMax: number;
  /** monster actions left before the daze meter can fill again */
  dazeLock: number;
  /** behaviour bookkeeping shared by the T1 cycles */
  seq: number;
  charges: number;
  usedWallow: boolean;
  usedRoot: boolean;
  exhausted: boolean;
  wallow: number;
  air: boolean;
  airLeft: number;
  /** underground (burrowers): only some weapons can hit */
  under: boolean;
  /** turns left on a molten shell that burns melee attackers */
  molten: number;
  /** layers of ice plating: each hit breaks layers instead of dealing damage (Cut breaks 2) */
  plating: number;
  /** T2 weighted behaviour: the last few actions (for the fairness rules) and the turn of its last big chain */
  recent?: string[];
  lastChain?: number;
  /** swallowed (grapplers): how many of your dice are stuck inside, and the damage left to cut free */
  gut?: number;
  gutHp?: number;
  /** several heads: each head's daze meter, and how many actions it still reels for */
  headDaze?: Record<string, number>;
  reel?: Record<string, number>;
  /** a one-turn debuff on you is coming (e.g. a screech halves your guard next turn) */
  screech?: number;
  /** regenerators: in its shell (your hits deal half), and turns left on the burning slime on you */
  shell?: number;
  slime?: number;
  /** mirage: turns left on its images (only the first hit each turn lands), and your hits so far this turn */
  mirage?: number;
  hits?: number;
  /** dice frozen solid on your next roll */
  frost?: number;
  /** T3 Monolith Warden: monster actions left with the core exposed; phase 2 (Crumbling) */
  core?: number;
  crumble?: boolean;
  /** T3 Stormcrown Roc: pips of storm in its crown, a counter for slower build, and phase 2 (never lands) */
  storm?: number;
  stormTick?: number;
  skyLock?: boolean;
  stormFull?: boolean;
  /** T3 Slagwyrm: molten armour left this turn, turns it stays shattered, stoked (double), phase 2 (meltdown) */
  armour?: number;
  shatter?: number;
  stoked?: boolean;
  melt?: boolean;
  burnedTurn?: number;
  /** T3 Gorhydra: monster actions until each broken head's stump regrows; heads sealed for good */
  stump?: Record<string, number>;
  sealed?: Record<string, boolean>;
  justCut?: string;
}

export interface WeaponInst extends WeaponDef { lv: number }
export interface ArmorInst extends ArmorDef { lv: number }

export interface HuntStats { dealt: number; taken: number; guarded: number; broken: number; rerollsUsed: number }

export interface Reward {
  coin: number;
  mats: Record<string, number>;
  rare: boolean;
  /** item charges returned to the stash (win) */
  returned: number;
  /** item charges lost (fail) */
  lost: number;
  /** monsters this hunt unlocked */
  unlocked?: string[];
  /** the bounty outcome (win or lose) */
  bounty?: { id: string; met: boolean; missed?: string; coin: number; seals: number; mat?: string };
}

export interface Hunt {
  /** hunt format; a saved hunt from another format is refunded and dropped */
  version: number;
  mid: string;
  turn: number;
  php: number;
  pmax: number;
  rerolls: number;
  weps: WeaponInst[];
  weapon: number;
  arm: ArmorInst;
  item: string | null;
  charm: string | null;
  itemCharges: number;
  carried: number;
  itemUsed: boolean;
  dice: Die[];
  guard: number;
  chargePending: boolean;
  chargeReady: boolean;
  evade: boolean;
  whet: number;
  target: string;
  mon: MonsterState;
  intent: string;
  log: LogEntry[];
  over: null | 'win' | 'lose';
  captured: boolean;
  stats: HuntStats;
  /** set once settleHunt has applied rewards to the save */
  reward: Reward | null;
  /** seeded RNG state; hunts are deterministic given a seed */
  rng: number;
  /** tutorial: fixed faces for the opening turns (index 0 = turn 1); later turns roll normally */
  script?: Face[][];
  /** notable moments this hunt, for achievements: 'daze' | 'interrupt' | 'grounded' | 'unearthed' | 'shatter' */
  feats?: string[];
  /** the bounty taken for this hunt */
  bounty?: string;
  /** a quickswap armor's free swap was used this turn */
  freeSwapUsed?: boolean;
}

export interface MonsterDef {
  id: string;
  name: string;
  short: string;
  kind: string;
  elem: Element;
  weak: Element;
  resist: Element;
  hp: number;
  tier: number;
  /** part that Blunt hits build daze on */
  head: string;
  /** several heads (Duskheron, Gorhydra): each has its own daze meter, handled by dazeHead instead of the shared one */
  heads?: string[];
  /** Blunt daze landed on one of `heads`: fill that head's meter; `dazed` when it reels */
  dazeHead?(h: Hunt, partId: string, amount: number): { line: string | null; dazed: boolean };
  common: string;
  rarePart: string;
  rare: string;
  habits: string;
  intro: string;
  enrageText: string;
  parts: PartDef[];
  /** describe a telegraphed action */
  intent(h: Hunt, type: string): Intent;
  /** choose the next action, given the one that just resolved */
  next(h: Hunt, prev: string | null): string;
  /** resolve a non-damage action (or side effects of a damaging one); `landed` = its damage reached you (not dodged). Returns a log line or null */
  resolve(h: Hunt, type: string, landed?: boolean): string | null;
  /** Tier 3: the fight changes at half HP (called once, right after the enrage line). Returns a log line */
  onPhase?(h: Hunt): string | null;
  /** a part just broke (after the break line). Returns a log line */
  onBreak?(h: Hunt, partId: string, w: WeaponInst): string | null;
  /** a bar on the monster panel (storm pips, molten armour, plates) */
  meter?(h: Hunt): { label: string; value: number; max: number; tone?: 'gold' | 'ember' | 'ice' | 'gale' | 'stone'; note?: string; pips?: boolean } | null;
  /** damage soaked before it reaches HP (after every multiplier). Returns what's left and a note */
  absorb?(h: Hunt, dmg: number, w: WeaponInst): { dmg: number; note: string } | null;
  /** a part that needs hitting right now with this weapon (a regrowing stump): the sim aims there, the UI flags it */
  priority?(h: Hunt, w: WeaponInst): string | null;
  /** a part's state in words for the monster panel (a stump, an exposed core) instead of Broken */
  partNote?(h: Hunt, partId: string): { chip: string; hint: string } | null;
  /** extra modifiers for a hit on a part */
  hitMod?(h: Hunt, partId: string, w: WeaponInst): { mult: number; note: string } | null;
  /** the hit strikes an image instead (dice spent, no damage, no daze); return the log line, or null if it lands */
  dodge?(h: Hunt, w: WeaponInst): string | null;
  /** can this weapon reach this part right now? */
  reachable?(h: Hunt, partId: string, w: WeaponInst): boolean;
  /** pin interaction; returns a log line when it lands */
  onPin?(h: Hunt): string | null;
  /** context tip on the telegraph */
  tip?(h: Hunt, type: string): string | null;
  canCapture?(h: Hunt): boolean;
  /** can this weapon hit at all right now? (false: its moves are unusable) */
  canHit?(h: Hunt, w: WeaponInst): boolean;
  /** why canHit is false, for the UI */
  cantHitReason?(h: Hunt, w: WeaponInst): string;
  /** reacts after a hit lands (e.g. Blunt drives a burrower up). Returns a log line. */
  onHit?(h: Hunt, mv: Move, w: WeaponInst): string | null;
  /** burn dealt to the player for this hit (molten shells); 0 for none */
  burn?(h: Hunt, w: WeaponInst): number;
  /** takes to the air: the UI shows air notes (Pierce full damage, nets work) */
  flier?: boolean;
  /** burrows: the UI shows underground notes (only Blunt reaches it, Blast Powder works) */
  burrower?: boolean;
  /** grows ice plating: layers it starts with (and the UI shows ice notes) */
  plated?: number;
  /** must have beaten this monster before it can be hunted (Tier 1: the Gorehorn) */
  /** must be beaten first (one id, or every id in the list: a region unlock) */
  requires?: string | string[];
}

export interface Loadout { weapons: string[]; armor: string; charm: string | null; item: string | null; target: string; /** a bounty taken for this monster */ bounty?: string | null }
export interface MonsterRecord { hunts: number; wins: number; captures: number; breaks: Record<string, number> }

export interface Save {
  /** which edition last wrote it; the demo never overwrites a save the full game wrote */
  edition?: 'demo' | 'full';
  version: number;
  coin: number;
  mats: Record<string, number>;
  weapons: Record<string, { lv: number }>;
  armors: Record<string, { lv: number }>;
  items: Record<string, number>;
  loadout: Loadout;
  pity: Record<string, number>;
  hunts: number;
  record: Record<string, MonsterRecord>;
  /** 'w:tusk' or 'a:vest' */
  tracked: string | null;
  /** crafted charms (no levels) */
  charms: Record<string, true>;
  /** tutorial tips this save has already shown */
  tips: string[];
  /** the end-of-content card ("That's the demo") has been shown */
  endSeen: boolean;
  /** achievement ids earned (kept locally so they reach Steam whenever it's available) */
  achievements: string[];
  /** bounties completed */
  bounties: Record<string, true>;
}
