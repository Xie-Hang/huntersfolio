<script lang="ts">
  // The Wanderer Sovereign, from the approved sketches (art/monsters/apex/slime2.py, Mekkman 6 Nov 2026): a vast slime
  // wearing what it swallowed. Gorehorn tusks at the front, two Galeshrike wings over the back, Cinderback vents on
  // top towards the head and digging claws at the base, a Rimetail tail behind. Poses follow the stance: Stone crusts
  // it in rock and lowers the tusks to charge, Gale spreads the wings and lifts it, Ember sinks it with the vents
  // burning, Frost raises the tail and ices it in the rocks' places. Torn-out parts are gone; the aimed part glows.
  import type { Hunt } from '../../../engine';
  import { oneShots, INK, BONE, BONE2, GOLD, EMBER, GALE, FROST } from './motion.svelte';

  let { hunt = null }: { hunt?: Hunt | null } = $props();
  const SLIME = '#d9e3c8', STONE = '#a99f90', ON = '#f3cf7a';
  const S = (w = 8, c = INK) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const uid = `sv${Math.random().toString(36).slice(2, 7)}`;

  const m = $derived(hunt?.mon);
  const intent = $derived(hunt && !hunt.over ? hunt.intent : '');
  const pose = $derived(
    hunt?.over === 'win' ? 'down' : !m ? 'rest' : m.air ? 'gale' : m.under ? 'ember' : intent === 'dazed' || intent === 'pinned' || intent === 'crashed' || intent === 'unearthed' ? 'dazed' :
    m.stance === 'stone' ? 'stone' : m.stance === 'frost' ? 'frost' : m.stance === 'ember' ? 'emberup' : m.stance === 'gale' ? 'galeup' : 'rest');
  const broke = (id: string) => !!m?.parts[id]?.broken;
  const on = (id: string) => !!hunt && !hunt.over && hunt.target === id;

  const CRUST: [number, number, number][] = [[540, 300, 90], [650, 340, 100], [760, 410, 80], [470, 380, 80]];

  function body(sx: number, sy: number) {
    const P = (x: number, y: number) => `${(500 + (x - 500) * sx).toFixed(0)} ${(520 - (520 - y) * sy).toFixed(0)}`;
    return `M${P(170, 520)} C${P(150, 380)} ${P(250, 190)} ${P(500, 180)} C${P(750, 190)} ${P(850, 380)} ${P(830, 520)} ` +
      `C${P(800, 540)} ${P(780, 500)} ${P(750, 530)} C${P(720, 560)} ${P(690, 505)} ${P(650, 526)} C${P(600, 548)} ${P(560, 505)} ${P(500, 528)} ` +
      `C${P(440, 550)} ${P(410, 504)} ${P(360, 526)} C${P(310, 548)} ${P(280, 500)} ${P(240, 528)} C${P(210, 548)} ${P(185, 530)} ${P(170, 520)} Z`;
  }
  function wing(x: number, y: number, spread: number, flip: number, glow: boolean) {
    const tip = [x + flip * (170 + 60 * spread), y - 40 - 160 * spread];
    const d = `M${x} ${y} C${x + flip * 40} ${y - 60 - 80 * spread} ${tip[0] - flip * 60} ${tip[1] - 20} ${tip[0]} ${tip[1]} C${tip[0] - flip * 20} ${tip[1] + 50} ${x + flip * 120} ${y + 10} ${x + flip * 20} ${y + 30} Z`;
    let out = `<path d="${d}" fill="${BONE}" ${S(8, glow ? ON : INK)}/>`;
    for (let k = 1; k < 5; k++) { const t = k / 5, fx = x + (tip[0] - x) * t, fy = y + (tip[1] - y) * t; out += `<path d="M${fx.toFixed(0)} ${fy.toFixed(0)} l${flip * 30} ${50 - 10 * spread}" ${S(5)}/>`; }
    out += `<path d="M${tip[0] - flip * 50} ${tip[1] + 6} L${tip[0]} ${tip[1]}" stroke="${GALE}" stroke-width="7" stroke-linecap="round"/>`;
    return out;
  }

  const svg = $derived.by(() => {
    const p = pose;
    let sx = 1, sy = 1, lift = 0;
    if (p === 'stone') { sx = 1.06; sy = 0.9; }
    if (p === 'gale') { sx = 0.9; sy = 1.1; lift = -90; }
    if (p === 'ember') sy = 0.6;
    if (p === 'down') sy = 0.5;
    const X = (x: number) => 500 + (x - 500) * sx, Y = (y: number) => 520 - (520 - y) * sy;
    const d = body(sx, sy);
    let o = `<defs><clipPath id="${uid}c"><path d="${d}"/></clipPath></defs>`;
    if (p === 'gale') o += `<ellipse cx="500" cy="530" rx="250" ry="16" fill="${INK}" opacity=".35"/>`;
    if (p === 'ember') o += `<path d="M190 532 l40 -14 l30 16 l50 -18 l40 14 M630 532 l44 -16 l36 14 l50 -14" fill="none" stroke="${EMBER}" stroke-width="7" stroke-linejoin="round" class="cracks"/>`;
    o += `<g transform="translate(0 ${lift})">`;
    // the Rimetail tail, behind
    if (!broke('tail')) {
      const up = p === 'frost', tx = X(800), ty = Y(440);
      const td = `M${tx} ${ty} C${tx + 80} ${ty - 10} ${tx + 120} ${ty - (up ? 150 : 60)} ${tx + 90} ${ty - (up ? 230 : 120)}`;
      o += `<g class="tail"><path d="${td}" fill="none" stroke="${on('tail') ? ON : INK}" stroke-width="40" stroke-linecap="round"/><path d="${td}" fill="none" stroke="${BONE2}" stroke-width="24" stroke-linecap="round"/>`;
      for (const [bx, by] of [[tx + 60, ty - 20], [tx + 100, ty - (up ? 90 : 50)], [tx + 100, ty - (up ? 170 : 95)]]) o += `<path d="M${bx - 14} ${by + 6} L${bx + 22} ${by - 30} L${bx + 14} ${by + 18} Z" fill="${FROST}" ${S(6)}/>`;
      o += '</g>';
    }
    // the far wing: spread from behind in flight, folded and peeking out higher up otherwise
    const sp = p === 'gale' ? 1 : 0.4;
    if (!broke('wings')) o += p === 'gale' ? wing(X(560), Y(240), sp, -1, on('wings')) : wing(X(560), Y(215), sp, 1, on('wings'));
    // the slime itself
    o += `<path d="${d}" fill="${SLIME}" ${S()}/>`;
    let hatch = ''; for (let x = 160; x < 900; x += 16) hatch += `M${x} 400 L${x - 60} 560 `;
    o += `<g clip-path="url(#${uid}c)"><path d="${hatch}" stroke="${INK}" stroke-width="5" opacity=".7"/>`;
    if (p !== 'ember' && p !== 'down') o += `<path d="M${X(560)} ${Y(300)} L${X(640)} ${Y(420)}" stroke="${INK}" stroke-width="14" stroke-linecap="round" opacity=".3"/><path d="M${X(430)} ${Y(430)} l70 -10" stroke="${INK}" stroke-width="18" stroke-linecap="round" opacity=".22"/>`;
    if (m && m.molten > 0) o += `<rect x="0" y="0" width="1000" height="600" fill="${EMBER}" opacity=".22"/>`;
    o += '</g>';
    o += `<path d="M${X(310)} ${Y(290)} C${X(350)} ${Y(230)} ${X(440)} ${Y(206)} ${X(510)} ${Y(208)}" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".7"/>`;
    // the near wing lies over the back
    if (!broke('wings')) o += wing(X(620), Y(270), sp, 1, on('wings'));
    // the Cinderback vents, forward on top
    if (!broke('vents')) for (const x of [360, 425, 490]) {
      const vx = X(x), vy = Y(({ 360: 232, 425: 205, 490: 192 } as Record<number, number>)[x]), hot = p === 'ember' || (m?.molten ?? 0) > 0;
      o += `<path d="M${vx - 18} ${vy + 6} L${vx - 10} ${vy - 34} H${vx + 10} L${vx + 18} ${vy + 6} Z" fill="${p === 'stone' ? STONE : BONE2}" ${S(6, on('vents') ? ON : INK)}/><ellipse cx="${vx}" cy="${vy - 34}" rx="9" ry="4" fill="${EMBER}"/>`;
      if (hot) o += `<path class="heat" d="M${vx} ${vy - 44} q-12 -22 0 -44 q12 -22 0 -44" fill="none" stroke="${EMBER}" stroke-width="6" stroke-linecap="round" opacity=".85"/>`;
    }
    if (p !== 'gale') for (const cx of [X(300), X(700)]) o += `<path d="M${cx - 30} 520 L${cx - 22} 548 M${cx - 8} 522 L${cx} 552 M${cx + 14} 520 L${cx + 22} 548" ${S(9)}/>`;
    // the Gorehorn tusks, lowered for the charge
    if (!broke('tusks')) {
      const lw = p === 'stone' && (intent === 'windup' || intent === 'charge') ? 1.3 : p === 'stone' ? 1.15 : 1;
      for (const [x, y] of [[X(215), Y(440)], [X(260), Y(470)]]) o += `<path d="M${x + 30} ${y} C${x - 40 * lw} ${y + 10} ${x - 80 * lw} ${y - 50 * lw} ${x - 60 * lw} ${y - 110 * lw} C${x - 40 * lw} ${y - 60 * lw} ${x - 10} ${y - 30} ${x + 34} ${y - 30} Z" fill="${GOLD}" ${S(7, on('tusks') ? ON : INK)}/>`;
    } else for (const [x, y] of [[X(215), Y(440)], [X(260), Y(470)]]) o += `<path d="M${x + 30} ${y} l-30 -8 l6 -20 l26 0 Z" fill="${GOLD}" ${S(6)}/>`;
    if (p === 'stone') for (const [x, y, w] of CRUST) o += `<path d="M${X(x)} ${Y(y)} l${w * 0.3} -${w * 0.32} l${w * 0.55} ${w * 0.06} l${w * 0.18} ${w * 0.4} l-${w * 0.5} ${w * 0.18} Z" fill="${STONE}" ${S(6)}/>`;
    if ((m?.plating ?? 0) > 0 || (!hunt && false)) for (const [x, y, w] of CRUST.slice(0, (m?.plating ?? 0) >= 2 ? 4 : 2)) for (const [dx, h] of [[-w * 0.3, w * 0.5], [0, w * 0.8], [w * 0.3, w * 0.55]]) {
      const bx = X(x) + dx, by = Y(y);
      o += `<path d="M${bx - 16} ${by + 14} L${bx} ${by - h} L${bx + 16} ${by + 14} Z" fill="${FROST}" ${S(6)}/>`;
    }
    // eyes: small, many, unsettling (shut when beaten)
    for (const [ex, ey, r] of [[330, 330, 18], [385, 312, 22], [300, 375, 12]]) {
      o += p === 'down' ? `<path d="M${X(ex) - r} ${Y(ey)} h${r * 2}" ${S(6)}/>` : `<ellipse cx="${X(ex)}" cy="${Y(ey)}" rx="${r}" ry="${(r * 1.3).toFixed(0)}" fill="${INK}"/><circle cx="${X(ex) - r * 0.3}" cy="${Y(ey) - r * 0.4}" r="${(r * 0.3).toFixed(0)}" fill="${EMBER}"/>`;
    }
    if (p === 'dazed') for (const [sx2, sy2] of [[X(300), Y(200)], [X(380), Y(170)], [X(460), Y(200)]]) o += `<path d="M${sx2} ${sy2 - 16} l5 11 l11 5 l-11 5 l-5 11 l-5 -11 l-11 -5 l11 -5 Z" fill="${GOLD}" ${S(4)}/>`;
    o += '</g>';
    return o;
  });

  let rig: SVGGElement;
  oneShots(() => rig, () => hunt);
