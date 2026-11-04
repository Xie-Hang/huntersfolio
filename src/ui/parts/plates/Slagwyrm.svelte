<script lang="ts">
  // The Slagwyrm, Stormspire serpent of slag, in the woodcut style (from the concept drawing). Facing left in
  // 1000 × 600, flipped. A thick coiled body with molten armour plates along its spine.
  // Idle: the coils breathe. Bite: the head lunges. Magma Spit: head up, a glowing gob. Tail Lash: the tail swings.
  // Stoke: it glows brighter and the plates swell. Eruption: fire bursts from the plates. Armour shattered: the
  // plates crack and fall away. Meltdown (phase 2): no plates, the body running molten. Broken: jaw split, tail gone.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, GOLD, EMBER, star } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();
  const ASH = '#6e6257', MAGMA = '#f0a85a', GOLDHI = '#f3cf7a';

  const SPINE = [[860, 470], [760, 420], [660, 470], [560, 430], [460, 470], [380, 420], [320, 330], [290, 250]] as const;
  const BODY = 'M' + SPINE.map(([x, y]) => `${x} ${y}`).join(' L');
  const PLATES = SPINE.slice(1, -2);
  const plate = (x: number, y: number) => `M${x - 52} ${y - 36} L${x - 10} ${y - 92} L${x + 52} ${y - 40} L${x + 32} ${y - 8} L${x - 30} ${y - 8} Z`;
  const HEAD = 'M196 262 C190 214 240 182 300 180 C352 182 372 222 364 258 C356 292 322 308 280 306 C240 304 204 294 196 262 Z';
  const TAIL = 'M840 440 C900 460 940 490 968 524 C930 512 890 500 840 500 Z';

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const shattered = $derived((m?.shatter ?? 0) > 0);
  const melt = $derived(!!m?.melt);
  const pose = $derived(
    hunt?.over === 'win' ? 'down' : intent === 'dazed' ? 'dazed' : intent === 'bite' ? 'bite' : intent === 'spit' ? 'spit' :
    intent === 'lash' ? 'lash' : intent === 'stoke' ? 'stoke' : intent === 'eruption' ? 'erupt' : intent === 'quenched' ? 'quenched' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const spine = $derived(part('spine')), jaw = $derived(part('jaw')), tail = $derived(part('tail'));
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  oneShots(() => rig, () => hunt, () => LUNGE);
</script>

<svg class="wc sw pose-{pose}" class:shattered class:melt class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Slagwyrm, a serpent of slag{melt ? ', melting down' : shattered ? ', its armour shattered' : ''}">
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <g class="rig" bind:this={rig}>
    <g class="breath">
      <!-- tail -->
      <g class="tail" style="transform-origin:840px 470px">
        {#if tail.on && !tail.broke}<path d={TAIL} fill="none" stroke={GOLD} stroke-width="22" opacity=".5" />{/if}
        {#if tail.broke}<path d="M840 448 l20 10 l-6 14 l18 8 l-10 14 l-22 6 Z" fill={EMBER} stroke={INK} stroke-width="6" stroke-linejoin="round" />
        {:else}<path d={TAIL} fill={melt ? MAGMA : BONE2} stroke={INK} stroke-width="9" stroke-linejoin="round" />{/if}
      </g>
      <!-- body: the coils -->
      <path d={BODY} fill="none" stroke={INK} stroke-width="124" stroke-linecap="round" stroke-linejoin="round" />
      <path class="flesh" d={BODY} fill="none" stroke={melt ? '#d98a52' : BONE2} stroke-width="102" stroke-linecap="round" stroke-linejoin="round" />
      <path class="veins" d={BODY} fill="none" stroke={EMBER} stroke-width={melt ? 22 : 10} stroke-linecap="round" stroke-linejoin="round" stroke-dasharray={melt ? '30 18' : '4 38'} />
      <!-- molten armour plates along the spine -->
      <g class="plates">
        {#if spine.on}{#each PLATES as [x, y]}<path d={plate(x, y)} fill="none" stroke={GOLD} stroke-width="16" opacity=".5" />{/each}{/if}
        {#each PLATES as [x, y], i}
          {#if !(spine.broke && i % 2 === 0)}
            <path d={plate(x, y)} fill={ASH} stroke={INK} stroke-width="7" stroke-linejoin="round" />
            <path d="M{x - 12} {y - 40} l10 10 l12 -10" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />
          {/if}
        {/each}
      </g>
      <!-- shattered: fragments on the ground -->
      <g class="shards">{#each [[420, 520], [520, 524], [640, 518], [720, 522]] as [x, y]}<path d="M{x} {y} l14 -14 l16 10 l-8 10 Z" fill={ASH} stroke={INK} stroke-width="5" stroke-linejoin="round" />{/each}</g>
      <!-- Eruption: fire from the plates -->
      <g class="fire">{#each PLATES as [x, y]}<path d="M{x - 18} {y - 60} C{x - 24} {y - 110} {x} {y - 120} {x + 4} {y - 160} C{x + 20} {y - 120} {x + 28} {y - 96} {x + 18} {y - 60} Z" fill={MAGMA} stroke={INK} stroke-width="5" stroke-linejoin="round" />{/each}</g>
      <!-- head -->
      <g class="head" style="transform-origin:330px 300px"><g transform="translate(-50 -110) scale(1.36)">
        <path d={HEAD} fill={melt ? '#e8a06a' : BONE} stroke={INK} stroke-width="9" stroke-linejoin="round" />
        <g class="jaw" style="transform-origin:300px 282px">
          {#if jaw.on}<path d="M214 268 L128 280 C126 296 150 306 214 296 Z" fill="none" stroke={GOLD} stroke-width="20" opacity=".55" />{/if}
          <path d="M214 268 L128 280 C126 296 150 306 214 296 Z" fill={BONE2} stroke={INK} stroke-width="7" stroke-linejoin="round" />
          <path d="M140 280 l6 -9 l6 9 M158 279 l6 -10 l6 10 M176 277 l6 -10 l6 10 M194 275 l6 -10 l6 10" fill={BONE} stroke={INK} stroke-width="3.5" stroke-linejoin="round" />
          {#if jaw.broke}<path d="M170 266 l8 -6 l6 8 l8 -6" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />{/if}
        </g>
        <path d="M300 184 L326 112 L334 196 Z M270 182 L262 120 L296 186 Z" fill={ASH} stroke={INK} stroke-width="7" stroke-linejoin="round" />
        <circle cx="262" cy="236" r="11" fill={enraged ? GOLDHI : EMBER} /><circle cx="258" cy="232" r="3.5" fill={BONE} />
        <circle class="gob" cx="136" cy="270" r="18" fill={MAGMA} stroke={INK} stroke-width="5" />
        <path d="M204 252 L136 266 L208 270 Z" fill={BONE} stroke={INK} stroke-width="6" stroke-linejoin="round" />
        <path d="M150 266 l5 8 l5 -8 M168 265 l5 8 l5 -8 M186 264 l5 8 l5 -8" fill={BONE} stroke={INK} stroke-width="3" stroke-linejoin="round" />
        <path d="M240 222 L290 214" stroke={INK} stroke-width="9" stroke-linecap="round" />
        <g class="stars" style="transform-origin:280px 140px"><path d={star(230, 150, 30)} fill={GOLD} stroke={INK} stroke-width="5" /><path d={star(330, 132, 24)} fill={GOLD} stroke={INK} stroke-width="5" /></g>
      </g></g>
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 560px 530px; }
  .breath { transform-origin: 560px 530px; animation: wc-breathe 3.4s ease-in-out infinite; }
  .tail, .head, .jaw, .plates, .shards, .fire, .gob { transform-box: view-box; transition: transform .4s ease, opacity .3s ease; }
  .veins { animation: pulse 2.4s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { opacity: .6; } 50% { opacity: 1; } }
  .shards, .fire, .gob { opacity: 0; }
  /* armour shattered: plates gone, fragments on the ground; meltdown: no plates, molten body */
  .shattered .plates, .melt .plates { opacity: 0; transform: translateY(30px); }
  .shattered .shards { opacity: 1; }
  .melt .veins { animation-duration: 1s; }
  /* Bite: the head lunges */
  .pose-bite .head { transform: translateX(-26px) rotate(-6deg); }
  .pose-bite .jaw { transform: rotate(14deg); }
  /* Magma Spit: head up, a glowing gob */
  .pose-spit .head { transform: rotate(8deg); }
  .pose-spit .gob { opacity: 1; animation: pulse .8s ease-in-out infinite; }
  /* Tail Lash: the tail swings up */
  .pose-lash .tail { transform: rotate(-24deg); }
  /* Stoke: glowing, the plates swelling */
  .pose-stoke .plates { transform: scale(1.06); transform-origin: 560px 420px; }
  .pose-stoke .veins { stroke-width: 22; animation-duration: .7s; }
  .pose-stoke .breath { animation: wc-breathe 1s ease-in-out infinite; }
  /* Eruption: fire from the plates */
  .pose-erupt .fire { opacity: 1; animation: pulse .5s ease-in-out infinite; }
  .pose-erupt .veins { stroke-width: 24; }
  /* Quenched: dull, sagging */
  .pose-quenched .breath { animation: none; transform: scaleY(.94); filter: saturate(.6); }
  /* dazed and beaten */
  .pose-dazed .breath { animation: wc-reel 1.3s ease-in-out infinite; }
  .pose-down .breath { animation: none; transform: scaleY(.84); filter: saturate(.5) brightness(.8); }
  .pose-down .head { transform: rotate(-24deg) translateY(60px); }
  .pose-down .veins { animation: none; opacity: .2; }
</style>
