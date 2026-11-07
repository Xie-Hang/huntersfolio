<script lang="ts">
  // The Cinderback, magma burrower, in the woodcut style. Drawn facing left in a 1000 × 600 space and flipped.
  // On the surface: breathing. Claw swipe coming: it rears up on its back legs, claws raised. Burrowing: head
  // down, claws digging, earth flying. Underground: gone below the ground line, a mound marks the spot; before
  // the Eruption the mound glows and swells. Molten shell: the shell burns ember. Venting: steam from the vents.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, FAR, GOLD, EMBER, MUD, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();

  const SHELL = 'M330 420 C340 300 440 220 580 214 C720 208 830 280 860 380 C868 410 860 432 838 440 L360 440 C340 440 328 432 330 420 Z';
  const BANDS = 'M372 360 C460 300 700 286 836 350 M400 300 C480 252 680 246 790 290 M470 250 C540 226 640 224 720 244';
  const VENTS = [[500, 236], [590, 222], [680, 232]] as const;
  const HEAD = 'M346 362 C304 352 252 362 222 386 C202 402 198 426 216 438 C242 452 302 450 342 438 C364 428 372 380 346 362 Z';
  const PLATE = 'M224 384 C250 342 302 322 354 330 C376 334 384 354 376 376 C334 370 282 374 226 396 Z';
  const CLAWS = 'M300 512 C276 506 252 512 236 526 L250 528 C262 520 282 516 300 520 Z M318 516 C298 516 278 524 268 536 L282 536 C292 528 306 524 320 524 Z M336 518 C320 522 306 530 300 540 L314 538 C320 532 330 528 340 526 Z';
  const CLAWS_BROKE = 'M300 512 C290 510 280 512 272 518 L282 522 C288 518 294 518 300 520 Z M318 516 C310 516 302 520 298 526 L306 528 C310 524 316 524 320 524 Z';
  const shellHatch = hatchLines(320, 880, 330, 450, 14, -36);
  const uid = `cb${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const under = $derived(!!m?.under);
  const molten = $derived((m?.molten ?? 0) > 0);
  const pose = $derived(
    hunt?.over === 'win' ? 'down' :
    intent === 'erupt' || intent === 'spray' ? 'erupt' : under ? 'under' :
    intent === 'dazed' || intent === 'unearthed' ? 'dazed' : intent === 'burrow' ? 'dig' : intent === 'swipe' ? 'rear' :
    intent === 'venting' ? 'vent' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const plate = $derived(part('plate')), claws = $derived(part('claws')), vents = $derived(part('vents'));
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  const BURST: Keyframe[] = [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-110px) scale(1.08)', offset: 0.4 }, { transform: 'translateY(0) scale(1)' }];
  oneShots(() => rig, () => hunt, i => (i === 'erupt' || i === 'spray' ? BURST : LUNGE));
</script>

<svg class="wc cb pose-{pose}" class:static={!hunt} class:molten viewBox="60 40 940 520" role="img" aria-label="Engraving of the Cinderback, a magma burrower{under ? ', underground' : ''}{molten ? ', its shell molten' : ''}">
  <defs>
    <clipPath id="{uid}g"><rect x="0" y="0" width="1000" height="532" /></clipPath>
    <clipPath id="{uid}s"><path d={SHELL} /></clipPath>
  </defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <!-- the mound it leaves when it digs in; it glows before the Eruption -->
  <g class="mound">
    <path d="M400 532 C440 470 680 470 720 532 Z" fill={MUD} stroke={INK} stroke-width="8" />
    <path class="crack" d="M480 520 l20 -24 l-8 -14 l24 -10 M600 522 l-12 -22 l18 -12 l-6 -16 M540 500 l10 -16" fill="none" stroke={EMBER} stroke-width="7" stroke-linecap="round" />
  </g>
  <g clip-path="url(#{uid}g)">
    <g class="rig" bind:this={rig}>
      <g class="sink">
        <g class="breath">
          <!-- rear leg and front digging leg -->
          <path d="M780 430 L800 512" stroke={INK} stroke-width="62" stroke-linecap="round" /><path d="M780 430 L800 512" stroke={FAR} stroke-width="48" stroke-linecap="round" />
          <path data-foot d="M800 512 h46 l4 14 h-54 Z" fill={INK} />
          <g class="leg claw-leg" style="transform-origin:384px 432px">
            {#if claws.on}<path d="M384 432 L320 508" stroke={GOLD} stroke-width="84" stroke-linecap="round" opacity=".55" />{/if}
            <path d="M384 432 L320 508" stroke={INK} stroke-width="70" stroke-linecap="round" /><path d="M384 432 L320 508" stroke={BONE} stroke-width="56" stroke-linecap="round" />
            <path data-foot transform="translate(0,-14)" d={claws.broke ? CLAWS_BROKE : CLAWS} fill={claws.broke ? BONE2 : BONE2} stroke={INK} stroke-width="6" stroke-linejoin="round" />
            {#if claws.broke}<path d="M286 486 l12 10 l-8 8 l12 8" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />{/if}
          </g>
          <!-- vents behind the shell's top edge -->
          {#each VENTS as [x, y], i}
            {#if vents.on}<path d="M{x - 26} {y + 20} L{x - 14} {y - 30} L{x + 14} {y - 30} L{x + 26} {y + 20} Z" fill="none" stroke={GOLD} stroke-width="24" opacity=".55" />{/if}
            <path d="M{x - 26} {y + 20} L{x - 14} {vents.broke ? y - 4 : y - 30} L{x + 14} {vents.broke ? y - 4 : y - 30} L{x + 26} {y + 20} Z" fill={BONE2} stroke={INK} stroke-width="8" stroke-linejoin="round" />
            {#if !vents.broke}<ellipse class="ventglow" cx={x} cy={y - 30} rx="12" ry="6" fill={EMBER} />{/if}
            <g class="steam" style="transform-origin:{x}px {y - 40}px;animation-delay:{i * 0.3}s"><circle cx={x} cy={y - 50} r="16" fill={BONE2} /><circle cx={x + 14} cy={y - 74} r="11" fill={BONE2} /></g>
          {/each}
          <path d={SHELL} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
          <g clip-path="url(#{uid}s)">
            <path d={shellHatch} stroke={INK} stroke-width="5" stroke-linecap="round" />
            <rect class="burn" x="300" y="200" width="600" height="260" fill={EMBER} />
          </g>
          <path class="bands" d={BANDS} fill="none" stroke={INK} stroke-width="7" stroke-linecap="round" />
          <g class="head" style="transform-origin:350px 400px">
            <path d={HEAD} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
            {#if plate.on}<path d={PLATE} fill="none" stroke={GOLD} stroke-width="26" stroke-linejoin="round" opacity=".55" />{/if}
            <path d={PLATE} fill={BONE2} stroke={INK} stroke-width="8" stroke-linejoin="round" />
            <circle cx="300" cy="346" r="5" fill={INK} /><circle cx="336" cy="342" r="5" fill={INK} /><circle cx="262" cy="362" r="5" fill={INK} />
            {#if plate.broke}<path d="M250 372 l20 -18 l10 12 l22 -20 l12 14 l20 -16" fill="none" stroke={EMBER} stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />{/if}
            <circle cx="262" cy="410" r="9" fill={enraged ? EMBER : INK} />
            <path d="M216 428 C246 422 282 422 316 428" fill="none" stroke={INK} stroke-width="6" stroke-linecap="round" />
            <g class="stars" style="transform-origin:290px 300px"><path d={star(220, 300, 40)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(360, 270, 34)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(300, 340, 26)} fill={GOLD} stroke={INK} stroke-width="6" /></g>
          </g>
          <g class="fx clods"><circle cx="250" cy="470" r="12" fill={MUD} /><circle cx="210" cy="440" r="9" fill={MUD} /><circle cx="280" cy="430" r="8" fill={MUD} /></g>
        </g>
      </g>
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 600px 530px; }
  .sink { transform-box: view-box; transition: transform .5s cubic-bezier(.5,0,.3,1); }
  .breath { transform-origin: 600px 530px; animation: wc-breathe 3s ease-in-out infinite; }
  .head { transition: transform .35s ease; }
  .claw-leg { transition: transform .35s ease; }
  .mound { opacity: 0; transition: opacity .4s ease; transform-box: view-box; transform-origin: 560px 532px; }
  .crack { opacity: 0; }
  .ventglow { opacity: 0; }
  .steam, .clods { opacity: 0; transform-box: view-box; }
  .burn { opacity: 0; transition: opacity .4s ease; }

  /* rearing up for a claw swipe: pivots on the back foot, so only the front lifts */
  .pose-rear .sink { transform: rotate(14deg); transform-origin: 820px 528px; }
  .pose-rear .claw-leg { animation: swipe .7s ease-in-out infinite; }
  @keyframes swipe { 0%, 100% { transform: rotate(-20deg); } 50% { transform: rotate(-60deg); } }
  /* burrowing: head down, claw digging, earth flying */
  .pose-dig .head { transform: translate(-6px, 26px) rotate(-12deg); }
  .pose-dig .claw-leg { animation: dig .35s ease-in-out infinite; }
  .pose-dig .clods { animation: clods .7s ease-out infinite; }
  @keyframes dig { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(30deg); } }
  @keyframes clods { 0% { opacity: 1; transform: translate(0, 0); } 100% { opacity: 0; transform: translate(-60px, -90px); } }
  /* underground: sunk below the ground line (clipped), a mound marks it */
  .pose-under .sink, .pose-erupt .sink { transform: translateY(360px); }
  .pose-under .mound, .pose-erupt .mound { opacity: 1; }
  /* the Eruption is coming: the mound swells and its cracks glow */
  .pose-erupt .mound { animation: swell .8s ease-in-out infinite; }
  .pose-erupt .crack { opacity: 1; animation: wc-glow .5s ease-in-out infinite; }
  @keyframes swell { 50% { transform: scale(1.12, 1.3); } }
  /* molten shell: the shell burns */
  .molten .burn { opacity: .55; animation: wc-glow 1.1s ease-in-out infinite; }
  .molten .bands { stroke: #c2501c; }
  .molten .ventglow { opacity: 1; }
  /* venting: steam pours from the vents */
  .pose-vent .ventglow { opacity: 1; }
  .pose-vent .steam { animation: wc-puff 1.2s ease-out infinite; }
  /* dazed or just driven up: reeling, stars */
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  /* beaten */
  .pose-down .breath { animation: none; transform: scaleY(.88); filter: saturate(.55) brightness(.8); }
  .pose-down .head { transform: translate(-10px, 30px) rotate(-14deg); }
</style>
