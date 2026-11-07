<script lang="ts" module>
  export type Place = { id: string; name: string; tag: string; open: boolean; fresh: number; here: boolean };
</script>

<script lang="ts">
  // The world map on the Hunt Board (Nov 2026 playtest: "a map instead" of the list). Six places in woodcut ink: the
  // Foothills at the bottom, Ashfall Ridge above them, the Mirewood west, the Gloamhollow beyond it, the Stormspire
  // north and the Caldera north-east. A place you can't hunt yet is under fog. Selecting a place lists its monsters
  // beside the map (Board.svelte). Drawn in one SVG so it scales with the column and stays sharp.
  let { places, sel, onpick }: { places: Place[]; sel: string; onpick: (id: string) => void } = $props();
  const P = $derived(Object.fromEntries(places.map(p => [p.id, p])) as Record<string, Place>);

  // where each place sits (its glyph centre) and where its label goes
  const AT: Record<string, { x: number; y: number; lx: number; ly: number; rx: number; ry: number }> = {
    foothills: { x: 500, y: 585, lx: 500, ly: 648, rx: 150, ry: 62 },
    ridge: { x: 505, y: 405, lx: 505, ly: 472, rx: 150, ry: 78 },
    mire: { x: 235, y: 395, lx: 235, ly: 470, rx: 135, ry: 80 },
    gloam: { x: 205, y: 170, lx: 205, ly: 245, rx: 120, ry: 78 },
    spire: { x: 520, y: 160, lx: 520, ly: 255, rx: 110, ry: 95 },
    caldera: { x: 800, y: 265, lx: 800, ly: 345, rx: 125, ry: 82 }
  };
  // the trails between them (from, to, a bend)
  const TRAILS: [string, string, number, number][] = [
    ['foothills', 'ridge', 520, 520], ['ridge', 'mire', 360, 420], ['mire', 'gloam', 230, 300],
    ['ridge', 'spire', 470, 300], ['spire', 'caldera', 690, 200], ['ridge', 'caldera', 680, 380]
  ];
  const trail = (a: string, b: string, cx: number, cy: number) => `M${AT[a].x} ${AT[a].y} Q${cx} ${cy} ${AT[b].x} ${AT[b].y}`;
  const key = (e: KeyboardEvent, id: string) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onpick(id); } };

  // a few trees for the Mirewood, mushrooms for the Gloamhollow (fixed, so the map doesn't shift between visits)
  const TREES = [[170, 380], [200, 352], [232, 372], [262, 345], [290, 380], [188, 418], [250, 410], [312, 415]];
  const CAPS = [[160, 168, 16], [200, 150, 22], [246, 172, 15], [180, 198, 11], [228, 200, 12]];
</script>

