<script lang="ts">
  // A dice shape as a drawn mark (Mekkman: the text ● looked smaller than ▲). Both fill the same box, sized to the
  // text around them; hollow = a shape you still need. Colour comes from the surrounding text (currentColor).
  let { c, hollow = false }: { c: string; hollow?: boolean } = $props();
</script>

<svg class="pip" viewBox="0 0 14 14" aria-hidden="true">
  {#if c === 'C'}<circle cx="7" cy="7.4" r={hollow ? 5 : 5.6} fill={hollow ? 'none' : 'currentColor'} stroke={hollow ? 'currentColor' : 'none'} stroke-width="1.6" />
  {:else}<path d="M7 0.9 L13.4 12.9 H0.6 Z" fill={hollow ? 'none' : 'currentColor'} stroke={hollow ? 'currentColor' : 'none'} stroke-width="1.6" stroke-linejoin="round" />{/if}
</svg>

<style>
  .pip { width: 0.95em; height: 0.95em; display: inline-block; vertical-align: -0.08em; margin: 0 1px; }
</style>
