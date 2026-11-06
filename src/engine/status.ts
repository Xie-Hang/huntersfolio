// Statuses the monsters put on YOU (Nov 2026, the Gloamhollow). Kept apart from combat.ts so monster files can use
// them without an import cycle.
import type { Hunt } from './types';

/** Spark on you: pips build to SPARK_CAP, then you Discharge (guard can't stop it). A charged die left unused hits for CHARGED_HIT. */
export const SPARK_CAP = 3, CHARGED_HIT = 15;
const feat = (h: Hunt, f: string) => { (h.feats ??= []).includes(f) || h.feats.push(f); };

/** Infect you for `turns` turns at `dmg` a turn (armor shortens it). Returns the log line. */
export function infectPlayer(h: Hunt, turns: number, dmg: number): string | null {
  const t = turns - (h.arm.infectLess ?? 0); if (t <= 0) return `Your ${h.arm.name} keeps the spores out.`;
  const m = h.mon; m.pInf = Math.max(m.pInf ?? 0, t); m.pInfDmg = Math.max(m.pInfDmg ?? 0, dmg);
  feat(h, 'infected');
  return `You’re infected: ${m.pInfDmg} a turn for ${m.pInf} turns.`;
}
/** Add Spark pips on you; at SPARK_CAP you Discharge for `hit` (armor lessens it). Returns the log line. */
export function sparkPlayer(h: Hunt, n: number, hit: number): string {
  const m = h.mon; m.pSpark = (m.pSpark ?? 0) + n;
  if (m.pSpark < SPARK_CAP) return `Spark on you: ${m.pSpark} of ${SPARK_CAP}.`;
  m.pSpark = 0; feat(h, 'discharged');
  const d = Math.round(hit * (1 - (h.arm.sparkLess ?? 0)));
  h.php = Math.max(0, h.php - d); h.stats.taken += d;
  return `The spark on you discharges for ${d}! Block can’t stop it.`;
}
/** The monster latches on for up to `turns` turns (armor caps it). */
export function latchPlayer(h: Hunt, turns: number) {
  h.mon.latch = Math.min(turns, h.arm.latchMax ?? turns); h.mon.drank = 0; feat(h, 'latched');
  return `It latches on! It will drink from you for ${h.mon.latch} turn${h.mon.latch > 1 ? 's' : ''}.`;
}
