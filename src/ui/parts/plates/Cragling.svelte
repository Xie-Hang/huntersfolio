<script lang="ts">
  // The Cragling, a Cragwing hatchling (the Foothills' first hunt, Nov 2026), in the woodcut style. A baby, not a
  // small adult: a round body with a bit of eggshell still stuck to its back, a big head with a horn bud, wing stubs
  // with one slate scale, a short tail and stubby legs. Drawn facing left in a 1000 × 600 space and flipped. Poses:
  // breathing with its wing stubs flapping, reeling when dazed, flopped when beaten.
  import type { Hunt } from '../../../engine';
  import { oneShots, INK, BONE, BONE2, FAR, GOLD, EMBER, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();
  const SLATE = '#8d8a84', SLATE_HI = '#b5b1a8';

  const BODY = 'M440 330 C446 262 520 226 610 230 C700 234 770 280 776 344 C782 404 736 444 650 450 C566 456 486 446 458 414 C442 396 436 362 440 330 Z';
  const HEAD = 'M470 282 C468 222 420 186 352 186 C286 186 236 222 226 274 C218 318 236 352 268 366 C306 382 360 384 410 370 C452 358 472 324 470 282 Z';
  const SNOUT = 'M246 300 C212 296 184 306 176 326 C170 344 186 358 214 360 C240 362 262 356 272 344 Z';
  const HORN = 'M232 268 L188 246 L232 296 Z';
  const SHELL = 'M600 232 L620 204 L640 224 L664 200 L684 236 C660 248 626 248 600 232 Z';
  const WING = 'M600 300 L640 236 L690 228 L724 252 L700 270 L726 290 L690 304 Z';
  const FAR_WING = 'M580 290 L604 246 L640 240 L626 270 Z';
  const TAIL = 'M770 352 C820 350 860 336 890 312 L902 330 C870 370 822 392 774 396 Z';
  const TAILTIP = 'M884 302 L912 300 L900 336 Z';
  type Leg = { id: string; sh: [number, number]; ft: [number, number]; far: boolean };
  const LEGS: Leg[] = [
    { id: 'ff', sh: [520, 430], ft: [516, 514], far: true },
    { id: 'rf', sh: [700, 432], ft: [708, 514], far: true },
    { id: 'fn', sh: [482, 420], ft: [474, 514], far: false },
    { id: 'rn', sh: [744, 420], ft: [752, 514], far: false }
  ];
  const bodyHatch = hatchLines(430, 800, 350, 460, 13, -30);
  const uid = `cl${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const pose = $derived(hunt?.over === 'win' ? 'down' : intent === 'dazed' ? 'dazed' : 'idle');
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  oneShots(() => rig, () => hunt);
</script>

<svg class="wc cl pose-{pose}" class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Cragling, a Cragwing hatchling">
  <defs>
    <clipPath id="{uid}b"><path d={BODY} /></clipPath>
    <linearGradient id="{uid}u" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#000" stop-opacity="0" /><stop offset="1" stop-color="#000" stop-opacity="1" /></linearGradient>
    <mask id="{uid}m"><rect x="0" y="0" width="1000" height="600" fill="url(#{uid}u)" /></mask>
  </defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <g class="rig" bind:this={rig}>
    <g class="breath">
      <path class="wing far" d={FAR_WING} fill={SLATE} stroke={INK} stroke-width="7" stroke-linejoin="round" style="transform-origin:600px 290px" />
      {#each LEGS as L (L.id)}
        <g class="leg leg-{L.id}" style="transform-origin:{L.sh[0]}px {L.sh[1]}px">
          <path d="M{L.sh[0]} {L.sh[1]} L{L.ft[0]} {L.ft[1]}" stroke={INK} stroke-width="50" stroke-linecap="round" />
          <path d="M{L.sh[0]} {L.sh[1]} L{L.ft[0]} {L.ft[1]}" stroke={L.far ? FAR : BONE} stroke-width="36" stroke-linecap="round" />
          <path d="M{L.ft[0] - 22} {L.ft[1] + 2} l8 -12 l8 10 l8 -12 l8 10 l8 -12 l6 16 Z" fill={INK} />
        </g>
      {/each}
      <path class="tail" d={TAIL} fill={BONE2} stroke={INK} stroke-width="8" stroke-linejoin="round" style="transform-origin:772px 370px" />
      <path d={TAILTIP} fill={SLATE} stroke={INK} stroke-width="6" stroke-linejoin="round" />
      <path d={BODY} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
      <g clip-path="url(#{uid}b)">
        <path d={bodyHatch} stroke={INK} stroke-width="5" stroke-linecap="round" />
        <rect x="0" y="0" width="1000" height="600" fill={INK} opacity=".8" mask="url(#{uid}m)" />
      </g>
      <!-- the eggshell it still wears -->
      <path d={SHELL} fill={BONE2} stroke={INK} stroke-width="7" stroke-linejoin="round" />
      <path class="wing near" d={WING} fill={SLATE} stroke={INK} stroke-width="8" stroke-linejoin="round" style="transform-origin:610px 296px" />
      <path d="M640 236 L660 290 M690 228 L690 300" stroke={SLATE_HI} stroke-width="6" stroke-linecap="round" />
      <g class="head" style="transform-origin:450px 330px">
        <path d={HEAD} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
        <path d={SNOUT} fill={BONE} stroke={INK} stroke-width="9" stroke-linejoin="round" />
        <path d={HORN} fill={GOLD} stroke={INK} stroke-width="7" stroke-linejoin="round" />
        <circle cx="200" cy="320" r="4" fill={INK} />
        <path d="M188 344 C210 350 238 348 262 340" fill="none" stroke={INK} stroke-width="6" stroke-linecap="round" />
        <!-- a hatchling's big eye -->
        <circle cx="332" cy="270" r="24" fill={enraged ? EMBER : INK} /><circle cx="324" cy="262" r="8" fill={BONE} />
        <path d="M398 206 L420 168 L432 214 Z" fill={BONE2} stroke={INK} stroke-width="7" stroke-linejoin="round" />
        <g class="stars" style="transform-origin:330px 150px"><path d={star(250, 150, 32)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(400, 120, 26)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(330, 190, 20)} fill={GOLD} stroke={INK} stroke-width="6" /></g>
      </g>
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 600px 530px; transition: transform .35s cubic-bezier(.3,.7,.3,1); }
  .breath { transform-origin: 600px 530px; animation: wc-breathe 2.2s ease-in-out infinite; }
  .wing { transform-box: view-box; animation: flutter 1.1s ease-in-out infinite; }
  .wing.far { animation-delay: .1s; }
  @keyframes flutter { 0%, 70%, 100% { transform: rotate(0); } 80% { transform: rotate(-16deg); } 90% { transform: rotate(4deg); } }
  .head { transition: transform .35s ease; }
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  .pose-dazed .wing { animation: none; }
  .pose-down .breath, .pose-down .wing { animation: none; }
  .pose-down .rig { transform: translateY(50px) scaleY(.9); filter: saturate(.55) brightness(.8); }
  .pose-down .leg-ff, .pose-down .leg-fn { transform: rotate(64deg); }
  .pose-down .leg-rf, .pose-down .leg-rn { transform: rotate(-64deg); }
  .pose-down .head { transform: translate(-10px, 30px) rotate(-12deg); }
  .leg { transition: transform .5s ease; }
</style>
