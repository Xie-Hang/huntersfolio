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
  pin?: boolean;
}

export interface WeaponDef {
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
  id: string;
  name: string;
  hp: number;
  guard: number;
  rerolls: number;
  resist: Element | null;
  perk: string;
  blankx2?: boolean;
  breakHeal?: boolean;
  craft: Cost;
}

export type ItemEffect = 'heal30' | 'smoke' | 'whet50' | 'whet100' | 'net';
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

export interface MaterialDef {
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

export interface PartState { hp: number; max: number; broken: boolean }

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
  /** resolve a non-damage action (or side effects of a damaging one); returns a log line or null */
  resolve(h: Hunt, type: string): string | null;
  /** extra modifiers for a hit on a part */
  hitMod?(h: Hunt, partId: string, w: WeaponInst): { mult: number; note: string } | null;
  /** can this weapon reach this part right now? */
  reachable?(h: Hunt, partId: string, w: WeaponInst): boolean;
  /** pin interaction; returns a log line when it lands */
  onPin?(h: Hunt): string | null;
  /** context tip on the telegraph */
  tip?(h: Hunt, type: string): string | null;
  canCapture?(h: Hunt): boolean;
  /** takes to the air: the UI shows air notes (Pierce full damage, nets work) */
  flier?: boolean;
}

export interface Loadout { weapons: string[]; armor: string; item: string | null; target: string }
export interface MonsterRecord { hunts: number; wins: number; captures: number; breaks: Record<string, number> }

export interface Save {
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
}
