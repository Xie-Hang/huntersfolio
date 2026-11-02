<script lang="ts">
  // Cost rows: name, then have / need. How to get it is a hover hint, not a caption.
  import * as E from '../../engine';
  import { game } from '../game.svelte';
  let { cost }: { cost: E.Cost } = $props();
  const rows = $derived(
    Object.entries(cost).map(([k, v]) => {
      const have = k === 'coin' ? game.save.coin : (game.save.mats[k] ?? 0);
      return {
        k, v, have, ok: have >= v,
        name: k === 'coin' ? 'Coin' : E.matName(k),
        how: k === 'coin' ? 'Earned from hunts, or by selling materials' : E.MATERIALS[k].how
      };
    })
  );
</script>

<div class="costs">
  {#each rows as r (r.k)}
    <div class="cost {r.ok ? 'ok' : 'miss'}"><span title={r.how}>{r.name}</span><span class="have">{r.have} / {r.v}</span></div>
  {/each}
</div>
