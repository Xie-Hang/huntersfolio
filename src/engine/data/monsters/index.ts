import type { Element, MonsterDef } from '../../types';
import { gorehorn } from './gorehorn';
import { galeshrike } from './galeshrike';
import { cinderback } from './cinderback';
import { rimetail } from './rimetail';
import { bogjaw } from './bogjaw';
import { duskheron } from './duskheron';
import { MAX_TIER, EDITION } from '../../edition';

/** every monster that's built; MONSTERS is the ones in this edition (the demo stops at Ashfall Ridge) */
export const ALL_MONSTERS: Record<string, MonsterDef> = { gorehorn, galeshrike, cinderback, rimetail, bogjaw, duskheron };
export const MONSTERS: Record<string, MonsterDef> = Object.fromEntries(Object.entries(ALL_MONSTERS).filter(([, M]) => M.tier <= MAX_TIER));
const builtIn = (t: number) => Object.values(MONSTERS).filter(M => M.tier === t).length;

export const TIERS: Record<number, string> = { 1: 'Tier 1 · Ashfall Ridge', 2: builtIn(2) ? 'Tier 2 · Mirewood' : 'Tier 2 · Uncharted', 3: 'Tier 3 · Uncharted', 4: 'Apex' };

/** Planned roster slots that aren't in the game yet (shown as Unknown on the Hunt Board). */
const later = EDITION === 'demo' ? 'in the full game' : 'in a coming update';
export const UNKNOWN: { tier: number; elem: Element | null; n: number; hint: string }[] = ([
  { tier: 2, elem: null, n: 4 - builtIn(2), hint: `Beyond Ashfall Ridge, ${later}` },
  { tier: 3, elem: null, n: 4 - builtIn(3), hint: `Further still, ${later}` },
  { tier: 4, elem: null, n: 1 - builtIn(4), hint: 'Something vast stirs beyond the ridge' }
] as { tier: number; elem: Element | null; n: number; hint: string }[]).filter(u => u.n > 0);
