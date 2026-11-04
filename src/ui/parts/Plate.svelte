<script lang="ts">
  // The monster plates: one woodcut drawing per monster (src/ui/parts/plates/), posed and animated from the hunt.
  // With no hunt (Hunt Board thumbnail, bestiary) they're drawn still. A new monster needs a plate here.
  import type { Hunt } from '../../engine';
  import Gorehorn from './plates/Gorehorn.svelte';
  import Galeshrike from './plates/Galeshrike.svelte';
  import Cinderback from './plates/Cinderback.svelte';
  import Rimetail from './plates/Rimetail.svelte';
  let { mon, hunt = null }: { mon: string; hunt?: Hunt | null } = $props();
</script>

{#if mon === 'gorehorn'}<Gorehorn {hunt} />
{:else if mon === 'galeshrike'}<Galeshrike {hunt} />
{:else if mon === 'cinderback'}<Cinderback {hunt} />
{:else if mon === 'rimetail'}<Rimetail {hunt} />
{/if}
