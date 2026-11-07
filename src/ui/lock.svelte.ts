// While a guided tutorial step is on screen, only the thing it points at (and the tip card itself: Next, Skip
// tutorial) can be used (Mekkman, Nov 2026: the Forge prompt was up and he hunted again instead). Coach.svelte sets
// this; the mouse, touch and keyboard are blocked there, and the controller's shortcut buttons check it here.
export const tutorialLock = $state({ on: false });
