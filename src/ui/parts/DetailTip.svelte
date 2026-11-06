<script lang="ts">
  // The one tooltip for every dotted-underlined word (detail.svelte.ts).
  import { tip } from '../detail.svelte';
</script>

<svelte:window onscroll={() => tip.hide()} onkeydown={e => e.key === 'Escape' && tip.hide()} onclick={() => tip.hide()} />
<div id="detail-tip" role="tooltip" class="dtip" class:on={!!tip.text} class:above={!tip.below} style="left:{tip.x}px;top:{tip.y}px">{tip.text}</div>

<style>
  .dtip { position: fixed; z-index: 90; width: max-content; max-width: 300px; padding: 9px 12px; border: 1px solid var(--gold); border-radius: 4px; background: var(--raise); color: var(--fg); font-size: var(--fs-sm); line-height: 1.45; box-shadow: 0 8px 24px rgba(0, 0, 0, .5); pointer-events: none; opacity: 0; visibility: hidden; transition: opacity .12s, visibility .12s; }
  .dtip.above { transform: translateY(-100%); }
  .dtip.on { opacity: 1; visibility: visible; }
  @media (prefers-reduced-motion: reduce) { .dtip { transition: none; } }
</style>
