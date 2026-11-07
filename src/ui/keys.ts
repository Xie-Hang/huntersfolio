// Hunt keyboard shortcuts were removed (Mekkman, 8 Nov 2026): only the hunt had them, so the rest of the game
// felt unsupported. Mouse, touch and controller remain. MOVE_KEYS still name the moves' data-key, which the
// controller and the tutorial lock use to find a control.

export const MOVE_KEYS = ['Q', 'W', 'E'];


/** the data-key of the control a key press triggers in a hunt (for the tutorial lock) */
export function keyName(e: KeyboardEvent): string | null {
  if (e.ctrlKey && e.key.toLowerCase() === 'z') return 'z';
  if (e.ctrlKey || e.altKey || e.metaKey) return null;
  const k = e.key.toLowerCase();
  return k === ' ' ? 'space' : k.length === 1 ? k : null;
}
