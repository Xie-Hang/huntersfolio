// What the player has been taught so far (Mekkman, 8 Nov 2026: "I do not want players to stumble upon something for it
// to later be introduced during the tutorial messages"). Reference screens (Help, Hunter's Notes) show a thing only
// once Mell has taught it. Players who skipped the tutorial, or whose saves predate the island, see everything.
import * as E from '../engine';
import { game } from './game.svelte';
import { settings } from './settings.svelte';

export type Topic = 'dice' | 'faces' | 'moves' | 'end' | 'intent' | 'reroll' | 'block' | 'parts' | 'undo' | 'swap' | 'flow' | 'daze' | 'items' | 'charge' | 'capture' | 'armour';

/** the prompt that teaches each topic, and the island step by which it's surely been taught (saves from older builds) */
const BY: Record<Topic, [string, number]> = {
  dice: ['i-die', 1], faces: ['i-faces2', 2], moves: ['i-move', 1], end: ['i-end', 1], intent: ['i-tele', 1], reroll: ['i-reroll', 1],
  block: ['i-block', 2], parts: ['i-aim', 4], undo: ['i-undo', 4], swap: ['i-swap', 4],
  flow: ['i-flow', 5], daze: ['i-dazemaul', 5], armour: ['i-vest2', 6], items: ['i-item', 8],
  charge: ['chargeNew', 99], capture: ['capture', 99]
};

export function taught(k: Topic): boolean {
  const s = game.save;
  // no teacher: tips off, or a save that never saw the island
  if (!settings.prefs.tips && !game.lesson) return true;
  if (E.islandDone(s) && !s.tips.includes('i-begin')) return true;
  const [tip, step] = BY[k];
  return s.tips.includes(tip) || E.islandStep(s) >= step;
}
