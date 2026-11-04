<script lang="ts">
  // The Rimetail, frost stalker, in the woodcut style. Drawn facing left in a 1000 × 600 space and flipped.
  // Its back carries the ice plating as shards, one row per layer: a broken layer's shards fall away, and Rime
  // Coat grows them back with a frost glitter. Pounce coming: it crouches low, tail high and twitching. Tail Sweep
  // coming: the tail draws back. One-shots: a leap on the pounce, a whip on the sweep, a flinch when hit.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, FAR, GOLD, EMBER, FROST, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();

  const BODY = 'M300 400 C310 350 380 320 480 318 C600 314 720 322 790 350 C830 368 842 400 820 420 C780 440 660 446 540 444 C440 442 360 438 320 428 C304 422 298 412 300 400 Z';
  const SKULL = 'M336 358 C302 338 252 334 212 344 C182 352 160 368 162 386 L252 390 C292 392 322 388 342 380 Z';
  const JAW = 'M168 392 L252 394 C286 396 316 396 338 392 C330 410 300 422 260 424 C220 426 186 416 168 402 Z';
  const FANGS = 'M190 394 l8 16 l8 -16 Z M226 396 l8 18 l8 -18 Z M262 396 l7 14 l7 -14 Z';
  const FRILL = 'M330 350 L358 300 L372 352 Z M352 356 L396 312 L398 362 Z';
  const TAIL = 'M800 384 C880 366 934 304 926 226 C918 164 862 142 830 172';
  const TAIL_STUMP = 'M800 384 C836 376 862 360 876 336';
  const BARB = 'M830 172 L796 140 L842 152 L838 112 L866 156 Z';
  // ice shards along the back: layer 1 (lower, bigger) and layer 2 (upper)
  const SHARDS: [number, string][] = [
    [1, 'M420 330 L446 270 L476 326 Z'], [1, 'M500 322 L534 248 L566 320 Z'], [1, 'M592 320 L626 256 L652 322 Z'], [1, 'M676 326 L706 272 L728 334 Z'],
    [2, 'M462 300 L480 238 L500 296 Z'], [2, 'M548 280 L570 206 L590 282 Z'], [2, 'M634 284 L654 222 L672 290 Z']
  ];
  type Leg = { id: string; sh: [number, number]; el: [number, number]; paw: [number, number]; far: boolean };
  const LEGS: Leg[] = [
    { id: 'ff', sh: [430, 424], el: [470, 470], paw: [446, 514], far: true },
    { id: 'rf', sh: [740, 424], el: [780, 470], paw: [756, 514], far: true },
    { id: 'fn', sh: [390, 422], el: [350, 470], paw: [372, 514], far: false },
    { id: 'rn', sh: [700, 426], el: [660, 472], paw: [682, 514], far: false }
  ];
  const bodyHatch = hatchLines(300, 860, 380, 450, 14, -30);
  const uid = `rt${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  // with no hunt (bestiary), show it as you meet it: plated
  const layers = $derived(hunt ? (m?.plating ?? 0) : 2);
  const pose = $derived(
    hunt?.over === 'win' ? 'down' :
    intent === 'dazed' ? 'dazed' : intent === 'pounce' ? 'crouch' : intent === 'sweep' ? 'coil' : intent === 'rimecoat' ? 'frost' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const tail = $derived(part('tail')), mantle = $derived(part('mantle')), jaw = $derived(part('jaw'));
  const enraged = $derived(!!m?.enraged);

  let rig: SVGGElement;
  const LEAP: Keyframe[] = [{ transform: 'translate(0,0)' }, { transform: 'translate(40px,10px) scaleY(.86)', offset: 0.2 }, { transform: 'translate(-150px,-110px) skewX(-10deg)', offset: 0.45 }, { transform: 'translate(-210px,0) skewX(-6deg)', offset: 0.62 }, { transform: 'translate(0,0)' }];
  const WHIP: Keyframe[] = [{ transform: 'translateX(0)' }, { transform: 'translateX(-40px) skewX(-8deg)', offset: 0.3 }, { transform: 'translateX(70px) skewX(12deg)', offset: 0.6 }, { transform: 'translateX(0)' }];
  oneShots(() => rig, () => hunt, i => (i === 'pounce' ? LEAP : i === 'sweep' ? WHIP : LUNGE));
</script>

<svg class="wc rt pose-{pose}" class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Rimetail, a frost stalker{layers ? `, plated in ice (${layers} layer${layers > 1 ? 's' : ''})` : ''}">
  <defs><clipPath id="{uid}b"><path d={BODY} /></clipPath></defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <g class="rig" bind:this={rig}>
    <g class="breath">
      {#each LEGS.filter(l => l.far) as L (L.id)}
        <path d="M{L.sh[0]} {L.sh[1]} L{L.el[0]} {L.el[1]} L{L.paw[0]} {L.paw[1]}" fill="none" stroke={INK} stroke-width="44" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M{L.sh[0]} {L.sh[1]} L{L.el[0]} {L.el[1]} L{L.paw[0]} {L.paw[1]}" fill="none" stroke={FAR} stroke-width="30" stroke-linecap="round" stroke-linejoin="round" />
      {/each}
      <g class="tail" style="transform-origin:800px 384px">
        {#if tail.on}<path d={tail.broke ? TAIL_STUMP : TAIL} fill="none" stroke={GOLD} stroke-width="80" stroke-linecap="round" opacity=".55" />{/if}
        <path d={tail.broke ? TAIL_STUMP : TAIL} fill="none" stroke={INK} stroke-width="62" stroke-linecap="round" />
        <path d={tail.broke ? TAIL_STUMP : TAIL} fill="none" stroke={BONE} stroke-width="46" stroke-linecap="round" />
        {#if tail.broke}<path d="M864 334 l14 6 l-4 12 l14 4" fill="none" stroke={EMBER} stroke-width="7" stroke-linecap="round" />
        {:else}<path d={BARB} fill={FROST} stroke={INK} stroke-width="7" stroke-linejoin="round" />{/if}
      </g>
      <path d={BODY} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
      <g clip-path="url(#{uid}b)"><path d={bodyHatch} stroke={INK} stroke-width="5" stroke-linecap="round" /></g>
      <!-- the ice mantle (the part) and the plating shards on it -->
      {#if mantle.on}<path d="M400 336 C500 300 680 300 750 340" fill="none" stroke={GOLD} stroke-width="40" stroke-linecap="round" opacity=".55" />{/if}
      <path d="M400 336 C500 300 680 300 750 340" fill="none" stroke={mantle.broke ? BONE2 : FROST} stroke-width="22" stroke-linecap="round" />
      {#if mantle.broke}<path d="M520 316 l16 18 l-10 10 l16 14 M640 314 l-12 18 l14 10" fill="none" stroke={EMBER} stroke-width="6" stroke-linecap="round" />{/if}
      {#each SHARDS as [layer, d], i}
        <path class="shard" class:gone={layers < layer} {d} fill={FROST} stroke={INK} stroke-width="7" stroke-linejoin="round" style="transform-origin:{560}px 320px;transition-delay:{i * 30}ms" />
      {/each}
      {#each LEGS.filter(l => !l.far) as L (L.id)}
        <path d="M{L.sh[0]} {L.sh[1]} L{L.el[0]} {L.el[1]} L{L.paw[0]} {L.paw[1]}" fill="none" stroke={INK} stroke-width="48" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M{L.sh[0]} {L.sh[1]} L{L.el[0]} {L.el[1]} L{L.paw[0]} {L.paw[1]}" fill="none" stroke={BONE} stroke-width="34" stroke-linecap="round" stroke-linejoin="round" />
        <path data-foot d="M{L.paw[0] - 26} {L.paw[1] - 2} h40 l6 14 h-50 Z" fill={INK} />
      {/each}
      <g class="head" style="transform-origin:340px 380px">
        <path d={FRILL} fill={FROST} stroke={INK} stroke-width="6" stroke-linejoin="round" />
        {#if jaw.on}<path d={JAW} fill="none" stroke={GOLD} stroke-width="26" stroke-linejoin="round" opacity=".55" />{/if}
        <g class="jaw" style="transform-origin:330px 394px">
          <path d={jaw.broke ? 'M190 394 l8 16 l8 -16 Z M262 396 l7 14 l7 -14 Z' : FANGS} fill={BONE} stroke={INK} stroke-width="4" />
          <path d={JAW} fill={BONE2} stroke={INK} stroke-width="8" stroke-linejoin="round" />
          {#if jaw.broke}<path d="M222 404 l10 -8 l8 10 l10 -8" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />{/if}
        </g>
        <path d={SKULL} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
        <circle cx="262" cy="364" r="10" fill={enraged ? EMBER : FROST} stroke={INK} stroke-width="4" />
        <path d="M236 350 C252 340 274 340 290 346" fill="none" stroke={INK} stroke-width="7" stroke-linecap="round" />
        <g class="stars" style="transform-origin:260px 270px"><path d={star(190, 270, 40)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(340, 240, 34)} fill={GOLD} stroke={INK} stroke-width="6" /><path d={star(280, 310, 26)} fill={GOLD} stroke={INK} stroke-width="6" /></g>
      </g>
      <g class="fx glitter"><path d={star(470, 230, 18)} fill={FROST} /><path d={star(600, 190, 22)} fill={FROST} /><path d={star(720, 250, 16)} fill={FROST} /><path d={star(540, 260, 12)} fill={FROST} /></g>
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 560px 530px; }
  .breath { transform-origin: 560px 530px; animation: wc-breathe 3s ease-in-out infinite; transition: transform .35s ease; }
  .head { transition: transform .35s ease; }
  .tail { animation: sway 3.4s ease-in-out infinite; }
  .jaw { transform-box: view-box; transition: transform .3s ease; }
  .shard { transform-box: view-box; transition: transform .45s ease, opacity .45s ease; }
  .shard.gone { opacity: 0; transform: translateY(120px) rotate(40deg) scale(.6); }
  .glitter { opacity: 0; }
  @keyframes sway { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-7deg); } }

  /* pounce coming: crouched low, head down, tail high and twitching */
  .pose-crouch .breath { animation: none; transform: translateX(40px) scaleY(.8); }
  .pose-crouch .head { transform: translate(-10px, 24px) rotate(-6deg); }
  .pose-crouch .tail { animation: twitch .35s ease-in-out infinite; }
  .pose-crouch .jaw { transform: rotate(-12deg); }
  @keyframes twitch { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(-22deg); } }
  /* tail sweep coming: the tail draws back and winds */
  .pose-coil .tail { animation: wind 1.1s ease-in-out infinite; }
  .pose-coil .breath { transform: skewX(-6deg); }
  @keyframes wind { 0%, 100% { transform: rotate(24deg); } 50% { transform: rotate(40deg); } }
  /* rime coat: still, frost glittering over the back */
  .pose-frost .breath { animation-duration: 5s; }
  .pose-frost .glitter { animation: twinkle 1.2s ease-in-out infinite; }
  @keyframes twinkle { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
  /* dazed */
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  .pose-dazed .jaw { transform: rotate(-10deg); }
  /* beaten */
  .pose-down .breath { animation: none; transform: scaleY(.84); filter: saturate(.55) brightness(.8); }
  .pose-down .head { transform: translate(-10px, 30px) rotate(-12deg); }
  .pose-down .tail { animation: none; transform: rotate(40deg); }
</style>
