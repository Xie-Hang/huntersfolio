<script lang="ts">
  // An element's mark: a distinct shape as well as a colour, so it reads without colour vision.
  // Shapes avoid the circle and triangle, which belong to the dice.
  // Stone = square block, Gale = two wind strokes, Ember = flame, Frost = six-point flake.
  import type { Element } from '../../engine';
  let { e }: { e: Element | null | undefined } = $props();
</script>

{#if e}
  <svg class="emark {e}" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
    {#if e === 'Stone'}<rect x="2" y="2" width="8" height="8" rx="1" />
    {:else if e === 'Gale'}<path class="ln" d="M1 4.5c2-1.6 3.6 1.6 5.5 0S9.5 2.9 11 4.5M1 8.5c2-1.6 3.6 1.6 5.5 0S9.5 6.9 11 8.5" />
    {:else if e === 'Ember'}<path d="M6 .8C7.2 3.4 10 4.8 10 7.8A4 4 0 0 1 2 7.8c0-1.6.9-2.6 1.7-3.2.1 1.2.7 1.9 1.4 2.1C4.8 4.6 5.2 2.6 6 .8z" />
    {:else}<path class="ln" d="M6 1v10M1.7 3.5l8.6 5M1.7 8.5l8.6-5" />{/if}
  </svg>
{/if}
