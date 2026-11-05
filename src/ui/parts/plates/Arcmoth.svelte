<script lang="ts">
  // The Arcmoth, static moth, in the woodcut style (Nov 2026). Drawn facing left in a 1000 × 600 space.
  // A huge pale moth: a furred thorax and segmented abdomen on six thin legs, feathery antennae, and broad wings with
  // pale-yellow eyespots. Dust crackles off it. On the ground its wings lie spread; taking off they lift; in the air
  // it rises out of frame, wings beating, its shadow shrinking; diving it folds and drops; settled or brought down it
  // sprawls. A broken wing is torn ragged, broken antennae are stubs, a broken thorax is cracked.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, FAR, GOLD, EMBER, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();
  const SPARK = '#f0dd6e';

  const THORAX = 'M378 330 C376 296 408 278 452 280 C496 282 520 308 518 340 C516 372 488 392 450 392 C408 392 380 366 378 330 Z';
  const ABDOMEN = 'M500 334 C560 314 690 320 774 352 C804 364 804 388 774 396 C690 414 560 396 500 372 Z';
  const HEAD = 'M314 340 C314 314 334 298 356 298 C380 298 396 316 396 340 C396 364 380 380 356 380 C334 380 314 364 314 340 Z';
  const WING_FAR = 'M450 300 C470 190 560 96 712 72 C800 60 846 108 812 172 C774 236 650 292 476 322 Z';
  const WING_NEAR = 'M452 334 C520 246 666 196 830 206 C910 212 934 284 870 336 C800 392 626 404 470 366 Z';
  const WING_NEAR_TORN = 'M452 334 C520 246 640 206 740 210 L720 240 L770 262 L716 290 L760 318 L700 340 L740 370 C640 396 560 392 470 366 Z';
  const VEINS = 'M470 344 C580 300 700 270 840 250 M480 352 C600 340 720 330 860 318 M500 330 C580 280 640 250 720 226';
  const LEGS: [number, number, number, number][] = [[400, 380, 360, 530], [430, 388, 430, 530], [470, 386, 500, 530]];
  const DUST = Array.from({ length: 12 }, (_, i) => ({ x: 420 + ((i * 71) % 460), y: 140 + ((i * 47) % 200), d: (i % 6) * 0.38 }));
  const furHatch = hatchLines(370, 520, 280, 396, 10, -18);
  const uid = `am${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const air = $derived(!!m?.air);
  const pose = $derived(
    hunt?.over === 'win' ? 'down' :
    intent === 'dazed' ? 'dazed' : intent === 'crashed' || intent === 'settle' ? 'settle' :
    intent === 'dive' ? 'dive' : air ? 'air' : intent === 'takeoff' ? 'takeoff' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const wings = $derived(part('wings')), feelers = $derived(part('feelers')), thorax = $derived(part('thorax'));
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  const DIVE: Keyframe[] = [{ transform: 'translate(0,0)' }, { transform: 'translate(-60px,-40px) scale(1.05)', offset: 0.25 }, { transform: 'translate(-200px,150px) skewX(-12deg)', offset: 0.55 }, { transform: 'translate(0,0)' }];
  oneShots(() => rig, () => hunt, i => (i === 'dive' ? DIVE : LUNGE));
</script>

<svg class="wc am pose-{pose}" class:static={!hunt} class:aloft={air || pose === 'dive'} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Arcmoth, a huge pale moth with eyespots on its wings{air ? ', in flight' : ''}">
  <defs><clipPath id="{uid}t"><path d={THORAX} /></clipPath></defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <ellipse class="shadow" cx="560" cy="534" rx="220" ry="12" fill={INK} opacity=".7" />
  <g class="rig" bind:this={rig}>
    <g class="lift">
      <g class="breath">
        <g class="wing wing-far" style="transform-origin:470px 310px">
          <path d={WING_FAR} fill={FAR} stroke={INK} stroke-width="9" stroke-linejoin="round" />
          <ellipse cx="690" cy="140" rx="34" ry="24" fill={SPARK} stroke={INK} stroke-width="6" opacity=".8" />
        </g>
        <g class="legs">
          {#each LEGS as [x0, y0, x1, y1], i (i)}
            <path d="M{x0} {y0} Q{(x0 + x1) / 2 - 30} {(y0 + y1) / 2} {x1} {y1}" fill="none" stroke={INK} stroke-width="12" stroke-linecap="round" />
            <path d="M{x0} {y0} Q{(x0 + x1) / 2 - 30} {(y0 + y1) / 2} {x1} {y1}" fill="none" stroke={BONE2} stroke-width="5" stroke-linecap="round" />
          {/each}
        </g>
        <path d={ABDOMEN} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
        <path d="M560 326 q8 30 0 60 M620 326 q8 30 0 64 M680 332 q8 28 0 62 M736 342 q6 22 0 44" fill="none" stroke={INK} stroke-width="5" stroke-linecap="round" opacity=".6" />
        {#if thorax.on}<path d={THORAX} fill="none" stroke={GOLD} stroke-width="26" stroke-linejoin="round" opacity=".55" />{/if}
        <path d={THORAX} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
        <g clip-path="url(#{uid}t)"><path d={furHatch} stroke={INK} stroke-width="4" stroke-linecap="round" opacity=".7" /></g>
        {#if thorax.broke}<path d="M430 290 l14 26 l-12 14 l18 24 l-8 22" fill="none" stroke={EMBER} stroke-width="7" stroke-linecap="round" />{/if}
        <g class="head" style="transform-origin:370px 340px">
          <g class="feelers">
            {#if feelers.broke}
              <path d="M340 304 l-20 -34 M362 300 l-6 -40" stroke={INK} stroke-width="10" stroke-linecap="round" />
              <path d="M316 266 l8 8 l-10 4 M352 256 l10 6 l-10 6" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />
            {:else}
              {#if feelers.on}<path d="M340 304 C320 250 280 210 230 196 M362 300 C360 240 340 196 300 168" fill="none" stroke={GOLD} stroke-width="26" stroke-linecap="round" opacity=".55" />{/if}
              <path d="M340 304 C320 250 280 210 230 196 M362 300 C360 240 340 196 300 168" fill="none" stroke={INK} stroke-width="9" stroke-linecap="round" />
              <path d="M326 270 l-24 4 M310 246 l-26 -2 M290 226 l-24 -8 M260 210 l-20 -12 M360 270 l-24 -6 M354 240 l-26 -8 M342 212 l-24 -12 M322 188 l-20 -14" stroke={INK} stroke-width="5" stroke-linecap="round" />
            {/if}
          </g>
          <path d={HEAD} fill={BONE2} stroke={INK} stroke-width="9" stroke-linejoin="round" />
          <ellipse cx="340" cy="336" rx="18" ry="22" fill={enraged ? EMBER : INK} />
          <ellipse cx="334" cy="328" rx="5" ry="7" fill="#fff" opacity=".45" />
          <g class="stars" style="transform-origin:360px 240px"><path d={star(290, 260, 36)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(420, 230, 28)} fill={GOLD} stroke={INK} stroke-width="6" /></g>
        </g>
        <g class="wing wing-near" style="transform-origin:470px 340px">
          {#if wings.on}<path d={wings.broke ? WING_NEAR_TORN : WING_NEAR} fill="none" stroke={GOLD} stroke-width="28" stroke-linejoin="round" opacity=".55" />{/if}
          <path d={wings.broke ? WING_NEAR_TORN : WING_NEAR} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
          <path d={VEINS} fill="none" stroke={INK} stroke-width="5" stroke-linecap="round" opacity=".5" />
          {#if !wings.broke}
            <ellipse cx="760" cy="290" rx="44" ry="32" fill={SPARK} stroke={INK} stroke-width="7" />
            <ellipse cx="760" cy="290" rx="18" ry="14" fill={INK} />
          {:else}<path d="M720 244 l16 18 l-14 12 l18 16" fill="none" stroke={EMBER} stroke-width="7" stroke-linecap="round" />{/if}
        </g>
      </g>
      <g class="fx dust" aria-hidden="true">
        {#each DUST as p}<path d="M{p.x} {p.y} l6 -10 l-2 8 l8 -2 l-6 10 l2 -8 z" fill={SPARK} stroke={INK} stroke-width="2" style="animation-delay:{p.d}s" />{/each}
      </g>
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 560px 530px; }
  .lift { transition: transform .6s cubic-bezier(.3,.7,.3,1); }
  .breath { transform-origin: 560px 530px; animation: wc-breathe 2.8s ease-in-out infinite; }
  .wing { transition: transform .35s ease; transform: rotate(4deg); }
  .feelers { transform-box: view-box; transform-origin: 350px 300px; animation: am-twitch 3.2s ease-in-out infinite; }
  .legs { transform-box: view-box; transform-origin: 450px 386px; transition: transform .4s ease; }
  .shadow { transform-box: view-box; transform-origin: 560px 534px; transition: transform .6s ease, opacity .6s ease; }
  .dust path { animation: am-fall 2.6s linear infinite; transform-box: view-box; }
  .static .dust path { animation: none; opacity: .4; }
  @keyframes am-twitch { 0%, 80%, 100% { transform: rotate(0); } 88% { transform: rotate(-8deg); } }
  @keyframes am-fall { 0% { transform: translate(0, 0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(-30px, 240px); opacity: 0; } }

  /* about to take off: wings raised */
  .pose-takeoff .wing { transform: rotate(-30deg); }
  /* in the air: up out of the frame, wings beating, the shadow shrinking */
  .aloft .lift { transform: translateY(-240px) scale(.96); transform-origin: 560px 420px; }
  .aloft .legs { transform: scaleY(.5) rotate(20deg); }
  .aloft .shadow { transform: scale(.55); opacity: .4; }
  .pose-air .wing { animation: am-flap .6s ease-in-out infinite; }
  .pose-air .dust path { animation-duration: 1.6s; }
  @keyframes am-flap { 0%, 100% { transform: rotate(-46deg); } 50% { transform: rotate(14deg); } }
  /* diving: pitched down, wings folded */
  .pose-dive .lift { transform: translateY(-180px) rotate(-22deg) scale(.96); transform-origin: 560px 420px; }
  .pose-dive .wing { transform: rotate(16deg); }
  /* settled or brought down: sprawled flat */
  .pose-settle .breath { animation: none; transform: scaleY(.88); }
  .pose-settle .wing { transform: rotate(18deg); }
  .pose-settle .dust { opacity: .3; }
  /* dazed */
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  .pose-dazed .head { transform: rotate(-10deg); }
  /* beaten */
  .pose-down .breath { animation: none; transform: scaleY(.8); filter: saturate(.55) brightness(.8); }
  .pose-down .wing { transform: rotate(28deg); }
  .pose-down .dust { display: none; }
</style>
