// Controller support (Xbox-style pads, the Steam Deck through Steam Input, PlayStation pads with the standard mapping).
// The d-pad or left stick moves focus to the nearest control in that direction; A presses it. Everything you can
// click can be reached this way. Shortcuts on top:
//   everywhere   B back / close · LB RB previous / next screen (Hunt Board, Forge, Shop) · Menu settings · View how to play
//   in a hunt    B clear the dice selection · X reroll selected · Y end turn · LB RB aim at the previous / next part
//                LT undo · RT swap weapon
// Using a pad switches the UI to controller hints (data-input="pad" on <html>); the mouse or keyboard switches back.
import * as E from '../engine';
import { game } from './game.svelte';
import { tutorialLock } from './lock.svelte';

export const input = $state({ mode: 'mouse' as 'mouse' | 'pad' });

/** On a pad, "click" reads wrong: say "select" instead (tutorial tips and hints). */
export const padWords = (t: string) => (input.mode === 'pad' ? t.replace(/\bClick\b/g, 'Select').replace(/\bclick\b/g, 'select') : t);

const B = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, MENU: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 } as const;
const FIRST = 320, REPEAT = 110, DEAD = 0.55;

function setMode(m: 'mouse' | 'pad') {
  if (input.mode === m) return;
  input.mode = m;
  document.documentElement.dataset.input = m;
  if (m === 'pad' && !document.activeElement?.matches?.(FOCUSABLE)) focusStart();
}

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]';
/** the area the pad works in: the open dialog if there is one, else the page */
const scope = (): ParentNode => {
  const d = [...document.querySelectorAll('dialog[open]')];
  return d[d.length - 1] ?? document;
};
const visible = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
const candidates = () => [...scope().querySelectorAll<HTMLElement>(FOCUSABLE)].filter(visible);

function focus(el: HTMLElement | null | undefined) {
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
/** where focus lands when the pad is first used, or when the focused control went away */
function focusStart() {
  const s = scope();
  focus(s.querySelector<HTMLElement>('[data-pad-start]:not([disabled])')
    ?? (game.view === 'hunt' ? s.querySelector<HTMLElement>('.die:not([disabled]), [data-coach="end"]:not([disabled])') : null)
    ?? s.querySelector<HTMLElement>('.btn.primary:not([disabled])')
    ?? candidates()[0]);
}

/** Move focus to the nearest control in a direction (spatial navigation). */
function nav(dx: number, dy: number) {
  const cur = document.activeElement as HTMLElement | null;
  const list = candidates();
  if (!cur || !list.includes(cur)) return focusStart();
  const a = cur.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  let best: HTMLElement | null = null, bestScore = Infinity;
  for (const el of list) {
    if (el === cur || el.contains(cur) || cur.contains(el)) continue;
    const r = el.getBoundingClientRect();
    // edges, so a wide neighbour still counts as "to the right" when its centre isn't
    const along = dx ? (dx > 0 ? r.left - a.right : a.left - r.right) : (dy > 0 ? r.top - a.bottom : a.top - r.bottom);
    if (along < -4) continue;
    const cx = Math.max(r.left, Math.min(ax, r.right)), cy = Math.max(r.top, Math.min(ay, r.bottom));
    const across = dx ? Math.abs(cy - ay) : Math.abs(cx - ax);
    const score = Math.max(0, along) + across * 2.2;
    if (score < bestScore) { bestScore = score; best = el; }
  }
  if (best) focus(best);
}

/** After a press re-draws the control (a die, a picker row), put focus back on whatever now sits in its place. */
function keepFocusNear(x: number, y: number) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const cur = document.activeElement;
    if (cur && cur !== document.body && (cur as HTMLElement).isConnected && candidates().includes(cur as HTMLElement)) return;
    let best: HTMLElement | null = null, d = Infinity;
    for (const el of candidates()) {
      const r = el.getBoundingClientRect(), dd = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
      if (dd < d) { d = dd; best = el; }
    }
    if (best && d < 200) focus(best); else focusStart();
  }));
}

