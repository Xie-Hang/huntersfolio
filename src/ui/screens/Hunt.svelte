<script lang="ts">
  // The monster and its next move at the top of the centre column, the parts to aim at under it, then your HP
  // and the dice. The weapon moves sit to the right of the dice they spend; the log is out of the way on the left.
  // (Playtest: players had to look left and right, and never read the monster's move.)
  import { game } from '../game.svelte';
  import MonsterPanel from './hunt/MonsterPanel.svelte';
  import PartsRow from './hunt/PartsRow.svelte';
  import PlayerPanel from './hunt/PlayerPanel.svelte';
  import DicePanel from './hunt/DicePanel.svelte';
  import GearPanel from './hunt/GearPanel.svelte';
  import BountyPanel from './hunt/BountyPanel.svelte';
  import Tagged from '../parts/Tagged.svelte';
  const h = $derived(game.hunt!);
</script>

<main class="grid hunt">
  <div class="side">
  <BountyPanel />
  <section class="panel huntlog" aria-label="Hunt log">
    <div class="ph"><h2>Hunt log</h2><span class="label">Newest first</span></div>
    <ul class="log">
      {#each h.log.slice(0, 24) as l}<li class={l.tone}><Tagged text={l.t} /></li>{/each}
    </ul>
  </section>
  </div>
  <div class="center">
    <MonsterPanel />
    {#if !h.over}<PartsRow /><div class="youbox"><PlayerPanel /><DicePanel /></div>{/if}
  </div>
  <GearPanel />
</main>
