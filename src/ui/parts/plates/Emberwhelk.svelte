<script lang="ts">
  // The Emberwhelk, Mirewood regenerator, in the woodcut style. Drawn facing left in 1000 × 600 and flipped.
  // A cart-sized snail: a long foot on the ground, a molten spiral shell, eye stalks and a frill of gills behind the head.
  // Idle: stalks sway, gills pulse. Spit Cinders: the head tips up, a glowing gob in the mouth. Molten Slime: the foot
  // surges and the slime under it glows. Shell Retreat: the head, stalks and gills shrink back into the shell.
  // Rears Back: the front lifts and the shell tips forward. Dazed: stars. Broken: grey torn gills, a split shell, a split foot.
  import type { Hunt } from '../../../engine';
  import { oneShots, LUNGE, INK, BONE, BONE2, FAR, GOLD, EMBER, MUD, star, hatchLines } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();
  const SHELL = '#9a7a5e', GILL = '#c9604a', GILL_DEAD = '#8a8174', SLIME = '#f0a85a';

  const FOOT = 'M120 530 C110 500 140 470 200 466 L330 470 C420 474 700 470 800 474 C860 478 900 506 890 530 Z';
  const NECK = 'M200 470 C190 420 196 380 222 352 C246 328 290 330 318 360 C340 386 344 430 340 472 Z';
  const HEAD = 'M150 372 C150 330 186 306 226 308 C266 310 290 336 286 370 C282 400 250 414 214 412 C176 410 150 398 150 372 Z';
  const SX = 600, SY = 316, SR = 176;
  const spiral = (() => {
    let d = '';
    for (let i = 0; i <= 120; i++) {
      const t = i / 120, a = Math.PI * 0.6 + t * Math.PI * 2 * 2.4, r = SR * (1 - t) * 0.92 + 10;
      d += `${i ? 'L' : 'M'}${(SX + Math.cos(a) * r).toFixed(1)} ${(SY + Math.sin(a) * r).toFixed(1)} `;
    }
    return d;
  })();
  const GILLS = [[296, 312, -40], [322, 300, -12], [344, 306, 16], [356, 328, 40]] as const;
  const shellHatch = hatchLines(SX - SR, SX + SR + 20, SY - SR, SY + SR, 16, -36);
  const footHatch = hatchLines(140, 900, 488, 532, 16, -18);
  const uid = `ew${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const inShell = $derived((m?.shell ?? 0) > 0);
  const pose = $derived(
    hunt?.over === 'win' ? 'down' : intent === 'dazed' ? 'dazed' : intent === 'retreat' || inShell ? 'retreat' :
    intent === 'rear' || intent === 'lunge' ? 'rear' : intent === 'spit' ? 'spit' : intent === 'slime' ? 'slime' : 'idle');
  const part = (id: string) => (hunt ? { on: hunt.target === id && !hunt.over, broke: !!m?.parts[id]?.broken } : { on: false, broke: false });
  const gills = $derived(part('gills')), shell = $derived(part('shell')), foot = $derived(part('foot'));
  const enraged = $derived(!!m?.enraged);
  const slimed = $derived((m?.slime ?? 0) > 0);

  let rig: SVGGElement;
  oneShots(() => rig, () => hunt, () => LUNGE);
</script>

<svg class="wc ew pose-{pose}" class:enraged class:static={!hunt} viewBox="60 40 940 520" role="img" aria-label="Engraving of the Emberwhelk, a giant snail with a molten shell">
  <defs>
    <clipPath id="{uid}s"><circle cx={SX} cy={SY} r={SR} /></clipPath>
    <clipPath id="{uid}f"><path d={FOOT} /></clipPath>
  </defs>
  <path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <!-- the slime trail: glows when it surges, and while it's burning you -->
  <ellipse class="slime" class:lit={slimed} cx="520" cy="534" rx="420" ry="16" fill={SLIME} opacity=".35" />
  <g class="rig" bind:this={rig}>
    <g class="breath">
      <!-- foot -->
      <g class="foot" style="transform-origin:600px 530px">
        {#if foot.on}<path d={FOOT} fill="none" stroke={GOLD} stroke-width="24" opacity=".5" />{/if}
        <path d={FOOT} fill={foot.broke ? BONE2 : BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
        <g clip-path="url(#{uid}f)"><path d={footHatch} stroke={INK} stroke-width="4" stroke-linecap="round" opacity=".7" /></g>
        <path d="M160 520 C300 514 600 514 870 520" fill="none" stroke={INK} stroke-width="4" opacity=".5" />
        {#if foot.broke}<path d="M420 474 l10 18 l-12 10 l14 22 M640 476 l-8 16 l12 12 l-6 20" fill="none" stroke={EMBER} stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />{/if}
      </g>
      <g class="drips" class:lit={slimed}>
        <path d="M112 530 C110 512 130 500 160 502 C190 504 200 516 230 512 C260 508 280 520 300 530 Z" fill={SLIME} stroke={INK} stroke-width="5" stroke-linejoin="round" />
        <path d="M150 502 C146 486 152 478 158 474 C162 482 164 492 160 502 Z M236 512 C234 498 240 492 246 488 C250 496 250 506 246 512 Z" fill={SLIME} stroke={INK} stroke-width="4" />
        <circle cx="96" cy="526" r="7" fill={SLIME} stroke={INK} stroke-width="4" />
      </g>
      <!-- front: neck, gills, head and eye stalks. Shrinks back into the shell on Shell Retreat -->
      <g class="front">
        <path d={NECK} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
        <g class="gills" style="transform-origin:320px 350px">
          {#if gills.on}<circle cx="326" cy="320" r="62" fill="none" stroke={GOLD} stroke-width="22" opacity=".5" />{/if}
          {#each GILLS as [x, y, a], i}
            <g transform="rotate({a} {x} {y + 30})">
              <path d={gills.broke && i % 2 ? `M${x - 10} ${y + 30} L${x - 6} ${y} L${x + 2} ${y + 12} L${x + 10} ${y + 30} Z` : `M${x - 14} ${y + 30} C${x - 18} ${y - 4} ${x - 6} ${y - 30} ${x} ${y - 30} C${x + 6} ${y - 30} ${x + 18} ${y - 4} ${x + 14} ${y + 30} Z`}
                fill={gills.broke ? GILL_DEAD : GILL} stroke={INK} stroke-width="6" stroke-linejoin="round" />
              {#if !gills.broke}<path d="M{x} {y + 24} L{x} {y - 18}" stroke={INK} stroke-width="3" opacity=".6" />{/if}
            </g>
          {/each}
        </g>
        <g class="head" style="transform-origin:250px 380px">
          <!-- eye stalks -->
          <g class="stalk a" style="transform-origin:196px 320px">
            <path d="M196 322 C186 290 172 262 160 236" fill="none" stroke={INK} stroke-width="22" stroke-linecap="round" /><path d="M196 322 C186 290 172 262 160 236" fill="none" stroke={BONE} stroke-width="11" stroke-linecap="round" />
            <circle cx="158" cy="230" r="16" fill={BONE} stroke={INK} stroke-width="6" /><circle cx="154" cy="228" r="7" fill={enraged ? EMBER : INK} />
          </g>
          <g class="stalk b" style="transform-origin:244px 314px">
            <path d="M244 316 C244 282 240 254 236 226" fill="none" stroke={INK} stroke-width="22" stroke-linecap="round" /><path d="M244 316 C244 282 240 254 236 226" fill="none" stroke={BONE} stroke-width="11" stroke-linecap="round" />
            <circle cx="236" cy="220" r="16" fill={BONE} stroke={INK} stroke-width="6" /><circle cx="232" cy="218" r="7" fill={enraged ? EMBER : INK} />
          </g>
          <path d={HEAD} fill={BONE} stroke={INK} stroke-width="10" stroke-linejoin="round" />
          <path d="M154 392 C168 380 196 378 236 394" fill="none" stroke={INK} stroke-width="7" stroke-linecap="round" />
          <path d="M162 388 l4 10 l6 -9 l6 11 l6 -11 l6 11 l6 -10 l6 10 l6 -8" fill={BONE2} stroke={INK} stroke-width="4" stroke-linejoin="round" />
          <path d="M168 340 C188 328 216 330 236 344" fill="none" stroke={INK} stroke-width="8" stroke-linecap="round" />
          <path d="M200 356 l-10 -4 M214 364 l-6 -8 M250 352 l-8 -6" stroke={INK} stroke-width="4" stroke-linecap="round" opacity=".6" />
          <circle class="gob" cx="150" cy="384" r="16" fill={EMBER} stroke={INK} stroke-width="5" />
          <g class="stars" style="transform-origin:200px 180px"><path d={star(150, 180, 30)} fill={GOLD} stroke={INK} stroke-width="5" /><path d={star(250, 168, 24)} fill={GOLD} stroke={INK} stroke-width="5" /></g>
        </g>
      </g>
      <!-- shell: the molten spiral. Cracks glow brighter when enraged; split open once broken -->
      <g class="shell" style="transform-origin:{SX}px {SY + SR}px">
        {#if shell.on}<circle cx={SX} cy={SY} r={SR + 12} fill="none" stroke={GOLD} stroke-width="24" opacity=".5" />{/if}
        <circle cx={SX} cy={SY} r={SR} fill={shell.broke ? '#7a5a44' : SHELL} stroke={INK} stroke-width="11" />
        <circle class="core" cx={SX + 6} cy={SY + 4} r="40" fill={EMBER} opacity=".5" />
        <g clip-path="url(#{uid}s)"><path d={shellHatch} stroke={INK} stroke-width="4" stroke-linecap="round" opacity=".4" /></g>
        <path class="glow" d={spiral} fill="none" stroke={EMBER} stroke-width="20" stroke-linecap="round" opacity=".55" />
        <path d={spiral} fill="none" stroke={INK} stroke-width="8" stroke-linecap="round" />
        <path class="crack" d="M520 180 l14 26 l-10 18 l16 22 M700 214 l-18 20 l8 16 l-14 20 M650 450 l-10 -22 l12 -14" fill="none" stroke={EMBER} stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
        {#if shell.broke}
          <path d="M600 140 l-20 50 l26 30 l-30 50 l22 40 l-16 60" fill="none" stroke={INK} stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M600 140 l-20 50 l26 30 l-30 50 l22 40 l-16 60" fill="none" stroke={EMBER} stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
        {/if}
        <path d="M{SX - SR + 20} {SY + 120} C{SX - 60} {SY + SR + 10} {SX + 80} {SY + SR + 10} {SX + SR - 10} {SY + 110}" fill="none" stroke={MUD} stroke-width="8" opacity=".5" />
      </g>
    </g>
  </g>
</svg>

<style>
  .rig { transform-origin: 520px 530px; }
  .breath { transform-origin: 520px 530px; animation: wc-breathe 3.6s ease-in-out infinite; }
  .drips, .front, .head, .gills, .stalk, .shell, .foot, .gob, .slime { transform-box: view-box; transition: transform .4s ease, opacity .3s ease; }
  .stalk.a { animation: swayA 3s ease-in-out infinite; }
  .stalk.b { animation: swayB 3.4s ease-in-out infinite; }
  @keyframes swayA { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-7deg); } }
  @keyframes swayB { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(6deg); } }
  .gills { animation: gillpulse 2.2s ease-in-out infinite; }
  @keyframes gillpulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.07); } }
  .glow { animation: glow 2.6s ease-in-out infinite; }
  @keyframes glow { 0%, 100% { opacity: .4; } 50% { opacity: .7; } }
  .enraged .glow { stroke-width: 28; animation-duration: 1.2s; }
  .enraged .crack { stroke-width: 9; }
  .front { transform-origin: 460px 470px; }
  .core { animation: glow 2.6s ease-in-out infinite; }
  .enraged .core { r: 56px; animation-duration: 1.2s; }
  .drips { opacity: 0; transition: opacity .3s ease; }
  .drips.lit, .pose-slime .drips { opacity: 1; }
  .pose-slime .drips { animation: drip 1s ease-in-out infinite; }
  @keyframes drip { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-10px); } }
  .gob, .stars { opacity: 0; }
  .slime { opacity: .2; }
  .slime.lit { opacity: .55; animation: glow 1.4s ease-in-out infinite; }
  /* Spit Cinders: head tips up, a glowing gob at the mouth */
  .pose-spit .head { transform: rotate(10deg); }
  .pose-spit .gob { opacity: 1; animation: gob .9s ease-in-out infinite; }
  @keyframes gob { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-8px); } }
  /* Molten Slime: the foot surges, the trail glows */
  .pose-slime .foot { transform: scaleX(1.05) skewX(-4deg); }
  .pose-slime .front { transform: translateX(-24px); }
  .pose-slime .slime { opacity: .7; animation: glow 1s ease-in-out infinite; }
  /* Shell Retreat: the soft parts draw back into the shell */
  .pose-retreat .front { transform: translateX(240px) scale(.25); opacity: 0; }
  .pose-retreat .foot { transform: scaleX(.72); }
  .pose-retreat .stalk, .pose-retreat .gills { animation: none; }
  .pose-retreat .glow { opacity: .8; }
  /* Rears Back: the front lifts, the shell tips forward */
  .pose-rear .front { transform-origin: 270px 470px; transform: rotate(10deg); }
  .pose-rear .shell { transform: rotate(-9deg); }
  /* dazed and beaten */
  .pose-dazed .breath { animation: wc-reel 1.2s ease-in-out infinite; }
  .pose-dazed .stars { opacity: 1; animation: wc-orbit 1.4s linear infinite; }
  .pose-dazed .stalk { animation: none; transform: rotate(-24deg); }
  .pose-down .breath { animation: none; transform: scaleY(.86); filter: saturate(.55) brightness(.8); }
  .pose-down .front { transform: rotate(-12deg) translateY(30px); }
  .pose-down .stalk, .pose-down .gills, .pose-down .glow { animation: none; }
  .pose-down .stalk { transform: rotate(-40deg); }
</style>
