<script lang="ts">
  // The Hunter Rank as a stamped guild tag on a bead chain (Nov 2026, Mekkman picked it from four directions).
  // Rank reads by the tag's metal first, the letter second: F iron, E copper, D bronze, C silver; High Rank later
  // goes mithril, adamantite, then a dark metal for S. Never gold: the UI keeps gold for "do this now".
  // Used in the header, the Hunt Board's rank headings and the "Promoted!" banner.
  // The letter is placed by its measured ink box (IM Fell English SC at 100px: left, right, ascent, descent),
  // because the face's capitals sit high in their line box and CSS centring leaves them off centre.
  let { rank, size = 44, dim = false, title = '' }: { rank: string; size?: number; dim?: boolean; title?: string } = $props();
  const INK: Record<string, [number, number, number, number]> = {
    S: [-4, 47, 71, 0], A: [2, 70, 71, 2], B: [-3, 63, 69, 1], C: [-4, 68, 71, 2], D: [-4, 77, 71, 0], E: [-2, 67, 68, 2], F: [-2, 62, 70, 2],
  };
  // [highlight, body, edge]
  const METAL: Record<string, [string, string, string]> = {
    F: ['#a19c93', '#6b6760', '#3a3834'], // iron
    E: ['#d79a6e', '#9a5a35', '#4f2a16'], // copper
    D: ['#cfb07c', '#8e6c3c', '#4a361b'], // bronze
    C: ['#eeebe4', '#b2aea6', '#5f5b55'], // silver
    B: ['#cfe3e6', '#8fb0b6', '#3f5559'], // mithril
    A: ['#b7a6c9', '#6f5f86', '#332942'], // adamantite
    S: ['#6c6760', '#2f2b27', '#0f0d0b'], // dark metal
  };
  const CX = 20, CY = 32.5, FS = 19;
  const m = $derived(METAL[rank] ?? METAL.F);
  const pos = $derived.by(() => {
    const [l, r, a, d] = INK[rank] ?? [0, 60, 70, 0]; const k = FS / 100;
    return { x: CX - ((r - l) / 2) * k, y: CY + ((a - d) / 2) * k };
  });
  const beads = [-1, 1].flatMap(s => [0, 1, 2, 3, 4, 5, 6].map(i => ({ x: 20 + s * (1.6 + i * 1.55), y: 12 - i * 1.9 })));
  const uid = $props.id();
</script>

<svg class="ranktag" class:dim width={size * (40 / 54)} height={size} viewBox="0 -2 40 54" role={title ? 'img' : undefined} aria-hidden={title ? undefined : 'true'} aria-label={title || undefined}>
  {#if title}<title>{title}</title>{/if}
  <defs>
    <linearGradient id="g{uid}" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color={m[0]} /><stop offset=".6" stop-color={m[1]} /><stop offset="1" stop-color={m[2]} /></linearGradient>
  </defs>
  {#each beads as b}<circle cx={b.x} cy={b.y} r=".85" fill="#9a958c" stroke="#3a3834" stroke-width=".3" />{/each}
  <rect x="5" y="9" width="30" height="42" rx="7" fill="url(#g{uid})" stroke={m[2]} stroke-width="1" />
  <rect x="8" y="17" width="24" height="31" rx="4" fill="none" stroke={m[2]} stroke-width=".7" opacity=".7" />
  <circle cx="20" cy="13" r="2" fill="#14100d" stroke={m[2]} stroke-width=".6" />
  <!-- stamped: a light edge under the dark letter -->
  <text x={pos.x} y={pos.y + 0.7} font-size={FS} fill={m[0]} opacity=".55">{rank}</text>
  <text x={pos.x} y={pos.y} font-size={FS} fill={m[2]}>{rank}</text>
</svg>

<style>
  .ranktag { flex: none; display: block; overflow: visible; filter: drop-shadow(0 2px 2px rgba(0,0,0,.55)); }
  .ranktag text { font-family: 'IM Fell English SC', Georgia, serif; }
  .ranktag.dim { filter: saturate(.5) brightness(.6) drop-shadow(0 2px 2px rgba(0,0,0,.55)); }
</style>
