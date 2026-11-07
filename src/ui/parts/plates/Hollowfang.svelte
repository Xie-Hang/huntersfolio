<script lang="ts">
  // The Hollowfang, cave leech, in the woodcut style (Nov 2026). Drawn facing left in a 1000 × 600 space.
  // Half bat, half leech: a ringed, tubular body hunched on clawed thumbs, leathery wings folded along its back, and a
  // blind head that ends in a round mouth ringed with fangs, a throat sac hanging beneath that swells as it drinks.
  // Latching: it lunges, mouth wide. Drinking: pulsing, the sac filling. Gorged or torn off: slumped. Dazed: stars.
  // A broken sac is split and empty, broken fangs are stumps, broken wings are torn. (The flight poses were for the
  // Gravefang, a variant since replaced by the Bloodwhelk; kept in case a flier ever reuses this body.)
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, FAR, GOLD, EMBER, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();
  const BLOOD = '#c4565c';

  const BODY = 'M420 404 C428 336 520 304 622 306 C724 308 794 350 804 412 C812 462 764 494 682 498 L500 498 C440 494 414 454 420 404 Z';
  const HEAD = 'M298 372 C296 322 336 292 390 292 C442 292 474 326 472 376 C470 420 436 444 390 444 C338 444 300 420 298 372 Z';
  const WING_FAR = 'M540 330 C560 230 650 160 770 146 L752 194 L812 204 L770 244 L830 266 L716 300 Z';
  const WING_NEAR = 'M500 350 C520 250 620 182 740 170 L722 218 L784 228 L740 266 L804 290 L690 330 C620 352 560 360 500 350 Z';
  const WING_NEAR_TORN = 'M500 350 C520 270 590 220 660 206 L650 240 L690 252 L660 276 L700 296 L650 324 C600 346 556 356 500 350 Z';
  const FINGERS = 'M520 340 L700 196 M540 344 L730 250 M560 348 L760 294';
  const FANGS = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return { x: 304 + Math.cos(a) * 30, y: 384 + Math.sin(a) * 36, a: (a * 180) / Math.PI }; });
  const bodyHatch = hatchLines(430, 810, 340, 500, 14, -30);
  const uid = `hf${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const air = $derived(!!m?.air);
  const latched = $derived((m?.latch ?? 0) > 0);
  const pose = $derived(
    hunt?.over === 'win' ? 'down' :
    intent === 'dazed' ? 'dazed' : intent === 'gorged' || intent === 'torn' || intent === 'crashed' ? 'slump' :
    intent === 'plunge' ? 'dive' : air ? 'air' : intent === 'takeoff' ? 'takeoff' :
    latched || intent === 'drink' ? 'drink' : intent === 'latch' || intent === 'exsang' || intent === 'frenzy' ? 'latch' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const fangs = $derived(part('fangs')), sac = $derived(part('sac')), wings = $derived(part('wings'));
  // the sac swells with what it has drunk this latch
  const fill = $derived(Math.min(1.35, 1 + (m?.drank ?? 0) / 160));
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  const DIVE: Keyframe[] = [{ transform: 'translate(0,0)' }, { transform: 'translate(-40px,-50px) scale(1.05)', offset: 0.25 }, { transform: 'translate(-180px,140px) skewX(-10deg)', offset: 0.55 }, { transform: 'translate(0,0)' }];
  oneShots(() => rig, () => hunt, i => (i === 'plunge' ? DIVE : LUNGE));
</script>

<svg class="wc hf pose-{pose}" class:static={!hunt} class:aloft={air || pose === 'dive'} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Hollowfang, a pale, eyeless cave leech with bat wings and a ring of fangs{latched ? ', latched on and drinking' : ''}">
  <defs><clipPath id="{uid}b"><path d={BODY} /></clipPath></defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <ellipse class="shadow" cx="580" cy="534" rx="220" ry="12" fill={INK} opacity=".7" />
  <g class="rig" bind:this={rig}>
    <g class="lift">
      <g class="breath">
        <g class="wing wing-far" style="transform-origin:560px 330px">
          <path d={WING_FAR} fill={FAR} stroke={INK} stroke-width="9" stroke-linejoin="round" />
        </g>
        <!-- clawed thumbs it walks on -->
        <path d="M470 486 q-20 30 -40 44 M470 486 q-4 30 -16 46 M700 490 q16 26 34 40 M700 490 q2 28 10 42" fill="none" stroke={INK} stroke-width="10" stroke-linecap="round" />
        <path d={BODY} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
        <g clip-path="url(#{uid}b)"><path d={bodyHatch} stroke={INK} stroke-width="5" stroke-linecap="round" opacity=".8" /></g>
        <path d="M520 316 q-14 90 0 180 M590 308 q-14 96 0 190 M660 312 q-12 94 0 186 M730 326 q-10 82 0 164" fill="none" stroke={INK} stroke-width="6" stroke-linecap="round" opacity=".55" />
        <g class="head" style="transform-origin:420px 380px">
          <!-- the throat sac, swelling as it drinks -->
          <g class="sac" style="transform-origin:410px 430px;transform:scale({sac.broke ? 1 : fill})">
            {#if sac.on}<path d="M362 420 C350 466 382 498 424 494 C466 490 480 456 466 424 Z" fill="none" stroke={GOLD} stroke-width="24" stroke-linejoin="round" opacity=".55" />{/if}
            {#if sac.broke}<path d="M366 424 C360 450 372 470 392 474 L404 458 L420 476 C450 470 462 446 460 424 Z" fill={BONE2} stroke={INK} stroke-width="8" stroke-linejoin="round" />
              <path d="M394 460 l8 16 l10 -12" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />
            {:else}<path d="M362 420 C350 466 382 498 424 494 C466 490 480 456 466 424 Z" fill={BLOOD} stroke={INK} stroke-width="8" stroke-linejoin="round" />
              <path d="M392 446 q14 10 30 6" fill="none" stroke={INK} stroke-width="4" opacity=".5" />{/if}
          </g>
          <path d={HEAD} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
          <path d="M380 318 q20 -8 40 4 M396 340 q16 -6 32 2" fill="none" stroke={INK} stroke-width="5" stroke-linecap="round" opacity=".5" />
          <!-- the round mouth and its ring of fangs -->
          {#if fangs.on}<ellipse cx="304" cy="384" rx="44" ry="50" fill="none" stroke={GOLD} stroke-width="22" opacity=".55" />{/if}
          <ellipse class="mouth" cx="304" cy="384" rx="32" ry="38" fill={enraged ? EMBER : INK} stroke={INK} stroke-width="8" />
          {#each FANGS as f, i (i)}
            {#if !fangs.broke || i % 3 === 0}<path d="M{f.x} {f.y} l{Math.cos(((f.a + 180) * Math.PI) / 180) * (fangs.broke ? 8 : 18)} {Math.sin(((f.a + 180) * Math.PI) / 180) * (fangs.broke ? 8 : 18)}" stroke={BONE2} stroke-width="7" stroke-linecap="round" />{/if}
          {/each}
          {#if fangs.broke}<path d="M270 350 l10 8 l-6 8 l10 6" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />{/if}
          <g class="stars" style="transform-origin:390px 260px"><path d={star(330, 270, 34)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(450, 250, 26)} fill={GOLD} stroke={INK} stroke-width="6" /></g>
        </g>
        <g class="wing wing-near" style="transform-origin:520px 350px">
          {#if wings.on}<path d={wings.broke ? WING_NEAR_TORN : WING_NEAR} fill="none" stroke={GOLD} stroke-width="28" stroke-linejoin="round" opacity=".55" />{/if}
          <path d={wings.broke ? WING_NEAR_TORN : WING_NEAR} fill={BONE2} stroke={INK} stroke-width="10" stroke-linejoin="round" />
          <path d={FINGERS} fill="none" stroke={INK} stroke-width="6" stroke-linecap="round" opacity=".6" />
          {#if wings.broke}<path d="M650 226 l14 14 l-12 10 l16 14" fill="none" stroke={EMBER} stroke-width="6" stroke-linecap="round" />{/if}
        </g>
      </g>
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 580px 530px; }
  .lift { transition: transform .6s cubic-bezier(.3,.7,.3,1); }
  .breath { transform-origin: 580px 530px; animation: wc-breathe 2.4s ease-in-out infinite; }
  .head { transition: transform .35s ease; }
  .sac { transform-box: view-box; transition: transform .5s ease; }
  .wing { transition: transform .35s ease; transform: rotate(6deg); }
  .shadow { transform-box: view-box; transform-origin: 580px 534px; transition: transform .6s ease, opacity .6s ease; }
  .mouth { transform-box: view-box; transform-origin: 304px 384px; transition: transform .3s ease; }

  /* gathering to latch: crouched, mouth wide */
  .pose-latch .breath { animation: none; transform: scaleY(.9); }
  .pose-latch .head { transform: translateX(-30px) rotate(6deg); }
  .pose-latch .mouth { transform: scale(1.25); }
  /* latched on and drinking: reached forward, pulsing */
  .pose-drink .head { transform: translate(-70px, 20px) rotate(10deg); animation: hf-gulp .9s ease-in-out infinite; }
  .pose-drink .mouth { transform: scale(1.2); }
  @keyframes hf-gulp { 0%, 100% { transform: translate(-70px, 20px) rotate(10deg); } 50% { transform: translate(-60px, 24px) rotate(8deg) scale(1.03); } }
  /* gorged or torn off: slumped */
  .pose-slump .breath { animation: none; transform: scaleY(.86); }
  .pose-slump .head { transform: translate(-10px, 40px) rotate(-12deg); }
  .pose-slump .wing { transform: rotate(18deg); }
  /* the Gravefang taking off and flying: wings up, rising out of frame */
  .pose-takeoff .wing { transform: rotate(-30deg); }
  .aloft .lift { transform: translateY(-240px) scale(.96); transform-origin: 580px 420px; }
  .aloft .shadow { transform: scale(.55); opacity: .4; }
  .pose-air .wing { animation: hf-flap .7s ease-in-out infinite; }
  @keyframes hf-flap { 0%, 100% { transform: rotate(-50deg); } 50% { transform: rotate(10deg); } }
  .pose-dive .lift { transform: translateY(-170px) rotate(-20deg) scale(.96); transform-origin: 580px 420px; }
  .pose-dive .wing { transform: rotate(16deg); }
  /* dazed */
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  .pose-dazed .head { transform: rotate(-10deg); }
  /* beaten */
  .pose-down .breath { animation: none; transform: scaleY(.8); filter: saturate(.55) brightness(.8); }
  .pose-down .head { transform: translate(-20px, 60px) rotate(-30deg); }
  .pose-down .wing { transform: rotate(26deg); }
</style>
