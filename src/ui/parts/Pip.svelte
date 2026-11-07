<script lang="ts">
  // A dice shape as a drawn mark (Mekkman: the text ● looked smaller than ▲). Both fill the same box, sized to the
  // text around them; hollow = a shape you still need. Colour comes from the surrounding text (currentColor).
  import FaceMark from './FaceMark.svelte';
  let { c, hollow = false }: { c: string; hollow?: boolean } = $props();
</script>

<span class="pip"><FaceMark {c} {hollow} /></span>

<style>
  .pip { width: 0.95em; height: 0.95em; display: inline-block; vertical-align: -0.08em; margin: 0 1px; }
  .pip :global(svg) { width: 100%; height: 100%; display: block; }
</style>
