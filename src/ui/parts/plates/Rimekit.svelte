<script lang="ts">
  // The Rimekit, a Rimetail kit (the Foothills, Nov 2026), in the woodcut style. A baby, not a small adult: a big
  // flat head, a long low body on stubby legs, ice only budding along its back, and a short tail with a barb bud.
  // Drawn facing left in a 1000 × 600 space and flipped. Poses: breathing, tail twitching; before its Tail Sweep the
  // tail coils back and up; reeling when dazed; flat out when beaten.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, FAR, GOLD, EMBER, FROST, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();

  const BODY = 'M400 380 C410 330 480 304 570 302 C670 300 740 318 772 352 C796 380 786 420 744 434 C690 450 580 452 500 448 C440 444 404 430 398 410 C396 400 398 390 400 380 Z';
  const HEAD = 'M444 352 C440 300 392 270 324 272 C258 274 204 304 188 346 C178 374 196 396 236 404 C290 414 360 414 410 404 C440 396 448 376 444 352 Z';
  const JAW = 'M196 380 C232 392 300 396 360 392 C350 410 312 424 262 424 C226 424 202 410 196 380 Z';
  const BUDS = ['M470 316 L484 284 L500 312 Z', 'M540 304 L556 266 L574 302 Z', 'M612 304 L628 270 L644 306 Z', 'M684 318 L698 290 L712 324 Z'];
  const TAIL = 'M766 380 C826 372 870 340 876 300 C882 262 852 246 832 262';
  const BARB = 'M832 262 L812 244 L840 248 L842 226 L854 256 Z';
  type Leg = { id: string; sh: [number, number]; ft: [number, number]; far: boolean };
  const LEGS: Leg[] = [
    { id: 'ff', sh: [470, 432], ft: [480, 514], far: true },
    { id: 'rf', sh: [710, 432], ft: [722, 514], far: true },
    { id: 'fn', sh: [430, 424], ft: [418, 514], far: false },
    { id: 'rn', sh: [670, 436], ft: [660, 514], far: false }
  ];
  const bodyHatch = hatchLines(390, 800, 380, 460, 13, -30);
  const headHatch = hatchLines(180, 460, 370, 420, 12, -22);
  const uid = `rk${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const pose = $derived(hunt?.over === 'win' ? 'down' : intent === 'dazed' ? 'dazed' : intent === 'pinch' ? 'sweep' : 'idle');
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  // the Tail Sweep swings the back end round; a Snap is the usual lunge
  const SWEEP: Keyframe[] = [{ transform: 'skewX(0)' }, { transform: 'translateX(40px) skewX(12deg)', offset: 0.3 }, { transform: 'translateX(-120px) skewX(-16deg)', offset: 0.55 }, { transform: 'skewX(0)' }];
  oneShots(() => rig, () => hunt, i => (i === 'pinch' ? SWEEP : LUNGE));
</script>

<svg class="wc rk pose-{pose}" class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Rimekit, a Rimetail kit{pose === 'sweep' ? ', its tail coiled to sweep' : ''}">
  <defs>
    <clipPath id="{uid}b"><path d={BODY} /></clipPath>
    <clipPath id="{uid}h"><path d={HEAD} /></clipPath>
    <linearGradient id="{uid}u" x1="0" y1="0" x2="0" y2="1"><stop offset=".62" stop-color="#000" stop-opacity="0" /><stop offset="1" stop-color="#000" stop-opacity="1" /></linearGradient>
    <mask id="{uid}m"><rect x="0" y="0" width="1000" height="600" fill="url(#{uid}u)" /></mask>
  </defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <g class="rig" bind:this={rig}>
    <g class="breath">
      {#each LEGS as L (L.id)}
        <g class="leg leg-{L.id}" style="transform-origin:{L.sh[0]}px {L.sh[1]}px">
          <path d="M{L.sh[0]} {L.sh[1]} L{L.ft[0]} {L.ft[1]}" stroke={INK} stroke-width="44" stroke-linecap="round" />
          <path d="M{L.sh[0]} {L.sh[1]} L{L.ft[0]} {L.ft[1]}" stroke={L.far ? FAR : BONE} stroke-width="30" stroke-linecap="round" />
          <path d="M{L.ft[0] - 22} {L.ft[1] + 4} c4 -14 10 -16 14 -4 c4 -14 10 -14 14 -2 c4 -12 10 -12 14 2 Z" fill={INK} />
        </g>
      {/each}
      <g class="tail" style="transform-origin:770px 384px">
        <path d={TAIL} fill="none" stroke={INK} stroke-width="44" stroke-linecap="round" />
        <path d={TAIL} fill="none" stroke={BONE} stroke-width="30" stroke-linecap="round" />
        <path d={BARB} fill={FROST} stroke={INK} stroke-width="6" stroke-linejoin="round" />
      </g>
      {#each BUDS as d}<path {d} fill={FROST} stroke={INK} stroke-width="6" stroke-linejoin="round" />{/each}
      <path d={BODY} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
      <g clip-path="url(#{uid}b)">
        <path d={bodyHatch} stroke={INK} stroke-width="5" stroke-linecap="round" />
        <rect x="0" y="0" width="1000" height="600" fill={INK} opacity=".8" mask="url(#{uid}m)" />
        <path d="M430 360 C520 344 640 344 760 366" fill="none" stroke={FROST} stroke-width="8" stroke-linecap="round" opacity=".7" />
      </g>
      <g class="head" style="transform-origin:440px 380px">
        <path d={JAW} fill={BONE2} stroke={INK} stroke-width="8" stroke-linejoin="round" />
        <path d={HEAD} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
        <g clip-path="url(#{uid}h)"><path d={headHatch} stroke={INK} stroke-width="4" stroke-linecap="round" opacity=".75" /></g>
        <path d="M216 392 l8 16 l8 -16 Z M262 396 l7 13 l7 -13 Z" fill={BONE} stroke={INK} stroke-width="4" stroke-linejoin="round" />
        <!-- a kit's big eye -->
        <circle cx="300" cy="326" r="22" fill={enraged ? EMBER : FROST} stroke={INK} stroke-width="7" /><circle cx="300" cy="326" r="9" fill={INK} /><circle cx="294" cy="320" r="4" fill={BONE} />
        <path d="M374 290 L396 250 L408 296 Z" fill={BONE2} stroke={INK} stroke-width="6" stroke-linejoin="round" />
        <circle cx="206" cy="352" r="4" fill={INK} />
        <g class="stars" style="transform-origin:320px 220px"><path d={star(240, 220, 30)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(390, 190, 24)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(320, 250, 18)} fill={GOLD} stroke={INK} stroke-width="6" /></g>
      </g>
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 600px 530px; transition: transform .35s cubic-bezier(.3,.7,.3,1); }
  .breath { transform-origin: 600px 530px; animation: wc-breathe 2.6s ease-in-out infinite; }
  .tail { animation: twitch 2.2s ease-in-out infinite; transition: transform .4s ease; }
  @keyframes twitch { 0%, 80%, 100% { transform: rotate(0); } 88% { transform: rotate(8deg); } }
  .head { transition: transform .35s ease; }
  /* the Tail Sweep is coming: low at the front, tail coiled back and up, shivering */
  .pose-sweep .head { transform: translate(-8px, 12px) rotate(-4deg); }
  .pose-sweep .tail { animation: coil .5s ease-in-out infinite; transform: rotate(-24deg); }
  @keyframes coil { 0%, 100% { transform: rotate(-24deg); } 50% { transform: rotate(-30deg); } }
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  .pose-down .breath, .pose-down .tail { animation: none; }
  .pose-down .rig { transform: translateY(40px) scaleY(.88); filter: saturate(.55) brightness(.8); }
  .pose-down .leg-ff, .pose-down .leg-fn { transform: rotate(60deg); }
  .pose-down .leg-rf, .pose-down .leg-rn { transform: rotate(-60deg); }
  .leg { transition: transform .5s ease; }
</style>
