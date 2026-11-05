<script lang="ts">
  // The Rotcap, spore beast, in the woodcut style (Nov 2026). Drawn facing left in a 1000 × 600 space.
  // A squat, toad-like body on gnarled root legs under a fungus cap the size of a cart, pale with sickly green spots.
  // Idle: breathing, spores drifting off the cap. Bloom: the cap swells and its gills glow; Burst: swollen to bursting,
  // shaking. Puff: a spore cloud rolls out. Wilting or popped: the cap sags. Dazed: stars. A broken cap is torn and
  // slumped; a broken jaw hangs; broken root legs are hacked short.
  // The Blightcrown reuses this plate, recoloured (Variant.svelte).
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, FAR, GOLD, EMBER, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();
  const SPORE = '#9fc062', SPORE_DK = '#6f8a3e';

  const BODY = 'M330 430 C326 370 396 336 520 334 C650 332 730 364 738 430 C744 478 704 506 620 508 L420 508 C362 506 334 476 330 430 Z';
  const CAP = 'M232 336 C238 214 388 120 548 116 C716 112 862 206 872 330 C818 356 706 366 552 366 C398 366 286 358 232 336 Z';
  const CAP_TORN = 'M250 350 C262 280 330 240 380 252 L410 214 L450 250 L500 196 L540 246 L600 206 L630 250 L700 222 L720 270 C800 280 852 320 858 350 C800 372 700 380 552 380 C400 380 300 372 250 350 Z';
  const GILLS = 'M280 340 L300 362 M330 346 L344 366 M380 350 L390 368 M430 352 L436 368 M480 354 L484 368 M530 354 L530 368 M580 354 L576 368 M630 352 L622 368 M680 350 L668 366 M730 346 L714 364 M780 340 L762 360';
  const SPOTS: [number, number, number][] = [[400, 200, 30], [520, 160, 22], [640, 196, 34], [740, 262, 24], [330, 280, 20], [570, 270, 26], [460, 290, 16]];
  const JAW = 'M332 436 C340 476 384 494 436 488 L444 456 C400 460 360 452 332 436 Z';
  const ROOTS: [number, number, number, number][] = [[400, 500, 372, 532], [470, 506, 462, 532], [600, 506, 618, 532], [680, 496, 716, 532]];
  const bodyHatch = hatchLines(350, 740, 380, 510, 14, -30);
  const uid = `rc${Math.random().toString(36).slice(2, 7)}`;
  const DRIFT = Array.from({ length: 9 }, (_, i) => ({ x: 300 + i * 62, y: 180 + (i % 3) * 40, d: i * 0.45 }));

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const pose = $derived(
    hunt?.over === 'win' ? 'down' :
    intent === 'dazed' ? 'dazed' : intent === 'popped' || intent === 'wilt' ? 'wilt' : intent === 'burst' ? 'burst' :
    intent === 'bloom' ? 'bloom' : intent === 'puff' ? 'puff' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const cap = $derived(part('cap')), jaw = $derived(part('jaw')), legs = $derived(part('legs'));
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  const SLAM: Keyframe[] = [{ transform: 'translateY(0)' }, { transform: 'translateY(-50px) scaleY(1.08)', offset: 0.3 }, { transform: 'translate(-80px, 10px) scaleY(.88)', offset: 0.55 }, { transform: 'translateY(0)' }];
  oneShots(() => rig, () => hunt, i => (i === 'slam' || i === 'burst' ? SLAM : LUNGE));
</script>

<svg class="wc rc pose-{pose}" class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Rotcap, a squat cave beast under a huge spotted fungus cap">
  <defs><clipPath id="{uid}b"><path d={BODY} /></clipPath><clipPath id="{uid}c"><path d={CAP} /></clipPath></defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <ellipse cx="540" cy="534" rx="230" ry="12" fill={INK} opacity=".7" />
  <g class="rig" bind:this={rig}>
    <g class="breath">
      <g class="roots">
        {#each ROOTS as [x0, y0, x1, y1], i (i)}
          {@const y = legs.broke ? y0 + 12 : y1}
          <path d="M{x0} {y0 - 30} Q{(x0 + x1) / 2 - 14} {y0} {x1} {y}" fill="none" stroke={legs.on ? GOLD : INK} stroke-width={legs.on ? 40 : 32} stroke-linecap="round" />
          <path d="M{x0} {y0 - 30} Q{(x0 + x1) / 2 - 14} {y0} {x1} {y}" fill="none" stroke={i % 2 ? FAR : BONE2} stroke-width="20" stroke-linecap="round" />
          {#if !legs.broke}<path d="M{x1} {y1 - 2} q-22 2 -30 8 M{x1} {y1 - 2} q20 0 28 8 M{x1} {y1 - 4} q-4 -10 -14 -16" fill="none" stroke={INK} stroke-width="6" stroke-linecap="round" />
          {:else}<path d="M{x1 - 12} {y - 6} l10 10 l8 -8 l10 8" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />{/if}
        {/each}
      </g>
      <path d={BODY} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
      <g clip-path="url(#{uid}b)"><path d={bodyHatch} stroke={INK} stroke-width="5" stroke-linecap="round" /></g>
      <path d="M520 420 q18 16 8 34 M600 412 q16 18 6 36 M440 428 q12 14 4 30" fill="none" stroke={INK} stroke-width="5" stroke-linecap="round" opacity=".55" />
      <!-- the face under the cap rim: beady eyes, a wide jaw -->
      <g class="face">
        <circle cx="366" cy="396" r="10" fill={enraged ? EMBER : INK} />
        <circle cx="408" cy="388" r="8" fill={enraged ? EMBER : INK} />
        <g class="jaw" class:hang={jaw.broke} style="transform-origin:440px 460px">
          {#if jaw.on}<path d={JAW} fill="none" stroke={GOLD} stroke-width="24" stroke-linejoin="round" opacity=".55" />{/if}
          <path d={JAW} fill={BONE2} stroke={INK} stroke-width="8" stroke-linejoin="round" />
          <path d="M346 450 l8 -12 l6 14 M370 460 l8 -12 l6 14 M396 466 l8 -12 l6 14" fill="none" stroke={INK} stroke-width="5" stroke-linejoin="round" />
          {#if jaw.broke}<path d="M420 470 l12 6 l-6 10 l14 4" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />{/if}
        </g>
        <g class="stars" style="transform-origin:380px 300px"><path d={star(300, 300, 36)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(440, 296, 28)} fill={GOLD} stroke={INK} stroke-width="6" /></g>
      </g>
      <!-- the cap: swells on a Bloom, sags when it wilts or pops -->
      <g class="cap" style="transform-origin:552px 360px">
        {#if cap.broke}
          {#if cap.on}<path d={CAP_TORN} fill="none" stroke={GOLD} stroke-width="26" stroke-linejoin="round" opacity=".55" />{/if}
          <path d={CAP_TORN} fill={BONE2} stroke={INK} stroke-width="10" stroke-linejoin="round" />
          <path d="M420 300 l16 18 l-12 10 l18 12 M640 290 l-14 16 l12 12" fill="none" stroke={EMBER} stroke-width="6" stroke-linecap="round" />
        {:else}
          {#if cap.on}<path d={CAP} fill="none" stroke={GOLD} stroke-width="28" stroke-linejoin="round" opacity=".55" />{/if}
          <path class="gills" d={GILLS} stroke={SPORE_DK} stroke-width="7" stroke-linecap="round" />
          <path d={CAP} fill={BONE} stroke={INK} stroke-width="11" stroke-linejoin="round" />
          <g clip-path="url(#{uid}c)">
            {#each SPOTS as [x, y, r]}<ellipse cx={x} cy={y} rx={r} ry={r * 0.72} fill={SPORE} stroke={INK} stroke-width="5" />{/each}
            <path d="M300 300 C420 330 680 330 820 296" fill="none" stroke={INK} stroke-width="5" opacity=".45" />
            <path class="split" d="M560 120 l-14 60 l18 40 l-16 50" fill="none" stroke={INK} stroke-width="8" stroke-linecap="round" />
          </g>
          <path class="glowrim" d="M244 338 C320 360 780 364 864 332" fill="none" stroke={SPORE} stroke-width="10" stroke-linecap="round" />
        {/if}
      </g>
    </g>
    <g class="fx drift" aria-hidden="true">
      {#each DRIFT as p}<circle cx={p.x} cy={p.y} r="6" fill={SPORE} stroke={INK} stroke-width="2" style="animation-delay:{p.d}s" />{/each}
    </g>
    <g class="fx cloud" aria-hidden="true"><path d="M300 420 C230 400 190 440 210 470 C170 480 180 530 230 520 C250 550 320 540 330 510 C380 520 400 470 360 450 C380 420 340 400 300 420 Z" fill={SPORE} opacity=".55" stroke={INK} stroke-width="5" /></g>
  </g>
</svg>

<style>
  .rig { transform-origin: 540px 530px; }
  .breath { transform-origin: 540px 530px; animation: wc-breathe 3s ease-in-out infinite; }
  .cap, .jaw { transform-box: view-box; }
  .cap { transition: transform .45s cubic-bezier(.3,.7,.3,1); }
  .jaw { transition: transform .3s ease; }
  .jaw.hang { transform: rotate(14deg) translateY(10px); }
  .drift circle { animation: rc-drift 4.5s linear infinite; transform-box: view-box; }
  @keyframes rc-drift { 0% { transform: translate(0, 0); opacity: 0; } 20% { opacity: .9; } 100% { transform: translate(-40px, -130px); opacity: 0; } }
  .gills { opacity: .8; }
  .glowrim { opacity: 0; }
  .split { opacity: 0; }
  .cloud { opacity: 0; }
  .static .drift circle { animation: none; opacity: .5; }

  /* blooming: the cap swells, its rim glows */
  .pose-bloom .cap { transform: scale(1.08) translateY(-10px); animation: rc-throb 1.4s ease-in-out infinite; }
  .pose-bloom .glowrim { opacity: .9; animation: rc-glow 1.4s ease-in-out infinite; }
  .pose-bloom .drift circle { animation-duration: 2.4s; }
  /* fit to burst: biggest, split, shaking */
  .pose-burst .cap { transform: scale(1.15) translateY(-18px); animation: rc-shake .25s linear infinite; }
  .pose-burst .glowrim { opacity: 1; }
  .pose-burst .split { opacity: .9; }
  @keyframes rc-throb { 0%, 100% { transform: scale(1.06) translateY(-8px); } 50% { transform: scale(1.11) translateY(-14px); } }
  @keyframes rc-glow { 50% { opacity: .5; } }
  @keyframes rc-shake { 0%, 100% { transform: scale(1.15) translate(0, -18px); } 25% { transform: scale(1.15) translate(-4px, -16px); } 75% { transform: scale(1.15) translate(4px, -20px); } }
  /* a puff of spores rolls out at you */
  .pose-puff .cloud { animation: rc-puff 1.8s ease-out infinite; transform-origin: 280px 470px; transform-box: view-box; }
  @keyframes rc-puff { 0% { opacity: 0; transform: scale(.5) translateX(40px); } 30% { opacity: .9; } 100% { opacity: 0; transform: scale(1.4) translateX(-90px); } }
  /* wilting or popped: the cap sags */
  .pose-wilt .cap { transform: scaleY(.84) translateY(30px) rotate(-3deg); }
  .pose-wilt .drift circle { animation: none; opacity: 0; }
  /* dazed: reeling, stars */
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  .pose-dazed .cap { transform: rotate(-6deg); }
  /* beaten */
  .pose-down .breath { animation: none; transform: scaleY(.84); filter: saturate(.55) brightness(.8); }
  .pose-down .cap { transform: scaleY(.8) translateY(50px) rotate(-8deg); }
  .pose-down .drift { display: none; }
</style>
