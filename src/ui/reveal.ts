// One layer of the hunt screen per hunt (Nov 2026 playtest: "overwhelming", "too many layers to register").
// The first hunt shows the basics only: one weapon, its moves, Guard, End turn, Reroll. The second adds parts and
// the item, the third the second weapon, and from the fourth everything is on. The engine keeps the rules; this only decides what's on screen.
// Settings → "Show every action" turns it off; saves from before this change have hunted enough to see it all.
import type { Hunt } from '../engine';
import { MONSTERS } from '../engine';

export const LAYER = {
  /** aim at parts; the monster's element, weakness and resistance; the item (each Ashfall Ridge monster after the
   *  Gorehorn has an item that answers it, so it can't wait: the QA bot lost the Galeshrike twice without its net) */
  parts: 2, item: 2,
  /** the second weapon (earlier against a flier or a burrower, see below) */
  swap: 3,
  /** Charge, the daze meter, move tags (Flow, Daze, Expose), armor and charm details, Capture before it is ready (from
   *  the second hunt Capture appears once the monster is weak enough) */
  all: 4
} as const;

/** Foothills hunts (the tutorial island, Nov 2026) name exactly what they show (MonsterDef.island.show); these are
 *  the extra keys they can name. Every other hunt shows them all. */
export type Show = keyof typeof LAYER | 'intent' | 'block' | 'reroll' | 'undo' | 'capture' | 'daze' | 'flow' | 'rend' | 'elements' | 'charge' | 'enraged';

const base = (h: Hunt | null | undefined, k: keyof typeof LAYER) => (h?.lesson ?? 99) >= LAYER[k];
/** Swap also shows early against a flier or a burrower: there, one weapon can't reach it and you'd be stuck. */
export const shows = (h: Hunt | null | undefined, k: Show): boolean => {
  if (h?.show) return h.show.includes(k) && (k !== 'swap' || h.weps.length > 1);
  if (k === 'intent' || k === 'block' || k === 'reroll' || k === 'undo' || k === 'rend' || k === 'enraged') return true;
  // outside the Foothills: Capture comes with the parts layer, Daze meters and move tags with everything
  if (k === 'capture' || k === 'elements') return base(h, 'parts');
  if (k === 'daze' || k === 'flow' || k === 'charge') return base(h, 'all');
  if (k === 'swap' && h && h.weps.length < 2) return false;
  return base(h, k) || (k === 'swap' && !!h && (h.lesson ?? 99) >= 2 && !!(MONSTERS[h.mid]?.flier || MONSTERS[h.mid]?.burrower));
};
