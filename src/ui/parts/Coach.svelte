<script lang="ts">
  // The tutorial tip on screen: a small card beside the thing it describes, with a ring around that thing.
  // Placement tries below, above, right, then left of the target, and stays inside the window.
  import { coach } from '../coach.svelte';

  const GAP = 12, W = 320, EDGE = 12;
  let cardH = $state(0);
  let ring = $state<{ x: number; y: number; w: number; h: number } | null>(null);
  let pos = $state({ x: 0, y: 0 });

  $effect(() => { coach.sync(); });

  function anchor(): HTMLElement | null {
    for (const key of coach.current?.at ?? []) {
      const el = document.querySelector<HTMLElement>(`[data-coach="${key}"]`);
      if (el && el.getClientRects().length) return el;
    }
    return null;
  }

  /** CSS zoom (the browser stand-in for Interface size) scales fixed positions too; work in unzoomed px. */
  const zoom = () => parseFloat(document.documentElement.style.zoom) || 1;
  function rectOf(el: HTMLElement) {
    const b = el.getBoundingClientRect(), z = zoom();
    return { left: b.left / z, top: b.top / z, right: b.right / z, bottom: b.bottom / z, width: b.width / z, height: b.height / z };
  }

  function place() {
    const z = zoom(), el = anchor(), vw = window.innerWidth / z, vh = window.innerHeight / z, ch = cardH || 120, cw = Math.min(W, vw - EDGE * 2);
    if (!el) { ring = null; pos = { x: (vw - cw) / 2, y: vh - ch - 24 }; return; }
    const r = rectOf(el);
    ring = { x: r.left - 4, y: r.top - 4, w: r.width + 8, h: r.height + 8 };
    const clampX = (x: number) => Math.max(EDGE, Math.min(vw - cw - EDGE, x));
    const clampY = (y: number) => Math.max(EDGE, Math.min(vh - ch - EDGE, y));
    const cx = clampX(r.left + r.width / 2 - cw / 2), cy = clampY(r.top + r.height / 2 - ch / 2);
    // tall targets (a column of parts): beside them, so the card doesn't cover the rest of the panel
    if (r.height > 160 && r.right + GAP + cw <= vw - EDGE) pos = { x: r.right + GAP, y: cy };
    else if (r.height > 160 && r.left - GAP - cw >= EDGE) pos = { x: r.left - GAP - cw, y: cy };
    else if (r.bottom + GAP + ch <= vh - EDGE) pos = { x: cx, y: r.bottom + GAP };
    else if (r.top - GAP - ch >= EDGE) pos = { x: cx, y: r.top - GAP - ch };
    else if (r.right + GAP + cw <= vw - EDGE) pos = { x: r.right + GAP, y: cy };
    else if (r.left - GAP - cw >= EDGE) pos = { x: r.left - GAP - cw, y: cy };
    else pos = { x: cx, y: clampY(r.bottom + GAP) };
  }

  // Follow the target while a tip is up (layouts shift as the hunt changes, the window resizes or scrolls).
  $effect(() => {
    if (!coach.current) return;
    let raf = 0;
    const loop = () => { place(); raf = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(raf);
  });
</script>

{#if coach.current}
  {@const t = coach.current}
  {#if ring}<div class="coach-ring" style="left:{ring.x}px;top:{ring.y}px;width:{ring.w}px;height:{ring.h}px" aria-hidden="true"></div>{/if}
  <div class="coach" role="status" aria-live="polite" bind:clientHeight={cardH} style="left:{pos.x}px;top:{pos.y}px;width:min({W}px, calc(100vw - {EDGE * 2}px))">
    <p>{t.text()}</p>
    <div class="coach-acts">
      <button class="coach-skip" onclick={() => coach.skipAll()}>Skip tips</button>
      <button class="btn quiet" onclick={() => coach.dismiss()}>Got it</button>
    </div>
  </div>
{/if}
