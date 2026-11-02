<script lang="ts">
  // Engine text with [PIN] / [DAZE] / [FLOW] markers rendered as signature chips.
  import { segments } from '../fmt';
  let { text }: { text: string } = $props();
  const segs = $derived(segments(text));
</script>

{#each segs as s}{#if s.tag}<span class="tag {s.tag}" style="margin:0">{s.text}</span>{:else}{s.text}{/if}{/each}
