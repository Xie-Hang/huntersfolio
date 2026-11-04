<script lang="ts">
  // The Galeshrike, storm raptor, in the woodcut style. Drawn facing left in a 1000 × 600 space and flipped.
  // On the ground: breathing, wings folded, head bobbing. Taking off: wings up, crouched. In the air: it rises,
  // legs tucked, wings beating (harder on a gust, gliding while it circles high), its shadow shrinking below.
  // Diving: pitched down, wings folded. Stuck: beak in the ground. Brought down or pinned: sprawled.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, FAR, GOLD, EMBER, GALE, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();

  const BODY = 'M380 320 C390 260 470 230 560 236 C650 242 720 280 740 320 C760 360 720 400 640 410 C560 418 450 410 400 380 C384 370 378 346 380 320 Z';
  const TAIL = 'M716 300 L900 246 L912 286 L930 300 L912 316 L904 352 L726 362 Z';
  const HEAD = 'M306 242 C306 202 338 176 384 174 C432 174 458 210 452 252 C446 290 412 308 376 306 C348 304 324 292 312 274 Z';
  const BEAK = 'M316 224 L214 236 C186 240 178 264 194 282 C202 290 216 288 220 276 L212 264 L314 268 Z';
  const CREST = ['M356 178 L392 104 L410 172 Z', 'M382 178 L444 118 L434 186 Z', 'M408 186 L478 144 L452 204 Z'];
  const CREST_BROKE = ['M356 178 L372 146 L390 174 Z', 'M386 180 L410 156 L414 186 Z'];
  const WING = 'M470 262 C560 196 700 168 870 146 L836 186 L884 196 L828 226 L862 244 L782 262 C680 282 560 292 470 292 Z';
  const WING_TORN = 'M470 262 C560 196 660 176 760 166 L740 196 L774 214 L722 240 L746 256 L700 268 C640 284 560 292 470 292 Z';
  const FEATHERS = 'M560 230 L620 270 M620 214 L690 262 M690 200 L760 256 M760 186 L820 236';
  type Leg = { id: string; hip: [number, number]; foot: [number, number]; far: boolean };
  const LEGS: Leg[] = [{ id: 'lf', hip: [580, 400], foot: [600, 512], far: true }, { id: 'ln', hip: [530, 404], foot: [520, 512], far: false }];
  const bodyHatch = hatchLines(360, 780, 320, 420, 14, -34);
  const uid = `gs${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const air = $derived(!!m?.air);
  const pose = $derived(
    hunt?.over === 'win' ? 'down' :
    intent === 'dazed' ? 'dazed' : intent === 'crashed' || intent === 'pinned' ? 'crashed' : intent === 'stuck' ? 'stuck' :
    intent === 'dive' ? 'dive' : intent === 'circle' ? 'circle' : air ? 'air' : intent === 'takeoff' ? 'takeoff' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const wings = $derived(part('wings')), talons = $derived(part('talons')), crest = $derived(part('crest'));
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  // a dive lands down and forward; a rake is the usual lunge
  const DIVE: Keyframe[] = [{ transform: 'translate(0,0)' }, { transform: 'translate(-60px,-40px) scale(1.05)', offset: 0.25 }, { transform: 'translate(-200px,150px) skewX(-12deg)', offset: 0.55 }, { transform: 'translate(0,0)' }];
  const GUST: Keyframe[] = [{ transform: 'translateX(0)' }, { transform: 'translateX(30px) scale(1.06)', offset: 0.3 }, { transform: 'translateX(-60px)', offset: 0.6 }, { transform: 'translateX(0)' }];
  oneShots(() => rig, () => hunt, i => (i === 'dive' ? DIVE : i === 'gust' ? GUST : LUNGE));
</script>

<svg class="wc gs pose-{pose}" class:static={!hunt} class:aloft={air || pose === 'dive' || pose === 'circle'} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Galeshrike, a storm raptor{air ? ', in flight' : ''}">
  <defs><clipPath id="{uid}b"><path d={BODY} /></clipPath></defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <ellipse class="shadow" cx="560" cy="534" rx="170" ry="12" fill={INK} opacity=".7" />
  <g class="rig" bind:this={rig}>
    <g class="lift">
      <g class="breath">
        <g class="wing wing-far" style="transform-origin:480px 272px">
          <path d={wings.broke ? WING_TORN : WING} fill={FAR} stroke={INK} stroke-width="9" stroke-linejoin="round" />
        </g>
        <g class="legs" style="transform-origin:556px 404px">
          {#each LEGS as L (L.id)}
            {@const lost = talons.broke && !L.far}
            <path d="M{L.hip[0]} {L.hip[1]} L{L.foot[0]} {L.foot[1] - 8}" stroke={talons.on ? GOLD : INK} stroke-width={talons.on ? 34 : 26} stroke-linecap="round" />
            <path d="M{L.hip[0]} {L.hip[1]} L{L.foot[0]} {L.foot[1] - 8}" stroke={L.far ? FAR : BONE2} stroke-width="16" stroke-linecap="round" />
            <path data-foot d="M{L.foot[0]} {L.foot[1] - 8} q-34 4 -42 18 M{L.foot[0]} {L.foot[1] - 8} q-12 10 -10 20 {lost ? '' : `M${L.foot[0]} ${L.foot[1] - 8} q26 2 34 16`}" fill="none" stroke={INK} stroke-width="9" stroke-linecap="round" />
            {#if lost}<path d="M{L.foot[0] + 8} {L.foot[1] - 12} l14 6 l-6 8 l14 4" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />{/if}
          {/each}
        </g>
        <path d={TAIL} fill={BONE} stroke={INK} stroke-width="9" stroke-linejoin="round" />
        <path d="M730 314 L900 270 M730 330 L912 300 M730 346 L900 330" stroke={INK} stroke-width="5" stroke-linecap="round" opacity=".6" />
        <!-- the neck, stretched down to the buried beak: only drawn while it's stuck (the head moves a long way) -->
        <g class="neck"><path d="M430 330 Q392 360 358 394" fill="none" stroke={INK} stroke-width="62" stroke-linecap="round" /><path d="M430 330 Q392 360 358 394" fill="none" stroke={BONE} stroke-width="46" stroke-linecap="round" /></g>
        <path d={BODY} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
        <g clip-path="url(#{uid}b)"><path d={bodyHatch} stroke={INK} stroke-width="5" stroke-linecap="round" /></g>
        <path d="M420 300 q14 20 6 40 M460 288 q14 22 6 44 M500 282 q14 22 6 46" fill="none" stroke={INK} stroke-width="5" stroke-linecap="round" opacity=".55" />
        <g class="head" style="transform-origin:400px 300px">
          {#each crest.broke ? CREST_BROKE : CREST as d}
            {#if crest.on}<path {d} fill="none" stroke={GOLD} stroke-width="22" stroke-linejoin="round" opacity=".55" />{/if}
            <path {d} fill={crest.broke ? BONE2 : GALE} stroke={INK} stroke-width="7" stroke-linejoin="round" />
          {/each}
          <path d={HEAD} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
          <path d={BEAK} fill={BONE2} stroke={INK} stroke-width="8" stroke-linejoin="round" />
          <circle cx="352" cy="232" r="11" fill={enraged ? EMBER : INK} />
          <path d="M316 210 C340 196 370 196 394 210" fill="none" stroke={INK} stroke-width="12" stroke-linecap="round" />
          <path d="M392 250 q18 14 40 10 M380 270 q20 12 44 6" fill="none" stroke={INK} stroke-width="5" stroke-linecap="round" opacity=".6" />
          <g class="stars" style="transform-origin:380px 150px"><path d={star(300, 140, 44)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(470, 110, 36)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(420, 200, 28)} fill={GOLD} stroke={INK} stroke-width="6" /></g>
        </g>
        <g class="wing wing-near" style="transform-origin:470px 276px">
          {#if wings.on}<path d={wings.broke ? WING_TORN : WING} fill="none" stroke={GOLD} stroke-width="28" stroke-linejoin="round" opacity=".55" />{/if}
          <path d={wings.broke ? WING_TORN : WING} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
          <path d={FEATHERS} stroke={INK} stroke-width="6" stroke-linecap="round" opacity=".7" />
          {#if wings.broke}<path d="M720 178 l18 22 l-16 14 l20 20 l-14 16" fill="none" stroke={EMBER} stroke-width="7" stroke-linecap="round" />{/if}
        </g>
      </g>
      <g class="fx gusts"><path d="M200 220 C150 230 120 260 130 290 M180 300 C120 310 90 340 110 370 M230 380 C170 392 150 420 170 446" fill="none" stroke={GALE} stroke-width="8" stroke-linecap="round" /></g>
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 560px 530px; }
  .lift { transition: transform .6s cubic-bezier(.3,.7,.3,1); }
  .breath { transform-origin: 560px 530px; animation: wc-breathe 2.6s ease-in-out infinite; }
  .head { transition: transform .35s ease; animation: bob 3.4s ease-in-out infinite; }
  .wing { transition: transform .35s ease; transform: rotate(6deg); }
  .legs { transform-box: view-box; transition: transform .4s ease; }
  .shadow { transform-box: view-box; transform-origin: 560px 534px; transition: transform .6s ease, opacity .6s ease; }
  .gusts { opacity: 0; }
  .neck { opacity: 0; }
  .pose-stuck .neck { opacity: 1; }
  @keyframes bob { 0%, 70%, 100% { transform: rotate(0); } 80% { transform: rotate(8deg) translateY(6px); } 90% { transform: rotate(-4deg); } }

  /* about to take off: crouched, wings raised */
  .pose-takeoff .breath { animation: none; transform: scaleY(.9); }
  .pose-takeoff .wing { transform: rotate(-38deg); }
  /* in the air: flown up past the top of the frame (the plate clips it), so only its underside, tucked legs and
     beating wings show; kept near full size so it doesn't read as a different, smaller bird. The shadow shrinks. */
  .aloft .lift { transform: translateY(-250px) scale(.96); transform-origin: 560px 420px; }
  .aloft .legs { transform: scaleY(.45) rotate(18deg); }
  .aloft .shadow { transform: scale(.55); opacity: .4; }
  .pose-air .wing { animation: flap .55s ease-in-out infinite; }
  .pose-air .gusts { animation: wind 1s linear infinite; }
  @keyframes flap { 0%, 100% { transform: rotate(-58deg); } 50% { transform: rotate(10deg); } }
  @keyframes wind { 0% { opacity: 0; transform: translateX(40px); } 30% { opacity: .9; } 100% { opacity: 0; transform: translateX(-80px); } }
  /* circling high: higher still, mostly out of view, gliding */
  .pose-circle .lift { transform: translateY(-310px) scale(.94); transform-origin: 560px 420px; }
  .pose-circle .wing { transform: rotate(-30deg); animation: glide 2s ease-in-out infinite; }
  .pose-circle .breath { animation: drift 2.4s ease-in-out infinite; }
  @keyframes glide { 50% { transform: rotate(-44deg); } }
  @keyframes drift { 50% { transform: translateX(40px) translateY(-16px); } }
  /* diving: pitched head-down, wings folded tight (it's in the air, so the tilt can't hit the ground) */
  .pose-dive .lift { transform: translateY(-200px) rotate(-24deg) scale(.96); transform-origin: 560px 420px; }
  .pose-dive .wing { transform: rotate(14deg); }
  /* beak stuck in the earth after a dive */
  .pose-stuck .head { animation: tug .5s ease-in-out infinite; transform: translate(-30px, 150px) rotate(-62deg); }
  .pose-stuck .wing { animation: flap .9s ease-in-out infinite; }
  @keyframes tug { 0%, 100% { transform: translate(-30px, 150px) rotate(-62deg); } 50% { transform: translate(-22px, 138px) rotate(-56deg); } }
  /* brought down: sprawled, wings flat */
  .pose-crashed .breath { animation: none; transform: scaleY(.86); }
  .pose-crashed .wing { transform: rotate(26deg); }
  .pose-crashed .head { animation: none; transform: translate(-20px, 70px) rotate(-26deg); }
  /* dazed: reeling, stars */
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  .pose-dazed .head { animation: none; transform: rotate(-12deg); }
  /* beaten */
  .pose-down .breath { animation: none; transform: scaleY(.8); filter: saturate(.55) brightness(.8); }
  .pose-down .wing { transform: rotate(30deg); }
  .pose-down .head { animation: none; transform: translate(-30px, 96px) rotate(-40deg); }
</style>
