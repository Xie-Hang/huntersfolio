// Shared types for the rules engine. The engine never touches the DOM.

export type Face = 'C' | 'T' | 'B'; // Fang, Claw, blank (drawn by ui/parts/FaceMark.svelte; they were a circle and a triangle)
export type DamageType = 'Cut' | 'Blunt' | 'Pierce';
export type Element = 'Ember' | 'Frost' | 'Gale' | 'Stone';
/** status effects (Nov 2026, the Gloamhollow): status weapons carry one instead of an element */
export type Status = 'Infect' | 'Spark' | 'Drain';
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
  /** made in the Foothills (the tutorial island): its own group at the Forge */
  foothills?: boolean;
  /** a starting weapon you're given, never made (the Foothills' Training Blade): kept out of the Forge */
  starter?: boolean;
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
  /** the Oath line: locked until this many different bounties are done */
  bounties?: number;
  /** a status weapon (no element): its hits fill this status meter on the monster */
  status?: Status;
  /** what a full meter does: Infect damage a turn, Spark's Discharge, or Drain's share of your max HP healed */
  statusPow?: number;
}

export interface ArmorDef {
  /** made in the Foothills (the tutorial island) */
  foothills?: boolean;
  /** monster tier it comes from (default 1); gear above the edition's top tier isn't in that build */
  tier?: number;
  id: string;
  name: string;
  hp: number;
  guard: number;
  rerolls: number;
  resist: Element | null;
  perk: string;
  /** one line, 30 characters or fewer, for the loadout slot and picker (8 Nov 2026) */
  short?: string;
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
  /** Blunt hits that build daze build 5 more (Squallhide Coat) */
  dazeUp?: boolean;
  /** tremors can't shake your dice loose (Quakestone Plate) */
  steadyfoot?: boolean;
  /** your first swap each hunt costs no die (Rimeplume Mantle) */
  swapOnce?: boolean;
  /** resists whatever element the monster attacks with (Sovereign Mantle) */
  adaptive?: boolean;
  /** being infected lasts this many turns less (Rotcap, Feverjaw) */
  infectLess?: number;
  /** a Spark Discharge on you deals this share less (Arcmoth, Archeron) */
  sparkLess?: number;
  /** your dice can't be charged (Archeron) */
  chargeProof?: boolean;
  /** leeching slime can't drink from you (Bloodwhelk) */
  leechProof?: boolean;
  /** a latch lasts at most this many turns (Hollowfang) */
  latchMax?: number;
  craft: Cost;
}

export type ItemEffect = 'heal30' | 'smoke' | 'whet50' | 'whet100' | 'net' | 'blast' | 'thaw' | 'snare' | 'cureInfect' | 'cureSpark' | 'trapRush' | 'trapLand';
export interface ItemDef {
  /** monster tier it belongs with (default 1); items above the edition's top tier aren't in that build */
  tier?: number;
  id: string;
  name: string;
  max: number;
  price?: number;
  craft?: Cost;
  yields?: number;
  desc: string;
  /** one line for the Shop card when desc runs long; desc then opens on hover (Nov 2026 text audit) */
  short?: string;
  /** the hunt button's line (about 30 characters) when desc is longer; desc goes in the tip (Nov 2026) */
  effect: ItemEffect;
  /** carried automatically, outside the item slot (Snares) */
  pouch?: boolean;
}

export type CharmEffect = 'dazeHeal' | 'exposeSelf' | 'charge1' | 'lightCut' | 'escapeHeal' | 'dazeWhet' | 'longExpose' | 'chargeBreak' | 'scout' | 'finisher' | 'salvage' | 'swapWhet' | 'airPierce' | 'bigHeal' | 'sealHeal' | 'chargeDaze' | 'groundHit' | 'breakFree' | 'pierceStrip' | 'breakWhet' | 'landWhet' | 'firstHit' | 'infectBuild' | 'sparkBuild' | 'drainUp' | 'infectLong' | 'sparkBig' | 'drainTol';
export interface CharmDef {
  /** made in the Foothills (the tutorial island) */
  foothills?: boolean;
  /** monster tier it comes from (default 1); gear above the edition's top tier isn't in that build */
  tier?: number;
  id: string;
  name: string;
  /** the perk in about 30 characters, for slots and buttons; the full perk goes in the tip (Nov 2026) */
  short?: string;
  /** monster whose materials make it */
  src: string;
  perk: string;
  effect: CharmEffect;
  craft: Cost;
  /** unlocked by completing this many different bounties (the bounty charms) */
  bounties?: number;
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
  /** daze can't cancel it: a full daze meter makes the monster reel after this move instead */
  steady?: boolean;
  /** how much of `dmg` carries the monster's element (resist armor only reduces this part); default from
   *  MonsterDef.elemental by move name, else 0 = a physical attack */
  elemDmg?: number;
  /** guard can't block any of it (a latch drinking) */
  noGuard?: boolean;
  /** the monster's enraged move, the first time it comes this hunt: the telegraph marks it "New move" */
  isNew?: boolean;
}

