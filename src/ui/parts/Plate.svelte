<script lang="ts">
  // The monster plates: one woodcut drawing per monster (src/ui/parts/plates/), posed and animated from the hunt.
  // With no hunt (Hunt Board thumbnail, bestiary) they're drawn still. A new monster needs a plate here.
  import type { Hunt } from '../../engine';
  import Gorehorn from './plates/Gorehorn.svelte';
  import Galeshrike from './plates/Galeshrike.svelte';
  import Cinderback from './plates/Cinderback.svelte';
  import Rimetail from './plates/Rimetail.svelte';
  import Cragwing from './plates/Cragwing.svelte';
  import Fenmother from './plates/Fenmother.svelte';
  import Bogjaw from './plates/Bogjaw.svelte';
  import Duskheron from './plates/Duskheron.svelte';
  import Emberwhelk from './plates/Emberwhelk.svelte';
  import Mistglass from './plates/Mistglass.svelte';
  import Monolith from './plates/Monolith.svelte';
  import Stormroc from './plates/Stormroc.svelte';
  import Slagwyrm from './plates/Slagwyrm.svelte';
  import Gorhydra from './plates/Gorhydra.svelte';
  import Variant from './plates/Variant.svelte';
  import Sovereign from './plates/Sovereign.svelte';
  import Rotcap from './plates/Rotcap.svelte';
  import Arcmoth from './plates/Arcmoth.svelte';
  import Hollowfang from './plates/Hollowfang.svelte';
  import { ALL_MONSTERS } from '../../engine';
  import Scene from './Scene.svelte';
  /** scene: draw Ashfall Ridge behind it (the big plates; not the small Hunt Board thumbnails) */
  let { mon, hunt = null, scene = false }: { mon: string; hunt?: Hunt | null; scene?: boolean } = $props();
</script>

<div class="plate-stage">
{#if scene}<Scene region={(ALL_MONSTERS[mon]?.tier ?? 1) === 2.2 ? 'hollow' : (ALL_MONSTERS[mon]?.tier ?? 1) === 3.2 ? 'mire' : (ALL_MONSTERS[mon]?.tier ?? 1) === 4 ? 'caldera' : (ALL_MONSTERS[mon]?.tier ?? 1) === 3 ? 'spire' : [2, 2.4].includes(ALL_MONSTERS[mon]?.tier ?? 1) ? 'mire' : 'ridge'} />{/if}
{#if ALL_MONSTERS[mon]?.variantOf}<Variant {mon} {hunt} />
{:else if mon === 'gorehorn'}<Gorehorn {hunt} />
{:else if mon === 'galeshrike'}<Galeshrike {hunt} />
{:else if mon === 'cinderback'}<Cinderback {hunt} />
{:else if mon === 'rimetail'}<Rimetail {hunt} />
{:else if mon === 'cragwing'}<Cragwing {hunt} />
{:else if mon === 'fenmother'}<Fenmother {hunt} />
{:else if mon === 'bogjaw'}<Bogjaw {hunt} />
{:else if mon === 'duskheron'}<Duskheron {hunt} />
{:else if mon === 'emberwhelk'}<Emberwhelk {hunt} />
{:else if mon === 'mistglass'}<Mistglass {hunt} />
{:else if mon === 'monolith'}<Monolith {hunt} />
{:else if mon === 'stormroc'}<Stormroc {hunt} />
{:else if mon === 'slagwyrm'}<Slagwyrm {hunt} />
{:else if mon === 'gorhydra'}<Gorhydra {hunt} />
{:else if mon === 'sovereign'}<Sovereign {hunt} />
{:else if mon === 'rotcap'}<Rotcap {hunt} />
{:else if mon === 'arcmoth'}<Arcmoth {hunt} />
{:else if mon === 'hollowfang'}<Hollowfang {hunt} />
{/if}
</div>

<style>
  .plate-stage { position: relative; }
  .plate-stage :global(svg.wc) { position: relative; }
</style>
