<script lang="ts">
  // The Gorehorn in the woodcut style of the store art (art/keyart.py): solid bone silhouette, ink edge,
  // hatched underside, gold tusks. Drawn in the key art's 1000 × 600 space, mirrored to face the player.
  // Poses follow the hunt: breathing at rest, a crouch and pawing on the wind-up, a lean before the charge,
  // a wobble when dazed, a droop when exhausted, nosing for roots. One-shots: a lunge when it attacks,
  // a flinch when it's hit. Parts light up when aimed at and change when broken.
  import type { Hunt } from '../../../engine';
  import { game } from '../../game.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();

  const INK = '#1a1410', BONE = '#ecdfc8', BONE2 = '#c9b89c', FAR = '#b9a88c', GOLD = '#f3cf7a', EMBER = '#e8773a';
  const BODY = 'M296 230 C320 170 388 124 476 108 C566 92 664 100 744 136 C808 164 848 212 858 266 C868 320 844 372 792 392 L762 404 C702 420 602 424 522 414 L432 404 C394 400 366 392 346 380 C318 364 300 340 294 312 Z';
  const HEAD = 'M352 196 C320 200 284 214 250 238 C214 262 176 296 146 330 C128 350 116 366 116 384 C118 402 138 412 164 414 C214 418 270 412 316 398 C356 386 378 360 380 326 C382 280 376 230 352 196 Z';
  const EAR = 'M318 206 L338 142 L372 214 Z';
  const BRISTLES = 'M392 132 L404 82 L424 124 L442 70 L462 118 L482 64 L502 112 L524 66 L542 110 L566 70 L582 110 L608 78 L620 114 L648 90 L656 120 L686 104 L690 128 Z';
  const TUSKS = ['M150 404 C128 372 130 324 158 292 C160 334 172 370 196 398 Z', 'M204 410 C190 374 198 330 230 302 C230 346 240 380 258 404 Z'];
  const STUBS = ['M150 404 C140 386 140 368 150 352 L168 370 C170 382 180 394 196 398 Z', 'M204 410 C198 392 200 376 208 362 L226 378 C230 390 240 398 258 404 Z'];
  // legs: shoulder, knee, hoof. Far legs are drawn first and a shade darker, for depth.
  type Leg = { id: string; sh: [number, number]; kn: [number, number]; hf: [number, number]; far: boolean };
  const LEGS: Leg[] = [
    { id: 'fr', sh: [456, 392], kn: [470, 452], hf: [462, 516], far: true },
    { id: 'rr', sh: [720, 392], kn: [744, 452], hf: [726, 516], far: true },
    { id: 'ff', sh: [392, 372], kn: [380, 446], hf: [372, 516], far: false },
    { id: 'rf', sh: [790, 370], kn: [810, 446], hf: [792, 516], far: false }
  ];
  const hatch = (() => { let d = ''; for (let x = 260; x < 900; x += 14) d += `M${x} 300 L${x - 40} 430 `; return d; })();
  const headHatch = (() => { let d = ''; for (let x = 130; x < 400; x += 12) d += `M${x} 330 L${x - 26} 420 `; return d; })();
  const fur = Array.from({ length: 9 }, (_, k) => `M${420 + k * 46} ${150 + Math.abs(k - 4) * 6} q10 22 4 44`).join(' ');
  const uid = `gh${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const pose = $derived(
    hunt?.over === 'win' ? 'down' :
    intent === 'windup' ? 'windup' : intent === 'charge' ? 'tense' : intent === 'dazed' || intent === 'pinned' ? 'dazed' :
    intent === 'exhausted' ? 'tired' : intent === 'root' ? 'root' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const tusks = $derived(part('tusks')), hide = $derived(part('hide')), legs = $derived(part('legs'));
  const mud = $derived(!!m && m.wallow > 0 && !m.parts.hide?.broken);
  const enraged = $derived(!!m?.enraged);

  // one-shot motion: lunge when it attacks, flinch when hit (Web Animations, so the loop underneath keeps running)
  let rig: SVGGElement;
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let seenAct = game.pulse.act, seenHit = game.pulse.hit;
  $effect(() => {
    const a = game.pulse.act;
    if (!hunt || a === seenAct) return; seenAct = a;
    if (!reduce) rig?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(14px)', offset: 0.2 }, { transform: 'translateX(-90px) rotate(3deg)', offset: 0.55 }, { transform: 'translateX(0)' }], { duration: 520, easing: 'cubic-bezier(.3,.7,.3,1)' });
  });
  $effect(() => {
    const t = game.pulse.hit;
    if (!hunt || t === seenHit) return; seenHit = t;
    if (!reduce) rig?.animate([{ transform: 'translateX(0)', filter: 'brightness(1.6)' }, { transform: 'translateX(22px) rotate(-2deg)', filter: 'brightness(1.15)', offset: 0.3 }, { transform: 'translateX(0)', filter: 'brightness(1)' }], { duration: 300, easing: 'ease-out' });
  });
</script>

<svg class="wc pose-{pose}" class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Gorehorn, a great ridge boar{pose === 'windup' ? ', lowering its head to charge' : ''}">
  <defs>
    <clipPath id="{uid}b"><path d={BODY} /></clipPath>
    <clipPath id="{uid}h"><path d={HEAD} /></clipPath>
    <linearGradient id="{uid}u" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0" /><stop offset="1" stop-color="#000" stop-opacity="1" /></linearGradient>
    <mask id="{uid}m"><rect x="0" y="0" width="1000" height="600" fill="url(#{uid}u)" /></mask>
  </defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <g>
    <g class="rig" bind:this={rig}>
      <g class="breath">
        {#each LEGS as L (L.id)}
          {@const lame = legs.broke && L.id === 'rf'}
          <g class="leg leg-{L.id}" style="transform-origin:{L.sh[0]}px {L.sh[1]}px">
            <path d="M{L.sh[0]} {L.sh[1]} L{L.kn[0]} {L.kn[1]}" stroke={legs.on ? GOLD : INK} stroke-width={legs.on ? 76 : 64} stroke-linecap="round" />
            <path d="M{L.sh[0]} {L.sh[1]} L{L.kn[0]} {L.kn[1]}" stroke={L.far ? FAR : BONE} stroke-width="50" stroke-linecap="round" />
            <g class="shin" style="transform-origin:{L.kn[0]}px {L.kn[1]}px;{lame ? 'transform:rotate(-28deg)' : ''}">
              <path d="M{L.kn[0]} {L.kn[1]} L{L.hf[0]} {L.hf[1]}" stroke={legs.on ? GOLD : INK} stroke-width={legs.on ? 52 : 40} stroke-linecap="round" />
              <path d="M{L.kn[0]} {L.kn[1]} L{L.hf[0]} {L.hf[1]}" stroke={L.far ? FAR : BONE} stroke-width="28" stroke-linecap="round" />
              <path d="M{L.hf[0] - 18} {L.hf[1] - 6} h36 l6 18 h-48 Z" fill={INK} stroke={BONE2} stroke-width="3" stroke-linejoin="round" />
              {#if lame}<path d="M{L.kn[0] - 14} {L.kn[1] + 10} l10 12 l-8 10 l12 10" fill="none" stroke={EMBER} stroke-width="6" stroke-linecap="round" />{/if}
            </g>
          </g>
        {/each}
        <path d={BRISTLES} fill={enraged ? EMBER : BONE} stroke={INK} stroke-width="8" stroke-linejoin="round" />
        {#if hide.on}<path d={BODY} fill="none" stroke={GOLD} stroke-width="30" stroke-linejoin="round" opacity=".55" />{/if}
        <path d={BODY} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
        <g clip-path="url(#{uid}b)">
          <path d={hatch} stroke={INK} stroke-width="5" stroke-linecap="round" />
          <rect x="0" y="0" width="1000" height="600" fill={INK} opacity=".85" mask="url(#{uid}m)" />
          {#if mud}<g class="mud"><ellipse cx="560" cy="330" rx="120" ry="50" fill="#5b4532" opacity=".85" /><ellipse cx="700" cy="290" rx="70" ry="40" fill="#5b4532" opacity=".8" /><ellipse cx="460" cy="250" rx="50" ry="26" fill="#5b4532" opacity=".7" /></g>{/if}
          {#if hide.broke}<path d="M520 170 l26 40 l-20 18 l30 44 l-22 20 l28 40" fill="none" stroke={EMBER} stroke-width="9" stroke-linecap="round" stroke-linejoin="round" /><path d="M560 200 l40 14 M552 262 l44 8 M560 320 l40 4" stroke={INK} stroke-width="6" stroke-linecap="round" />{/if}
        </g>
        <path d={fur} fill="none" stroke={INK} stroke-width="5" stroke-linecap="round" opacity=".6" />
        <path d="M338 236 C372 260 392 300 392 344 M360 222 C398 252 418 296 420 344" fill="none" stroke={INK} stroke-width="6" stroke-linecap="round" opacity=".7" />
        <g class="head" style="transform-origin:360px 300px">
          <path d={EAR} fill={BONE} stroke={INK} stroke-width="9" stroke-linejoin="round" />
          <path d={HEAD} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
          <ellipse cx="112" cy="382" rx="20" ry="32" fill={BONE2} stroke={INK} stroke-width="8" />
          <ellipse cx="108" cy="372" rx="4" ry="7" fill={INK} /><ellipse cx="108" cy="392" rx="4" ry="7" fill={INK} />
          <circle cx="266" cy="286" r="10" fill={enraged ? EMBER : INK} />
          <path d="M244 270 C258 258 278 256 294 262" fill="none" stroke={INK} stroke-width="8" stroke-linecap="round" />
          <g clip-path="url(#{uid}h)"><path d={headHatch} stroke={INK} stroke-width="5" stroke-linecap="round" /><rect x="0" y="0" width="1000" height="600" fill={INK} opacity=".7" mask="url(#{uid}m)" /></g>
          <path d="M166 404 C200 396 236 396 268 404" fill="none" stroke={INK} stroke-width="6" stroke-linecap="round" />
          {#each tusks.broke ? STUBS : TUSKS as d}
            {#if tusks.on}<path {d} fill="none" stroke={GOLD} stroke-width="26" stroke-linejoin="round" opacity=".55" />{/if}
            <path {d} fill={tusks.broke ? BONE2 : GOLD} stroke={INK} stroke-width="8" stroke-linejoin="round" />
          {/each}
          {#if tusks.broke}<path d="M148 356 l10 -6 l6 10 l10 -6 M206 366 l10 -6 l6 10 l10 -6" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" />{/if}
          <g class="snort"><circle cx="70" cy="370" r="10" fill={BONE2} /><circle cx="44" cy="356" r="7" fill={BONE2} /><circle cx="60" cy="398" r="6" fill={BONE2} /></g>
        </g>
      </g>
      <g class="stars" style="transform-origin:300px 150px"><circle cx="240" cy="150" r="10" fill={GOLD} /><circle cx="330" cy="120" r="8" fill={GOLD} /><circle cx="380" cy="170" r="7" fill={GOLD} /></g>
    </g>
  </g>
</svg>

<style>
  /* drawn facing left (like the key art); flipped so it faces the player */
  svg { display: block; width: 100%; height: auto; overflow: visible; transform: scaleX(-1); }
  .rig, .breath, .head, .leg, .shin, .stars, .snort { transform-box: view-box; }
  .breath { transform-origin: 560px 520px; animation: breathe 3.2s ease-in-out infinite; }
  .head { transform: translate(-34px, -8px) rotate(5deg); transition: transform .45s ease; }
  .stars, .snort { opacity: 0; }
  @keyframes breathe { 50% { transform: scaleY(1.025); } }

  /* wind-up: head down, rear up, the front hoof scrapes the ground */
  .pose-windup .head { transform: translate(-20px, 6px) rotate(-8deg); }
  .pose-windup .rig { transform: translateX(16px) rotate(2deg); transform-origin: 560px 520px; transition: transform .4s ease; }
  .pose-windup .leg-ff { animation: paw .7s ease-in-out infinite; }
  .pose-windup .breath { animation-duration: 1.1s; }
  @keyframes paw { 0%, 100% { transform: rotate(0); } 40% { transform: rotate(-24deg); } 70% { transform: rotate(10deg); } }
  /* the charge is coming: leaning in, snorting */
  .pose-tense .head { transform: translate(-40px, 0) rotate(-1deg); }
  .pose-tense .rig { transform: translateX(-14px); transition: transform .3s ease; }
  .pose-tense .snort { animation: snort 1.2s ease-out infinite; }
  @keyframes snort { 0% { opacity: .9; transform: translateX(0); } 100% { opacity: 0; transform: translateX(-40px); } }
  /* dazed: swaying, stars round the head */
  .pose-dazed .rig { animation: sway 1.4s ease-in-out infinite; transform-origin: 560px 520px; }
  .pose-dazed .stars { opacity: 1; animation: orbit 1.6s linear infinite; }
  @keyframes sway { 0%, 100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }
  @keyframes orbit { to { transform: rotate(360deg); } }
  /* exhausted: head hangs, slow heavy breathing */
  .pose-tired .head { transform: translate(-24px, 10px) rotate(-14deg); }
  .pose-tired .breath { animation-duration: 1.6s; }
  /* rooting for food: nose to the ground, nodding */
  .pose-root .head { animation: nose 1.1s ease-in-out infinite; }
  @keyframes nose { 0%, 100% { transform: translate(-24px, 12px) rotate(-16deg); } 50% { transform: translate(-24px, 6px) rotate(-8deg); } }
  /* beaten: lies still */
  .pose-down .breath { animation: none; }
  .pose-down .rig { transform: translateY(40px) rotate(4deg); transform-origin: 560px 520px; filter: saturate(.6) brightness(.85); }
  .pose-down .head { transform: translate(-20px, 14px) rotate(-18deg); }
  .static .breath { animation: none; }
  @media (prefers-reduced-motion: reduce) { .breath, .leg, .stars, .snort, .rig, .head { animation: none !important; transition: none !important; } }
</style>
