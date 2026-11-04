// Achievements reach Steam through the desktop shell. Earned ids live in the save, so every sync sends
// the full list: anything earned while Steam wasn't running (or before the game had an App ID) catches up.
import * as E from '../engine';

type Bridge = { unlock(ids: string[]): void };
const bridge = (): Bridge | undefined =>
  typeof window !== 'undefined' ? (window.hf as { achievements?: Bridge } | undefined)?.achievements : undefined;

/** Award whatever the save (and the hunt that just ended, if any) now qualifies for, then sync to Steam. */
export function checkAchievements(s: E.Save, h: E.Hunt | null = null): string[] {
  const got = E.award(s, h);
  if (got.length || h === null) bridge()?.unlock([...s.achievements]);
  return got;
}
