// While a guided tutorial step is on screen, only the thing it points at (and the tip card itself: Next, Skip
// tutorial) can be used (Mekkman, Nov 2026: the Forge prompt was up and he hunted again instead). Coach.svelte sets
// this; the mouse, touch and keyboard are blocked there, and the controller's shortcut buttons check it here.
export const tutorialLock = $state({ on: false });
/** whether an element may be used under the lock (the prompt's target, or inside it). Keys and pad buttons look up the
 *  control they'd trigger by its data-key and ask this (Nov 2026 playtest: the keyboard was locked out of prompts). */
let allows: ((el: Element) => boolean) | null = null;
export function setLockAllows(f: ((el: Element) => boolean) | null) { allows = f; }
export function keyAllowed(key: string | null): boolean {
  if (!key || !allows) return false;
  const el = document.querySelector(`[data-key="${CSS.escape(key)}"]`);
  return !!el && allows(el);
}
