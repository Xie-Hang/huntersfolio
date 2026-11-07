<script lang="ts">
  // The monster and its next move at the top of the centre column, the parts to aim at under it, then your HP
  // and the dice. The weapon moves sit to the right of the dice they spend.
  // (Playtest: players had to look left and right, and never read the monster's move.)
  // Nov 2026: both HP bars are one fighting-game bar across the top (VersusBar); the You panel is gone.
  // Nov 2026 playtest ("too wordy"): the hunt log column is gone. What happened last turn is one line under the
  // next move (Telegraph), the full log opens from there, and a bounty is a strip at the top of the centre column.
  import { game } from '../game.svelte';
  import MonsterPanel from './hunt/MonsterPanel.svelte';
  import PartsRow from './hunt/PartsRow.svelte';
  import VersusBar from './hunt/VersusBar.svelte';
  import DicePanel from './hunt/DicePanel.svelte';
  import GearPanel from './hunt/GearPanel.svelte';
  import BountyPanel from './hunt/BountyPanel.svelte';
  import { shows } from '../reveal';
  const h = $derived(game.hunt!);
  // layout drafts (Nov 2026 playtest: "the hunt screen feels a bit everywhere"): HP across the top, the monster on
  // the left, the player on the right. ?layout=a|b|c picks a draft; none = the current screen.
  const L = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('layout') : null;
</script>

<!-- when the hunt ends the action column goes (Nov 2026 text audit: 74 words of buttons that did nothing) -->
{#if !L}
<main class="grid hunt" class:done={!!h.over}>
  <VersusBar />
  <div class="center">
    <BountyPanel />
    <MonsterPanel />
    {#if !h.over}{#if shows(h, 'parts')}<PartsRow />{/if}<div class="youbox"><DicePanel /></div>{/if}
  </div>
  {#if !h.over}<GearPanel />{/if}
</main>
{:else}
<main class="grid hunt lay lay-{L}" class:done={!!h.over}>
  <VersusBar />
  <div class="mcol">
    <BountyPanel />
    <MonsterPanel />
    {#if !h.over && shows(h, 'parts')}<PartsRow />{/if}
  </div>
  {#if !h.over}
  <div class="pcol">
    {#if L === 'b'}<GearPanel /><div class="youbox"><DicePanel /></div>
    {:else}<div class="youbox"><DicePanel /></div><GearPanel />{/if}
  </div>
  {/if}
</main>
{/if}
