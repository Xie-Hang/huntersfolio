<script lang="ts">
  import Rich from './Rich.svelte';
  // The tutorial tip on screen: a small card beside the thing it describes, with a ring around that thing.
  // Placement tries below, above, right, then left of the target, and stays inside the window.
  import { coach, tipTargets } from '../coach.svelte';
  import { padWords } from '../pad.svelte';
  import { game } from '../game.svelte';
  import { tutorialLock, setLockAllows, keyAllowed } from '../lock.svelte';
  import { keyName } from '../keys';

  const GAP = 12, W = 320, EDGE = 12;
  let cardH = $state(0);
  let ring = $state<{ x: number; y: number; w: number; h: number } | null>(null);
  let pos = $state({ x: 0, y: 0 });
  /** the paper tab pointing from the card at its target: which edge it sits on, and where along it */
  let arrow = $state<{ side: 'up' | 'down' | 'left' | 'right'; at: number } | null>(null);

  $effect(() => { coach.sync(); });

  /** fully shown: not hidden, and not still fading in or sliding in (a looping glow or pulse doesn't count) (a result card's buttons fade in line by line; the tip used to
   *  arrive before its button did) */
  function settled(el: HTMLElement) {
    if (!el.getClientRects().length) return false;
    for (let n: HTMLElement | null = el; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.98 || (cs.transform !== 'none' && n.getAnimations?.().some(a => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity))) return false;
    }
    return true;
  }
  /** The first of the tip's targets that's on the page. One that's there but still fading in is waited for, not
   *  skipped: the Shop prompt used to land on the Shop tab, then jump to the result card's button once it faded in. */
  function anchor(): HTMLElement | null {
    for (const key of tipTargets(coach.current)) {
      const el = document.querySelector<HTMLElement>(`[data-coach="${key}"]`);
      if (el && el.getClientRects().length) return settled(el) ? el : null;
    }
    return null;
  }
  /** a guided step waits for its target: the card shows once the thing it points at is there */
  let ready = $state(false);
  let target: HTMLElement | null = null;
  let cardEl = $state<HTMLElement>();

  // Lock everything but the target and the card while a guided step is up (pointer, touch and keys, in the capture
  // phase so the game's own handlers never see them). Info steps lock too: Next, or Skip tutorial, moves on.
  $effect(() => {
    const t = coach.current;
    const on = !!t?.guide && ready;
    tutorialLock.on = on;
    if (!on) return;
    const allowed = (n: EventTarget | null) => {
      if (!(n instanceof Node)) return false;
      if (cardEl?.contains(n)) return true;
      // an open dialog (Help, Settings) can always be used and closed
      if (n instanceof Element && n.closest('dialog[open]')) return true;
      // a replayed lesson can always be left
      if (n instanceof Element && n.closest('[data-coach="end-lesson"]')) return true;
      // the target as last placed (not re-checked here: a hover or press animation must not make it unclickable)
      return !!target && target.isConnected && target.contains(n);
    };
    // an island prompt that only explains has no button (Nov 2026 playtest): selecting the highlighted thing moves on
    const ack = !!t?.info && t.id.startsWith('i-') && !t.gotit;
    const done = () => { if (ack) setTimeout(() => { if (coach.current === t) coach.dismiss(); }, 0); };
    const block = (e: Event) => {
      if (!allowed(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (e.type === 'click' && !cardEl?.contains(e.target as Node)) done();
    };
    // a key passes when it's focus on the target, or the shortcut for the target (1 for the first die, Q for a move…)
    const keys = (e: KeyboardEvent) => { if (e.key === 'Tab' || e.key === 'Shift') return;
      // Enter or Space presses Got it
      if (t?.gotit && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopImmediatePropagation(); coach.dismiss(); return; } const k = keyName(e); if (keyAllowed(k) || (allowed(document.activeElement) && (e.key === 'Enter' || e.key === ' '))) { done(); return; } if (!allowed(document.activeElement)) { e.preventDefault(); e.stopImmediatePropagation(); } };
    setLockAllows(el => allowed(el));
    const evs = ['pointerdown', 'mousedown', 'click', 'touchstart', 'dblclick'] as const;
    for (const ev of evs) window.addEventListener(ev, block, true);
    window.addEventListener('keydown', keys, true);
    return () => { for (const ev of evs) window.removeEventListener(ev, block, true); window.removeEventListener('keydown', keys, true); tutorialLock.on = false; setLockAllows(null); };
  });

  /** CSS zoom (the browser stand-in for Interface size) scales fixed positions too; work in unzoomed px. */
  const zoom = () => parseFloat(document.documentElement.style.zoom) || 1;
  function rectOf(el: HTMLElement) {
    const b = el.getBoundingClientRect(), z = zoom();
    return { left: b.left / z, top: b.top / z, right: b.right / z, bottom: b.bottom / z, width: b.width / z, height: b.height / z };
  }

  function place() {
    const z = zoom(), el = anchor(), vw = window.innerWidth / z, vh = window.innerHeight / z, ch = cardH || 120, cw = Math.min(W, vw - EDGE * 2);
    // keep the last good target while it's still on the page (it can be mid-animation for a moment)
    if (!el && target?.isConnected && ready && tipTargets(coach.current).some(k => target!.dataset.coach === k)) return;
    target = el;
    if (!el) { ring = null; arrow = null; ready = !coach.current?.guide; pos = { x: (vw - cw) / 2, y: vh - ch - 24 }; return; }
    ready = true;
    const r = rectOf(el);
    ring = { x: r.left - 4, y: r.top - 4, w: r.width + 8, h: r.height + 8 };
    const clampX = (x: number) => Math.max(EDGE, Math.min(vw - cw - EDGE, x));
    const clampY = (y: number) => Math.max(EDGE, Math.min(vh - ch - EDGE, y));
    const cx = clampX(r.left + r.width / 2 - cw / 2), cy = clampY(r.top + r.height / 2 - ch / 2);
    const side = coach.current?.side;
    if (side === 'right' && r.right + GAP + cw <= vw - EDGE) pos = { x: r.right + GAP, y: clampY(r.bottom - ch) };
    else if (side === 'left' && r.left - GAP - cw >= EDGE) pos = { x: r.left - GAP - cw, y: clampY(r.bottom - ch) };
    // tall targets (a column of parts): beside them, so the card doesn't cover the rest of the panel
    else if (r.height > 160 && r.right + GAP + cw <= vw - EDGE) pos = { x: r.right + GAP, y: cy };
    else if (r.height > 160 && r.left - GAP - cw >= EDGE) pos = { x: r.left - GAP - cw, y: cy };
    else if (r.bottom + GAP + ch <= vh - EDGE) pos = { x: cx, y: r.bottom + GAP };
    else if (r.top - GAP - ch >= EDGE) pos = { x: cx, y: r.top - GAP - ch };
    else if (r.right + GAP + cw <= vw - EDGE) pos = { x: r.right + GAP, y: cy };
    else if (r.left - GAP - cw >= EDGE) pos = { x: r.left - GAP - cw, y: cy };
    else pos = { x: cx, y: clampY(r.bottom + GAP) };
    // point the tab at the target from whichever side of it the card ended up on (none if they overlap)
    const tx = r.left + r.width / 2, ty = r.top + r.height / 2, along = (v: number, lo: number, len: number) => Math.max(14, Math.min(len - 30, v - lo - 8));
    if (pos.y >= r.bottom + GAP - 1) arrow = { side: 'up', at: along(tx, pos.x, cw) };
    else if (pos.y + ch <= r.top - GAP + 1) arrow = { side: 'down', at: along(tx, pos.x, cw) };
    else if (pos.x >= r.right + GAP - 1) arrow = { side: 'left', at: along(ty, pos.y, ch) };
    else if (pos.x + cw <= r.left - GAP + 1) arrow = { side: 'right', at: along(ty, pos.y, ch) };
    else arrow = null;
  }

  // Follow the target while a tip is up (layouts shift as the hunt changes, the window resizes or scrolls).
  $effect(() => {
    if (!coach.current) return;
    let raf = 0;
    const loop = () => { place(); raf = requestAnimationFrame(loop); };
    // first placement on the next frame, not inside this effect: place() reads the position it writes
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });
</script>

{#if coach.current && (ready || !coach.current.guide)}
  {@const t = coach.current}
  {#if ring}<div class="coach-ring" class:guide={t.guide} style="left:{ring.x}px;top:{ring.y}px;width:{ring.w}px;height:{ring.h}px" aria-hidden="true"></div>{/if}
  <div class="coach" class:guide={t.guide} role="status" aria-live="polite" bind:this={cardEl} bind:clientHeight={cardH} style="left:{pos.x}px;top:{pos.y}px;width:min({W}px, calc(100vw - {EDGE * 2}px))">
    {#if arrow}<span class="coach-arrow {arrow.side}" style="{arrow.side === 'up' || arrow.side === 'down' ? 'left' : 'top'}:{arrow.at}px" aria-hidden="true"></span>{/if}
    <!-- Mell (8 Nov 2026): the S-rank hunter who teaches you speaks every prompt; the topic follows her name -->
    <span class="coach-head">Mell{#if t.head}<span class="coach-topic">{' · '}{t.head}</span>{/if}</span>
    <p><Rich quiet text={padWords(t.text())} /></p>
    <div class="coach-acts">
      {#if game.lesson}<button class="coach-skip" onclick={() => game.endLesson()}>End lesson</button>{:else}<button class="coach-skip" onclick={() => coach.skipAll(!!t.guide)}>{t.guide ? 'Skip tutorial' : 'Skip tips'}</button>{/if}
      {#if !t.guide}<button class="btn quiet" onclick={() => coach.dismiss()}>Got it</button>
      {:else if t.gotit}<button class="btn primary" onclick={() => coach.dismiss()}>Got it</button>
      {:else if t.info && !t.id.startsWith('i-')}<button class="btn primary" onclick={() => coach.dismiss()}>{t.next ?? 'Next'}</button>
      {/if}<!-- no "Do it to continue" line: a playtester clicked it, thinking it was the button (Nov 2026) -->
    </div>
  </div>
{/if}