</script>

<svg class="wc sv pose-{pose}" class:static={!hunt} viewBox="40 20 980 560" role="img" aria-label="Engraving of the Wanderer Sovereign, a vast slime wearing tusks, wings, vents and a tail{m?.stance && m.stance !== 'bare' ? `, in its ${m.stance} stance` : ''}">
  <path d="M40 532 H1010" stroke="#4d4136" stroke-width="5" stroke-linecap="round" />
  <g class="rig" bind:this={rig}><g class="breath">{@html svg}</g></g>
</svg>

<style>
  .sv .breath { transform-origin: 500px 530px; animation: sv-breath 3.2s ease-in-out infinite; }
  .sv.pose-gale .breath { animation: sv-hover 1.6s ease-in-out infinite; }
  .sv.pose-dazed .breath { animation: sv-wobble .9s ease-in-out infinite; }
  .sv :global(.heat) { animation: sv-heat 1.4s ease-in-out infinite; }
  @keyframes sv-breath { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.015, .985); } }
  @keyframes sv-hover { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
  @keyframes sv-wobble { 0%, 100% { transform: skewX(0); } 25% { transform: skewX(4deg); } 75% { transform: skewX(-4deg); } }
  @keyframes sv-heat { 0%, 100% { opacity: .85; transform: translateY(0); } 50% { opacity: .4; transform: translateY(-10px); } }
</style>