export type Tone = '' | 'gold' | 'ember' | 'daze';
export interface LogEntry { t: string; tone: Tone; /** order written (for the last-turn recap) */ n?: number }

export interface Die { face: Face; used: string | null; /** Glarewing: left unused at the end of your turn, it discharges into you */ charged?: boolean }

/** exposed: turns left on a Pierce exposure (+15% damage, ×2 toward the break, from any weapon) */
export interface PartState { hp: number; max: number; broken: boolean; exposed: number; /** times broken this hunt, for parts that reform (the Warden's plates); rewards count it */ cracks?: number }

export interface MonsterState {
  /** a counter stance's one-off punishment already happened this turn */
  stanceUsed?: boolean;
  /** the Cinderpup (id burrowmole, the Foothills) has dug in at least once this hunt */
  dug?: boolean;
  /** its enraged move (Nov 2026: each Ridge monster unlocks one when enraged) has been seen this hunt */
  newSeen?: boolean;
  /** Galeshrike: the second dive of a Twin Dive is still to come this climb */
  twin?: boolean;
  /** Cinderback: its next time under it sprays magma instead of erupting */
  sprayNext?: boolean;
  /** Cragwing: buried by its Rockslide, you can't Swap this turn */
  slide?: number;
  /** small per-monster counters for enraged moves (Nov 2026), so a monster file needs no new shared field */
  extra?: Record<string, number>;
  /** turns it's still held by a trap */
  trapped?: number;
  hp: number;
  max: number;
  parts: Record<string, PartState>;
  enraged: boolean;
  daze: number;
  dazeMax: number;
  /** monster actions left before the daze meter can fill again */
  dazeLock: number;
  /** a full daze meter during a steady move: it reels next turn instead */
  dazeQueued?: boolean;
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
  /** the Fenmother: the turn it last raised its steam */
  lastSplit?: number;
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
  /** Fen Charm: the turn the first hit landed on */
  fenHit?: number;
  hits?: number;
  /** dice frozen solid on your next roll */
  frost?: number;
  /** dice shaken loose by a tremor on your next roll (Quakeback) */
  shake?: number;
  /** Squallhorn: pips of gathered wind; Tailwind (its next charge ignores half your guard) */
  wind?: number;
  tailwind?: boolean;
  /** Rimeshrike: its ground actions left with the Frost Shroud up (only Cut and Blunt reach it) */
  shroud?: number;
  /** Wanderer Sovereign: its stance, the stance it shifts into next, and how far through the stance it is */
  stance?: 'stone' | 'gale' | 'ember' | 'frost' | 'bare';
  nextStance?: 'stone' | 'gale' | 'ember' | 'frost' | 'bare';
  stanceStep?: number;
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
  /** status meters filled by status weapons, and how much each needs to fill (it grows each time: tolerance) */
  sm?: Partial<Record<Status, number>>;
  smax?: Partial<Record<Status, number>>;
  /** the monster is infected: turns left, damage a turn */
  infected?: number;
  infectDmg?: number;
  /** statuses on YOU: infected (turns, damage a turn), Spark pips, a latch drinking (turns left), dice charged next roll */
  pInf?: number;
  pInfDmg?: number;
  pSpark?: number;
  latch?: number;
  charge?: number;
  /** Gloamhollow bookkeeping: the Rotcap's bloom, HP drunk during the current latch (frenzy: unused since the Gravefang went) */
  bloom?: number;
  frenzy?: number;
  drank?: number;
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
  /** the Hunter Rank this hunt took you to, when it changed (Nov 2026 bug hunt: "Promoted!" used to show on any first
   *  win against a promotion monster, rank change or not) */
  rankUp?: string;
  /** the bounty outcome (win or lose) */
  bounty?: { id: string; met: boolean; missed?: string; coin: number; mat?: string; repeat?: boolean; unlocked?: string[] };
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
  /** a Flow reroll was given this turn (one a turn, Nov 2026) */
  flowUsed?: boolean;
  evade: boolean;
  /** a trap set this turn (prototype, Nov 2026): springs on the monster's next move if it's the kind it catches */
  trapSet?: 'trapRush' | 'trapLand';
  whet: number;
  target: string;
  mon: MonsterState;
  intent: string;
  log: LogEntry[];
  over: null | 'win' | 'lose';
  captured: boolean;
  /** Snares carried this hunt (outside the item slot) */
  snares: number;
  /** a snare is set this turn: it holds unless the monster's move hits for CHARGE_BREAK or more */
  snareSet?: boolean;
  stats: HuntStats;
  /** set once settleHunt has applied rewards to the save */
  reward: Reward | null;
  /** seeded RNG state; hunts are deterministic given a seed */
  rng: number;
  /** tutorial: fixed faces for the opening turns (index 0 = turn 1); later turns roll normally */
  script?: Face[][];
  /** which layer of the hunt screen this hunt teaches (1 = the first hunt: basics only). Unset = everything.
   *  Monsters keep their extra moves (stances, mud) for later layers (Nov 2026 playtest: "overwhelming"). */
  lesson?: number;
  /** the Foothills' promotion hunt (the Gorehorn before you're a Hunter): it fights without mud or stance */
  exam?: boolean;
  /** a Foothills hunt: dice rolled, the faces they can show, and what the hunt screen shows (MonsterDef.island) */
  ndice?: number;
  faces?: Face[];
  show?: string[];
  /** actions held back until a turn (the island's prompts teach them then): key → turn */
  held?: Record<string, number>;
  /** what happened last turn, for the line under the next move (Nov 2026: replaces the hunt log on screen) */
  recap?: { turn: number; dealt: number; lines: LogEntry[] };
  logSeq?: number;
  dealtAtTurnStart?: number;
  /** notable moments this hunt, for achievements: 'daze' | 'interrupt' | 'grounded' | 'unearthed' | 'shatter' */
  feats?: string[];
  /** the bounty taken for this hunt */
  bounty?: string;
  /** a quickswap armor's free swap was used this turn */
  freeSwapUsed?: boolean;
  /** a swapOnce armor's free swap was used this hunt */
  swapOnceUsed?: boolean;
}

