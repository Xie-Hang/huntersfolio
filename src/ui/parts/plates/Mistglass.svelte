<script lang="ts">
  // The Mistglass, Mirewood trickster, in the woodcut style (from the concept drawing). Drawn facing left in
  // 1000 × 600 and flipped. A fox of faceted glass with a tail of shards.
  // Idle: breathing, the light moving over the facets. Glass Rake: a front paw raised. Freezing Mist: head low, a
  // cloud from the mouth. Split: it shivers and dashed mirror images step out of it; they stay while the mirage
  // lasts, drifting. Pounce: it crouches, and so do the images. Dazed: stars. Broken: shards snapped off the tail,
  // clouded cracked facets, dark eyes.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, GOLD, FROST, EMBER, star } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();
  const GLASS = '#cfe3ec', CLOUD = '#a9b8bf', SHADE = '#9fbfe0';

  const LEGS = [[420, 410, 404, 470, 392, 524], [470, 414, 482, 470, 470, 524], [690, 400, 716, 462, 700, 524], [740, 392, 776, 450, 772, 524]] as const;
  const TAIL = 'M760 330 L900 226 L930 262 L966 250 L944 316 L980 340 L900 372 L800 384 Z';
  const TAIL_BROKEN = 'M760 330 L840 286 L860 310 L880 300 L870 344 L800 384 Z';
  const BODY = 'M352 360 L440 290 L560 276 L690 290 L770 330 L760 396 L680 424 L540 432 L420 420 Z';
  const EARS = 'M352 360 L310 236 L350 286 L380 226 L396 316 Z';
  const SNOUT = 'M352 360 L250 352 L200 380 L290 402 L380 400 Z';
  const FACETS = 'M440 290 L500 360 L560 276 M500 360 L620 300 L690 290 M620 300 L640 420 M500 360 L420 420 M760 330 L640 420';
  const legPath = (l: readonly number[]) => `M${l[0]} ${l[1]} L${l[2]} ${l[3]} L${l[4]} ${l[5]}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const images = $derived((m?.mirage ?? 0) > 0 || intent === 'split' || intent === 'pounce');
  const pose = $derived(
    hunt?.over === 'win' ? 'down' : intent === 'dazed' ? 'dazed' : intent === 'pounce' || intent === 'shatter' ? 'pounce' : intent === 'split' ? 'split' :
    intent === 'mist' ? 'mist' : intent === 'rake' ? 'rake' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const tail = $derived(part('tail')), facets = $derived(part('facets')), eyes = $derived(part('eyes'));
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  oneShots(() => rig, () => hunt, () => LUNGE);
</script>

{#snippet ghost(dx: number, dy: number, sc: number, op: number, cls: string)}
  <g class="ghost {cls}" style="--dx:{dx}px; --dy:{dy}px; --s:{sc}; transform-origin:580px 530px" opacity={op}>
    <g class="crouch">
      {#each LEGS as l}<path d={legPath(l)} fill="none" stroke={FROST} stroke-width="6" stroke-linecap="round" stroke-dasharray="14 10" />{/each}
      {#each [tail.broke ? TAIL_BROKEN : TAIL, BODY, EARS, SNOUT] as d}<path {d} fill="none" stroke={FROST} stroke-width="5" stroke-dasharray="14 10" stroke-linejoin="round" />{/each}
    </g>
  </g>
{/snippet}

<svg class="wc mg pose-{pose}" class:images class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Mistglass, a fox of living glass{images ? ', surrounded by its mirror images' : ''}">
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <g class="rig" bind:this={rig}>
    <g class="breath">
      <g class="crouch">
        <!-- legs (the front-right one lifts on Glass Rake) -->
        {#each LEGS as l, i}
          <g class="leg l{i}" style="transform-origin:{l[0]}px {l[1]}px">
            <path d={legPath(l)} fill="none" stroke={INK} stroke-width="30" stroke-linecap="round" stroke-linejoin="round" />
            <path d={legPath(l)} fill="none" stroke={facets.broke ? CLOUD : GLASS} stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
            <path data-foot d="M{l[4] - 18} 530 h36" stroke={INK} stroke-width="8" stroke-linecap="round" />
          </g>
        {/each}
        <!-- tail of shards -->
        <g class="tail" style="transform-origin:770px 340px">
          {#if tail.on}<path d={tail.broke ? TAIL_BROKEN : TAIL} fill="none" stroke={GOLD} stroke-width="24" stroke-linejoin="round" opacity=".5" />{/if}
          <path d={tail.broke ? TAIL_BROKEN : TAIL} fill={GLASS} stroke={INK} stroke-width="9" stroke-linejoin="round" />
          {#if tail.broke}<path d="M840 286 l10 -18 M880 300 l14 -10 M870 344 l18 6" stroke={INK} stroke-width="6" stroke-linecap="round" />
          {:else}<path d="M900 226 L860 330 L944 316" fill="none" stroke="#fff" stroke-width="4" opacity=".8" />{/if}
        </g>
        <!-- body: the facets (the daze part) -->
        {#if facets.on}<path d={BODY} fill="none" stroke={GOLD} stroke-width="24" stroke-linejoin="round" opacity=".5" />{/if}
        <path d={BODY} fill={facets.broke ? CLOUD : GLASS} stroke={INK} stroke-width="9" stroke-linejoin="round" />
        <path class="shine" d={FACETS} fill="none" stroke="#fff" stroke-width="4" opacity=".8" />
        {#if facets.broke}<path d="M520 300 l-10 30 l16 18 l-12 34 M650 320 l14 26 l-10 24" fill="none" stroke={INK} stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />{/if}
        <!-- head -->
        <g class="head" style="transform-origin:380px 380px">
          <path d={EARS} fill={GLASS} stroke={INK} stroke-width="9" stroke-linejoin="round" />
          <path d={SNOUT} fill={GLASS} stroke={INK} stroke-width="9" stroke-linejoin="round" />
          <path d="M352 360 L380 400 L290 402 Z" fill={SHADE} stroke={INK} stroke-width="7" stroke-linejoin="round" />
          <path d="M352 360 L296 380" stroke="#fff" stroke-width="4" opacity=".8" />
          {#if eyes.on}<circle cx="300" cy="366" r="24" fill="none" stroke={GOLD} stroke-width="12" opacity=".6" />{/if}
          {#if eyes.broke}<path d="M288 360 l22 10 M290 372 l20 -10" stroke={INK} stroke-width="5" stroke-linecap="round" />
          {:else}<circle class="eyeglow" cx="300" cy="366" r="16" fill={enraged ? '#ffffff' : '#7fd4ff'} opacity=".45" /><circle cx="300" cy="366" r="9" fill={enraged ? EMBER : INK} />{/if}
          <!-- Freezing Mist -->
          <g class="mist">
            <ellipse cx="176" cy="392" rx="46" ry="22" fill={FROST} opacity=".55" />
            <ellipse cx="124" cy="372" rx="38" ry="20" fill={FROST} opacity=".4" />
            <ellipse cx="140" cy="414" rx="30" ry="14" fill={FROST} opacity=".35" />
          </g>
          <g class="stars" style="transform-origin:330px 200px"><path d={star(290, 200, 30)} fill={GOLD} stroke={INK} stroke-width="5" /><path d={star(380, 186, 24)} fill={GOLD} stroke={INK} stroke-width="5" /></g>
        </g>
      </g>
    </g>
  </g>
  {@render ghost(-140, -10, 0.94, 0.8, 'g1')}
  {@render ghost(120, -26, 0.88, 0.6, 'g2')}
</svg>

<style>
  .rig { transform-origin: 580px 530px; }
  .breath { transform-origin: 580px 530px; animation: wc-breathe 3s ease-in-out infinite; }
  .crouch { transform-origin: 580px 530px; transition: transform .35s ease; }
  .leg, .tail, .head, .mist, .ghost { transform-box: view-box; transition: transform .35s ease, opacity .35s ease; }
  .tail { animation: wag 3.4s ease-in-out infinite; }
  @keyframes wag { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-6deg); } }
  .shine { animation: shine 2.8s ease-in-out infinite; }
  @keyframes shine { 0%, 100% { opacity: .35; } 50% { opacity: .95; } }
  .eyeglow { animation: shine 2s ease-in-out infinite; }
  .mist, .stars { opacity: 0; }
  /* the mirror images: hidden until it splits, then they drift beside it */
  .ghost { opacity: 0 !important; transform: scale(var(--s)); }
  .images .ghost { opacity: 1 !important; transform: translate(var(--dx), var(--dy)) scale(var(--s)); animation: drift 3.6s ease-in-out infinite; }
  .images .ghost.g2 { animation-duration: 4.4s; }
  .ghost g, .ghost path { transition: none; }
  @keyframes drift { 0%, 100% { transform: translate(var(--dx), var(--dy)) scale(var(--s)); } 50% { transform: translate(calc(var(--dx) - 20px), calc(var(--dy) - 6px)) scale(var(--s)); } }
  /* Glass Rake: a front paw lifts */
  .pose-rake .leg.l0 { transform: rotate(72deg); }
  .pose-rake .head { transform: rotate(-4deg); }
  /* Freezing Mist: head low, the cloud rolls out */
  .pose-mist .head { transform: rotate(-6deg) translateY(8px); }
  .pose-mist .mist { opacity: 1; animation: roll 1.6s ease-in-out infinite; }
  @keyframes roll { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-16px); } }
  /* Split: it shivers as the images step out */
  .pose-split .breath { animation: shiver .18s linear infinite; }
  @keyframes shiver { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(3px); } }
  /* Pounce: everyone crouches */
  .pose-pounce .crouch { transform: scaleY(.84) scaleX(1.04); }
  .pose-pounce .head { transform: rotate(-6deg); }
  /* dazed and beaten */
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  .pose-dazed .stars { opacity: 1; animation: wc-orbit 1.4s linear infinite; }
  .pose-down .breath { animation: none; transform: scaleY(.84); filter: saturate(.5) brightness(.8); }
  .pose-down .head { transform: rotate(-16deg) translateY(30px); }
  .pose-down .tail, .pose-down .shine { animation: none; }
</style>
