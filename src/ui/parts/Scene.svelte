<script lang="ts">
  // Ashfall Ridge behind the monster plates: a far ridge and nearer hills in low-contrast hatching, a hazy sun,
  // and ash drifting down. Kept dark and quiet so the monster always reads first. Same space as the plates.
  const flakes = [[140, 0], [260, 3.2], [380, 1.4], [520, 4.6], [640, 2.1], [760, 5.4], [880, 0.8], [200, 6.1], [700, 7.3]] as const;
  const hatch = (x0: number, x1: number, y0: number, y1: number, step: number) =>
    Array.from({ length: Math.ceil((x1 - x0) / step) }, (_, i) => `M${x0 + i * step} ${y0} l-40 ${y1 - y0}`).join(' ');
  const uid = `sc${Math.random().toString(36).slice(2, 7)}`;
  const FAR = 'M60 360 L150 300 L210 326 L320 230 L400 290 L470 256 L560 312 L660 214 L760 296 L840 262 L1000 330 V532 H60 Z';
  const NEAR = 'M60 440 C160 400 260 420 340 430 C460 444 560 398 680 404 C800 410 900 444 1000 430 V532 H60 Z';
</script>

<svg class="scene" viewBox="60 40 940 520" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs>
    <clipPath id="{uid}f"><path d={FAR} /></clipPath>
    <clipPath id="{uid}n"><path d={NEAR} /></clipPath>
    <radialGradient id="{uid}s"><stop offset="0" stop-color="#3a2e24" /><stop offset="1" stop-color="#3a2e24" stop-opacity="0" /></radialGradient>
  </defs>
  <circle cx="820" cy="140" r="120" fill="url(#{uid}s)" />
  <circle cx="820" cy="140" r="44" fill="#2e251e" />
  <path d={FAR} fill="#211a15" />
  <path d={hatch(60, 1080, 210, 540, 18)} stroke="#2a221b" stroke-width="4" clip-path="url(#{uid}f)" />
  <path d={FAR} fill="none" stroke="#2c241d" stroke-width="5" stroke-linejoin="round" />
  <path d={NEAR} fill="#1c1612" />
  <path d={hatch(60, 1080, 396, 540, 14)} stroke="#241d17" stroke-width="4" clip-path="url(#{uid}n)" />
  {#each flakes as [x, d]}<circle class="ash" cx={x} cy="40" r="3.5" fill="#4a3f35" style="animation-delay:-{d}s" />{/each}
</svg>

<style>
  .scene { position: absolute; inset: 0; width: 100%; height: 100%; display: block; pointer-events: none; }
  .ash { animation: fall 9s linear infinite; transform-box: view-box; }
  @keyframes fall { 0% { transform: translate(0, 0); opacity: 0; } 10% { opacity: .9; } 100% { transform: translate(-60px, 480px); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .ash { animation: none; opacity: 0; } }
</style>
