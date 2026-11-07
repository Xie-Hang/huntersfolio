<script lang="ts">
  // Both HP bars are one fighting-game bar across the top (VersusBar). What happened last turn is one line under the
  // monster's next move (Telegraph); the full log opens from there; a bounty is a strip above the monster.
  import { game } from '../game.svelte';
  import MonsterPanel from './hunt/MonsterPanel.svelte';
  import PartsRow from './hunt/PartsRow.svelte';
  import VersusBar from './hunt/VersusBar.svelte';
  import DicePanel from './hunt/DicePanel.svelte';
  import GearPanel from './hunt/GearPanel.svelte';
  import BountyPanel from './hunt/BountyPanel.svelte';
  import { shows } from '../reveal';
  const h = $derived(game.hunt!);
</script>

<!-- HP across the top; the monster on the left (its picture, next move, parts); you on the right: dice and Reroll,
     your attacks in a row, then Block · Charge · Swap, then Capture and the item, then Undo and End turn (Nov 2026
     playtest: "the hunt screen feels a bit everywhere"). When the hunt ends the player's side goes. -->
<main class="grid hunt lay" class:done={!!h.over}>
  <VersusBar />
  <div class="mcol">
    <BountyPanel />
    <MonsterPanel />
    {#if !h.over && shows(h, 'parts')}<PartsRow />{/if}
  </div>
  {#if !h.over}
  <div class="pcol">
    <div class="youbox"><DicePanel part="dice" /></div>
    <GearPanel />
    <DicePanel part="end" />
  </div>
  {/if}
</main>
