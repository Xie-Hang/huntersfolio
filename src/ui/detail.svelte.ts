// One step away (Nov 2026 screen text audit): text a player needs only sometimes sits behind a small circled i and
// opens on hover, controller focus or tap, never deeper than that. Settings → Text detail: Full puts it back on
// screen instead (`full()`), for players who want everything showing.
// The tip is drawn once, at the top of the page (DetailTip.svelte), so a panel's overflow never clips it.
import { settings } from './settings.svelte';

export const full = () => settings.prefs.detail === 'full';

class TipState {
  text = $state('');
  x = $state(0);
  y = $state(0);
  below = $state(true);
  owner: HTMLElement | null = null;
  show(el: HTMLElement, text: string) {
    const r = el.getBoundingClientRect();
    this.owner = el; this.text = text;
    this.below = r.bottom + 120 < innerHeight;
    this.x = Math.min(Math.max(12, r.left), innerWidth - 312);
    this.y = this.below ? r.bottom + 8 : r.top - 8;
  }
  hide(el?: HTMLElement) { if (!el || el === this.owner) { this.text = ''; this.owner = null; } }
}
export const tip = new TipState();

/** `use:detail={'the rule, in one or two sentences'}`: a small circled i, the text on hover, focus or tap */
export function detail(el: HTMLElement, text: string) {
  let t = text;
  // the mark only shows when there is something behind it (Nov 2026: an empty tip still drew its mark)
  el.classList.toggle('dt', !!t);
  // inside a button (a move's Flow tag) the button keeps its click and focus; the tip shows on hover, or while the
  // button has focus (a pad's focus lands on the button)
  const host = el.tagName === 'BUTTON' ? null : el.closest('button');
  if (!host && !el.hasAttribute('tabindex') && !/^(A|INPUT|SELECT)$/.test(el.tagName)) el.tabIndex = 0;
  el.setAttribute('aria-describedby', 'detail-tip');
  // blur also fires when a focused element is removed mid-render, where writing state is refused: hide a tick later
  const on = () => t && tip.show(el, t), off = () => queueMicrotask(() => tip.hide(el));
  const tap = (e: Event) => { if (el.tagName === 'BUTTON' || host) return; e.stopPropagation(); tip.owner === el ? off() : on(); };
  const focusEl = host ?? el;
  el.addEventListener('mouseenter', on); el.addEventListener('mouseleave', off);
  focusEl.addEventListener('focus', on); focusEl.addEventListener('blur', off); el.addEventListener('click', tap);
  return {
    update(v: string) { t = v; el.classList.toggle('dt', !!t); if (!t) off(); else if (tip.owner === el) on(); },
    destroy() { off(); el.removeEventListener('mouseenter', on); el.removeEventListener('mouseleave', off); focusEl.removeEventListener('focus', on); focusEl.removeEventListener('blur', off); el.removeEventListener('click', tap); }
  };
}
