<script lang="ts">
  // The two dice faces, drawn: a Fang and a Claw (Nov 2026 playtest: a tester read the old circle as "1", a pip).
  // Neither looks like a number, both read at 12 px, and both are the hunter's marks. The engine still calls them
  // 'C' (Fang) and 'T' (Claw). Colour comes from the surrounding text (currentColor); hollow = a face you still need.
  let { c, hollow = false }: { c: string; hollow?: boolean } = $props();
</script>

<svg class="face" viewBox="0 0 40 40" aria-hidden="true" opacity={hollow ? 0.45 : 1}>
  {#if c === 'C'}
    <!-- a fang: one curved tooth, point down -->
    <path d="M9 5 C18 2 31 4 33 9 C33 20 27 30 17 38 C18 27 15 17 9 11 C6 9 6 6 9 5 Z" fill="currentColor" />
  {:else}
    <!-- a claw: three raking slashes -->
    <path d="M8 33 L19 6 M17 35 L28 8 M26 36 L35 13" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" />
  {/if}
</svg>
