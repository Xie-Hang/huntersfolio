// Hunter Rank (Nov 2026, Mekkman's ladder): F → E → D → C is Low Rank (the game as built); B → A → S is High Rank,
// hidden until it's built. You rank up by winning a promotion hunt, which opens once every monster in your rank's
// main region is beaten. No rank points: nothing to grind.
// Saves from before ranks get the rank their records earn: any win at a higher tier counts as that promotion passed.
import type { Save } from './types';
import { MONSTERS } from './data/monsters';

export type Rank = 'F' | 'E' | 'D' | 'C';
export const RANKS: Rank[] = ['F', 'E', 'D', 'C'];
/** what each rank holds, for the Hunt Board's section headings */
export const RANK_REGION: Record<Rank, string> = { F: 'Ashfall Ridge', E: 'The Mirewood', D: 'The Stormspire', C: 'Low Rank cleared' };
/** which rank a tier's monsters belong to (promotion hunts sit in the rank they promote from) */
export const rankOfTier = (t: number): Rank => (t < 2 ? 'F' : t < 3 ? 'E' : t < 4 ? 'D' : 'D');

const won = (s: Save, id: string) => (s.record[id]?.wins ?? 0) > 0;
// For saves from before ranks: wins that show a rank was reached. Rank E: anything past Ashfall Ridge (before the
// Cragwing, the Gloamhollow opened straight after the Ridge, so an Arcmoth win means the player was past rank F:
// Nov 2026 bug hunt, those saves had the rest of the Gloamhollow locked again). Rank D: a Stormspire win.
const EVIDENCE: Record<'E' | 'D', number[]> = { E: [2, 2.2, 2.5, 3, 3.2], D: [3] };
const wonTier = (s: Save, r: 'E' | 'D') => Object.values(MONSTERS).some(M => EVIDENCE[r].includes(M.tier) && !M.promotion && won(s, M.id));

export function hunterRank(s: Save): Rank {
  const passed = (r: Rank) => Object.values(MONSTERS).some(M => M.promotion === r && won(s, M.id));
  if (passed('C')) return 'C';
  if (passed('D') || wonTier(s, 'D')) return 'D';
  if (passed('E') || wonTier(s, 'E')) return 'E';
  return 'F';
}
export const rankAtLeast = (s: Save, r: Rank) => RANKS.indexOf(hunterRank(s)) >= RANKS.indexOf(r);

/** the promotion hunt that takes you from your current rank to the next, if this edition has it */
export function promotionFor(s: Save) {
  const r = hunterRank(s), next = RANKS[RANKS.indexOf(r) + 1];
  return next ? Object.values(MONSTERS).find(M => M.promotion === next) ?? null : null;
}
