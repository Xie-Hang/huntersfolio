<script lang="ts">
  // Small woodcut icons for items, charms and materials: bone fills, heavy ink edges, each monster's colour as
  // the accent on its materials (Gorehorn gold, Galeshrike gale blue, Cinderback ember, Rimetail frost).
  // Drawn in a 48 × 48 box; shown beside the name, so they're decorative (aria-hidden).
  let { id, size = 22 }: { id: string; size?: number } = $props();
  const INK = '#1a1410', BONE = '#ecdfc8', BONE2 = '#c9b89c', GOLD = '#e9b949', GOLDHI = '#f3cf7a', EMBER = '#e8773a',
    GALE = '#8fc3c9', FROST = '#b9d3f0', MUD = '#5b4532', LEAF = '#8aa56a', STEEL = '#d8d2c4', ASH = '#6e6257', MOSS = '#7f9159', STONEC = '#a99f90';
  const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const scale = (c: string) => `<path d="M24 6 C36 10 42 22 38 34 C34 42 14 42 10 34 C6 22 12 10 24 6 Z" fill="${c}" ${S}/><path d="M14 22 C20 26 28 26 34 22 M16 31 C21 34 27 34 32 31" fill="none" ${S} stroke-width="2.2"/>`;
  const gem = (c: string, glow: string) => `<circle cx="24" cy="25" r="20" fill="${glow}" opacity=".22"/><path d="M10 18 L17 9 H31 L38 18 L24 41 Z" fill="${c}" ${S}/><path d="M10 18 H38 M17 9 L21 18 L24 41 L27 18 L31 9" fill="none" ${S} stroke-width="2"/><path d="M14 17 L18 12" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>`;
  const fang = (c: string) => `<path d="M14 6 C10 20 14 34 30 42 C24 30 24 18 28 6 Z" fill="${c}" ${S}/><path d="M18 12 C17 20 19 28 24 34" fill="none" stroke="${INK}" stroke-width="2" opacity=".5"/>`;
  const feather = (c: string, big = false) => big
    ? `<path d="M36 6 C44 18 34 34 14 42 C16 26 22 12 36 6 Z" fill="${c}" ${S}/><path d="M35 9 L12 44 M30 16 l6 4 M26 22 l7 4 M22 28 l7 3 M28 14 l-7 2 M24 20 l-7 2" fill="none" ${S} stroke-width="2"/>`
    : `<path d="M24 5 C34 14 34 30 24 42 C14 30 14 14 24 5 Z" fill="${c}" ${S}/><path d="M24 9 V45 M24 18 l6 -4 M24 25 l6 -4 M24 32 l5 -4 M24 18 l-6 -4 M24 25 l-6 -4 M24 32 l-5 -4" fill="none" ${S} stroke-width="2"/>`;
  const claw = (c: string) => `<path d="M10 40 C10 22 20 10 38 8 C30 16 26 24 26 40 Z" fill="${c}" ${S}/><path d="M16 36 C17 26 22 18 30 14" fill="none" stroke="${INK}" stroke-width="2" opacity=".5"/>`;
  const charmTop = `<circle cx="24" cy="7" r="4" fill="none" ${S} stroke-width="2.6"/>`;

  const ICONS: Record<string, string> = {
    /* items */
    salve: `<path d="M17 10 H31 V15 C37 18 40 24 40 30 C40 38 33 43 24 43 C15 43 8 38 8 30 C8 24 11 18 17 15 Z" fill="${BONE}" ${S}/><path d="M10 29 C14 33 34 33 38 29 C38 37 32 41 24 41 C16 41 10 37 10 29 Z" fill="${LEAF}"/><path d="M17 10 H31 V15 C37 18 40 24 40 30 C40 38 33 43 24 43 C15 43 8 38 8 30 C8 24 11 18 17 15 Z" fill="none" ${S}/><rect x="15" y="5" width="18" height="6" rx="2" fill="${MUD}" ${S}/>`,
    smoke: `<circle cx="16" cy="18" r="8" fill="${BONE2}" ${S}/><circle cx="30" cy="14" r="9" fill="${BONE2}" ${S}/><path d="M12 26 C10 34 16 42 24 42 C32 42 38 34 36 26 Z" fill="${MUD}" ${S}/><path d="M14 28 H34" ${S} fill="none"/>`,
    whet: `<path d="M8 30 L30 12 C33 10 37 11 39 14 C41 17 40 21 37 23 L16 40 C13 42 9 41 7 38 C5 35 6 32 8 30 Z" fill="${ASH}" ${S}/><path d="M14 30 L30 17 M18 34 L33 22" fill="none" stroke="${INK}" stroke-width="2" opacity=".55"/><path d="M40 3 L42 9 L48 11 L42 13 L40 19 L38 13 L32 11 L38 9 Z" fill="${GOLDHI}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
    tuskwhet: `<path d="M8 30 L30 12 C33 10 37 11 39 14 C41 17 40 21 37 23 L16 40 C13 42 9 41 7 38 C5 35 6 32 8 30 Z" fill="${GOLDHI}" ${S}/><path d="M14 30 L30 17 M18 34 L33 22" fill="none" stroke="${INK}" stroke-width="2" opacity=".55"/><path d="M40 3 L42 9 L48 11 L42 13 L40 19 L38 13 L32 11 L38 9 Z" fill="${GOLDHI}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
    net: `<path d="M6 40 C10 14 38 14 42 40 Z" fill="${BONE2}" opacity=".25"/><path d="M6 40 C10 14 38 14 42 40 M12 26 L30 40 M20 19 L38 34 M28 18 L16 40 M36 24 L24 40 M10 33 H38" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M6 40 C10 14 38 14 42 40 M12 26 L30 40 M20 19 L38 34 M28 18 L16 40 M36 24 L24 40 M10 33 H38" fill="none" stroke="${BONE2}" stroke-width="2.4" stroke-linecap="round"/><circle cx="6" cy="40" r="4" fill="${ASH}" ${S} stroke-width="2"/><circle cx="42" cy="40" r="4" fill="${ASH}" ${S} stroke-width="2"/>`,
    firepot: `<path d="M12 18 H36 L34 38 C33 42 30 43 24 43 C18 43 15 42 14 38 Z" fill="${MUD}" ${S}/><path d="M14 22 H34" ${S} fill="none"/><path d="M24 18 C18 12 22 8 24 4 C26 8 32 10 28 18 Z" fill="${EMBER}" ${S} stroke-width="2.4"/>`,
    blast: `<path d="M14 16 C14 12 34 12 34 16 L36 38 C36 43 12 43 12 38 Z" fill="${BONE2}" ${S}/><path d="M14 16 C14 20 34 20 34 16" fill="none" ${S}/><path d="M24 14 C26 8 32 6 34 4" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M34 4 l4 -1 M34 4 l1 -4 M34 4 l3 3" stroke="${EMBER}" stroke-width="2.4" stroke-linecap="round"/><path d="M18 28 h12 M24 22 v12" stroke="${EMBER}" stroke-width="3" stroke-linecap="round"/>`,
    /* charms */
    tuskcharm: `${charmTop}<path d="M20 12 C12 22 14 34 30 42 C22 30 22 20 28 12 Z" fill="${GOLDHI}" ${S}/>`,
    plumecharm: `${charmTop}${feather(GALE).replace('M24 5', 'M24 11')}`,
    kilncharm: `${charmTop}<circle cx="24" cy="28" r="15" fill="${EMBER}" opacity=".25"/><path d="M14 18 L32 14 L37 30 L24 42 L11 31 Z" fill="${MUD}" ${S}/><path d="M18 26 l5 4 l4 -5 l5 5" fill="none" stroke="${EMBER}" stroke-width="3" stroke-linecap="round"/>`,
    rimecharm: `${charmTop}<path d="M24 12 L33 26 L24 44 L15 26 Z" fill="${FROST}" ${S}/><path d="M24 16 V40 M19 26 H29" stroke="#fff" stroke-width="2" opacity=".8"/>`,
    /* Gorehorn */
    hide: `<path d="M8 12 C16 8 32 8 40 12 L38 22 L42 30 L36 40 C28 43 20 43 12 40 L6 30 L10 22 Z" fill="${BONE2}" ${S}/><path d="M14 18 l4 6 M24 15 l3 7 M32 18 l2 6 M18 30 l3 5 M28 30 l2 5" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>`,
    tusk: fang(GOLDHI),
    pelt: `<path d="M8 16 C16 12 32 12 40 16 L40 38 C32 42 16 42 8 38 Z" fill="${BONE}" ${S}/><path d="M8 16 L12 8 L16 14 L20 6 L24 13 L28 6 L32 14 L36 8 L40 16" fill="${BONE}" ${S}/><path d="M14 22 v12 M20 21 v14 M26 21 v14 M32 22 v12" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>`,
    sinew: `<path d="M8 10 C20 14 14 24 24 26 C34 28 28 38 40 40" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M8 10 C20 14 14 24 24 26 C34 28 28 38 40 40" fill="none" stroke="#c98a6a" stroke-width="5" stroke-linecap="round"/><path d="M13 13 l3 -3 M20 21 l3 -3 M28 29 l3 -3 M34 36 l3 -3" stroke="${INK}" stroke-width="1.8"/>`,
    heartstone: gem(EMBER, EMBER),
    /* Galeshrike */
    plume: feather(GALE),
    pinion: feather(BONE, true),
    talon: claw(BONE2),
    crest: `<path d="M8 40 L14 12 L20 30 L26 6 L31 30 L38 14 L40 40 Z" fill="${GALE}" ${S}/><path d="M6 40 H42" ${S} fill="none"/>`,
    tempesteye: `<circle cx="24" cy="24" r="17" fill="${GALE}" ${S}/><path d="M12 24 C18 16 30 16 36 24 C30 32 18 32 12 24 Z" fill="${BONE}" ${S} stroke-width="2.4"/><circle cx="24" cy="24" r="5" fill="${INK}"/><path d="M8 12 C14 6 22 4 30 6 M40 36 C34 42 26 44 18 42" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>`,
    /* Cinderback */
    cinderscale: scale('#b0623a'),
    slagplate: `<path d="M8 14 C14 8 34 8 40 14 L38 36 C30 42 18 42 10 36 Z" fill="${ASH}" ${S}/><path d="M16 18 l6 6 l-3 6 l8 4 M30 16 l-4 8 l6 4" fill="none" stroke="${EMBER}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    digclaw: claw(BONE2).replace('M10 40', 'M10 40').concat(`<path d="M30 40 C30 30 33 22 42 18 C38 26 36 32 36 40 Z" fill="${BONE2}" ${S} stroke-width="2.6"/>`),
    ventgland: `<path d="M14 40 L18 12 H30 L34 40 Z" fill="${BONE2}" ${S}/><ellipse cx="24" cy="12" rx="6" ry="3" fill="${EMBER}" ${S} stroke-width="2.2"/><path d="M22 6 C20 2 26 2 24 -2" fill="none" stroke="${BONE2}" stroke-width="3" stroke-linecap="round"/><path d="M18 24 H30 M17 32 H31" stroke="${INK}" stroke-width="2" opacity=".5"/>`,
    kilnheart: `<circle cx="24" cy="26" r="20" fill="${EMBER}" opacity=".25"/><path d="M24 42 C10 32 6 24 10 16 C14 9 22 10 24 16 C26 10 34 9 38 16 C42 24 38 32 24 42 Z" fill="${EMBER}" ${S}/><path d="M16 22 l5 4 l4 -6 l5 6 l3 -3" fill="none" stroke="${GOLDHI}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    /* Rimetail */
    rimescale: scale(FROST),
    barbtail: `<path d="M8 40 C14 30 20 22 30 16" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M8 40 C14 30 20 22 30 16" fill="none" stroke="${BONE}" stroke-width="5" stroke-linecap="round"/><path d="M28 10 L42 6 L36 20 Z" fill="${FROST}" ${S}/><path d="M18 28 l-6 -4 M23 22 l-5 -5" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    mantleshard: `<path d="M10 34 L16 10 L30 6 L40 20 L34 40 L18 42 Z" fill="${FROST}" ${S}/><path d="M16 10 L24 24 L34 40 M24 24 L40 20 M24 24 L10 34" fill="none" stroke="#ffffff" stroke-width="2" opacity=".75"/>`,
    frostfang: fang(FROST),
    frostheart: gem(FROST, FROST),
    /* Bogjaw (Mirewood): moss green accent */
    bogskin: `<path d="M8 14 C16 8 32 8 40 14 L38 24 L42 32 L36 40 C28 43 20 43 12 40 L6 32 L10 24 Z" fill="${BONE2}" ${S}/><circle cx="18" cy="22" r="4" fill="${MOSS}" ${S} stroke-width="2"/><circle cx="30" cy="30" r="5" fill="${MOSS}" ${S} stroke-width="2"/><circle cx="28" cy="17" r="3" fill="${MOSS}" ${S} stroke-width="2"/>`,
    bogmolar: `<path d="M10 14 C10 8 38 8 38 14 L36 26 C34 30 32 30 30 40 C28 44 26 44 25 36 L24 30 L23 36 C22 44 20 44 18 40 C16 30 14 30 12 26 Z" fill="${BONE}" ${S}/><path d="M14 16 H34" stroke="${MOSS}" stroke-width="3" stroke-linecap="round"/>`,
    throatsac: `<ellipse cx="24" cy="26" rx="17" ry="13" fill="${BONE2}" ${S}/><path d="M12 22 C18 26 30 26 36 22" fill="none" stroke="${INK}" stroke-width="2" opacity=".55"/><path d="M24 13 V6" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
    wartstone: `<circle cx="18" cy="26" r="11" fill="${STONEC}" ${S}/><circle cx="31" cy="20" r="8" fill="${STONEC}" ${S}/><circle cx="31" cy="34" r="6" fill="${STONEC}" ${S}/><path d="M12 30 C16 26 22 26 26 30" fill="none" stroke="${MOSS}" stroke-width="3" stroke-linecap="round"/>`,
    mirestone: gem(MOSS, MOSS),
    duskplume: feather(GALE),
    duskbeak: `<path d="M44 20 L8 26 L44 32 Z" fill="${BONE2}" ${S}/><path d="M44 26 L10 26" stroke="${INK}" stroke-width="2"/><path d="M38 14 L44 6 L44 18 Z" fill="${GALE}" ${S} stroke-width="2"/>`,
    duskpinion: feather(GALE, true),
    duskcrest: `<path d="M8 40 L14 12 L20 30 L26 6 L31 30 L38 14 L40 40 Z" fill="${GALE}" ${S}/><path d="M6 40 H42" ${S} fill="none"/><circle cx="24" cy="34" r="4" fill="${INK}"/>`,
    twilightquill: `<circle cx="24" cy="24" r="20" fill="${GALE}" opacity=".22"/>${feather('#5f8fa6', true)}`,
    /* Emberwhelk (Mirewood): ember accent on a dark shell */
    whelkscale: scale('#9a7a5e'),
    whelkgill: `<path d="M24 42 L10 14 C14 10 18 12 20 16 L24 8 C26 10 28 12 28 16 C30 12 34 10 38 14 Z" fill="#c9604a" ${S}/><path d="M24 40 L16 18 M24 40 V14 M24 40 L32 18" fill="none" stroke="${INK}" stroke-width="2" opacity=".55"/>`,
    whelkshell: `<circle cx="24" cy="25" r="17" fill="#9a7a5e" ${S}/><path d="M24 25 C27 25 28 22 26 20 C23 17 18 20 18 25 C18 31 25 34 30 31 C36 27 35 17 28 13" fill="none" stroke="${EMBER}" stroke-width="3.4" stroke-linecap="round"/><path d="M24 25 C27 25 28 22 26 20 C23 17 18 20 18 25 C18 31 25 34 30 31 C36 27 35 17 28 13" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
    whelkfoot: `<path d="M6 36 C6 28 14 24 24 24 C34 24 42 28 42 36 C42 40 6 40 6 36 Z" fill="${BONE}" ${S}/><path d="M12 32 l3 4 M20 30 l3 5 M28 30 l3 5 M36 32 l2 4" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".55"/><path d="M8 40 C16 44 30 44 40 40" fill="none" stroke="#f0a85a" stroke-width="3" stroke-linecap="round"/>`,
    emberpearl: `<circle cx="24" cy="24" r="20" fill="${EMBER}" opacity=".25"/><circle cx="24" cy="25" r="13" fill="${EMBER}" ${S}/><circle cx="19" cy="20" r="4" fill="${GOLDHI}"/><path d="M14 30 C18 34 30 34 34 30" fill="none" stroke="${INK}" stroke-width="2" opacity=".45"/>`,
    whelkcharm: `${charmTop}<circle cx="24" cy="28" r="13" fill="#9a7a5e" ${S}/><path d="M24 28 C26 28 27 26 25 25 C22 23 19 26 20 29 C21 33 28 34 31 30" fill="none" stroke="${EMBER}" stroke-width="3" stroke-linecap="round"/>`,
    duskcharm: `${charmTop}<path d="M38 22 L12 28 L38 34 Z" fill="${BONE2}" ${S}/><path d="M38 34 L14 38 L38 42 Z" fill="${BONE2}" ${S}/>`,
    bogcharm: `${charmTop}<circle cx="24" cy="28" r="13" fill="${STONEC}" ${S}/><circle cx="20" cy="25" r="3.5" fill="${MOSS}"/><circle cx="28" cy="31" r="3" fill="${MOSS}"/>`
  };
  const body = $derived(ICONS[id]);
</script>

{#if body}<svg class="icon" width={size} height={size} viewBox="0 -2 48 50" aria-hidden="true">{@html body}</svg>{/if}

<style>
  .icon { display: inline-block; vertical-align: middle; flex: none; margin-right: 6px; }
</style>
