<script lang="ts">
  // The Bogjaw, Mirewood grappler, in the woodcut style. Drawn facing left in a 1000 × 600 space and flipped.
  // Idle: half-sunk, breathing. Tongue Lash: the tongue uncoils. Body Slam: it squats to heave itself up.
  // Gape: the jaw drops wide open. Swallow: wider still, lunging. Digest: jaw shut, the throat sac bulging and
  // pulsing (you're inside). Dazed: stars. Broken parts: a cracked jaw, a torn and slack throat sac, warts snapped off.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, FAR, GOLD, EMBER, MUD, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();
  const STONE = '#a99f90', MOSS = '#7f9159', TONGUE = '#c9776a';

  const BODY = 'M300 420 C300 300 420 228 584 228 C748 228 866 300 872 420 C876 474 842 506 782 508 L380 508 C330 504 300 470 300 420 Z';
  const UPPER = 'M110 432 C110 352 196 312 300 312 C366 312 410 350 418 402 C420 420 414 432 404 438 C300 452 200 452 116 446 Z';
  const LOWER = 'M116 446 C200 452 300 452 404 438 C420 470 380 498 300 502 C206 506 120 486 116 446 Z';
  const WARTS = [[470, 276, 20], [548, 250, 26], [632, 258, 20], [712, 284, 24], [590, 312, 15], [790, 330, 16]] as const;
  const TEETH_UP = Array.from({ length: 8 }, (_, i) => 150 + i * 34);
  const bodyHatch = hatchLines(300, 880, 380, 512, 14, -30);
  const uid = `bj${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const inside = $derived((m?.gut ?? 0) > 0);
  const pose = $derived(
    hunt?.over === 'win' ? 'down' :
    intent === 'dazed' ? 'dazed' : intent === 'swallow' || intent === 'gulp' ? 'swallow' : intent === 'gape' ? 'gape' :
    inside || intent === 'digest' ? 'digest' : intent === 'lash' ? 'lash' : intent === 'slam' || intent === 'snap' ? 'slam' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const jaw = $derived(part('jaw')), sac = $derived(part('sac')), warts = $derived(part('warts'));
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  const SLAM: Keyframe[] = [{ transform: 'translateY(0)' }, { transform: 'translateY(-40px) scale(1.04)', offset: 0.35 }, { transform: 'translateY(6px) scaleY(.94)', offset: 0.6 }, { transform: 'translateY(0)' }];
  oneShots(() => rig, () => hunt, i => (i === 'slam' ? SLAM : LUNGE));
</script>

<svg class="wc bj pose-{pose}" class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Bogjaw, a mire grappler{inside ? ', with you inside it' : ''}">
  <defs><clipPath id="{uid}b"><path d={BODY} /></clipPath></defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <g class="rig" bind:this={rig}>
    <g class="breath">
      <!-- back leg -->
      <path d="M780 430 L812 512" stroke={INK} stroke-width="84" stroke-linecap="round" /><path d="M780 430 L812 512" stroke={FAR} stroke-width="70" stroke-linecap="round" />
      <path data-foot d="M780 530 q38 -26 76 0 Z" fill={INK} />
      <!-- body, warts, moss -->
      {#if warts.on}<path d={BODY} fill="none" stroke={GOLD} stroke-width="26" opacity=".5" />{/if}
      <path d={BODY} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
      <g clip-path="url(#{uid}b)"><path d={bodyHatch} stroke={INK} stroke-width="5" stroke-linecap="round" /></g>
      {#each WARTS as [x, y, r]}
        {#if warts.broke}<path d="M{x - r * .6} {y + r * .4} l{r * .3} -{r * .5} l{r * .3} {r * .3} l{r * .3} -{r * .4} l{r * .3} {r * .6} Z" fill={STONE} stroke={INK} stroke-width="6" stroke-linejoin="round" />
        {:else}<circle cx={x} cy={y} {r} fill={STONE} stroke={INK} stroke-width="7" />{/if}
      {/each}
      <path d="M440 300 C470 286 500 292 516 310 M660 300 C690 292 724 302 740 324" fill="none" stroke={MOSS} stroke-width="12" stroke-linecap="round" />
      <!-- front leg -->
      <path d="M360 452 L330 514" stroke={INK} stroke-width="70" stroke-linecap="round" /><path d="M360 452 L330 514" stroke={BONE} stroke-width="56" stroke-linecap="round" />
      <path data-foot d="M291 530 q35 -26 70 0 Z" fill={INK} />
      <!-- head: upper head with the eyes, and a lower jaw hinged at the back -->
      <g class="head" style="transform-origin:404px 430px">
        <g class="lower" style="transform-origin:404px 436px">
          {#if jaw.on}<path d={LOWER} fill="none" stroke={GOLD} stroke-width="24" opacity=".55" />{/if}
          <path d={LOWER} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
          {#each TEETH_UP as x}<path d="M{x} {452 - (x - 140) * .02} l9 -13 l9 13" fill={BONE} stroke={INK} stroke-width="4" stroke-linejoin="round" />{/each}
          {#if jaw.broke}<path d="M200 470 l18 14 l-6 10 l20 8" fill="none" stroke={EMBER} stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />{/if}
        </g>
        <path class="tongue" d="M170 446 C110 452 76 432 72 392 C70 360 92 340 112 352 C124 360 116 374 104 370 C96 382 104 420 170 434 Z" fill={TONGUE} stroke={INK} stroke-width="6" stroke-linejoin="round" />
        <g class="upper" style="transform-origin:404px 436px">
          <path d={UPPER} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
          {#each TEETH_UP as x}<path d="M{x} {442 - (x - 140) * .02} l9 13 l9 -13" fill={BONE} stroke={INK} stroke-width="4" stroke-linejoin="round" />{/each}
          <circle cx="246" cy="318" r="30" fill={BONE} stroke={INK} stroke-width="8" /><circle class="eye" cx="240" cy="316" r="12" fill={enraged ? EMBER : INK} />
          <circle cx="336" cy="322" r="24" fill={BONE} stroke={INK} stroke-width="8" /><circle class="eye" cx="332" cy="320" r="9" fill={enraged ? EMBER : INK} />
        </g>
        <g class="stars" style="transform-origin:290px 270px"><path d={star(200, 260, 40)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(360, 240, 34)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(290, 300, 24)} fill={GOLD} stroke={INK} stroke-width="6" /></g>
      </g>
      <!-- throat sac: swells when you're inside, slack and torn once broken -->
      <g class="sac" style="transform-origin:372px 470px">
        {#if sac.on}<ellipse cx="372" cy="494" rx="78" ry="38" fill="none" stroke={GOLD} stroke-width="22" opacity=".55" />{/if}
        <ellipse cx="372" cy="494" rx="66" ry="28" fill={sac.broke ? MUD : BONE2} stroke={INK} stroke-width="8" />
        {#if sac.broke}<path d="M330 490 l14 -10 l10 12 l16 -12 l12 10 l16 -8" fill="none" stroke={EMBER} stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />{/if}
      </g>
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 590px 530px; }
  .breath { transform-origin: 590px 530px; animation: wc-breathe 3.4s ease-in-out infinite; }
  .head, .lower, .upper, .sac, .tongue { transform-box: view-box; transition: transform .35s ease, opacity .25s ease; }
  .tongue { opacity: 0; transform-origin: 170px 440px; }
  /* Tongue Lash: the tongue uncoils from the mouth */
  .pose-lash .tongue { opacity: 1; animation: lash 1s ease-in-out infinite; }
  @keyframes lash { 0%, 100% { transform: rotate(8deg) scale(.85); } 50% { transform: rotate(-6deg) scale(1.08); } }
  /* Body Slam: squats low, ready to heave (squash stays on the ground) */
  .pose-slam .breath { animation: none; transform: scaleY(.9) scaleX(1.03); }
  /* Gape and Swallow: the jaw drops wide open */
  .pose-gape .lower { transform: rotate(-12deg); }
  .pose-gape .upper { transform: rotate(5deg); }
  .pose-gape .breath { animation: wc-breathe 1.6s ease-in-out infinite; }
  .pose-swallow .lower { transform: rotate(-15deg); }
  .pose-swallow .upper { transform: rotate(7deg); }
  .pose-swallow .head { transform: translateX(-16px); }
  /* Digest: you're inside, the throat sac bulges and churns */
  .pose-digest .sac { animation: churn 1.4s ease-in-out infinite; }
  @keyframes churn { 0%, 100% { transform: scale(1.35, 1.25); } 50% { transform: scale(1.5, 1.4); } }
  /* dazed: reeling, stars */
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  .pose-dazed .lower { transform: rotate(-5deg); }
  /* beaten */
  .pose-down .breath { animation: none; transform: scaleY(.84); filter: saturate(.55) brightness(.8); }
  .pose-down .lower { transform: rotate(-4deg); }
</style>
