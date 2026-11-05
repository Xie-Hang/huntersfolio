// Keyboard shortcuts for hunts. Mouse stays the main input; keys are for speed.
// 1–4 dice · Q W E moves · G guard · C charge · S swap · X capture · I item · R reroll
// Space end turn · Ctrl+Z or U undo · Esc clear selection.
import * as E from '../engine';
import { game } from './game.svelte';

export const MOVE_KEYS = ['Q', 'W', 'E'];

export function onHuntKey(e: KeyboardEvent) {
  if (e.repeat || e.altKey || e.metaKey) return;
  const t = e.target as HTMLElement | null;
  if (t && (t.closest('input, textarea, select') || t.isContentEditable)) return;
  if (document.querySelector('dialog[open]')) return;
  const h = game.hunt;
  if (game.view !== 'hunt' || !h || h.over) return;

  const k = e.key.toLowerCase();
  if (e.ctrlKey) { if (k === 'z') { game.undo(); e.preventDefault(); } return; }
  let done = true;
  if (k >= '1' && k <= '4') game.toggleDie(+k - 1);
  else if (k === 'q' || k === 'w' || k === 'e') { const i = 'qwe'.indexOf(k); if (E.canUseMove(h, i)) game.move(i); }
  else if (k === 'g') game.guard();
  else if (k === 'c') game.charge();
  else if (k === 's') game.swap();
  else if (k === 'x') game.capture();
  else if (k === 'i') game.item();
  else if (k === 'r') game.reroll();
  else if (k === 'u') game.undo();
  else if (k === ' ') game.requestEnd();
  else if (k === 'escape') game.sel = [];
  else done = false;
  if (done) e.preventDefault(); // Space would also click the focused button
}
