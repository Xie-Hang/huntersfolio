<script lang="ts">
  /** Text with **game terms** marked: they render bold, so a player can tell a rule word (Pierce, Block, Snare) from plain English. */
  let { text }: { text: string } = $props();
  const parts = $derived(text.split(/\*\*(.+?)\*\*/));
</script>
{#each parts as p, i}{#if i % 2}<strong class="term">{p}</strong>{:else}{p}{/if}{/each}
<style>.term { font-weight: 700; }</style>
