<script lang="ts">
  /** ridge: Ashfall Ridge (Tier 1). mire: the Mirewood (Tier 2), reeds and still water under mist. */
  let { region = 'ridge' }: { region?: 'ridge' | 'mire' } = $props();
  // Ashfall Ridge behind the monster plates: a far ridge and nearer hills in low-contrast hatching, a hazy sun,
  // and ash drifting down. Kept dark and quiet so the monster always reads first. Same space as the plates.
  const flakes = [[140, 0], [260, 3.2], [380, 1.4], [520, 4.6], [640, 2.1], [760, 5.4], [880, 0.8], [200, 6.1], [700, 7.3]] as const;
  const hatch = (x0: number, x1: number, y0: number, y1: number, step: number) =>
    Array.from({ length: Math.ceil((x1 - x0) / step) }, (_, i) => `M${x0 + i * step} ${y0} l-40 ${y1 - y0}`).join(' ');
  const uid = `sc${Math.random().toString(36).slice(2, 7)}`;
  const FAR = 'M60 360 L150 300 L210 326 L320 230 L400 290 L470 256 L560 312 L660 214 L760 296 L840 262 L1000 330 V532 H60 Z';
  const NEAR = 'M60 440 C160 400 260 420 340 430 C460 444 560 398 680 404 C800 410 900 444 1000 430 V532 H60 Z';
  const TREES = [[120, 250, 1], [250, 210, 1.2], [420, 260, .9], [640, 200, 1.3], [800, 240, 1], [920, 220, 1.1]] as const;
  const REEDS = Array.from({ length: 26 }, (_, i) => [80 + i * 36 + (i % 3) * 7, 470 - (i % 4) * 14] as const);
</script>

<svg class="scene" viewBox="60 40 940 520" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs>
    <clipPath id="{uid}f"><path d={FAR} /></clipPath>
    <clipPath id="{uid}n"><path d={NEAR} /></clipPath>
    <radialGradient id="{uid}s"><stop offset="0" stop-color="#3a2e24" /><stop offset="1" stop-color="#3a2e24" stop-opacity="0" /></radialGradient>
  <linearGradient id="{uid}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f2320" /><stop offset="1" stop-color="#161a17" /></linearGradient></defs>
  {#if region === 'mire'}
    <circle cx="820" cy="140" r="120" fill="url(#{uid}s)" opacity=".6" />
    {#each TREES as [x, top, k]}<path d="M{x} 470 L{x} {top} M{x} {top + 60 * k} l-{40 * k} -{30 * k} M{x} {top + 110 * k} l{46 * k} -{34 * k} M{x} {top + 30} l{24 * k} -{40 * k}" stroke="#262a24" stroke-width={10 * k} stroke-linecap="round" fill="none" />{/each}
    <rect x="60" y="300" width="940" height="60" fill="#2a2d28" opacity=".35" />
    <path d="M60 470 H1000 V532 H60 Z" fill="url(#{uid}w)" />
    <path d="M90 488 h70 M240 502 h110 M430 492 h60 M560 506 h120 M760 494 h80 M880 508 h70" stroke="#2c322d" stroke-width="4" stroke-linecap="round" />
    {#each REEDS as [x, top]}<path d="M{x} 476 Q{x - 4} {top + 20} {x + 6} {top}" stroke="#2b3026" stroke-width="4" fill="none" stroke-linecap="round" />{/each}
  {:else}

  <circle cx="820" cy="140" r="120" fill="url(#{uid}s)" />
  <circle cx="820" cy="140" r="44" fill="#2e251e" />
  <path d={FAR} fill="#211a15" />
  <path d={hatch(60, 1080, 210, 540, 18)} stroke="#2a221b" stroke-width="4" clip-path="url(#{uid}f)" />
  <path d={FAR} fill="none" stroke="#2c241d" stroke-width="5" stroke-linejoin="round" />
  <path d={NEAR} fill="#1c1612" />
  <path d={hatch(60, 1080, 396, 540, 14)} stroke="#241d17" stroke-width="4" clip-path="url(#{uid}n)" />

  {/if}
  {#each flakes as [x, d]}<circle class="ash" class:mote={region === 'mire'} cx={x} cy="40" r="3.5" fill="#4a3f35" style="animation-delay:-{d}s" />{/each}
</svg>

<style>
  .scene { position: absolute; inset: 0; width: 100%; height: 100%; display: block; pointer-events: none; }
  .ash { animation: fall 9s linear infinite; transform-box: view-box; }
  @keyframes fall { 0% { transform: translate(0, 0); opacity: 0; } 10% { opacity: .9; } 100% { transform: translate(-60px, 480px); opacity: 0; } }
  .mote { fill: #3a4236; }
  @media (prefers-reduced-motion: reduce) { .ash { animation: none; opacity: 0; } }
</style>