<svg class="wmap" viewBox="0 0 1000 680" role="group" aria-label="The hunting grounds">
  <defs>
    <pattern id="wm-sea" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
      <path d="M0 7 q3.5 -3 7 0 t7 0" fill="none" stroke="var(--line-2)" stroke-width="1" />
    </pattern>
    <pattern id="wm-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" stroke="var(--bone)" stroke-width="1.2" opacity=".55" />
    </pattern>
    <filter id="wm-fog" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14" /></filter>
    <radialGradient id="wm-glow"><stop offset="0" stop-color="var(--ember)" stop-opacity=".75" /><stop offset="1" stop-color="var(--ember)" stop-opacity="0" /></radialGradient>
  </defs>

  <!-- sea, then the land: one coast drawn by hand -->
  <rect x="0" y="0" width="1000" height="680" fill="#16120f" />
  <rect x="0" y="0" width="1000" height="680" fill="url(#wm-sea)" opacity=".7" />
  <path class="land" d="M72 318 L60 286 L74 262 L66 232 L88 206 L84 176 L108 150 L120 118 L150 104 L168 80 L204 78 L232 62 L268 70 L300 56 L338 66 L372 60 L398 76 L430 64 L462 70 L488 50 L522 54 L556 40 L590 56 L622 52 L650 74 L684 82 L704 106 L744 110 L774 124 L812 122 L846 142 L884 152 L906 182 L932 204 L928 238 L948 266 L936 300 L948 330 L922 356 L906 390 L872 404 L846 428 L806 432 L776 452 L742 462 L722 488 L712 524 L690 548 L686 584 L654 606 L640 638 L600 648 L566 668 L524 660 L486 672 L452 660 L414 664 L388 642 L360 630 L348 600 L322 586 L310 556 L280 540 L246 534 L222 516 L186 512 L160 494 L132 486 L114 460 L96 444 L94 414 L76 392 L82 358 Z" />
  <path class="coast" d="M72 318 L60 286 L74 262 L66 232 L88 206 L84 176 L108 150 L120 118 L150 104 L168 80 L204 78 L232 62 L268 70 L300 56 L338 66 L372 60 L398 76 L430 64 L462 70 L488 50 L522 54 L556 40 L590 56 L622 52 L650 74 L684 82 L704 106 L744 110 L774 124 L812 122 L846 142 L884 152 L906 182 L932 204 L928 238 L948 266 L936 300 L948 330 L922 356 L906 390 L872 404 L846 428 L806 432 L776 452 L742 462 L722 488 L712 524 L690 548 L686 584 L654 606 L640 638 L600 648 L566 668 L524 660 L486 672 L452 660 L414 664 L388 642 L360 630 L348 600 L322 586 L310 556 L280 540 L246 534 L222 516 L186 512 L160 494 L132 486 L114 460 L96 444 L94 414 L76 392 L82 358 Z" transform="translate(500 340) scale(1.025) translate(-500 -340)" />

  <!-- trails -->
  {#each TRAILS as [a, b, cx, cy]}
    <path class="trail" class:dim={!P[a]?.open || !P[b]?.open} d={trail(a, b, cx, cy)} />
  {/each}

  <!-- the places -->
  {#each places as p (p.id)}
    {@const a = AT[p.id]}
    {@const w = Math.max(p.name.length * 14, ((p.open ? p.tag : `${p.tag} · fogged`) + (p.fresh ? ` · ${p.fresh} new` : '')).length * 8.6) + 36}
    <g class="place" class:open={p.open} class:sel={sel === p.id} role="button" tabindex="0" aria-pressed={sel === p.id}
      aria-label="{p.name}, {p.tag}{p.open ? '' : ', not open yet'}" data-region={p.id}
      onclick={() => onpick(p.id)} onkeydown={(e) => key(e, p.id)}>
      <ellipse class="hit" cx={a.x} cy={a.y + 10} rx={a.rx} ry={a.ry} />
      <ellipse class="ring" cx={a.x} cy={a.y + 10} rx={a.rx - 6} ry={a.ry - 6} />
      <g class="glyph">
        {#if p.id === 'foothills'}
          <path d="M370 610 q40 -46 80 0 q40 -60 90 0 q35 -40 70 0 q30 -30 60 0" class="ink" />
          <path d="M390 600 l14 -8 M470 596 l16 -12 M560 600 l12 -8" class="ink thin" />
          <path d="M420 625 h160" class="ink thin" />
        {:else if p.id === 'ridge'}
          <path d="M375 450 L415 395 L440 420 L478 352 L505 392 L535 340 L566 398 L590 378 L635 450 Z" class="peak" />
          <path d="M478 352 L470 450 M535 340 L540 450 M415 395 L420 450" class="ink thin" />
          <path d="M440 420 L455 450 M505 392 L500 450 M590 378 L600 450" class="ink thin" opacity=".6" />
          <path d="M535 338 c-10 -16 6 -24 0 -40 c-6 -16 12 -24 6 -42" class="ink thin ash" />
          <circle cx="545" cy="252" r="9" class="ash" /><circle cx="560" cy="236" r="6" class="ash" />
        {:else if p.id === 'mire'}
          {#each TREES as [x, y]}<path d="M{x} {y - 30} L{x - 12} {y} L{x + 12} {y} Z M{x} {y} v8" class="peak" />{/each}
          <path d="M150 440 q15 -6 30 0 t30 0 M230 448 q15 -6 30 0 t30 0 M180 455 q12 -5 24 0" class="ink thin" />
        {:else if p.id === 'gloam'}
          <ellipse cx="205" cy="200" rx="95" ry="26" class="hollow" />
          {#each CAPS as [x, y, r]}<path d="M{x - r} {y} a{r} {r * .8} 0 0 1 {r * 2} 0 Z M{x} {y} v{r * .9}" class="peak" />{/each}
          <circle cx="172" cy="136" r="2.5" class="spore" /><circle cx="228" cy="128" r="2" class="spore" /><circle cx="252" cy="146" r="2.5" class="spore" />
        {:else if p.id === 'spire'}
          <path d="M470 230 L495 120 L505 140 L520 60 L536 140 L546 112 L572 230 Z" class="peak" />
          <path d="M520 60 L520 230 M495 120 L492 230 M546 112 L550 230" class="ink thin" />
          <path d="M580 70 l-14 26 h12 l-16 30" class="bolt" />
          <path d="M455 70 q20 -14 40 0 q16 -10 30 0" class="ink thin" opacity=".6" />
        {:else if p.id === 'caldera'}
          <circle cx="800" cy="232" r="60" fill="url(#wm-glow)" class="glow" />
          <path d="M720 300 L776 232 L824 232 L880 300 Z" class="peak" />
          <path d="M776 232 q24 12 48 0" class="ink" />
          <path d="M790 300 L798 240 M812 300 L806 240" class="ink thin" />
          <path d="M786 222 c-6 -14 8 -20 2 -34 M812 220 c6 -14 -6 -22 2 -36" class="ink thin ash" />
        {/if}
      </g>
      {#if !p.open}
        <!-- fog: soft cloud over the place, hatched -->
        <ellipse class="fog" cx={a.x} cy={a.y} rx={a.rx * .9} ry={a.ry * .8} filter="url(#wm-fog)" />
        <ellipse class="foghatch" cx={a.x} cy={a.y} rx={a.rx * .7} ry={a.ry * .6} />
      {/if}
      <g class="label" transform="translate({a.lx} {a.ly})">
        <rect x={-w / 2} y="-24" width={w} height="50" rx="3" class="plaque" />
        <text class="nm" y="0" text-anchor="middle">{p.name}</text>
        <!-- monsters not yet hunted are said in words, not a dot (Mekkman, Nov 2026: "what is the yellow circle?") -->
        <text class="tg" y="18" text-anchor="middle">{p.open ? p.tag : `${p.tag} · fogged`}{#if p.fresh}<tspan class="new">&#160;· {p.fresh} new</tspan>{/if}</text>
      </g>
      {#if p.here}
        <!-- your next hunt is here: a small flag -->
        <g class="flag" transform="translate({a.x + a.rx * .55} {a.y - a.ry * .55})"><path d="M0 0 v-30" /><path d="M0 -30 l18 6 l-18 6 z" class="cloth" /></g>
      {/if}
    </g>
  {/each}

  <!-- a compass, for the woodcut map feel -->
  <g class="compass" transform="translate(920 600)"><circle r="28" /><path d="M0 -24 L6 0 L0 24 L-6 0 Z" /><text y="-32" text-anchor="middle">N</text></g>
</svg>

<style>
  .wmap { display: block; width: 100%; height: auto; border: 1px solid var(--mat-plate-rule, var(--line)); border-radius: 3px; user-select: none; }
  .land { fill: #221b15; stroke: var(--bone-edge); stroke-width: 2.5; }
  .coast { fill: none; stroke: var(--bone-edge); stroke-width: 1; opacity: .45; stroke-dasharray: 2 6; }
  .trail { fill: none; stroke: var(--soft); stroke-width: 2; stroke-dasharray: 2 9; stroke-linecap: round; opacity: .75; }
  .trail.dim { opacity: .2; }
  .ink { fill: none; stroke: var(--bone); stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; }
  .ink.thin { stroke-width: 1.6; }
  .ink.ash, .ash { opacity: .5; }
  circle.ash { fill: none; stroke: var(--bone); stroke-width: 1.5; }
  .peak { fill: #2e251d; stroke: var(--bone); stroke-width: 2.6; stroke-linejoin: round; }
  .hollow { fill: #120e0b; stroke: var(--bone-edge); stroke-width: 1.5; }
  .spore { fill: var(--daze); opacity: .7; }
  .bolt { fill: none; stroke: var(--gold-hi); stroke-width: 3; stroke-linejoin: round; }
  .glow { opacity: .8; }
  .place { cursor: pointer; outline: none; }
  .hit { fill: transparent; }
  .ring { fill: none; stroke: transparent; stroke-width: 2; stroke-dasharray: 6 6; transition: stroke .15s; }
  .place:hover .ring, .place:focus-visible .ring { stroke: var(--soft); }
  .place.sel .ring { stroke: var(--gold); stroke-width: 2.5; }
  .place:not(.open) .glyph { opacity: .28; }
  .fog { fill: #8a8076; opacity: .22; pointer-events: none; }
  .foghatch { fill: url(#wm-hatch); opacity: .25; pointer-events: none; }
  .plaque { fill: var(--panel); stroke: var(--line-2); stroke-width: 1.5; }
  .place.sel .plaque { stroke: var(--gold); fill: #2b2219; }
  .place.open:hover .plaque { stroke: var(--soft); }
  .nm { font-family: 'IM Fell English', Georgia, serif; font-size: 25px; fill: var(--fg); }
  .tg { font-family: var(--f-body); font-size: 15px; font-weight: 600; letter-spacing: .04em; fill: var(--muted); }
  .place.sel .nm { fill: var(--gold-hi); }
  .place:not(.open) .nm { fill: var(--muted); }
  .tg .new { fill: var(--gold-hi); }
  .flag path { stroke: var(--bone); stroke-width: 2.5; fill: none; }
  .flag .cloth { fill: var(--ember); stroke: var(--ember); }
  .compass circle { fill: none; stroke: var(--bone-edge); stroke-width: 1.5; }
  .compass path { fill: var(--bone-edge); }
  .compass text { font-family: 'IM Fell English', Georgia, serif; font-size: 16px; fill: var(--muted); }
</style>
