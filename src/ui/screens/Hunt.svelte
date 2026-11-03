<script lang="ts">
  // Monster on the left; you, the telegraph, the dice and the log in the centre; gear on the right.
  import { game } from '../game.svelte';
  import MonsterPanel from './hunt/MonsterPanel.svelte';
  import PlayerPanel from './hunt/PlayerPanel.svelte';
  import Telegraph from './hunt/Telegraph.svelte';
  import DicePanel from './hunt/DicePanel.svelte';
  import GearPanel from './hunt/GearPanel.svelte';
  import Tagged from '../parts/Tagged.svelte';
  const h = $derived(game.hunt!);
</script>

<main class="grid">
  <MonsterPanel />
  <div class="center">
    <PlayerPanel />
    <Telegraph />
    <DicePanel />
    <section class="panel" aria-label="Hunt log">
      <div class="ph"><h2>Hunt log</h2><span class="label">Newest first</span></div>
      <ul class="log">
        {#each h.log.slice(0, 16) as l}<li class={l.tone}><Tagged text={l.t} /></li>{/each}
      </ul>
    </section>
  </div>
  <GearPanel />
</main>
