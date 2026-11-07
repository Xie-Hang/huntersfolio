<script lang="ts">
  // A controller button hint while a pad is in use (nothing otherwise: hunts have no keyboard shortcuts, 8 Nov 2026).
  import { input } from '../pad.svelte';
  let { k, pad = '' }: { k: string; pad?: string } = $props();
</script>

{#if input.mode === 'pad' && pad}<kbd class="key pad pad-{pad.toLowerCase()}" data-k={k}>{pad}</kbd>{/if}
