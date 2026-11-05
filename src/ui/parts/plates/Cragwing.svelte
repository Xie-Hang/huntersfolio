<script lang="ts">
  // The Cragwing, scree drake (the rank F → E promotion hunt, Nov 2026), in the woodcut style. Drawn facing left in a
  // 1000 × 600 space and mirrored by CSS. A long-necked drake on two legs, wings of split slate, a digging horn on
  // its snout, slate plates on its back (as many as its plating layers). Winding up: head down, horn glinting.
  // Taking off: wings raised. In the air: it rises out of the frame, wings beating, its shadow shrinking. Diving:
  // pitched down. Burrowing: head into the scree; under it: sunk below the ground line, a scree mound marks it, and
  // before the Rockburst the mound swells and cracks. Perched, brought down: settled low. Broken parts: torn wing,
  // horn stub, bare back.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, FAR, GOLD, EMBER, GALE, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();
  const SLATE = '#8d8a84', SLATE_HI = '#b5b1a8';

  const BODY = 'M420 330 C430 270 520 250 620 258 C720 266 780 300 790 340 C800 380 760 410 680 416 C580 422 470 414 440 390 C424 376 418 352 420 330 Z';
  const NECK = 'M452 300 C414 276 386 248 366 226 L334 262 C362 292 402 330 444 352 Z';
  const HEAD = 'M250 246 C252 222 282 206 318 208 C352 210 372 230 370 256 C368 280 344 294 312 292 L262 286 C248 280 246 262 250 246 Z';
  const HORN = 'M262 248 L192 226 L258 272 Z';
  const HORN_BROKE = 'M262 250 L238 246 L260 266 Z';
  const TAIL = 'M770 326 C840 316 900 296 958 262 L968 284 C914 328 852 360 782 374 Z';
  const TAILTIP = 'M952 252 L990 248 L968 290 Z';
  const WING = 'M560 286 L630 174 L692 150 L760 158 L830 196 L790 218 L842 248 L770 262 L812 292 L700 304 Z';
  const WING_TORN = 'M560 286 L630 176 L690 160 L726 182 L700 214 L744 238 L716 262 L748 292 L690 304 Z';
  const WING_RIBS = 'M600 286 L660 178 M640 292 L720 166 M690 300 L790 204 M730 300 L800 262';
  const FAR_WING = 'M540 280 L590 196 L640 176 L700 186 L660 230 L700 256 L620 290 Z';
  // the slate plates on its back: one per layer of plating
  const SLATES = ['M500 262 L540 230 L580 250 L560 274 Z', 'M570 254 L620 222 L664 246 L640 270 Z'];
  type Leg = { id: string; hip: [number, number]; foot: [number, number]; far: boolean };
  const LEGS: Leg[] = [{ id: 'hf', hip: [690, 398], foot: [716, 518], far: true }, { id: 'hn', hip: [640, 404], foot: [620, 518], far: false }, { id: 'ff', hip: [500, 396], foot: [478, 518], far: false }];
  const bodyHatch = hatchLines(420, 800, 330, 420, 13, -30);
  const SCREE = Array.from({ length: 9 }, (_, i) => ({ x: 470 + i * 26 + ((i * 37) % 13), y: 520 - ((i * 53) % 22), s: 10 + ((i * 29) % 9) }));
  const uid = `cw${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const air = $derived(!!m?.air);
  const under = $derived(!!m?.under);
  const plating = $derived(hunt ? (m?.plating ?? 0) : 2);
  const pose = $derived(
    hunt?.over === 'win' ? 'down' :
    intent === 'dazed' ? 'dazed' : intent === 'crashed' || intent === 'perched' || intent === 'unearthed' ? 'settle' :
    under ? (intent === 'rockburst' ? 'burst' : 'under') : intent === 'burrow' ? 'dig' :
    intent === 'dive' ? 'dive' : air ? 'air' : intent === 'takeoff' ? 'takeoff' : intent === 'windup' ? 'windup' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const wings = $derived(part('wings')), horn = $derived(part('horn')), back = $derived(part('back'));
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  const DIVE: Keyframe[] = [{ transform: 'translate(0,0)' }, { transform: 'translate(-60px,-40px) scale(1.05)', offset: 0.25 }, { transform: 'translate(-200px,150px) skewX(-12deg)', offset: 0.55 }, { transform: 'translate(0,0)' }];
  oneShots(() => rig, () => hunt, i => (i === 'dive' ? DIVE : LUNGE));
</script>

<svg class="wc cw pose-{pose}" class:static={!hunt} class:aloft={air || pose === 'dive'} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Cragwing, a drake with wings of split slate{air ? ', in flight' : under ? ', under the scree' : ''}">
  <defs><clipPath id="{uid}b"><path d={BODY} /></clipPath><clipPath id="{uid}g"><rect x="0" y="0" width="1000" height="532" /></clipPath></defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <ellipse class="shadow" cx="600" cy="534" rx="190" ry="12" fill={INK} opacity=".7" />
  <!-- the scree mound it leaves when it burrows; it swells and cracks before the Rockburst -->
  <g class="mound" aria-hidden="true">
    <path d="M400 532 C450 470 540 452 600 452 C680 452 760 474 810 532 Z" fill={SLATE} stroke={INK} stroke-width="9" stroke-linejoin="round" />
    {#each SCREE as r}<path d="M{r.x} {r.y - 40} l{r.s} -{r.s / 2} l{r.s / 2} {r.s} z" fill={SLATE_HI} stroke={INK} stroke-width="4" />{/each}
    <path class="crack" d="M560 470 l20 22 l-14 14 l24 18 M640 476 l-10 24 l18 12" fill="none" stroke={EMBER} stroke-width="6" stroke-linecap="round" />
  </g>
  <g clip-path="url(#{uid}g)">
  <g class="rig" bind:this={rig}>
    <g class="lift">
      <g class="sink">
      <g class="breath">
        <g class="wing wing-far" style="transform-origin:560px 284px"><path d={FAR_WING} fill={FAR} stroke={INK} stroke-width="8" stroke-linejoin="round" /></g>
        <path d={TAIL} fill={BONE2} stroke={INK} stroke-width="9" stroke-linejoin="round" />
        <path d={TAILTIP} fill={SLATE} stroke={INK} stroke-width="7" stroke-linejoin="round" />
        <g class="legs">
          {#each LEGS as L (L.id)}
            <path d="M{L.hip[0]} {L.hip[1]} Q{(L.hip[0] + L.foot[0]) / 2 + 26} {(L.hip[1] + L.foot[1]) / 2} {L.foot[0]} {L.foot[1] - 6}" fill="none" stroke={INK} stroke-width="30" stroke-linecap="round" />
            <path d="M{L.hip[0]} {L.hip[1]} Q{(L.hip[0] + L.foot[0]) / 2 + 26} {(L.hip[1] + L.foot[1]) / 2} {L.foot[0]} {L.foot[1] - 6}" fill="none" stroke={L.far ? FAR : BONE} stroke-width="18" stroke-linecap="round" />
            <path data-foot d="M{L.foot[0]} {L.foot[1] - 6} q-34 2 -40 14 M{L.foot[0]} {L.foot[1] - 6} q-10 10 -6 16 M{L.foot[0]} {L.foot[1] - 6} q22 4 26 14" fill="none" stroke={INK} stroke-width="8" stroke-linecap="round" />
          {/each}
        </g>
        <path d={BODY} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
        <g clip-path="url(#{uid}b)"><path d={bodyHatch} stroke={INK} stroke-width="4" stroke-linecap="round" opacity=".55" /></g>
        {#if back.on}<path d="M480 268 C560 232 660 236 720 262" fill="none" stroke={GOLD} stroke-width="26" stroke-linecap="round" opacity=".55" />{/if}
        {#if !back.broke}
          {#each SLATES.slice(0, plating) as d}<path {d} fill={SLATE} stroke={INK} stroke-width="7" stroke-linejoin="round" /><path d={d} fill="none" stroke={SLATE_HI} stroke-width="2" opacity=".6" />{/each}
        {:else}<path d="M520 262 l14 -12 l12 10 l16 -14 l14 12" fill="none" stroke={EMBER} stroke-width="6" stroke-linecap="round" />{/if}
        <g class="head" style="transform-origin:420px 300px">
          <path d={NECK} fill={BONE2} stroke={INK} stroke-width="9" stroke-linejoin="round" />
          <path d="M374 246 q14 30 42 56 M392 236 q14 26 40 50" fill="none" stroke={INK} stroke-width="4" opacity=".55" />
          {#if horn.on}<path d={horn.broke ? HORN_BROKE : HORN} fill="none" stroke={GOLD} stroke-width="22" stroke-linejoin="round" opacity=".6" />{/if}
          <path class="horn" d={horn.broke ? HORN_BROKE : HORN} fill={GOLD} stroke={INK} stroke-width="8" stroke-linejoin="round" />
          {#if horn.broke}<path d="M240 250 l-8 10 l10 4" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />{/if}
          <path d={HEAD} fill={BONE} stroke={INK} stroke-width="9" stroke-linejoin="round" />
          <path d="M318 210 L338 176 L350 212 Z M340 214 L372 190 L366 226 Z" fill={SLATE} stroke={INK} stroke-width="6" stroke-linejoin="round" />
          <ellipse cx="306" cy="244" rx="10" ry="9" fill={enraged ? EMBER : INK} /><circle cx="303" cy="241" r="3" fill="#fff" opacity=".5" />
          <path d="M262 278 L300 282" stroke={INK} stroke-width="5" stroke-linecap="round" />
          <g class="stars" style="transform-origin:320px 170px"><path d={star(270, 176, 30)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(370, 150, 24)} fill={GOLD} stroke={INK} stroke-width="6" /></g>
        </g>
        <g class="wing wing-near" style="transform-origin:560px 290px">
          {#if wings.on}<path d={wings.broke ? WING_TORN : WING} fill="none" stroke={GOLD} stroke-width="26" stroke-linejoin="round" opacity=".55" />{/if}
          <path d={wings.broke ? WING_TORN : WING} fill={SLATE_HI} stroke={INK} stroke-width="10" stroke-linejoin="round" />
          <path d={WING_RIBS} fill="none" stroke={INK} stroke-width="5" stroke-linecap="round" opacity=".7" />
          {#if wings.broke}<path d="M720 186 l-14 18 l16 12 l-12 16" fill="none" stroke={EMBER} stroke-width="6" stroke-linecap="round" />{/if}
        </g>
      </g>
      </g>
      <g class="fx gusts" aria-hidden="true"><path d="M180 150 q60 -20 120 0 M150 200 q70 -16 140 4 M200 250 q50 -12 100 0" fill="none" stroke={GALE} stroke-width="6" stroke-linecap="round" /></g>
    </g>
  </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 600px 530px; }
  .lift { transition: transform .6s cubic-bezier(.3,.7,.3,1); }
  .sink { transition: transform .5s ease; }
  .breath { transform-origin: 600px 530px; animation: wc-breathe 3s ease-in-out infinite; }
  .wing { transition: transform .35s ease; transform-box: view-box; }
  .head { transform-box: view-box; transition: transform .35s ease; }
  .gusts { opacity: 0; transition: opacity .3s; }
  .mound { opacity: 0; transition: opacity .4s ease; transform-box: view-box; transform-origin: 600px 532px; }
  .crack { opacity: 0; }
  .shadow { transform-box: view-box; transform-origin: 600px 534px; transition: transform .6s ease, opacity .6s ease; }

  /* winding up: head down, the horn glinting */
  .pose-windup .head { transform: translate(-14px, 36px) rotate(-8deg); }
  .pose-windup .breath { animation: none; transform: scaleY(.94); }
  .pose-windup .horn { animation: wc-glow .6s ease-in-out infinite; }
  /* about to take off: wings raised */
  .pose-takeoff .wing { transform: rotate(-28deg); }
  /* in the air: up out of the frame, wings beating, the shadow shrinking */
  .aloft .lift { transform: translateY(-250px) scale(.96); transform-origin: 600px 420px; }
  .aloft .legs { transform: scaleY(.6); transform-box: view-box; transform-origin: 600px 400px; }
  .aloft .shadow { transform: scale(.55); opacity: .4; }
  .pose-air .wing { animation: cw-flap .6s ease-in-out infinite; }
  .pose-air .gusts { opacity: .8; animation: wc-puff 1s ease-out infinite; }
  @keyframes cw-flap { 0%, 100% { transform: rotate(-40deg); } 50% { transform: rotate(10deg); } }
  /* diving: pitched down, wings folded */
  .pose-dive .lift { transform: translateY(-180px) rotate(-20deg) scale(.96); transform-origin: 600px 420px; }
  .pose-dive .wing { transform: rotate(14deg); }
  /* burrowing: head into the scree */
  .pose-dig .head { transform: translate(-10px, 70px) rotate(-18deg); }
  /* under the scree: sunk below the ground line, a mound marks it; before the Rockburst it swells and cracks */
  .pose-under .sink, .pose-burst .sink { transform: translateY(380px); }
  .pose-under .mound, .pose-burst .mound { opacity: 1; }
  .pose-under .shadow, .pose-burst .shadow { opacity: 0; }
  .pose-burst .mound { animation: cw-swell .8s ease-in-out infinite; }
  .pose-burst .crack { opacity: 1; animation: wc-glow .5s ease-in-out infinite; }
  @keyframes cw-swell { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06, 1.12); } }
  /* perched, brought down, driven up: settled low */
  .pose-settle .breath { animation: none; transform: scaleY(.9); }
  .pose-settle .wing { transform: rotate(16deg); }
  /* dazed */
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  /* beaten */
  .pose-down .breath { animation: none; transform: scaleY(.84); filter: saturate(.55) brightness(.8); }
  .pose-down .head { transform: translate(-10px, 60px) rotate(-16deg); }
  .pose-down .wing { transform: rotate(24deg); }
  @media (prefers-reduced-motion: reduce) { .breath, .wing, .gusts, .mound, .crack, .horn, .stars { animation: none !important; } }
</style>
