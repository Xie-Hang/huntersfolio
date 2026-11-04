<script lang="ts">
  // The Duskheron, two-headed Mirewood wader, in the woodcut style. Drawn facing left in 1000 × 600 and flipped.
  // Each neck + head pivots where it joins the body, and poses on its own from that head's move:
  // Peck jabs, Spear Thrust draws the neck back, Screech opens the beak, Reeling wobbles under its own stars.
  // Rear Up / Twin Spear: both necks rise and the wing lifts. Broken: cracked beaks, torn wing.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, FAR, GOLD, GALE, EMBER, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();

  const BODY = 'M470 300 C490 236 580 210 670 222 C760 234 820 284 820 340 C820 394 760 420 670 420 C580 420 490 384 470 300 Z';
  const WING = 'M560 270 C620 236 720 236 800 276 C780 300 740 316 690 320 C640 324 590 310 560 270 Z';
  const bodyHatch = hatchLines(470, 830, 330, 424, 14, -30);
  const uid = `dh${Math.random().toString(36).slice(2, 7)}`;
  const HEADS = {
    upper: { neck: 'M520 300 C470 250 470 190 420 160 C380 136 340 140 312 160', hx: 300, hy: 158, ox: 520, oy: 300 },
    lower: { neck: 'M520 340 C460 360 420 400 380 400 C350 400 330 392 312 380', hx: 300, hy: 380, ox: 520, oy: 340 }
  } as const;
  const headPath = (x: number, y: number) => `M${x - 36} ${y} C${x - 36} ${y - 30} ${x - 8} ${y - 44} ${x + 18} ${y - 40} C${x + 44} ${y - 34} ${x + 48} ${y - 6} ${x + 36} ${y + 18} C${x + 20} ${y + 34} ${x - 26} ${y + 30} ${x - 36} ${y} Z`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const acts = $derived.by(() => {
    const out: Record<string, string> = { upper: 'idle', lower: 'idle' };
    if (intent === 'rear' || intent === 'twin') { out.upper = out.lower = 'rear'; }
    else if (intent.includes(':')) for (const p of intent.split('|')) { const [k, v] = p.split(':'); out[k] = v; }
    for (const k of ['upper', 'lower']) if ((m?.reel?.[k] ?? 0) > 0) out[k] = 'reel';
    return out;
  });
  const pose = $derived(hunt?.over === 'win' ? 'down' : intent === 'dazed' ? 'dazed' : intent === 'rear' || intent === 'twin' ? 'rear' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const up = $derived(part('upper')), lo = $derived(part('lower')), wings = $derived(part('wings'));
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  oneShots(() => rig, () => hunt, () => LUNGE);
</script>

{#snippet head(key: 'upper' | 'lower', p: { on: boolean; broke: boolean })}
  {@const H = HEADS[key]}
  <g class="neckhead {key} act-{acts[key]}" style="transform-origin:{H.ox}px {H.oy}px">
    {#if p.on}<path d={H.neck} fill="none" stroke={GOLD} stroke-width="70" stroke-linecap="round" opacity=".45" />{/if}
    <path d={H.neck} fill="none" stroke={INK} stroke-width="54" stroke-linecap="round" /><path d={H.neck} fill="none" stroke={BONE} stroke-width="40" stroke-linecap="round" />
    <g class="beak" style="transform-origin:{H.hx - 30}px {H.hy + 10}px"><path d="M{H.hx - 30} {H.hy + 6} L{H.hx - 170} {H.hy + 14} L{H.hx - 30} {H.hy + 22} Z" fill={BONE2} stroke={INK} stroke-width="7" stroke-linejoin="round" /></g>
    <path d="M{H.hx - 30} {H.hy - 6} L{H.hx - 170} {H.hy + 8} L{H.hx - 30} {H.hy + 12} Z" fill={BONE2} stroke={INK} stroke-width="7" stroke-linejoin="round" />
    {#if p.broke}<path d="M{H.hx - 120} {H.hy + 2} l10 8 l-6 6 l12 6" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />{/if}
    <path d={headPath(H.hx, H.hy)} fill={BONE} stroke={INK} stroke-width="8" stroke-linejoin="round" />
    <path d="M{H.hx + 10} {H.hy - 38} L{H.hx + 40} {H.hy - 86} L{H.hx + 34} {H.hy - 30} Z M{H.hx + 26} {H.hy - 34} L{H.hx + 70} {H.hy - 66} L{H.hx + 40} {H.hy - 20} Z" fill={GALE} stroke={INK} stroke-width="6" stroke-linejoin="round" />
    <circle cx={H.hx} cy={H.hy - 8} r="8" fill={enraged ? EMBER : INK} />
    <g class="stars" style="transform-origin:{H.hx}px {H.hy - 70}px"><path d={star(H.hx - 40, H.hy - 70, 26)} fill={GOLD} stroke={INK} stroke-width="5" /><path d={star(H.hx + 40, H.hy - 86, 20)} fill={GOLD} stroke={INK} stroke-width="5" /></g>
  </g>
{/snippet}

<svg class="wc dh pose-{pose}" class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Duskheron, a two-headed wader">
  <defs><clipPath id="{uid}b"><path d={BODY} /></clipPath></defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <g class="rig" bind:this={rig}>
    <g class="breath">
      <path d="M680 410 L700 524" stroke={INK} stroke-width="32" stroke-linecap="round" /><path d="M680 410 L700 524" stroke={BONE2} stroke-width="18" stroke-linecap="round" />
      <path d="M620 410 L600 524" stroke={INK} stroke-width="32" stroke-linecap="round" /><path d="M620 410 L600 524" stroke={FAR} stroke-width="18" stroke-linecap="round" />
      <path data-foot d="M570 530 h56 l-10 -8 M600 528 l-4 -12" stroke={INK} stroke-width="8" stroke-linecap="round" fill="none" />
      <path data-foot d="M676 530 h56 l-10 -8 M704 528 l4 -12" stroke={INK} stroke-width="8" stroke-linecap="round" fill="none" />
      <path d="M790 300 C860 290 930 300 960 330 C920 336 880 350 820 366 Z" fill={BONE} stroke={INK} stroke-width="8" stroke-linejoin="round" />
      {@render head('lower', lo)}
      <path d={BODY} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
      <g clip-path="url(#{uid}b)"><path d={bodyHatch} stroke={INK} stroke-width="5" stroke-linecap="round" /></g>
      <g class="wing" style="transform-origin:580px 280px">
        {#if wings.on}<path d={WING} fill="none" stroke={GOLD} stroke-width="24" opacity=".5" />{/if}
        <path d={WING} fill={wings.broke ? BONE2 : BONE} stroke={INK} stroke-width="8" stroke-linejoin="round" />
        <path d="M600 280 C660 262 730 264 780 284 M620 298 C670 286 720 288 760 300" fill="none" stroke={INK} stroke-width="4" opacity=".55" />
        {#if wings.broke}<path d="M700 250 l-8 20 l14 8 l-6 18" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />{/if}
      </g>
      {@render head('upper', up)}
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 650px 530px; }
  .breath { transform-origin: 650px 530px; animation: wc-breathe 2.8s ease-in-out infinite; }
  .neckhead, .beak, .wing { transform-box: view-box; transition: transform .35s ease; }
  .neckhead .stars { opacity: 0; }
  .act-idle.upper { animation: bobU 3.2s ease-in-out infinite; }
  .act-idle.lower { animation: bobL 3.6s ease-in-out infinite; }
  @keyframes bobU { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-4deg); } }
  @keyframes bobL { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(4deg); } }
  /* Peck: quick jabs */
  .act-peck { animation: jab .9s ease-in-out infinite; }
  @keyframes jab { 0%, 60%, 100% { transform: rotate(0); } 75% { transform: rotate(-8deg) translateX(-14px); } }
  /* Spear Thrust: neck drawn back, ready */
  .act-thrust.upper { transform: rotate(14deg); }
  .act-thrust.lower { transform: rotate(-10deg); }
  /* Screech: beak open, head up */
  .act-screech .beak { transform: rotate(-16deg); }
  .act-screech.upper { transform: rotate(-8deg); }
  .act-screech.lower { transform: rotate(6deg); }
  /* Reeling: wobble under its own stars */
  .act-reel { animation: wc-reel 1.2s ease-in-out infinite; }
  .act-reel .stars { opacity: 1; animation: wc-orbit 1.4s linear infinite; }
  /* Rear Up / Twin Spear: both necks high, the wing lifts */
  .act-rear.upper { transform: rotate(18deg); }
  .act-rear.lower { transform: rotate(24deg); }
  .pose-rear .wing { transform: rotate(-16deg); }
  /* dazed (whole body) and beaten */
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  .pose-down .breath { animation: none; transform: scaleY(.86); filter: saturate(.55) brightness(.8); }
  .pose-down .neckhead.upper { animation: none; transform: rotate(-40deg); }
  .pose-down .neckhead.lower { animation: none; transform: rotate(-20deg); }
</style>
