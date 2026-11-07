<script lang="ts">
  // The Cinderpup, a Cinderback pup (the Foothills, Nov 2026), in the woodcut style. A baby, not a small adult: a
  // tall round shell, its vents only bumps and still cool, a big head with a soft snout, one oversized digging paw.
  // Drawn facing left in a 1000 × 600 space and flipped. Poses: breathing; digging (paw going, earth flying);
  // underground (sunk below the ground line, a warm mound marks it); reeling when stunned or dazed; flat when beaten.
  // Its Snout lights up when aimed at.
  import type { Hunt } from '../../../engine';
  import { oneShots, INK, BONE, BONE2, FAR, GOLD, EMBER, MUD, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();

  const SHELL = 'M440 420 C440 320 510 250 610 248 C710 246 790 316 796 420 Z';
  const BANDS = 'M470 350 C540 326 680 326 770 350 M500 294 C560 278 660 278 730 294';
  const BUMPS: [number, number][] = [[556, 246], [636, 238], [712, 262]];
  const HEAD = 'M470 380 C462 334 420 310 368 312 C312 314 266 340 250 376 C238 404 250 432 284 440 C330 450 400 448 444 434 C468 424 474 402 470 380 Z';
  const SNOUT = 'M262 382 C230 380 204 390 198 408 C194 424 210 434 236 434 C258 434 274 426 280 414 Z';
  const CLAWS = 'M330 512 l-34 -6 l30 -10 l-34 -12 l32 -6 l-26 -16 l40 8 Z';
  const bodyHatch = hatchLines(430, 820, 360, 430, 13, -30);
  const uid = `cp${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const under = $derived(!!m?.under);
  const pose = $derived(
    hunt?.over === 'win' ? 'down' : intent === 'dazed' || intent === 'stunned' ? 'dazed' : under ? 'under' : intent === 'dig' ? 'dig' : 'idle');
  const snout = $derived(hunt ? { on: hunt.target === 'snout' && !hunt.over, broke: !!m?.parts.snout?.broken } : { on: false, broke: false });
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  oneShots(() => rig, () => hunt);
</script>

<svg class="wc cp pose-{pose}" class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Cinderpup, a Cinderback pup{under ? ', underground' : ''}">
  <defs>
    <clipPath id="{uid}g"><rect x="0" y="0" width="1000" height="532" /></clipPath>
    <clipPath id="{uid}s"><path d={SHELL} /></clipPath>
  </defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <!-- the warm mound it leaves when it digs in -->
  <g class="mound">
    <path d="M440 532 C470 476 650 476 680 532 Z" fill={MUD} stroke={INK} stroke-width="8" />
    <path d="M510 520 l14 -18 l-6 -12 M590 522 l-10 -18 l14 -10" fill="none" stroke={EMBER} stroke-width="6" stroke-linecap="round" opacity=".7" />
  </g>
  <g clip-path="url(#{uid}g)">
    <g class="rig" bind:this={rig}>
      <g class="sink">
        <g class="breath">
          <!-- back leg -->
          <path d="M740 420 L756 510" stroke={INK} stroke-width="54" stroke-linecap="round" /><path d="M740 420 L756 510" stroke={FAR} stroke-width="40" stroke-linecap="round" />
          <path d="M734 508 h44 l4 14 h-52 Z" fill={INK} />
          {#each BUMPS as [x, y]}<path d="M{x - 20} {y + 18} L{x - 10} {y - 12} L{x + 10} {y - 12} L{x + 20} {y + 18} Z" fill={BONE2} stroke={INK} stroke-width="7" stroke-linejoin="round" /><ellipse cx={x} cy={y - 12} rx="7" ry="4" fill={EMBER} opacity=".6" />{/each}
          <path d={SHELL} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
          <g clip-path="url(#{uid}s)"><path d={bodyHatch} stroke={INK} stroke-width="5" stroke-linecap="round" /></g>
          <path d={BANDS} fill="none" stroke={INK} stroke-width="7" stroke-linecap="round" />
          <path d="M436 420 H800" stroke={INK} stroke-width="10" stroke-linecap="round" />
          <!-- the big digging paw -->
          <g class="leg paw" style="transform-origin:420px 430px">
            <path d="M420 430 L360 500" stroke={INK} stroke-width="62" stroke-linecap="round" /><path d="M420 430 L360 500" stroke={BONE} stroke-width="48" stroke-linecap="round" />
            <path data-foot d={CLAWS} fill={BONE2} stroke={INK} stroke-width="6" stroke-linejoin="round" />
          </g>
          <g class="head" style="transform-origin:440px 420px">
            <path d={HEAD} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
            {#if snout.on}<path d={SNOUT} fill="none" stroke={GOLD} stroke-width="24" stroke-linejoin="round" opacity=".55" />{/if}
            <path d={SNOUT} fill={snout.broke ? BONE2 : BONE} stroke={INK} stroke-width="8" stroke-linejoin="round" />
            <ellipse cx="206" cy="406" rx="5" ry="7" fill={INK} />
            {#if snout.broke}<path d="M222 392 l10 10 l-8 8 l12 10" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />{/if}
            <!-- a pup's big eye -->
            <circle cx="344" cy="370" r="20" fill={enraged ? EMBER : INK} /><circle cx="337" cy="363" r="7" fill={BONE} />
            <path d="M246 428 C276 424 306 424 332 430" fill="none" stroke={INK} stroke-width="6" stroke-linecap="round" />
            <g class="stars" style="transform-origin:330px 260px"><path d={star(250, 270, 30)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(400, 240, 24)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(330, 300, 18)} fill={GOLD} stroke={INK} stroke-width="6" /></g>
          </g>
          <g class="fx clods"><circle cx="300" cy="470" r="12" fill={MUD} /><circle cx="262" cy="444" r="9" fill={MUD} /><circle cx="330" cy="436" r="8" fill={MUD} /></g>
        </g>
      </g>
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 600px 530px; }
  .sink { transform-box: view-box; transition: transform .5s cubic-bezier(.5,0,.3,1); }
  .breath { transform-origin: 600px 530px; animation: wc-breathe 2.6s ease-in-out infinite; }
  .head, .paw { transition: transform .35s ease; }
  .mound { opacity: 0; transition: opacity .4s ease; }
  .clods { opacity: 0; }
  /* digging: head down, paw going, earth flying */
  .pose-dig .head { transform: translate(-4px, 20px) rotate(-10deg); }
  .pose-dig .paw { animation: dig .35s ease-in-out infinite; }
  .pose-dig .clods { animation: clods .7s ease-out infinite; }
  @keyframes dig { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(30deg); } }
  @keyframes clods { 0% { opacity: 1; transform: translate(0, 0); } 100% { opacity: 0; transform: translate(-60px, -90px); } }
  /* underground: sunk below the ground line (clipped), a mound marks it */
  .pose-under .sink { transform: translateY(330px); }
  .pose-under .mound { opacity: 1; }
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  .pose-down .breath { animation: none; transform: scaleY(.88); filter: saturate(.55) brightness(.8); }
  .pose-down .head { transform: translate(-10px, 26px) rotate(-12deg); }
</style>
