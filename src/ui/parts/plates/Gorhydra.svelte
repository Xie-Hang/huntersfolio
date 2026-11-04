<script lang="ts">
  // The Gorhydra, Stormspire frost hydra, in the woodcut style (from the concept drawing). Facing left in
  // 1000 × 600, flipped. One heavy body, three necks.
  // Each head poses on its own from its move: Bite / Snap lunge, Frost Breath opens the jaw with a cloud, Crush
  // rears back, Reeling wobbles under stars. A broken head leaves a short neck ending in a stump: frosted while it
  // regrows (pulsing), scarred dark once sealed. Phase 2: frost spikes glow. Beaten: necks slump.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, FAR, GOLD, EMBER, FROST, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();

  const BODY = 'M520 400 C520 320 600 280 690 282 C790 284 850 340 850 410 C850 470 790 500 690 500 C600 500 520 470 520 400 Z';
  const TAIL = 'M800 380 C860 380 930 420 960 480 C900 470 850 460 800 460 Z';
  const bodyHatch = hatchLines(520, 860, 410, 502, 14, -30);
  const uid = `gh${Math.random().toString(36).slice(2, 7)}`;
  const HEADS = {
    left: { neck: 'M560 360 C500 300 470 220 430 170', stub: 'M560 360 C516 320 496 270 478 236', sx: 478, sy: 236, hx: 400, hy: 160, ox: 560, oy: 360 },
    middle: { neck: 'M580 380 C500 360 420 330 360 320', stub: 'M580 380 C520 364 470 348 440 342', sx: 440, sy: 342, hx: 320, hy: 316, ox: 580, oy: 380 },
    right: { neck: 'M590 410 C520 430 450 450 390 450', stub: 'M590 410 C540 426 494 440 458 444', sx: 458, sy: 444, hx: 350, hy: 450, ox: 590, oy: 410 }
  } as const;
  type K = keyof typeof HEADS;
  const headPath = (x: number, y: number) => `M${x - 50} ${y} C${x - 50} ${y - 30} ${x - 20} ${y - 46} ${x + 14} ${y - 42} C${x + 46} ${y - 36} ${x + 54} ${y - 6} ${x + 42} ${y + 18} C${x + 26} ${y + 34} ${x - 30} ${y + 34} ${x - 50} ${y} Z`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const acts = $derived.by(() => {
    const out: Record<string, string> = { left: 'idle', middle: 'idle', right: 'idle' };
    if (intent.includes(':')) for (const p of intent.split('|')) { const [k, v] = p.split(':'); out[k] = v; }
    for (const k of Object.keys(out)) if ((m?.reel?.[k] ?? 0) > 0) out[k] = 'reel';
    return out;
  });
  const state = (k: K) => (m?.sealed?.[k] ? 'sealed' : (m?.stump?.[k] ?? 0) > 0 ? 'stump' : m?.parts[k]?.broken ? 'stump' : 'head');
  const pose = $derived(hunt?.over === 'win' ? 'down' : intent === 'slam' ? 'slam' : 'idle');
  const on = (k: string) => !!hunt && hunt.target === k && !hunt.over;
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  oneShots(() => rig, () => hunt, () => LUNGE);
</script>

