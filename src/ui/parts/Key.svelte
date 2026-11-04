<script lang="ts">
  // A shortcut hint: the keyboard key, or the controller button while a pad is in use (nothing if the pad has none).
  import { input } from '../pad.svelte';
  let { k, pad = '' }: { k: string; pad?: string } = $props();
</script>

{#if input.mode === 'pad'}{#if pad}<kbd class="key pad pad-{pad.toLowerCase()}">{pad}</kbd>{/if}{:else}<kbd class="key">{k}</kbd>{/if}
