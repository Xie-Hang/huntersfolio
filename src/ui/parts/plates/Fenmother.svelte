<script lang="ts">
  // The Fenmother, hot-spring toad (the rank E → D promotion hunt, Nov 2026), in the woodcut style. Drawn facing
  // left in a 1000 × 600 space and mirrored by CSS. A vast squat toad sitting up in a steaming spring: bulging eyes,
  // a wide mouth, a throat sac under the chin, frilled gills fanning back from behind its cheek, ember spots on its back.
  // Gape: the jaw drops wide. Swallow: wider, lunging. Digest: jaw shut, the sac pulsing (you're inside). Scalding
  // Belch: the sac swells and glows. Steam (the images): it sinks low, steam pours off it and its outline doubles.
  // Broken parts: a split sac, grey drooping gills, a cracked skull.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, FAR, GOLD, EMBER, MUD, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();
  const SKIN = '#c9a98c', SAC = '#e0956a', SPRING = '#6f8c8a';

  const BODY = 'M336 470 C300 360 380 236 548 224 C724 214 846 320 838 452 C834 502 786 522 724 522 L404 522 C356 518 342 498 336 470 Z';
  const HEAD = 'M196 332 C196 254 276 204 380 204 C476 204 528 254 528 324 C528 384 474 414 382 416 C290 418 196 404 196 332 Z';
  const LOWER = 'M204 344 C280 376 410 380 508 346 C504 392 446 426 370 430 C286 432 214 404 204 344 Z';
  // frilled gills fanning back from behind the cheek, like an axolotl's: three fronds (upper, middle, lower)
  const GILLS = [
    'M510 296 C556 262 604 248 648 242 L622 266 L660 272 L626 288 L652 302 C604 304 560 308 512 320 Z',
    'M514 326 C568 318 628 318 676 328 L644 342 L682 354 L640 362 C600 356 560 350 514 348 Z',
    'M510 352 C554 364 598 384 636 410 L604 408 L624 432 L586 420 C564 402 538 386 508 374 Z'
  ];
  const GILL_VEINS = 'M520 304 C566 280 606 266 640 256 M522 336 C576 332 628 334 668 340 M520 362 C560 378 592 396 620 418';
  // broken: torn short and hanging limp
  const GILLS_LIMP = [
    'M512 316 C540 312 566 318 586 332 L560 334 L574 350 C552 340 532 334 512 332 Z',
    'M512 346 C534 360 550 380 558 404 L538 394 L536 414 C526 390 518 372 508 362 Z'
  ];
  const SPOTS = [[700, 250, 16], [770, 312, 20], [800, 394, 14], [726, 372, 12]] as const;
  const STEAM = Array.from({ length: 9 }, (_, i) => ({ x: 240 + i * 80 + ((i * 31) % 26), y: 480 - ((i * 47) % 60), d: (i % 5) * 0.4 }));
  const bodyHatch = hatchLines(336, 846, 380, 526, 14, -30);
  const uid = `fm${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const inside = $derived((m?.gut ?? 0) > 0);
  const steaming = $derived((m?.mirage ?? 0) > 0);
  const pose = $derived(
    hunt?.over === 'win' ? 'down' :
    intent === 'dazed' ? 'dazed' : intent === 'swallow' ? 'swallow' : intent === 'gape' ? 'gape' :
    inside || intent === 'digest' ? 'digest' : intent === 'belch' ? 'belch' : intent === 'steam' ? 'steam' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const sac = $derived(part('sac')), gills = $derived(part('gills')), head = $derived(part('head'));
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  oneShots(() => rig, () => hunt, () => LUNGE);
</script>

<svg class="wc fm pose-{pose}" class:static={!hunt} class:steaming viewBox="60 40 940 520" role="img" aria-label="Engraving of the Fenmother, a vast hot-spring toad{inside ? ', with you inside it' : ''}{steaming ? ', hidden in steam' : ''}">
  <defs><clipPath id="{uid}b"><path d={BODY} /></clipPath></defs>
  <!-- the hot spring it sits in -->
  <path d="M120 530 C260 506 760 506 940 530" fill={SPRING} opacity=".35" stroke="#4d4136" stroke-width="5" />
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <g class="rig" bind:this={rig}>
    <g class="breath">
      <!-- in the steam its outline doubles, like the Mistglass's images -->
      <g class="ghost" aria-hidden="true"><path d={BODY} fill="none" stroke={BONE2} stroke-width="5" stroke-dasharray="14 12" transform="translate(70 -10)" /><path d={HEAD} fill="none" stroke={BONE2} stroke-width="5" stroke-dasharray="14 12" transform="translate(70 -10)" /></g>
      <!-- hind leg -->
      <path d="M720 440 C800 430 840 480 820 520 L700 520 C700 490 700 460 720 440 Z" fill={SKIN} stroke={INK} stroke-width="9" stroke-linejoin="round" />
      <path d={BODY} fill={SKIN} stroke={INK} stroke-width="10" stroke-linejoin="round" />
      <g clip-path="url(#{uid}b)"><path d={bodyHatch} stroke={INK} stroke-width="4" stroke-linecap="round" opacity=".5" /></g>
      {#each SPOTS as [x, y, r]}<circle cx={x} cy={y} r={r} fill={EMBER} stroke={INK} stroke-width="5" opacity=".9" />{/each}
      <g class="gills" style="transform-origin:510px 336px">
        {#each gills.broke ? GILLS_LIMP : GILLS as d}
          {#if gills.on}<path {d} fill="none" stroke={GOLD} stroke-width="22" stroke-linejoin="round" opacity=".55" />{/if}
          <path {d} fill={gills.broke ? FAR : BONE} stroke={INK} stroke-width="7" stroke-linejoin="round" />
        {/each}
        {#if !gills.broke}<path d={GILL_VEINS} fill="none" stroke={EMBER} stroke-width="4" stroke-linecap="round" />{/if}
      </g>
      <!-- front legs -->
      <path d="M300 400 C290 450 280 490 270 520 L340 520 C344 480 346 440 352 410 Z" fill={SKIN} stroke={INK} stroke-width="9" stroke-linejoin="round" />
      <path d="M430 410 C434 450 432 490 426 520 L494 520 C496 480 494 440 488 412 Z" fill={SKIN} stroke={INK} stroke-width="9" stroke-linejoin="round" />
      <path data-foot d="M270 520 l-26 4 M300 520 l-10 6 M426 520 l-24 4 M456 520 l-8 6" stroke={INK} stroke-width="7" stroke-linecap="round" />
      <!-- throat sac -->
      <g class="sac">
        {#if sac.on}<ellipse cx="350" cy="424" rx="98" ry="54" fill="none" stroke={GOLD} stroke-width="24" opacity=".55" />{/if}
        <ellipse class="sacbody" cx="350" cy="424" rx="92" ry="48" fill={SAC} stroke={INK} stroke-width="8" />
        {#if sac.broke}<path d="M300 404 l20 22 l-12 14 l24 16 M380 400 l-8 20" fill="none" stroke={INK} stroke-width="6" stroke-linecap="round" />{/if}
      </g>
      <g class="head" style="transform-origin:420px 330px">
        {#if head.on}<path d={HEAD} fill="none" stroke={GOLD} stroke-width="26" stroke-linejoin="round" opacity=".5" />{/if}
        <g class="jaw" style="transform-origin:500px 344px"><path d={LOWER} fill={BONE2} stroke={INK} stroke-width="9" stroke-linejoin="round" /><path d="M240 376 C300 398 400 400 480 372" fill="none" stroke={EMBER} stroke-width="10" stroke-linecap="round" opacity=".8" /></g>
        <path d={HEAD} fill={SKIN} stroke={INK} stroke-width="10" stroke-linejoin="round" />
        <path d="M206 342 C282 374 410 378 508 346" fill="none" stroke={INK} stroke-width="8" stroke-linecap="round" />
        <!-- bulging eyes -->
        <circle cx="300" cy="214" r="34" fill={BONE} stroke={INK} stroke-width="8" /><circle cx="396" cy="200" r="38" fill={BONE} stroke={INK} stroke-width="8" />
        <ellipse cx="292" cy="216" rx="12" ry="16" fill={enraged ? EMBER : INK} /><ellipse cx="388" cy="202" rx="13" ry="18" fill={enraged ? EMBER : INK} />
        <path d="M232 300 q8 -6 16 0 M260 290 q8 -6 16 0" fill="none" stroke={INK} stroke-width="5" stroke-linecap="round" />
        {#if head.broke}<path d="M340 250 l16 22 l-14 12 l18 20" fill="none" stroke={EMBER} stroke-width="7" stroke-linecap="round" />{/if}
        <g class="stars" style="transform-origin:340px 160px"><path d={star(280, 150, 32)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(420, 128, 26)} fill={GOLD} stroke={INK} stroke-width="6" /></g>
      </g>
    </g>
  </g>
  <g class="fx steam" aria-hidden="true">
    {#each STEAM as p}<ellipse cx={p.x} cy={p.y} rx="44" ry="26" fill={BONE} opacity=".22" style="animation-delay:{p.d}s" />{/each}
  </g>
  <g class="fx belchfx" aria-hidden="true"><ellipse cx="150" cy="360" rx="60" ry="34" fill={EMBER} opacity=".5" /><ellipse cx="110" cy="330" rx="40" ry="24" fill={BONE} opacity=".4" /></g>
</svg>

<style>
  .rig { transform-origin: 560px 530px; }
  .breath { transform-origin: 560px 530px; animation: wc-breathe 3.4s ease-in-out infinite; }
  .jaw, .gills, .sac, .head { transform-box: view-box; transition: transform .35s ease; }
  .sac { transform-origin: 350px 424px; }
  .ghost { opacity: 0; transition: opacity .4s ease; }
  .steam ellipse { animation: wc-puff 3.2s ease-out infinite; transform-box: view-box; opacity: .12; }
  .belchfx { opacity: 0; }
  .gills { animation: fm-fan 2.6s ease-in-out infinite; }
  @keyframes fm-fan { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-6deg); } }
  .static .steam ellipse { animation: none; opacity: .1; }

  /* gape and swallow: the jaw drops */
  .pose-gape .jaw { transform: rotate(-16deg); }
  .pose-swallow .jaw { transform: rotate(-26deg); }
  .pose-swallow .head { transform: translate(-20px, 6px); }
  /* digest: jaw shut, the sac pulsing */
  .pose-digest .sac { animation: fm-pulse .9s ease-in-out infinite; }
  @keyframes fm-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.16, 1.22); } }
  /* scalding belch: the sac swells and glows, a burst of boiling water */
  .pose-belch .sac { transform: scale(1.22, 1.3); }
  .pose-belch .sacbody { animation: wc-glow .5s ease-in-out infinite; }
  .pose-belch .belchfx { opacity: 1; animation: wc-puff 1s ease-out infinite; }
  /* the steam: it sinks low, the steam pours off it and its outline doubles */
  .steaming .steam ellipse, .pose-steam .steam ellipse { opacity: .5; animation-duration: 1.8s; }
  .steaming .ghost, .pose-steam .ghost { opacity: .7; animation: fm-drift 2.4s ease-in-out infinite; }
  .pose-steam .breath { transform: translateY(30px) scaleY(.94); animation: none; }
  @keyframes fm-drift { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-30px); } }
  /* dazed */
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  /* beaten */
  .pose-down .breath { animation: none; transform: scaleY(.86); filter: saturate(.55) brightness(.8); }
  .pose-down .jaw { transform: rotate(-10deg); }
  @media (prefers-reduced-motion: reduce) { .breath, .gills, .sac, .ghost, .steam ellipse, .belchfx, .sacbody { animation: none !important; } }
</style>