{#snippet head(key: K)}
  {@const H = HEADS[key]}
  {@const st = state(key)}
  <g class="neckhead {key} act-{acts[key]} st-{st}" style="transform-origin:{H.ox}px {H.oy}px">
    {#if st === 'head'}
      {#if on(key)}<path d={H.neck} fill="none" stroke={GOLD} stroke-width="72" stroke-linecap="round" opacity=".45" />{/if}
      <path d={H.neck} fill="none" stroke={INK} stroke-width="70" stroke-linecap="round" /><path d={H.neck} fill="none" stroke={BONE} stroke-width="54" stroke-linecap="round" />
      <g transform="translate({H.hx} {H.hy}) scale(1.32) translate({-H.hx} {-H.hy})">
      <g class="jaw" style="transform-origin:{H.hx + 20}px {H.hy + 10}px"><path d="M{H.hx - 46} {H.hy + 6} C{H.hx - 20} {H.hy + 30} {H.hx + 10} {H.hy + 30} {H.hx + 32} {H.hy + 14} Z" fill={BONE2} stroke={INK} stroke-width="6" stroke-linejoin="round" /></g>
      <path d={headPath(H.hx, H.hy)} fill={BONE} stroke={INK} stroke-width="8" stroke-linejoin="round" />
      <path d="M{H.hx - 48} {H.hy + 8} L{H.hx + 26} {H.hy + 2}" fill="none" stroke={INK} stroke-width="5" stroke-linecap="round" />
      <path d="M{H.hx - 42} {H.hy + 7} l4 13 l4 -12 M{H.hx - 26} {H.hy + 6} l4 12 l4 -11" fill={BONE} stroke={INK} stroke-width="3" stroke-linejoin="round" />
      <path d="M{H.hx - 26} {H.hy - 22} L{H.hx + 6} {H.hy - 14}" stroke={INK} stroke-width="6" stroke-linecap="round" />
      <path d="M{H.hx} {H.hy - 40} L{H.hx + 20} {H.hy - 82} L{H.hx + 30} {H.hy - 36} Z" fill={FROST} stroke={INK} stroke-width="6" stroke-linejoin="round" />
      <circle cx={H.hx - 10} cy={H.hy - 12} r="8" fill={enraged ? '#7fd4ff' : INK} /><circle cx={H.hx - 13} cy={H.hy - 15} r="2.5" fill={BONE} />
      <g class="breathcloud"><ellipse cx={H.hx - 90} cy={H.hy + 14} rx="40" ry="20" fill={FROST} opacity=".6" /><ellipse cx={H.hx - 130} cy={H.hy + 2} rx="30" ry="16" fill={FROST} opacity=".4" /></g>
      <g class="stars" style="transform-origin:{H.hx}px {H.hy - 70}px"><path d={star(H.hx - 30, H.hy - 70, 22)} fill={GOLD} stroke={INK} stroke-width="5" /><path d={star(H.hx + 34, H.hy - 84, 18)} fill={GOLD} stroke={INK} stroke-width="5" /></g>
      </g>
    {:else}
      {#if on(key)}<path d={H.stub} fill="none" stroke={GOLD} stroke-width="72" stroke-linecap="round" opacity=".45" />{/if}
      <path d={H.stub} fill="none" stroke={INK} stroke-width="70" stroke-linecap="round" /><path d={H.stub} fill="none" stroke={BONE} stroke-width="54" stroke-linecap="round" />
      <circle class="stumpcap" cx={H.sx} cy={H.sy} r="24" fill={st === 'sealed' ? '#4a3a30' : FROST} stroke={INK} stroke-width="6" />
      {#if st === 'sealed'}<path d="M{H.sx - 12} {H.sy - 6} l8 8 l-6 6 l10 6" fill="none" stroke={EMBER} stroke-width="4" stroke-linecap="round" />
      {:else}<circle class="bud" cx={H.sx - 14} cy={H.sy - 4} r="12" fill={BONE} stroke={INK} stroke-width="4" />{/if}
    {/if}
  </g>
{/snippet}

<svg class="wc gh pose-{pose}" class:enraged class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Gorhydra, a three-headed frost serpent">
  <defs><clipPath id="{uid}b"><path d={BODY} /></clipPath></defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <g class="rig" bind:this={rig}>
    <g class="breath">
      <path d="M560 440 L540 516" stroke={INK} stroke-width="74" stroke-linecap="round" /><path d="M560 440 L540 516" stroke={FAR} stroke-width="60" stroke-linecap="round" />
      <path d="M760 440 L790 516" stroke={INK} stroke-width="74" stroke-linecap="round" /><path d="M760 440 L790 516" stroke={FAR} stroke-width="60" stroke-linecap="round" />
      <path data-foot d="M496 530 q40 -26 80 0 Z" fill={INK} /><path data-foot d="M756 530 q40 -26 80 0 Z" fill={INK} />
      <g class="tail" style="transform-origin:800px 420px"><path d={TAIL} fill={BONE} stroke={INK} stroke-width="8" stroke-linejoin="round" /></g>
      {@render head('right')}
      {@render head('middle')}
      <path d={BODY} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
      <g clip-path="url(#{uid}b)"><path d={bodyHatch} stroke={INK} stroke-width="5" stroke-linecap="round" /></g>
      <g class="spikes">
        {#each [['600 290', '630 230', '650 288'], ['660 284', '700 220', '714 290'], ['726 292', '770 240', '780 306']] as [a, b, c]}<path d="M{a} L{b} L{c} Z" fill={FROST} stroke={INK} stroke-width="7" stroke-linejoin="round" />{/each}
      </g>
      {@render head('left')}
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 680px 530px; }
  .breath { transform-origin: 680px 530px; animation: wc-breathe 3.2s ease-in-out infinite; }
  .neckhead, .jaw, .tail { transform-box: view-box; transition: transform .35s ease; }
  .neckhead .stars, .neckhead .breathcloud { opacity: 0; }
  .act-idle.left { animation: bobL 3.4s ease-in-out infinite; }
  .act-idle.middle { animation: bobM 3s ease-in-out infinite; }
  .act-idle.right { animation: bobR 3.8s ease-in-out infinite; }
  @keyframes bobL { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-4deg); } }
  @keyframes bobM { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(3deg); } }
  @keyframes bobR { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(4deg); } }
  /* Bite / Snap: a quick lunge */
  .act-bite, .act-snap { animation: jab .9s ease-in-out infinite; }
  @keyframes jab { 0%, 60%, 100% { transform: rotate(0); } 75% { transform: rotate(-6deg) translateX(-16px); } }
  .act-bite .jaw, .act-snap .jaw { transform: rotate(12deg); }
  /* Frost Breath: jaw open, a cloud */
  .act-breath .jaw { transform: rotate(18deg); }
  .act-breath .breathcloud { opacity: 1; animation: drift 1.4s ease-in-out infinite; }
  @keyframes drift { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-12px); } }
  /* Crush: rears back, ready to slam */
  .act-crush.middle { transform: rotate(16deg); }
  /* Reeling */
  .act-reel { animation: wc-reel 1.2s ease-in-out infinite; }
  .act-reel .stars { opacity: 1; animation: wc-orbit 1.4s linear infinite; }
  /* stumps: frosted while regrowing (a bud swells), scarred once sealed */
  .st-stump { animation: none; }
  .st-stump .stumpcap { animation: throb 1.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  @keyframes throb { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
  .st-sealed { animation: none; }
  /* phase 2: the frost spikes glow */
  .enraged .spikes { filter: drop-shadow(0 0 10px #b9d3f0); }
  /* Tail Slam (headless) */
  .pose-slam .tail { transform: rotate(-26deg); }
  /* beaten */
  .pose-down .breath { animation: none; transform: scaleY(.86); filter: saturate(.55) brightness(.8); }
  .pose-down .neckhead { animation: none; transform: rotate(-28deg); }
</style>
