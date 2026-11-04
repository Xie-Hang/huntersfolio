<script lang="ts">
  // The Monolith Warden, Stormspire colossus, in the woodcut style (from the concept drawing). Facing left in
  // 1000 × 600, flipped. A hunched stone body on boulder arms, slabs of plate over its back, a core glowing through
  // a crack in its chest.
  // Idle: slow breathing. Knuckle Sweep: the arm swings back. Boulder Toss: the arm lifts a boulder overhead.
  // Rumble: both fists planted, the body shaking. Reform: the plates slide back. Core exposed: the plates have
  // fallen away and the core blazes. Crumbling (phase 2): rubble cracks across the back. Dazed: stars.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, GOLD, EMBER, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();
  const STONE = '#a99f90', STONE2 = '#8d8475', MOSS = '#7f9159', GOLDHI = '#f3cf7a';

  const BACK = 'M286 340 C270 190 350 100 460 100 C590 100 720 190 820 296 C872 352 852 452 742 460 L400 460 C320 452 292 410 286 340 Z';
  const SLABS = ['M300 220 C330 150 400 110 470 108 L470 230 L320 250 Z', 'M484 106 C580 110 660 160 720 214 L600 250 L490 236 Z',
    'M300 270 L470 250 L480 352 L300 352 Z', 'M496 254 L610 262 L740 226 C790 262 830 300 850 340 L500 352 Z'];
  const HEAD = 'M140 330 L154 280 L234 270 L258 328 L240 366 L156 370 Z';
  const ARM = [[282, 270, 62, 50], [256, 350, 54, 44], [238, 424, 50, 42]] as const;
  const backHatch = hatchLines(270, 880, 360, 466, 16, -30);
  const uid = `mw${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const exposed = $derived(!!m && ((m.core ?? 0) > 0 || intent === 'reform'));
  const pose = $derived(
    hunt?.over === 'win' ? 'down' : intent === 'dazed' ? 'dazed' : intent === 'rumble' || intent === 'quake' ? 'rumble' :
    intent === 'toss' ? 'toss' : intent === 'sweep' ? 'sweep' : intent === 'reform' ? 'reform' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const plates = $derived(part('plates')), arms = $derived(part('arms')), core = $derived(part('core'));
  const crumble = $derived(!!m?.crumble);

  let rig: SVGGElement;
  const SLAM: Keyframe[] = [{ transform: 'translateY(0)' }, { transform: 'translateY(-24px) scaleY(1.04)', offset: 0.35 }, { transform: 'translateY(8px) scaleY(.94)', offset: 0.6 }, { transform: 'translateY(0)' }];
  oneShots(() => rig, () => hunt, i => (i === 'quake' || i === 'rumble' ? SLAM : LUNGE));
</script>

<svg class="wc mw pose-{pose}" class:exposed class:crumble class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Monolith Warden, a stone colossus{exposed ? ', its core exposed' : ''}">
  <defs><clipPath id="{uid}b"><path d={BACK} /></clipPath></defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <g class="rig" bind:this={rig}>
    <g class="breath">
      <!-- back leg -->
      <path d="M730 420 L760 470" stroke={INK} stroke-width="94" stroke-linecap="round" /><path d="M730 420 L760 470" stroke={STONE2} stroke-width="80" stroke-linecap="round" />
      <path data-foot d="M700 530 Q760 470 822 530 Z" fill={STONE2} stroke={INK} stroke-width="9" stroke-linejoin="round" />
      <!-- body -->
      <path d={BACK} fill={STONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
      <g clip-path="url(#{uid}b)"><path d={backHatch} stroke={INK} stroke-width="5" stroke-linecap="round" /></g>
      <!-- the plates: slabs over the back; fall away when broken, slide back on Reform -->
      <g class="plates" style="transform-origin:560px 240px">
        {#if plates.on && !exposed}<path d={BACK} fill="none" stroke={GOLD} stroke-width="24" opacity=".5" />{/if}
        <g clip-path="url(#{uid}b)">{#each SLABS as d}<path {d} fill={BONE2} stroke={INK} stroke-width="8" stroke-linejoin="round" />{/each}</g>
        <path d="M360 140 C400 116 450 106 500 108 M560 116 C610 126 660 150 700 180" fill="none" stroke={MOSS} stroke-width="14" stroke-linecap="round" />
        {#if crumble}<path d="M420 140 l-14 40 l20 20 l-10 36 M640 170 l10 30 l-16 22 M560 270 l-20 28 l14 20" fill="none" stroke={INK} stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />{/if}
      </g>
      <path d={BACK} fill="none" stroke={INK} stroke-width="10" stroke-linejoin="round" />
      <!-- the core, through the crack in its chest -->
      <g class="core">
        {#if core.on && exposed}<circle cx="372" cy="400" r="70" fill="none" stroke={GOLD} stroke-width="16" opacity=".6" />{/if}
        <circle class="glow" cx="372" cy="400" r="54" fill={GOLD} opacity=".3" />
        <g class="rays">
          <circle cx="372" cy="400" r="96" fill={GOLDHI} opacity=".28" />
          <path d="M388 380 L470 300 L540 296 M396 430 L520 420 L600 380 M362 404 L330 330 L360 250 M370 452 L440 470" fill="none" stroke={INK} stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M388 380 L470 300 L540 296 M396 430 L520 420 L600 380 M362 404 L330 330 L360 250 M370 452 L440 470" fill="none" stroke={GOLDHI} stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
        </g>
        <path d="M350 352 L388 380 L362 404 L396 430 L370 452" fill="none" stroke={INK} stroke-width="20" stroke-linecap="round" stroke-linejoin="round" />
        <path class="crack" d="M350 352 L388 380 L362 404 L396 430 L370 452" fill="none" stroke={core.broke ? EMBER : GOLDHI} stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <!-- the arm: stacked boulders; a fist that sweeps or lifts a boulder -->
      <g class="arm" style="transform-origin:282px 250px">
        {#if arms.on}<ellipse cx="256" cy="350" rx="80" ry="130" fill="none" stroke={GOLD} stroke-width="20" opacity=".45" />{/if}
        {#each ARM as [cx, cy, rx, ry], i}
          {#if !(arms.broke && i === 2)}<ellipse {cx} {cy} {rx} {ry} fill={STONE} stroke={INK} stroke-width="9" />{/if}
        {/each}
        {#if arms.broke}<path d="M210 410 l16 -10 l10 14 l18 -12 l12 12" fill="none" stroke={EMBER} stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
        {:else}<ellipse cx="230" cy="486" rx="54" ry="34" fill={STONE} stroke={INK} stroke-width="9" />{/if}
        <ellipse class="boulder" cx="282" cy="196" rx="58" ry="48" fill={STONE2} stroke={INK} stroke-width="9" />
      </g>
      <g class="dust"><ellipse cx="150" cy="524" rx="40" ry="14" fill={BONE2} opacity=".5" /><ellipse cx="320" cy="522" rx="34" ry="12" fill={BONE2} opacity=".45" /><ellipse cx="840" cy="524" rx="38" ry="13" fill={BONE2} opacity=".45" /></g>
      <path data-foot d="M172 530 Q232 474 296 530 Z" fill={STONE} stroke={INK} stroke-width="9" stroke-linejoin="round" />
      <!-- head -->
      <g class="head" style="transform-origin:240px 330px">
        <path d={HEAD} fill={STONE} stroke={INK} stroke-width="9" stroke-linejoin="round" />
        <path d="M160 314 H206" stroke={crumble ? EMBER : GOLDHI} stroke-width="9" stroke-linecap="round" /><path d="M154 342 H230" stroke={INK} stroke-width="5" opacity=".6" />
        <g class="stars" style="transform-origin:200px 220px"><path d={star(150, 226, 32)} fill={GOLD} stroke={INK} stroke-width="5" /><path d={star(250, 210, 26)} fill={GOLD} stroke={INK} stroke-width="5" /></g>
      </g>
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 520px 530px; }
  .breath { transform-origin: 520px 530px; animation: wc-breathe 4.2s ease-in-out infinite; }
  .plates, .arm, .head, .core, .boulder, .rays, .dust { transform-box: view-box; transition: transform .45s ease, opacity .35s ease; }
  .glow { animation: glow 3s ease-in-out infinite; }
  @keyframes glow { 0%, 100% { opacity: .22; } 50% { opacity: .38; } }
  .boulder, .rays, .dust { opacity: 0; }
  .exposed .rays { opacity: 1; }
  .pose-rumble .dust { opacity: 1; animation: glow .5s ease-in-out infinite; }
  /* the core exposed: plates fallen away, the core blazing */
  .exposed .plates { transform: translate(40px, -30px) rotate(6deg); opacity: .18; }
  .exposed .glow { animation: blaze 1s ease-in-out infinite; }
  @keyframes blaze { 0%, 100% { opacity: .55; transform: scale(1); } 50% { opacity: .85; transform: scale(1.15); } }
  .exposed .glow { transform-box: fill-box; transform-origin: center; }
  /* Reform: the plates slide back, half-seated */
  .pose-reform .plates { transform: translate(14px, -10px) rotate(2deg); opacity: .7; }
  /* Knuckle Sweep: the arm draws back */
  .pose-sweep .arm { transform: rotate(-16deg); }
  /* Boulder Toss: the arm lifts a boulder overhead */
  .pose-toss .arm { transform: rotate(28deg) translateY(-30px); }
  .pose-toss .boulder { opacity: 1; }
  /* Rumble: both fists planted, the body shaking */
  .pose-rumble .breath { animation: quake .16s linear infinite; }
  @keyframes quake { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
  .pose-rumble .head { transform: translateY(14px); }
  /* dazed and beaten */
  .pose-dazed .breath { animation: wc-reel 1.4s ease-in-out infinite; }
  .pose-down .breath { animation: none; transform: scaleY(.84); filter: saturate(.55) brightness(.8); }
  .pose-down .head { transform: translateY(40px) rotate(-6deg); }
  .pose-down .glow { animation: none; opacity: .08; }
</style>
