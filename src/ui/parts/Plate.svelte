<script lang="ts">
  // The monster plates: one woodcut drawing per monster (src/ui/parts/plates/), posed and animated from the hunt.
  // With no hunt (Hunt Board thumbnail, bestiary) they're drawn still. A new monster needs a plate here.
  import type { Hunt } from '../../engine';
  import Gorehorn from './plates/Gorehorn.svelte';
  import Galeshrike from './plates/Galeshrike.svelte';
  import Cinderback from './plates/Cinderback.svelte';
  import Rimetail from './plates/Rimetail.svelte';
  import Bogjaw from './plates/Bogjaw.svelte';
  import Duskheron from './plates/Duskheron.svelte';
  import Emberwhelk from './plates/Emberwhelk.svelte';
  import Mistglass from './plates/Mistglass.svelte';
  import Monolith from './plates/Monolith.svelte';
  import { ALL_MONSTERS } from '../../engine';
  import Scene from './Scene.svelte';
  /** scene: draw Ashfall Ridge behind it (the big plates; not the small Hunt Board thumbnails) */
  let { mon, hunt = null, scene = false }: { mon: string; hunt?: Hunt | null; scene?: boolean } = $props();
</script>

<div class="plate-stage">
{#if scene}<Scene region={(ALL_MONSTERS[mon]?.tier ?? 1) === 2 ? 'mire' : 'ridge'} />{/if}
{#if mon === 'gorehorn'}<Gorehorn {hunt} />
{:else if mon === 'galeshrike'}<Galeshrike {hunt} />
{:else if mon === 'cinderback'}<Cinderback {hunt} />
{:else if mon === 'rimetail'}<Rimetail {hunt} />
{:else if mon === 'bogjaw'}<Bogjaw {hunt} />
{:else if mon === 'duskheron'}<Duskheron {hunt} />
{:else if mon === 'emberwhelk'}<Emberwhelk {hunt} />
{:else if mon === 'mistglass'}<Mistglass {hunt} />
{:else if mon === 'monolith'}<Monolith {hunt} />
{/if}
</div>

<style>
  .plate-stage { position: relative; }
  .plate-stage :global(svg.wc) { position: relative; }
</style>