/** Left / right on a slider, a number box or a drop-down changes its value instead of moving focus. */
function adjust(step: number): boolean {
  const el = document.activeElement;
  if (el instanceof HTMLInputElement && (el.type === 'range' || el.type === 'number')) {
    if (step > 0) el.stepUp(); else el.stepDown();
  } else if (el instanceof HTMLSelectElement) {
    el.selectedIndex = Math.max(0, Math.min(el.options.length - 1, el.selectedIndex + step));
  } else return false;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function back() {
  const close = [...document.querySelectorAll<HTMLElement>('dialog[open] .dlg > .ph .iconbtn')].pop();
  if (close) return close.click();
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}
function cycleScreen(step: number) {
  const views = ['board', 'forge', 'shop'] as const;
  const i = views.indexOf(game.view as (typeof views)[number]); if (i < 0) return;
  const btn = document.querySelector<HTMLElement>(`[data-coach="nav-${views[(i + step + views.length) % views.length]}"]`);
  btn?.click();
  requestAnimationFrame(() => focusStart());
}
function cyclePart(step: number) {
  const h = game.hunt; if (!h) return;
  const ids = E.monsterOf(h).parts.map(p => p.id);
  game.target(ids[(ids.indexOf(h.target) + step + ids.length) % ids.length]);
}

function press(btn: number) {
  const inDialog = !!document.querySelector('dialog[open]');
  const hunting = game.view === 'hunt' && !!game.hunt && !game.hunt.over && !inDialog;
  if (btn === B.A) {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body || !candidates().includes(el)) return focusStart();
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, view = game.view;
    el.click();
    // a new screen starts at its own start point; the same screen keeps your place
    if (game.view !== view) requestAnimationFrame(() => requestAnimationFrame(focusStart)); else keepFocusNear(x, y);
    return;
  }
  if (btn === B.UP) return nav(0, -1);
  if (btn === B.DOWN) return nav(0, 1);
  if ((btn === B.LEFT || btn === B.RIGHT) && adjust(btn === B.RIGHT ? 1 : -1)) return;
  if (btn === B.LEFT) return nav(-1, 0);
  if (btn === B.RIGHT) return nav(1, 0);
  // a guided tutorial step: only A on the thing it points at (and D-pad moves) until it's done
  if (tutorialLock.on && btn !== B.UP && btn !== B.DOWN && btn !== B.LEFT && btn !== B.RIGHT) return;
  if (btn === B.MENU) return document.querySelector<HTMLElement>('.iconbtn[aria-label="Settings"]')?.click();
  if (btn === B.VIEW) return document.querySelector<HTMLElement>('.iconbtn[aria-label="How to play"]')?.click();
  if (hunting) {
    if (btn === B.B) { if (game.sel.length) game.sel = []; return; }
    if (btn === B.X) return game.reroll();
    if (btn === B.Y) return game.requestEnd();
    if (btn === B.LB) return cyclePart(-1);
    if (btn === B.RB) return cyclePart(1);
    if (btn === B.LT) return game.undo();
    if (btn === B.RT) return game.swap();
    return;
  }
  if (btn === B.B) return back();
  if (!inDialog && btn === B.LB) return cycleScreen(-1);
  if (!inDialog && btn === B.RB) return cycleScreen(1);
}

/** When a hunt has just ended, jump to the result card's first button. */
let wasOver = false;
function afterPress() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const over = game.view === 'hunt' && !!game.hunt?.over;
    if (over && !wasOver) focus(document.querySelector<HTMLElement>('.tele .btn.primary, .tele .btn'));
    wasOver = over;
  }));
}

/** Start listening for pads. Safe to call once at startup; costs nothing until a pad connects. */
/** Connected pads, or none where the page isn't allowed to read them (an embedded frame can block the
 *  gamepad feature, and getGamepads then throws). Never let a missing controller break the game. */
function readPads(): Gamepad[] {
  try { return [...navigator.getGamepads()].filter((p): p is Gamepad => !!p && p.connected); } catch { return []; }
}

export function startPad() {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
  const held = new Map<number, number>(); // button → next repeat time
  // Inputs already down when we first see a pad are ignored until they've been released once. Some PCs expose a
  // device whose stick or button rests at full tilt (a wheel, a flight stick, a driver quirk); without this it
  // would "press right" forever, creeping sliders up and dragging focus around under the mouse.
  const trusted = new Map<string, Set<number>>(); // pad id → inputs seen released
  let raf = 0;
  const DIRS = [B.UP, B.DOWN, B.LEFT, B.RIGHT] as number[];
  function frame(t: number) {
    raf = 0;
    const pads = readPads();
    if (!pads.length) { held.clear(); return; }
    const down = new Set<number>();
    for (const p of pads) {
      const key = `${p.index}:${p.id}`;
      let ok = trusted.get(key); if (!ok) trusted.set(key, ok = new Set());
      const raw = new Set<number>();
      p.buttons.forEach((b, i) => { if (b.pressed || b.value > 0.6) raw.add(i); });
      const [x = 0, y = 0] = p.axes;
      if (y < -DEAD) raw.add(B.UP); if (y > DEAD) raw.add(B.DOWN);
      if (x < -DEAD) raw.add(B.LEFT); if (x > DEAD) raw.add(B.RIGHT);
      for (let i = 0; i <= B.RIGHT; i++) if (!raw.has(i)) ok.add(i);
      for (const i of raw) if (ok.has(i)) down.add(i);
    }
    for (const i of down) {
      const next = held.get(i);
      if (next === undefined) {
        held.set(i, t + FIRST);
        // the first press after the mouse only switches to the pad and shows where focus is
        const wasPad = input.mode === 'pad';
        setMode('pad');
        if (wasPad && document.hasFocus()) { press(i); afterPress(); }
      }
      else if (DIRS.includes(i) && t >= next && input.mode === 'pad') { held.set(i, t + REPEAT); if (document.hasFocus()) press(i); }
    }
    for (const i of [...held.keys()]) if (!down.has(i)) held.delete(i);
    raf = requestAnimationFrame(frame);
  }
  const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
  window.addEventListener('gamepadconnected', wake);
  // a pad already connected before the page loaded shows up on its first button press
  window.addEventListener('pointermove', () => setMode('mouse'), { passive: true });
  window.addEventListener('pointerdown', () => setMode('mouse'), { passive: true });
  window.addEventListener('keydown', e => { if (e.isTrusted) setMode('mouse'); });
  if (readPads().length) wake();
}
