<script lang="ts">
  // The Stormcrown Roc, Stormspire sky tyrant, in the woodcut style (from the concept drawing). Facing left in
  // 1000 × 600, flipped. A huge raptor, wings raised, a crown of lightning bolts over its head.
  // On the ground: wings half-raised, breathing. Airborne: lifted out of the top of the frame (only the belly,
  // talons and wingtips show, like the Galeshrike), wings beating, a shadow on the ground. Stoop Dive: wings folded.
  // The crown's bolts brighten with every storm pip; Thunderhead: the crown blazes and lightning strikes the ground.
  // Landed / brought down: crouched, wings drooping. Dazed: stars. Broken: torn wing, shattered crown, cracked talons.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, FAR, GOLD, EMBER, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();
  const GOLDHI = '#f3cf7a';

  const WING = 'M560 260 C480 150 360 70 160 60 C230 110 270 150 300 190 C230 190 180 210 140 240 C240 250 330 270 420 320 Z';
  const WING_TORN = 'M560 260 C480 160 400 110 290 96 C320 130 330 160 340 190 C290 196 250 214 220 240 C290 252 350 270 420 320 Z';
  const BODY = 'M460 340 C480 260 580 230 680 240 C780 250 820 300 820 360 C820 420 760 450 660 450 C560 450 470 420 460 340 Z';
  const TAIL = 'M780 330 C860 320 940 350 970 400 C910 398 860 410 800 430 Z';
  const HEAD = 'M380 320 C380 280 410 254 450 254 C490 254 510 290 504 326 C498 356 470 372 440 370 C404 368 380 350 380 320 Z';
  const BEAK = 'M394 298 C356 290 318 298 300 322 C290 338 296 358 314 364 C312 350 318 340 332 338 L392 348 Z';
  const bolt = (x: number, y: number, s: number) => `M${x} ${y} l${-26 * s} ${46 * s} h${20 * s} l${-14 * s} ${44 * s} l${44 * s} ${-56 * s} h${-20 * s} l${14 * s} ${-34 * s} Z`;
  const CROWN = [[430, 168, .8], [474, 176, .62], [392, 186, .55]] as const;
  const bodyHatch = hatchLines(460, 830, 360, 452, 14, -30);
  const uid = `sr${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const air = $derived(!!m?.air);
  const storm = $derived(m?.storm ?? 0);
  const pose = $derived(
    hunt?.over === 'win' ? 'down' : intent === 'dazed' ? 'dazed' : intent === 'thunder' ? 'thunder' : intent === 'dive' ? 'dive' :
    intent === 'perched' || intent === 'crashed' ? 'landed' : intent === 'takeoff' ? 'takeoff' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const wings = $derived(part('wings')), crown = $derived(part('crown')), talons = $derived(part('talons'));
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  const DIVE: Keyframe[] = [{ transform: 'translate(0,0)' }, { transform: 'translate(-60px,-40px) scale(1.04)', offset: 0.25 }, { transform: 'translate(-200px,120px) skewX(-12deg)', offset: 0.55 }, { transform: 'translate(0,0)' }];
  oneShots(() => rig, () => hunt, i => (i === 'dive' ? DIVE : LUNGE));
</script>

<svg class="wc sr pose-{pose}" class:aloft={air && pose !== 'landed'} class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Stormcrown Roc{air ? ', in flight' : ''}">
  <defs><clipPath id="{uid}b"><path d={BODY} /></clipPath></defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <ellipse class="shadow" cx="620" cy="528" rx="240" ry="16" fill="#000" opacity="0" />
  <!-- Thunderhead: lightning to the ground -->
  <g class="strike">
    <path d="M300 60 L250 220 L300 230 L220 520 M700 40 L660 200 L720 210 L640 520" fill="none" stroke={INK} stroke-width="22" stroke-linejoin="round" stroke-linecap="round" />
    <path d="M300 60 L250 220 L300 230 L220 520 M700 40 L660 200 L720 210 L640 520" fill="none" stroke={GOLDHI} stroke-width="10" stroke-linejoin="round" stroke-linecap="round" />
  </g>
  <g class="rig" bind:this={rig}>
    <g class="lift">
      <g class="breath">
        <!-- far wing -->
        <g class="wing far" style="transform-origin:560px 270px"><path d={WING.replace('160 60', '230 40')} transform="translate(1064 26) scale(-0.9 0.9)" fill={FAR} stroke={INK} stroke-width="9" stroke-linejoin="round" /></g>
        <!-- legs -->
        <g class="legs" style="transform-origin:650px 430px">
          {#each [[620, 430, 600], [680, 430, 690]] as [x0, y0, x1], i}
            <path d="M{x0} {y0} L{x1} 500" stroke={INK} stroke-width="40" stroke-linecap="round" /><path d="M{x0} {y0} L{x1} 500" stroke={BONE2} stroke-width="24" stroke-linecap="round" />
            {#if !(talons.broke && i === 1)}<path data-foot d="M{x1} 500 l-28 24 M{x1} 500 l4 30 M{x1} 500 l26 20" stroke={INK} stroke-width="12" stroke-linecap="round" />
            {:else}<path data-foot d="M{x1} 500 l-10 14 M{x1} 500 l8 12" stroke={INK} stroke-width="8" stroke-linecap="round" />{/if}
          {/each}
          {#if talons.on}<circle cx="645" cy="510" r="70" fill="none" stroke={GOLD} stroke-width="14" opacity=".45" />{/if}
        </g>
        <path d={TAIL} fill={BONE} stroke={INK} stroke-width="8" stroke-linejoin="round" />
        <path d={BODY} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
        <g clip-path="url(#{uid}b)"><path d={bodyHatch} stroke={INK} stroke-width="5" stroke-linecap="round" /></g>
        <!-- near wing -->
        <g class="wing near" style="transform-origin:560px 270px">
          {#if wings.on}<path d={wings.broke ? WING_TORN : WING} transform="translate(1064 26) scale(-0.9 0.9)" fill="none" stroke={GOLD} stroke-width="26" opacity=".5" />{/if}
          <path d={wings.broke ? WING_TORN : WING} transform="translate(1064 26) scale(-0.9 0.9)" fill={wings.broke ? BONE2 : BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
          <path d="M300 120 C380 140 450 190 520 250 M250 170 C340 190 420 230 480 280 M220 220 C300 230 380 260 440 300" transform="translate(1064 26) scale(-0.9 0.9)" fill="none" stroke={INK} stroke-width="5" opacity=".55" />
          {#if wings.broke}<path d="M700 120 l-12 26 l18 12 l-10 26" fill="none" stroke={EMBER} stroke-width="6" stroke-linecap="round" />{/if}
        </g>
        <!-- head, beak and the storm crown -->
        <g class="head" style="transform-origin:460px 330px">
          <path d={HEAD} fill={BONE} stroke={INK} stroke-width="9" stroke-linejoin="round" />
          <path d={BEAK} fill={GOLD} stroke={INK} stroke-width="7" stroke-linejoin="round" />
          <circle cx="424" cy="314" r="10" fill={enraged ? EMBER : INK} /><circle cx="420" cy="310" r="3" fill={BONE} />
          <path d="M398 302 L452 290" stroke={INK} stroke-width="12" stroke-linecap="round" />
          <path d="M478 268 L520 250 L506 276 L540 272 L508 296" fill={BONE2} stroke={INK} stroke-width="7" stroke-linejoin="round" />
          <g class="crown" style="--glow:{0.25 + storm * 0.25}">
            {#if crown.on}<circle cx="436" cy="210" r="76" fill="none" stroke={GOLD} stroke-width="14" opacity=".5" />{/if}
            {#each CROWN as [x, y, s], i}
              {#if !(crown.broke && i > 0)}<path d={bolt(x, y, s)} fill={crown.broke ? BONE2 : GOLDHI} stroke={INK} stroke-width="6" stroke-linejoin="round" />{/if}
            {/each}
            {#if crown.broke}<path d="M454 196 l12 -8 M392 210 l-10 -6" stroke={EMBER} stroke-width="5" stroke-linecap="round" />{/if}
          </g>
          <g class="stars" style="transform-origin:440px 230px"><path d={star(380, 236, 28)} fill={GOLD} stroke={INK} stroke-width="5" /><path d={star(500, 226, 22)} fill={GOLD} stroke={INK} stroke-width="5" /></g>
        </g>
      </g>
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 620px 530px; }
  .lift, .wing, .head, .legs, .crown, .shadow, .strike { transform-box: view-box; transition: transform .5s ease, opacity .35s ease; }
  .lift { transform-origin: 620px 430px; }
  .breath { transform-origin: 620px 530px; animation: wc-breathe 3.2s ease-in-out infinite; }
  .wing.near { animation: half 3.2s ease-in-out infinite; }
  @keyframes half { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-3deg); } }
  /* the storm crown: brighter with every pip */
  .crown { filter: drop-shadow(0 0 calc(var(--glow) * 22px) #f3cf7a); transform-origin: 436px 210px; transform: scale(calc(.85 + var(--glow) * .2)); }
  .strike { opacity: 0; }
  /* airborne: lifted out of the top of the frame, wings beating, a shadow below */
  .aloft .lift { transform: translateY(-230px) scale(.95); }
  .aloft .wing { animation: beat .8s ease-in-out infinite; }
  @keyframes beat { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(14deg); } }
  .aloft .legs { transform: scaleY(.5) rotate(16deg); }
  .aloft .shadow { opacity: .35; }
  /* Taking off: crouched, wings up */
  .pose-takeoff .wing { transform: rotate(10deg); }
  .pose-takeoff .breath { animation: none; transform: scaleY(.92); }
  /* Stoop Dive: wings folded, head down */
  .pose-dive .lift { transform: translateY(-150px) rotate(-18deg) scale(.95); }
  .pose-dive .wing { animation: none; transform: rotate(-22deg) scaleY(.6); }
  /* Thunderhead: the crown blazes, lightning strikes */
  .pose-thunder .strike { opacity: 1; animation: flash .5s steps(2) infinite; }
  @keyframes flash { 0% { opacity: 1; } 100% { opacity: .25; } }
  /* Landed (spent, or brought down): crouched, wings drooping */
  .pose-landed .breath { animation: none; transform: scaleY(.9); }
  .pose-landed .wing { animation: none; transform: rotate(-16deg); }
  .pose-landed .head { transform: rotate(-10deg) translateY(16px); }
  /* dazed and beaten */
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  .pose-down .breath { animation: none; transform: scaleY(.84); filter: saturate(.55) brightness(.8); }
  .pose-down .wing { animation: none; transform: rotate(-30deg); }
  .pose-down .head { transform: rotate(-30deg) translateY(40px); }
</style>
