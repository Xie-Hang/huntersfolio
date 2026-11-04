// Weighted, state-driven behaviour for Tier 2 and up (design doc: Behavior model).
// A monster offers a pool of actions with weights for its current state; this picks one, applying the fairness rules:
//   no two heavy attacks (threat 3+) in a row, and at least one low-threat turn (threat 0–1) in any three.
// Committed chains (wind-up → big hit) are handled by the monster itself before it calls this.
import type { Hunt } from './types';
import { nextRandom } from './rng';

export type Pool = [action: string, weight: number][];

export function choose(h: Hunt, pool: Pool, threatOf: (action: string) => number): string {
  const m = h.mon, recent = m.recent ?? [];
  const last = recent.at(-1), last2 = recent.slice(-2);
  let options = pool.filter(([, w]) => w > 0);
  if (last && threatOf(last) >= 3) options = options.filter(([a]) => threatOf(a) < 3);
  if (last2.length === 2 && last2.every(a => threatOf(a) >= 2)) {
    const low = options.filter(([a]) => threatOf(a) <= 1);
    if (low.length) options = low;
  }
  if (!options.length) options = pool;
  const total = options.reduce((t, [, w]) => t + w, 0);
  let r = nextRandom(h) * total;
  for (const [a, w] of options) { r -= w; if (r <= 0) return a; }
  return options.at(-1)![0];
}

/** Call from `next` with the action that was chosen, so the fairness rules can see it. */
export function remember(h: Hunt, action: string) {
  const m = h.mon;
  m.recent = [...(m.recent ?? []), action].slice(-3);
  return action;
}
