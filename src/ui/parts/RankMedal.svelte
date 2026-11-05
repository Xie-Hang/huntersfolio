<script lang="ts">
  // The Hunter Rank as a hanging medal: a ribbon over a struck gold disc. Used in the header, the Hunt Board's rank
  // headings and the "Promoted!" banner. The letter is placed by its measured ink box (IM Fell English SC at 100px:
  // left, right, ascent, descent), because the face's capitals sit high in their line box and CSS centring leaves
  // them off centre.
  let { rank, size = 40, dim = false, title = '' }: { rank: string; size?: number; dim?: boolean; title?: string } = $props();
  const INK: Record<string, [number, number, number, number]> = {
    S: [-4, 47, 71, 0], A: [2, 70, 71, 2], B: [-3, 63, 69, 1], C: [-4, 68, 71, 2], D: [-4, 77, 71, 0], E: [-2, 67, 68, 2], F: [-2, 62, 70, 2],
  };
  const CX = 24, CY = 37, FS = 20;
  const pos = $derived.by(() => {
    const [l, r, a, d] = INK[rank] ?? [0, 60, 70, 0]; const k = FS / 100;
    return { x: CX - ((r - l) / 2) * k, y: CY + ((a - d) / 2) * k };
  });
  const uid = $props.id();
</script>

<svg class="medal" class:dim width={size * 0.8} height={size} viewBox="0 0 48 60" role={title ? 'img' : undefined} aria-hidden={title ? undefined : 'true'} aria-label={title || undefined}>
  {#if title}<title>{title}</title>{/if}
  <defs>
    <radialGradient id="g{uid}" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#f6d98c" /><stop offset=".55" stop-color="#d9a740" /><stop offset="1" stop-color="#8e6420" /></radialGradient>
  </defs>
  <!-- ribbon: two crossed tails in ember with a gold stripe -->
  <path d="M10 0h12l8 22h-12z" fill="#8f3f1d" />
  <path d="M38 0h-12l-8 22h12z" fill="#b2532a" />
  <path d="M15 0h2l8 22h-2zM33 0h-2l-8 22h2z" fill="#e9b949" opacity=".8" />
  <!-- ring and disc -->
  <circle cx={CX} cy={CY} r="19.5" fill="#5e3f12" />
  <circle cx={CX} cy={CY} r="18" fill="url(#g{uid})" />
  <circle cx={CX} cy={CY} r="14.2" fill="none" stroke="#7a5418" stroke-width="1" />
  <circle cx={CX} cy={CY} r="15.6" fill="none" stroke="#f6d98c" stroke-width=".6" opacity=".55" />
  <text x={pos.x} y={pos.y} font-size={FS} fill="#1a1410">{rank}</text>
</svg>

<style>
  .medal { flex: none; display: block; overflow: visible; filter: drop-shadow(0 2px 2px rgba(0,0,0,.55)); }
  .medal text { font-family: 'IM Fell English SC', Georgia, serif; }
  .medal.dim { filter: grayscale(.75) brightness(.7) drop-shadow(0 2px 2px rgba(0,0,0,.55)); }
</style>
