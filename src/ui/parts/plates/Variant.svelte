<script lang="ts">
  // The changed Ashfall Ridge monsters (variants, Nov 2026) reuse their original's woodcut plate: same body and
  // poses, recoloured to the variant's element, with that element's weather drawn around it (wind streaks, hail,
  // dust and cracks, rising embers). The variant's actions are mapped onto the original's poses.
  import type { Hunt } from '../../../engine';
  import Gorehorn from './Gorehorn.svelte';
  import Galeshrike from './Galeshrike.svelte';
  import Cinderback from './Cinderback.svelte';
  import Rimetail from './Rimetail.svelte';

  let { mon, hunt = null }: { mon: string; hunt?: Hunt | null } = $props();

  type V = { base: string; label: string; tint: string; map: Record<string, string> };
  const VARIANTS: Record<string, V> = {
    squallhorn: { base: 'gorehorn', label: 'a storm-maned boar', tint: 'sepia(.25) hue-rotate(120deg) saturate(.85) brightness(.96)', map: { gather: 'windup', cyclone: 'charge', winded: 'exhausted', tailwind: '' } },
    rimeshrike: { base: 'galeshrike', label: 'an ice-feathered raptor', tint: 'sepia(.3) hue-rotate(170deg) saturate(1.3) brightness(1.03)', map: {} },
    quakeback: { base: 'cinderback', label: 'a rock-backed burrower', tint: 'grayscale(.85) brightness(.92) contrast(1.06)', map: { rockfall: 'swipe', tremor: '', rockburst: 'erupt', settle: 'venting' } },
    ashtail: { base: 'rimetail', label: 'a stalker with glowing cinder scales', tint: 'sepia(.5) hue-rotate(-15deg) saturate(1.7)', map: { kindle: 'rimecoat' } }
  };
  const v = $derived(VARIANTS[mon]);
  // the original plate reads hunt.intent; give it the matching pose name
  const shown = $derived(hunt ? { ...hunt, intent: v.map[hunt.intent] ?? hunt.intent } as Hunt : null);
  const m = $derived(hunt?.mon);
  const wind = $derived(mon === 'squallhorn' ? (hunt ? Math.min(3, m?.wind ?? 0) : 1) : 0);
  const shroud = $derived(mon === 'rimeshrike' && !!hunt && (m?.shroud ?? 0) > 0);
  const quake = $derived(mon === 'quakeback' && !!hunt && (hunt.intent === 'tremor' || hunt.intent === 'rockburst'));
  const flare = $derived(mon === 'ashtail' ? (hunt ? (m?.plating ?? 0) : 2) : 0);

  const STREAKS = ['M200 110 q120 -30 240 0 t240 -6', 'M160 200 q140 -26 280 4 t260 -10', 'M240 290 q110 -20 220 0 t230 -4', 'M120 150 q80 -14 160 0', 'M600 250 q90 -16 180 0'];
  const HAIL = Array.from({ length: 22 }, (_, i) => ({ x: 90 + ((i * 137) % 880), y: 50 + ((i * 61) % 180), d: (i % 5) * 0.31 }));
  const EMBERS = Array.from({ length: 16 }, (_, i) => ({ x: 260 + ((i * 97) % 560), y: 300 + ((i * 53) % 160), d: (i % 6) * 0.4 }));
  const DUST = Array.from({ length: 12 }, (_, i) => ({ x: 120 + ((i * 89) % 820), r: 4 + (i % 3) * 3, d: (i % 4) * 0.35 }));
</script>

<div class="variant" style="--tint:{v.tint}" role="img" aria-label="Engraving of the {mon[0].toUpperCase() + mon.slice(1)}, {v.label}">
  <div class="body" aria-hidden="true">
    {#if v.base === 'gorehorn'}<Gorehorn hunt={shown} />
    {:else if v.base === 'galeshrike'}<Galeshrike hunt={shown} />
    {:else if v.base === 'cinderback'}<Cinderback hunt={shown} />
    {:else}<Rimetail hunt={shown} />{/if}
  </div>
  <svg class="wc vfx" class:static={!hunt} viewBox="60 40 940 520" aria-hidden="true">
    {#if mon === 'squallhorn'}
      <g class="wind" style="opacity:{0.25 + wind * 0.22}" fill="none" stroke="#8fc3c9" stroke-width="5" stroke-linecap="round">
        {#each STREAKS.slice(0, 2 + wind) as d, i}<path {d} style="animation-delay:{i * 0.27}s" />{/each}
      </g>
    {:else if mon === 'rimeshrike'}
      <g class="hail" fill="#e6f0fb" stroke="#1a1410" stroke-width="1.5" style="opacity:{shroud ? 0.95 : 0.55}">
        {#each HAIL as p}<circle cx={p.x} cy={p.y} r={shroud ? 6 : 4} style="animation-delay:{p.d}s" />{/each}
      </g>
      {#if shroud}<path d="M200 470 q300 -40 600 0" fill="none" stroke="#b9d3f0" stroke-width="7" stroke-dasharray="14 10" opacity=".8" />{/if}
    {:else if mon === 'quakeback'}
      <g class="dust" class:shake={quake} fill="#a99f90" stroke="#1a1410" stroke-width="2">
        {#each DUST as p}<circle cx={p.x} cy="520" r={p.r} style="animation-delay:{p.d}s" />{/each}
      </g>
      <path d="M140 532 l40 -10 l30 12 l46 -14 M720 532 l36 -12 l28 10 l40 -12" fill="none" stroke="#1a1410" stroke-width="4" stroke-linejoin="round" opacity={quake ? 0.9 : 0.45} />
    {:else if mon === 'ashtail'}
      <g class="embers" fill="#f3b25a" stroke="#1a1410" stroke-width="1.5" style="opacity:{0.3 + flare * 0.3}">
        {#each EMBERS as p}<circle cx={p.x} cy={p.y} r="4" style="animation-delay:{p.d}s" />{/each}
      </g>
    {/if}
  </svg>
</div>

<style>
  .variant { position: relative; }
  .body { filter: var(--tint); }
  .variant > :global(svg.wc.vfx) { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden; }
  .wind path { animation: v-wind 2.4s ease-in-out infinite; }
  .hail circle { animation: v-fall 2.2s linear infinite; }
  .embers circle { animation: v-rise 2.6s ease-out infinite; }
  .dust.shake circle { animation: v-hop .5s ease-in-out infinite; }
  @keyframes v-wind { 0%, 100% { transform: translateX(0); opacity: .6; } 50% { transform: translateX(-40px); opacity: 1; } }
  @keyframes v-fall { from { transform: translate(0, 0); } to { transform: translate(-30px, 300px); opacity: 0; } }
  @keyframes v-rise { from { transform: translate(0, 0); opacity: 1; } to { transform: translate(10px, -240px); opacity: 0; } }
  @keyframes v-hop { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
</style>
