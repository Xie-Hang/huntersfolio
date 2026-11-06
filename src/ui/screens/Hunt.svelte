<script lang="ts">
  // The monster and its next move at the top of the centre column, the parts to aim at under it, then your HP
  // and the dice. The weapon moves sit to the right of the dice they spend.
  // (Playtest: players had to look left and right, and never read the monster's move.)
  // Nov 2026 playtest ("too wordy"): the hunt log column is gone. What happened last turn is one line under the
  // next move (Telegraph), the full log opens from there, and a bounty is a strip at the top of the centre column.
  import { game } from '../game.svelte';
  import MonsterPanel from './hunt/MonsterPanel.svelte';
  import PartsRow from './hunt/PartsRow.svelte';
  import PlayerPanel from './hunt/PlayerPanel.svelte';
  import DicePanel from './hunt/DicePanel.svelte';
  import GearPanel from './hunt/GearPanel.svelte';
  import BountyPanel from './hunt/BountyPanel.svelte';
  import { shows } from '../reveal';
  const h = $derived(game.hunt!);
</script>

<main class="grid hunt">
  <div class="center">
    <BountyPanel />
    <MonsterPanel />
    {#if !h.over}{#if shows(h, 'parts')}<PartsRow />{/if}<div class="youbox"><PlayerPanel /><DicePanel /></div>{/if}
  </div>
  <GearPanel />
</main>
