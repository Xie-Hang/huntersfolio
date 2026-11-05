<script lang="ts">
  // Engraved weapon pictures (playtest, Nov 2026: "the weapons are all text"). Nine drawings, one per damage type
  // (Cut = blade, Blunt = maul, Pierce = bow) and band: 1 = starter and Ashfall Ridge gear (plain), 2 = Mirewood
  // (banded, inlaid), 3 = Stormspire and beyond (ornate, a glowing gem). The element colours the edge or inlay and
  // adds its mark (same shapes as Elem.svelte). Same woodcut style as Icon.svelte: bone fills, heavy ink.
  // Drawn diagonally in a 64 × 64 box, hilt bottom-left. Decorative beside the name (aria-hidden).
  import * as E from '../../engine';
  let { id, size = 40 }: { id: string; size?: number } = $props();

  const INK = '#1a1410', BONE = '#ecdfc8', BONE2 = '#c9b89c', STEEL = '#d8d2c4', WOOD = '#8a6a48', LEATHER = '#5b4532', GOLD = '#e9b949';
  const ELEM: Record<string, string> = { Stone: '#a99f90', Gale: '#8fc3c9', Ember: '#e8773a', Frost: '#b9d3f0' };
  const S = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

  const d = $derived(E.WEAPONS[id]);
  const band = $derived(Math.min(3, Math.max(1, d?.tier ?? 1)));
  const accent = $derived(d?.elem ? ELEM[d.elem] : STEEL);

  /** the element's mark, small, centred on (x, y) */
  function mark(e: string | null | undefined, x: number, y: number) {
    if (!e) return '';
    const c = ELEM[e], t = `translate(${x - 6} ${y - 6})`;
    if (e === 'Stone') return `<g transform="${t}"><rect x="1.5" y="1.5" width="9" height="9" rx="1" fill="${c}" ${S(1.6)}/></g>`;
    if (e === 'Gale') return `<g transform="${t}" fill="none"><path d="M0 4.5c2-1.8 4 1.8 6 0s4-1.8 6 0M0 8.5c2-1.8 4 1.8 6 0s4-1.8 6 0" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M0 4.5c2-1.8 4 1.8 6 0s4-1.8 6 0M0 8.5c2-1.8 4 1.8 6 0s4-1.8 6 0" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/></g>`;
    if (e === 'Ember') return `<g transform="${t}"><path d="M6 .5C7.3 3.3 10.5 4.8 10.5 8A4.5 4.5 0 0 1 1.5 8c0-1.8 1-2.9 1.9-3.5.1 1.3.8 2.1 1.6 2.3C4.7 4.7 5.1 2.5 6 .5z" fill="${c}" ${S(1.4)}/></g>`;
    return `<g transform="${t}" fill="none"><path d="M6 .5v11M1.2 3.2l9.6 5.6M1.2 8.8l9.6-5.6" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M6 .5v11M1.2 3.2l9.6 5.6M1.2 8.8l9.6-5.6" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/></g>`;
  }

  /** a quad centred on (cx, cy): half-length a along u = (1,1)/√2 (across the haft), half-width b along v = (1,-1)/√2 */
  function quad(cx: number, cy: number, a: number, b: number) {
    const k = Math.SQRT1_2, pts = [[a, b], [a, -b], [-a, -b], [-a, b]].map(([p, q]) => `${(cx + p * k + q * k).toFixed(1)} ${(cy + p * k - q * k).toFixed(1)}`);
    return `M${pts.join(' L')} Z`;
  }

  function blade(b: number, a: string, curved: boolean) {
    // blade from the guard (~20,44) to the tip (~58,6); wider and longer each band
    const edge = curved
      ? 'M16 40 C24 26 38 12 60 3 C56 18 44 34 26 48 Z'
      : b === 3 ? 'M14.5 39 L48 5 L61 3 L59 16 L25 49.5 Z' : b === 2 ? 'M15.5 40 L50 6 L60 4 L58 14 L24 48.5 Z' : 'M16.5 41 L51.5 7.5 L58.5 5.5 L56.5 12.5 L23 47.5 Z';
    let out = `<path d="${edge}" fill="${STEEL}" ${S()}/>`;
    out += curved ? `<path d="M22 42 C31 29 42 18 56 8" fill="none" stroke="${a}" stroke-width="3.6" stroke-linecap="round"/>`
      : `<path d="M21 44 L55 10" stroke="${b === 1 && a === STEEL ? BONE2 : a}" stroke-width="${b === 1 ? 2.4 : 3.6}" stroke-linecap="round"/>`;
    if (b === 3 && !curved) out += `<path d="M27 30 l-3 -3 M34 23 l-3 -3 M41 16 l-3 -3" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
    // guard
    out += b === 1 ? `<path d="${quad(19, 45, 9, 2.2)}" fill="${BONE2}" ${S(2.6)}/>`
      : `<path d="M10 37 C13 33 17 34 19 37 L27 45 C30 47 31 51 27 54 C25 50 21 50 19 48 L17 46 C14 44 9 42 10 37 Z" fill="${b === 3 ? GOLD : BONE2}" ${S(2.6)}/>`;
    // grip and pommel
    out += `<path d="M17 47 L7 57" ${S(8)}/><path d="M17 47 L7 57" stroke="${LEATHER}" stroke-width="4.4" stroke-linecap="round"/><path d="M14 48 l2.5 2.5 M11 51 l2.5 2.5" stroke="${INK}" stroke-width="1.8"/>`;
    out += `<circle cx="6" cy="58" r="${b === 3 ? 5.5 : 4.5}" fill="${b === 3 ? a : BONE2}" ${S(2.6)}/>`;
    if (b === 3) out += `<circle cx="19" cy="45" r="5" fill="${a}" ${S(2.2)}/><circle cx="17.6" cy="43.6" r="1.5" fill="#fff" opacity=".8"/>`;
    return out;
  }

  function maul(b: number, a: string) {
    // haft from (9,57) up to the head at (42,20); the head lies across the haft
    let out = `<path d="M9 57 L44 18" ${S(10)}/><path d="M9 57 L44 18" stroke="${WOOD}" stroke-width="5.6" stroke-linecap="round"/>`;
    out += `<path d="M13 51 l3.5 3.5 M17 46.5 l3.5 3.5" stroke="${INK}" stroke-width="2"/>`;
    const [ha, hb] = b === 1 ? [15, 8] : b === 2 ? [17, 9.5] : [19, 11];
    out += `<path d="${quad(42, 20, ha, hb)}" fill="${b === 1 ? STEEL : BONE2}" ${S(3.2)}/>`;
    if (b === 1) out += a === STEEL ? `<path d="${quad(42, 20, ha - 4, 0.1)}" stroke="${INK}" stroke-width="2" opacity=".4"/>` : `<path d="${quad(42, 20, ha - 4, 0.1)}" stroke="${a}" stroke-width="2.6"/>`;
    if (b >= 2) out += `<path d="${quad(42, 20, ha - 3.5, 0.1)}" stroke="${a}" stroke-width="4.4"/><path d="${quad(42, 20, ha - 3.5, 0.1)}" stroke="${INK}" stroke-width="1" opacity=".45"/>`;
    if (b === 2) for (const t of [-1, 1]) out += `<circle cx="${42 + t * (ha - 4) * Math.SQRT1_2}" cy="${20 + t * (ha - 4) * Math.SQRT1_2}" r="2.2" fill="${INK}"/>`;
    if (b === 3) {
      for (const t of [-1, 1]) { const x = 42 + t * (ha + 1) * Math.SQRT1_2, y = 20 + t * (ha + 1) * Math.SQRT1_2; out += `<path d="M${x - 4} ${y + 4 * -t * 0} L${x + t * 7} ${y + t * 7} L${x + 4 * 0} ${y - 4} Z" fill="${BONE}" ${S(2)}/>`; }
      out += `<circle cx="42" cy="20" r="6.5" fill="${a}" ${S(2.6)}/><circle cx="40.2" cy="18.2" r="2" fill="#fff" opacity=".8"/>`;
    }
    out += `<circle cx="8" cy="58" r="4" fill="${b === 1 ? BONE2 : a}" ${S(2.4)}/>`;
    return out;
  }

  function bow(b: number, a: string) {
    // stave arcs from the lower tip to the upper tip, bellying toward the top-left; the string runs straight
    const stave = b === 1 ? 'M10 54 C8 30 30 8 54 10' : b === 2 ? 'M6 56 C3 51 7 47 11 46 C12 28 28 12 46 11 C47 7 51 3 56 6' : 'M4 58 C0 52 5 46 10 45 C10 26 26 10 45 10 C46 5 52 0 58 4';
    let out = `<path d="M${b === 1 ? '10 54 L54 10' : b === 2 ? '7 55 L55 7' : '5 57 L57 5'}" stroke="${b === 1 && a !== STEEL ? a : BONE}" stroke-width="${b === 1 && a !== STEEL ? 2.4 : 1.8}"/>`;
    if (b === 3) out += `<path d="M18 54 L50 22" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M18 54 L50 22" stroke="${WOOD}" stroke-width="2" stroke-linecap="round"/><path d="M48 18 L58 12 L54 24 Z" fill="${STEEL}" ${S(2)}/><path d="M18 54 l-5 -1 M18 54 l1 5" stroke="${a}" stroke-width="2.6" stroke-linecap="round"/>`;
    out += `<path d="${stave}" fill="none" ${S(10)}/><path d="${stave}" fill="none" stroke="${b === 1 ? WOOD : BONE2}" stroke-width="5.6" stroke-linecap="round"/>`;
    if (b >= 2) out += `<path d="${stave}" fill="none" stroke="${a}" stroke-width="2" stroke-dasharray="${b === 3 ? '3 3' : '6 6'}" stroke-linecap="round"/>`;
    // grip at the middle of the stave
    const g = b === 1 ? [16, 26, 24, 18] : [14, 24, 22, 16];
    out += `<path d="M${g[0]} ${g[1]} L${g[2]} ${g[3]}" ${S(11)}/><path d="M${g[0]} ${g[1]} L${g[2]} ${g[3]}" stroke="${LEATHER}" stroke-width="6.4" stroke-linecap="round"/>`;
    if (b === 3) out += `<path d="M3 60 L-2 50 L8 52 Z M60 3 L50 -2 L52 8 Z" fill="${a}" ${S(2)}/><circle cx="18" cy="20" r="4.5" fill="${a}" ${S(2.2)}/><circle cx="16.8" cy="18.8" r="1.4" fill="#fff" opacity=".8"/>`;
    return out;
  }

  const svg = $derived.by(() => {
    if (!d) return '';
    const body = d.type === 'Cut' ? blade(band, accent, d.kind === 'Curved blade') : d.type === 'Blunt' ? maul(band, accent) : bow(band, accent);
    const at = d.type === 'Cut' ? [52, 54] : d.type === 'Blunt' ? [54, 54] : [52, 50];
    return body + mark(d.elem, at[0], at[1]);
  });
</script>

{#if d}<svg class="wart" viewBox="-4 -10 74 74" width={size} height={size} aria-hidden="true">{@html svg}</svg>{/if}

<style>
  .wart { flex: none; display: inline-block; vertical-align: middle; overflow: visible; }
</style>
