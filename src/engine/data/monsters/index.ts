import type { Element, MonsterDef } from '../../types';
import { gorehorn } from './gorehorn';
import { galeshrike } from './galeshrike';
import { cinderback } from './cinderback';

export const MONSTERS: Record<string, MonsterDef> = { gorehorn, galeshrike, cinderback };

export const TIERS: Record<number, string> = { 1: 'Tier 1 · Ashfall Ridge', 2: 'Tier 2 · Uncharted', 3: 'Tier 3 · Uncharted', 4: 'Apex' };

/** Planned roster slots that aren't in the game yet (shown as Unknown on the Hunt Board). */
export const UNKNOWN: { tier: number; elem: Element | null; n: number; hint: string }[] = [
  { tier: 1, elem: 'Frost', n: 1, hint: 'Frost on the reeds at dawn' },
  { tier: 2, elem: null, n: 4, hint: '4 monsters unsighted' },
  { tier: 3, elem: null, n: 4, hint: '4 monsters unsighted' },
  { tier: 4, elem: null, n: 1, hint: 'Something vast stirs beyond the ridge' }
];