export interface MonsterDef {
  /** a Foothills monster (the tutorial island, Nov 2026): how many dice you roll against it and which faces they can
   *  show. What the hunt screen shows comes from the island step (engine/island.ts, ui/reveal.ts). */
  island?: { dice: number; faces: Face[] };
  /** a Foothills monster is the young of a Ridge monster (Mekkman, Nov 2026): that monster's id */
  youngOf?: string;
  /** a shorter name for the hunt screen's header, when the full one doesn't fit beside its chips */
  panelName?: string;
  /** a variant of this monster (the changed Ashfall Ridge, Nov 2026): same body, new element and mechanic */
  variantOf?: string;
  /** a promotion hunt (Nov 2026, the rank ladder): winning it makes you this Hunter Rank */
  promotion?: 'E' | 'D' | 'C';
  /** plating that isn't ice: its name in the log and on the badge, and layers a hit clears (default: Cut 2, else 1) */
  plateWord?: string;
  plateBreak?(w: WeaponInst): number;
  /** hot plating: a Firepot does nothing */
  plateHot?: boolean;
  /** its element right now, when it changes during the hunt (the Wanderer Sovereign's stances): its weakness and
   *  resistance follow the element wheel (WEAK_OF / RESIST_OF) */
  elemOf?(h: Hunt): Element;
  /** extra condition badges on the monster panel */
  badges?(h: Hunt): { key: string; label: string; short: string; cls: string; desc: string; n?: number }[];
  /** names of its elemental attacks (Nov 2026: only these carry its element; the rest are physical, so resist
   *  armor answers the big elemental moves without making the whole fight trivial) */
  elemental?: string[];
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
  /** what it starts doing once enraged (its own mechanic turned up, Nov 2026); shown in the bestiary */
  enragedHabit?: string;
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
  /** the status it puts on you (the Gloamhollow): the loadout notes which items and armor answer it */
  inflicts?: Status;
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
  /** the Foothills (the tutorial island, Nov 2026): the step reached. Absent = done (saves from before the island,
   *  and players who skipped it). See engine/island.ts. */
  island?: number;
  /** 2: the island's step numbers are the 8-step island (8 Nov 2026). Older saves are moved on load (migrateIsland) */
  islandV?: number;
  /** the hunt count when the last Ridge lesson tip showed: the next waits a hunt (8 Nov 2026) */
  lessonAt?: number;
}
