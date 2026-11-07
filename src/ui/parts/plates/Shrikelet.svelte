<script lang="ts">
  // The Shrikelet, a Galeshrike chick (the Foothills, Nov 2026), in the woodcut style. A baby, not a small adult: a
  // round ball of down, a big head with a crest of three soft feathers, a short hooked beak, wing stubs it can't fly
  // on yet, two sturdy legs. Drawn facing left in a 1000 × 600 space and flipped. Poses: breathing; flapping hard
  // before its Gust (the wind gathering); leaning into the Gust; reeling when dazed; flopped when beaten. Its Beak and
  // Down light up when aimed at.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, FAR, GOLD, EMBER, GALE, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();

  const BODY = 'M440 360 C440 280 510 236 600 236 C690 236 760 290 764 370 C768 440 710 476 610 478 C510 480 444 440 440 360 Z';
  const FLUFF = 'M470 452 l-6 22 l18 -12 l4 24 l14 -20 l10 22 l10 -22 l14 20 l6 -22 l18 14 l-2 -24';
  const TAIL = 'M756 330 L820 300 L824 326 L846 334 L820 350 L760 384 Z';
  const HEAD = 'M480 250 C480 196 436 162 376 162 C314 162 266 200 262 252 C258 304 300 338 362 342 C430 346 480 308 480 250 Z';
  const BEAK = 'M272 236 L210 248 C192 252 188 270 200 282 C208 288 218 284 220 276 L214 268 L272 270 Z';
  const BEAK_BROKE = 'M272 236 L236 246 L240 266 L272 270 Z';
  const CREST = ['M360 168 L374 118 L394 164 Z', 'M392 168 L428 128 L428 176 Z', 'M418 178 L466 152 L448 196 Z'];
  const WING = 'M560 300 C610 270 680 268 720 290 L700 314 L716 330 L670 342 C620 346 580 336 560 320 Z';
  type Leg = { id: string; hip: [number, number]; foot: [number, number]; far: boolean };
  const LEGS: Leg[] = [{ id: 'lf', hip: [630, 460], foot: [646, 514], far: true }, { id: 'ln', hip: [570, 462], foot: [560, 514], far: false }];
  const bodyHatch = hatchLines(430, 790, 380, 490, 13, -30);
  const uid = `sk${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const pose = $derived(hunt?.over === 'win' ? 'down' : intent === 'dazed' ? 'dazed' : intent === 'whistle' ? 'flap' : intent === 'gust' ? 'tense' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const beak = $derived(part('cheeks')), down = $derived(part('fur'));
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  const GUST: Keyframe[] = [{ transform: 'translateX(0)' }, { transform: 'translateX(30px) scale(1.06)', offset: 0.3 }, { transform: 'translateX(-60px)', offset: 0.6 }, { transform: 'translateX(0)' }];
  oneShots(() => rig, () => hunt, i => (i === 'gust' ? GUST : LUNGE));
</script>

<svg class="wc sk pose-{pose}" class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Shrikelet, a Galeshrike chick{pose === 'flap' ? ', beating its wings to whip up a gust' : ''}">
  <defs>
    <clipPath id="{uid}b"><path d={BODY} /></clipPath>
    <linearGradient id="{uid}u" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0" /><stop offset="1" stop-color="#000" stop-opacity="1" /></linearGradient>
    <mask id="{uid}m"><rect x="0" y="0" width="1000" height="600" fill="url(#{uid}u)" /></mask>
  </defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <!-- the wind it whips up -->
  <g class="fx gusts"><path d="M180 200 C140 190 120 210 90 204 M200 300 C150 290 130 316 96 306 M190 400 C150 392 128 412 100 404" fill="none" stroke={GALE} stroke-width="8" stroke-linecap="round" /></g>
  <g class="rig" bind:this={rig}>
    <g class="breath">
      {#each LEGS as L (L.id)}
        <path d="M{L.hip[0]} {L.hip[1]} L{L.foot[0]} {L.foot[1]}" stroke={INK} stroke-width="26" stroke-linecap="round" />
        <path d="M{L.hip[0]} {L.hip[1]} L{L.foot[0]} {L.foot[1]}" stroke={L.far ? FAR : BONE2} stroke-width="14" stroke-linecap="round" />
        <path d="M{L.foot[0] - 30} {L.foot[1] + 6} L{L.foot[0]} {L.foot[1] - 6} L{L.foot[0] + 26} {L.foot[1] + 6} M{L.foot[0]} {L.foot[1] - 4} L{L.foot[0] - 4} {L.foot[1] + 10}" fill="none" stroke={INK} stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
      {/each}
      <path d={TAIL} fill={BONE2} stroke={INK} stroke-width="8" stroke-linejoin="round" />
      {#if down.on}<path d={BODY} fill="none" stroke={GOLD} stroke-width="28" opacity=".55" />{/if}
      <path d={BODY} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
      <g clip-path="url(#{uid}b)">
        <path d={bodyHatch} stroke={INK} stroke-width="5" stroke-linecap="round" />
        <rect x="0" y="0" width="1000" height="600" fill={INK} opacity=".75" mask="url(#{uid}m)" />
        {#if down.broke}<path d="M640 300 l18 26 l-16 12 l20 28" fill="none" stroke={EMBER} stroke-width="7" stroke-linecap="round" />{/if}
      </g>
      <path d={FLUFF} fill="none" stroke={INK} stroke-width="6" stroke-linejoin="round" stroke-linecap="round" />
      <g class="wing" style="transform-origin:566px 312px">
        <path d={WING} fill={BONE2} stroke={INK} stroke-width="8" stroke-linejoin="round" />
        <path d="M600 300 L630 330 M640 290 L668 330 M680 286 L700 314" stroke={INK} stroke-width="5" stroke-linecap="round" />
      </g>
      <g class="head" style="transform-origin:420px 300px">
        {#each CREST as d}<path {d} fill={enraged ? EMBER : GALE} stroke={INK} stroke-width="7" stroke-linejoin="round" />{/each}
        <path d={HEAD} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
        {#if beak.on}<path d={beak.broke ? BEAK_BROKE : BEAK} fill="none" stroke={GOLD} stroke-width="24" stroke-linejoin="round" opacity=".55" />{/if}
        <path d={beak.broke ? BEAK_BROKE : BEAK} fill={BONE2} stroke={INK} stroke-width="8" stroke-linejoin="round" />
        {#if beak.broke}<path d="M238 246 l6 8 l-6 6 l6 8" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />{/if}
        <!-- a chick's big eye -->
        <circle cx="318" cy="236" r="22" fill={enraged ? EMBER : INK} /><circle cx="311" cy="228" r="7" fill={BONE} />
        <path d="M290 206 C306 196 326 196 342 204" fill="none" stroke={INK} stroke-width="6" stroke-linecap="round" />
        <g class="stars" style="transform-origin:340px 110px"><path d={star(260, 110, 30)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(420, 90, 24)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(340, 140, 18)} fill={GOLD} stroke={INK} stroke-width="6" /></g>
      </g>
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 600px 530px; transition: transform .35s cubic-bezier(.3,.7,.3,1); }
  .breath { transform-origin: 600px 530px; animation: wc-breathe 2s ease-in-out infinite; }
  .head { transition: transform .35s ease; animation: bob 2.6s ease-in-out infinite; }
  @keyframes bob { 0%, 70%, 100% { transform: rotate(0); } 80% { transform: rotate(-6deg); } }
  .gusts { opacity: 0; }
  /* the wind gathers: wings beating hard, crouched, gusts streaming */
  .pose-flap .wing { animation: beat .28s ease-in-out infinite; }
  .pose-flap .rig { transform: scaleY(.95); }
  .pose-flap .gusts { animation: stream .8s linear infinite; }
  @keyframes beat { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-38deg); } }
  @keyframes stream { 0% { opacity: .9; transform: translateX(0); } 100% { opacity: 0; transform: translateX(-60px); } }
  /* the Gust is coming: leaning in, wings back */
  .pose-tense .rig { transform: translateX(-20px) skewX(-6deg); }
  .pose-tense .wing { transform: rotate(-20deg); }
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  .pose-dazed .head { animation: none; }
  .pose-down .breath, .pose-down .head { animation: none; }
  .pose-down .rig { transform: translateY(30px) scaleY(.86); filter: saturate(.55) brightness(.8); }
  .pose-down .head { transform: translate(-10px, 40px) rotate(-14deg); }
</style>
