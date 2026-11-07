<script lang="ts">
  // The Tuskling, a Gorehorn calf (the Foothills, Nov 2026), in the woodcut style. A baby, not a small adult: a big
  // head on a round body, stubby legs, a calf's stripes, tusks only nubs, a few bristles where the parent has a mane.
  // Drawn facing left in a 1000 × 600 space and flipped. Poses: breathing, leaning in before its Bite, reeling when
  // dazed, head hung when tired, folded down when beaten. Its Tusks and Hide light up when aimed at.
  import type { Hunt } from '../../../engine';
  import { oneShots, INK, BONE, BONE2, FAR, GOLD, EMBER, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();

  const BODY = 'M430 300 C440 236 520 206 616 208 C716 210 796 250 808 318 C820 388 776 436 700 448 C612 460 506 458 460 430 C428 410 422 352 430 300 Z';
  const HEAD = 'M470 282 C470 222 420 188 356 190 C288 192 236 232 218 288 C204 330 200 360 212 386 C226 412 266 420 314 418 C382 414 440 396 462 362 C474 338 472 310 470 282 Z';
  const EAR = 'M408 206 C430 176 462 160 488 162 C478 192 460 222 436 238 Z';
  const BRISTLES = 'M486 214 L498 182 L512 210 L526 176 L540 206 L556 180 L566 210 Z';
  const STRIPES = 'M430 280 C540 252 700 252 812 290 M440 330 C560 304 700 306 816 334 M446 378 C560 360 700 362 806 382';
  const TUSKS = ['M240 404 C228 384 232 364 248 354 C250 372 256 388 268 398 Z', 'M288 410 C280 390 286 372 300 364 C300 382 306 396 318 404 Z'];
  const STUBS = ['M240 404 C236 394 238 386 246 380 L256 392 C258 398 262 400 268 398 Z', 'M288 410 C286 400 288 392 294 386 L306 398 C308 404 312 406 318 404 Z'];
  type Leg = { id: string; sh: [number, number]; hf: [number, number]; far: boolean };
  const LEGS: Leg[] = [
    { id: 'fr', sh: [520, 430], hf: [516, 512], far: true },
    { id: 'rr', sh: [730, 430], hf: [736, 512], far: true },
    { id: 'ff', sh: [470, 420], hf: [462, 512], far: false },
    { id: 'rf', sh: [780, 410], hf: [784, 512], far: false }
  ];
  const bodyHatch = hatchLines(420, 840, 340, 470, 14, -34);
  const headHatch = hatchLines(200, 480, 350, 430, 12, -24);
  const uid = `tk${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const pose = $derived(hunt?.over === 'win' ? 'down' : intent === 'dazed' ? 'dazed' : intent === 'tired' ? 'tired' : intent === 'bite' ? 'tense' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const tusks = $derived(part('tusks')), hide = $derived(part('hide'));
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  oneShots(() => rig, () => hunt);
</script>

<svg class="wc tk pose-{pose}" class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Tuskling, a Gorehorn calf{pose === 'tired' ? ', tired out' : ''}">
  <defs>
    <clipPath id="{uid}b"><path d={BODY} /></clipPath>
    <clipPath id="{uid}h"><path d={HEAD} /></clipPath>
    <linearGradient id="{uid}u" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#000" stop-opacity="0" /><stop offset="1" stop-color="#000" stop-opacity="1" /></linearGradient>
    <mask id="{uid}m"><rect x="0" y="0" width="1000" height="600" fill="url(#{uid}u)" /></mask>
  </defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <g class="rig" bind:this={rig}>
    <g class="breath">
      {#each LEGS as L (L.id)}
        <g class="leg leg-{L.id}" style="transform-origin:{L.sh[0]}px {L.sh[1]}px">
          <path d="M{L.sh[0]} {L.sh[1]} L{L.hf[0]} {L.hf[1]}" stroke={INK} stroke-width="56" stroke-linecap="round" />
          <path d="M{L.sh[0]} {L.sh[1]} L{L.hf[0]} {L.hf[1]}" stroke={L.far ? FAR : BONE} stroke-width="42" stroke-linecap="round" />
          <path d="M{L.hf[0] - 18} {L.hf[1] - 4} h36 l5 16 h-46 Z" fill={INK} />
        </g>
      {/each}
      <!-- a curly tail -->
      <path class="tail" d="M806 306 C846 290 862 320 842 334 C826 344 814 326 828 318" fill="none" stroke={INK} stroke-width="9" stroke-linecap="round" style="transform-origin:806px 306px" />
      <path d={BRISTLES} fill={enraged ? EMBER : BONE} stroke={INK} stroke-width="7" stroke-linejoin="round" />
      {#if hide.on}<path d={BODY} fill="none" stroke={GOLD} stroke-width="28" stroke-linejoin="round" opacity=".55" />{/if}
      <path d={BODY} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
      <g clip-path="url(#{uid}b)">
        <path d={STRIPES} fill="none" stroke={BONE2} stroke-width="22" stroke-linecap="round" />
        <path d={bodyHatch} stroke={INK} stroke-width="5" stroke-linecap="round" />
        <rect x="0" y="0" width="1000" height="600" fill={INK} opacity=".8" mask="url(#{uid}m)" />
        {#if hide.broke}<path d="M600 230 l22 34 l-18 16 l26 38 l-18 18 l24 34" fill="none" stroke={EMBER} stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />{/if}
      </g>
      <g class="head" style="transform-origin:440px 330px">
        <path d={EAR} fill={BONE2} stroke={INK} stroke-width="8" stroke-linejoin="round" />
        <path d={HEAD} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
        <g clip-path="url(#{uid}h)"><path d={headHatch} stroke={INK} stroke-width="4" stroke-linecap="round" opacity=".8" /></g>
        <ellipse cx="204" cy="368" rx="18" ry="28" fill={BONE2} stroke={INK} stroke-width="8" />
        <ellipse cx="200" cy="360" rx="3.5" ry="6" fill={INK} /><ellipse cx="200" cy="378" rx="3.5" ry="6" fill={INK} />
        <!-- a big calf's eye -->
        <circle cx="326" cy="292" r="19" fill={enraged ? EMBER : INK} /><circle cx="320" cy="285" r="6" fill={BONE} />
        <path d="M300 262 C314 252 332 252 346 258" fill="none" stroke={INK} stroke-width="6" stroke-linecap="round" />
        <path d="M232 404 C262 398 290 398 318 404" fill="none" stroke={INK} stroke-width="6" stroke-linecap="round" />
        {#each tusks.broke ? STUBS : TUSKS as d}
          {#if tusks.on}<path {d} fill="none" stroke={GOLD} stroke-width="22" stroke-linejoin="round" opacity=".55" />{/if}
          <path {d} fill={tusks.broke ? BONE2 : GOLD} stroke={INK} stroke-width="7" stroke-linejoin="round" />
        {/each}
        <g class="stars" style="transform-origin:330px 170px"><path d={star(250, 160, 34)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(400, 130, 28)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(340, 200, 22)} fill={GOLD} stroke={INK} stroke-width="6" /></g>
      </g>
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 600px 530px; transition: transform .35s cubic-bezier(.3,.7,.3,1); }
  .breath { transform-origin: 600px 530px; animation: wc-breathe 2.4s ease-in-out infinite; }
  .head { transition: transform .35s cubic-bezier(.3,.7,.3,1); }
  .tail { animation: wag 1.6s ease-in-out infinite; }
  @keyframes wag { 50% { transform: rotate(14deg); } }
  /* about to bite: leaning in, head low */
  .pose-tense .rig { transform: translateX(-24px) skewX(-7deg); }
  .pose-tense .head { transform: translate(-12px, 10px) rotate(-6deg); }
  .pose-tense .breath { animation-duration: .9s; }
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  /* tired: sagging, head hung, slow heaving */
  .pose-tired .rig { transform: scaleY(.94); }
  .pose-tired .head { transform: translate(-10px, 28px) rotate(-16deg); }
  .pose-tired .breath { animation-duration: 1.6s; }
  .pose-tired .tail { animation: none; }
  /* beaten: legs fold, it settles on its belly */
  .pose-down .breath, .pose-down .tail { animation: none; }
  .pose-down .rig { transform: translateY(54px) scaleY(.92); filter: saturate(.55) brightness(.8); }
  .pose-down .leg-ff, .pose-down .leg-fr { transform: rotate(64deg); }
  .pose-down .leg-rf, .pose-down .leg-rr { transform: rotate(-64deg); }
  .pose-down .head { transform: translate(-10px, 24px) rotate(-14deg); }
  .leg { transition: transform .5s ease; }
</style>
