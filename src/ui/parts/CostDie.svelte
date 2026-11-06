<script lang="ts">
  // A move's cost, drawn as a small die like the ones in your tray (Nov 2026 playtest: players didn't link the ● ▲
  // marks to their dice). It never changes state: the move around it greys out when your dice can't make it.
  // c: 'C' circle, 'T' triangle, 'any' = any die.
  let { c, small = false }: { c: string; small?: boolean } = $props();
</script>

<span class="cd" class:any={c === 'any'} class:small aria-hidden="true">
  {#if c === 'C'}<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="13" /></svg>
  {:else if c === 'T'}<svg viewBox="0 0 40 40"><path d="M20 6l15 27H5z" /></svg>
  {:else}Any{/if}
</span>

<style>
  .cd { flex: none; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; width: 30px; height: 30px; border-radius: 6px; background: var(--bone, #ecdfc8); box-shadow: 0 2px 0 #8c7a62; color: #2a1f17; }
  .cd svg { width: 17px; height: 17px; fill: #2a1f17; }
  .cd.small { width: 20px; height: 20px; border-radius: 4px; box-shadow: 0 1px 0 #8c7a62; }
  .cd.small svg { width: 12px; height: 12px; }
  .cd.any { width: auto; padding: 0 7px; font-family: var(--f-body); font-size: 13px; font-weight: 600; }
</style>
