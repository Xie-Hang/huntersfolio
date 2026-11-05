# Steam achievement icons in the woodcut style: 256x256, an achieved and a locked version each.
# Monster achievements use the game's own plates (captured by capture.cjs into poses/); the rest are drawn here
# in the same language: bone fills, heavy ink edges, hatching, gold and ember accents.
#   python3 art/ach2/make_achievements.py   → art/ach2/svg/*.svg, then node art/ach2/render.cjs → art/ach2/out/*.jpg
import base64, math, pathlib

ROOT = pathlib.Path(__file__).parent
POSES = ROOT / 'poses'
SVG = ROOT / 'svg'; SVG.mkdir(exist_ok=True)
INK, BONE, BONE2, EMBER, GOLD, GOLDHI = '#1a1410', '#ecdfc8', '#c9b89c', '#e8773a', '#e9b949', '#f3cf7a'
GALE, FROST, MUD, STEEL = '#8fc3c9', '#b9d3f0', '#5b4532', '#d8d2c4'
W = 256


def frame(body, done):
    ring = GOLD if done else '#5a4c3e'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{W}" viewBox="0 0 {W} {W}">
<defs><radialGradient id="bg" cx="50%" cy="44%" r="70%"><stop offset="0" stop-color="#2e241c"/><stop offset=".65" stop-color="#1a1410"/><stop offset="1" stop-color="#0e0b09"/></radialGradient>
<clipPath id="in"><rect x="20" y="20" width="216" height="216" rx="6"/></clipPath></defs>
<rect width="{W}" height="{W}" fill="url(#bg)"/>
<g clip-path="url(#in)">{body}</g>
<rect x="10" y="10" width="236" height="236" rx="10" fill="none" stroke="{ring}" stroke-width="5"/>
<rect x="20" y="20" width="216" height="216" rx="6" fill="none" stroke="#3d3229" stroke-width="2"/>
</svg>'''


def plate(name, x, y, w, crop=None):
    """A captured plate (876x489 PNG, facing right). crop = (cx, cy, cw, ch) in PNG pixels."""
    data = base64.b64encode((POSES / f'{name}.png').read_bytes()).decode()
    cx, cy, cw, ch = crop or (0, 0, 876, 489)
    h = w * ch / cw
    return f'<svg x="{x}" y="{y}" width="{w}" height="{h:.1f}" viewBox="{cx} {cy} {cw} {ch}"><image width="876" height="489" xlink:href="data:image/png;base64,{data}"/></svg>'


def ground(y=206):
    return f'<path d="M24 {y} H232" stroke="#4d4136" stroke-width="4" stroke-linecap="round"/>'


def star(cx, cy, r):
    pts = []
    for i in range(8):
        a = math.pi / 4 * i - math.pi / 2
        rr = r if i % 2 == 0 else r * 0.38
        pts.append(f'{cx + rr * math.cos(a):.1f},{cy + rr * math.sin(a):.1f}')
    return f'<polygon points="{" ".join(pts)}" fill="{GOLD}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'


def hatch(x0, y0, x1, y1, step=7, slant=-8, clip=None, w=2.4):
    lines = ''.join(f'M{x} {y0} l{slant} {y1 - y0}' for x in range(int(x0), int(x1), step))
    c = f' clip-path="url(#{clip})"' if clip else ''
    return f'<path d="{lines}" stroke="{INK}" stroke-width="{w}" stroke-linecap="round"{c}/>'


def sparks(cx, cy, n=7, r0=18, r1=40, color=GOLDHI):
    out = ''
    for i in range(n):
        a = -math.pi / 2 + (i - (n - 1) / 2) * 0.42
        out += f'<path d="M{cx + r0 * math.cos(a):.1f} {cy + r0 * math.sin(a):.1f} L{cx + r1 * math.cos(a):.1f} {cy + r1 * math.sin(a):.1f}" stroke="{color}" stroke-width="4" stroke-linecap="round"/>'
    return out


# ---------- drawn motifs ----------
def blade(x, y, ang, s=1.0):
    """The Hunter's Blade, point up, rotated about its grip."""
    return f'''<g transform="translate({x} {y}) rotate({ang}) scale({s})">
<path d="M-11 -10 L-11 -128 L0 -150 L11 -128 L11 -10 Z" fill="{STEEL}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>
<path d="M0 -140 L0 -16" stroke="#9e978a" stroke-width="3"/>
<rect x="-30" y="-12" width="60" height="12" rx="4" fill="{GOLD}" stroke="{INK}" stroke-width="5"/>
<rect x="-7" y="0" width="14" height="40" rx="4" fill="{MUD}" stroke="{INK}" stroke-width="5"/>
<circle cx="0" cy="46" r="9" fill="{GOLD}" stroke="{INK}" stroke-width="5"/></g>'''


def maul(x, y, ang, s=1.0):
    return f'''<g transform="translate({x} {y}) rotate({ang}) scale({s})">
<rect x="-7" y="-110" width="14" height="150" rx="5" fill="{MUD}" stroke="{INK}" stroke-width="5"/>
<path d="M-40 -150 H40 Q48 -150 48 -142 V-104 Q48 -96 40 -96 H-40 Q-48 -96 -48 -104 V-142 Q-48 -150 -40 -150 Z" fill="{BONE}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
<path d="M-36 -140 l-6 36 M-24 -142 l-6 40 M-12 -142 l-6 40" stroke="{INK}" stroke-width="2.6" stroke-linecap="round"/>
<rect x="-14" y="-98" width="28" height="12" fill="{GOLD}" stroke="{INK}" stroke-width="4"/></g>'''


def shield(cx, cy, s=1.0, scratch=False, rim=GOLD):
    d = 'M0 -70 C26 -58 52 -56 70 -60 C72 -6 56 40 0 74 C-56 40 -72 -6 -70 -60 C-52 -56 -26 -58 0 -70 Z'
    out = f'''<g transform="translate({cx} {cy}) scale({s})"><clipPath id="sh"><path d="{d}"/></clipPath>
<path d="{d}" fill="{BONE}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>
<g clip-path="url(#sh)">{hatch(0, -80, 80, 80, 8, -10)}</g>
<path d="{d}" transform="scale(.82)" fill="none" stroke="{rim}" stroke-width="6"/>
<path d="M0 -50 V52 M-44 -14 H44" stroke="{INK}" stroke-width="5" stroke-linecap="round" opacity=".5"/>'''
    if scratch:
        out += f'<path d="M-30 -30 L24 22" stroke="{EMBER}" stroke-width="5" stroke-linecap="round"/>'
    return out + '</g>'


def ridge(flag=True):
    d = 'M20 200 L62 140 L84 158 L120 92 L150 130 L170 112 L236 200 Z'
    out = f'<clipPath id="rg"><path d="{d}"/></clipPath><path d="{d}" fill="{BONE}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
    out += f'<g clip-path="url(#rg)">{hatch(20, 120, 240, 210, 7, -12)}<path d="M120 92 L104 200 M62 140 L74 200 M170 112 L186 200" stroke="{INK}" stroke-width="3" opacity=".6"/></g>'
    out += f'<path d="M22 200 H234" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
    if flag:
        out += f'<path d="M120 92 V40" stroke="{INK}" stroke-width="5" stroke-linecap="round"/><path d="M122 42 L162 52 L122 66 Z" fill="{EMBER}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'
    return out


def net(x0, y0, x1, y1, step=22):
    out = ''
    for i in range(-8, 14):
        out += f'<path d="M{x0 + i * step} {y0} L{x0 + i * step + (y1 - y0)} {y1}" stroke="{GOLDHI}" stroke-width="2.6" opacity=".85"/>'
        out += f'<path d="M{x0 + i * step} {y1} L{x0 + i * step + (y1 - y0)} {y0}" stroke="{GOLDHI}" stroke-width="2.6" opacity=".85"/>'
    return f'<clipPath id="nt"><path d="M{x0} {y1} Q{(x0 + x1) / 2} {y0 - 120} {x1} {y1} Z"/></clipPath><g clip-path="url(#nt)" opacity=".95">{out}</g><path d="M{x0} {y1} Q{(x0 + x1) / 2} {y0 - 120} {x1} {y1}" fill="none" stroke="{INK}" stroke-width="5"/>'


def folio(page_img):
    return f'''<path d="M128 70 C100 58 58 58 28 66 V196 C58 188 100 188 128 200 Z" fill="{BONE}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
<path d="M128 70 C156 58 198 58 228 66 V196 C198 188 156 188 128 200 Z" fill="{BONE}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
{page_img}
<path d="M146 90 H212 M146 106 H212 M146 122 H204 M146 138 H212 M146 154 H196 M146 170 H210" stroke="{INK}" stroke-width="3.5" stroke-linecap="round" opacity=".55"/>
<path d="M128 70 V200" stroke="{INK}" stroke-width="5"/>
<path d="M118 200 L128 222 L138 200" fill="{EMBER}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'''


def gem(cx, cy, s=1.0):
    return f'''<g transform="translate({cx} {cy}) scale({s})">
<circle r="74" fill="{EMBER}" opacity=".18"/><circle r="52" fill="{EMBER}" opacity=".18"/>
<path d="M-46 -18 L-24 -48 H24 L46 -18 L0 54 Z" fill="{EMBER}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
<path d="M-46 -18 H46 M-24 -48 L-12 -18 L0 54 L12 -18 L24 -48 M-12 -18 L0 -48 L12 -18" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M-30 -24 L-18 -42" stroke="{GOLDHI}" stroke-width="5" stroke-linecap="round"/></g>'''


def anvil_hammer():
    av = 'M70 124 H198 V142 H176 C166 142 160 150 160 160 V170 H184 V196 H82 V170 H106 V160 C106 150 100 142 90 142 H70 C52 142 34 138 22 128 C40 126 56 124 70 124 Z'
    return f'''<clipPath id="av"><path d="{av}"/></clipPath>
<path d="{av}" fill="{BONE}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
<g clip-path="url(#av)">{hatch(20, 140, 240, 200, 7, -8)}<path d="M70 124 H198 V131 H70 Z" fill="{STEEL}"/></g>
<path d="M60 198 H206" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>
<g transform="translate(150 128) rotate(-40) scale(.86)"><rect x="-6" y="-96" width="12" height="100" rx="4" fill="{MUD}" stroke="{INK}" stroke-width="5"/>
<rect x="-30" y="-116" width="60" height="30" rx="5" fill="{STEEL}" stroke="{INK}" stroke-width="6"/></g>
{sparks(124, 122, 7, 12, 38)}'''


def tempered():
    return f'''<circle cx="128" cy="112" r="70" fill="{EMBER}" opacity=".12"/>{blade(128, 176, 0, 0.92)}
<g>{''.join(f'<path d="M{x} 214 l9 -9 l9 9 l-9 9 Z" fill="{GOLD}" stroke="{INK}" stroke-width="3"/>' for x in (98, 119, 140))}</g>
<path d="M92 60 l-14 -10 M164 60 l14 -10 M88 96 l-18 0 M168 96 l18 0" stroke="{GOLDHI}" stroke-width="4" stroke-linecap="round"/>'''


def charm(kind, cx, cy, s=1.0):
    g = f'<g transform="translate({cx} {cy}) scale({s})"><circle cx="0" cy="-34" r="7" fill="none" stroke="{INK}" stroke-width="4"/>'
    if kind == 'tusk':
        g += f'<path d="M-8 -28 C-22 4 -12 36 18 48 C4 26 4 0 10 -28 Z" fill="{GOLDHI}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
    elif kind == 'plume':
        g += f'<path d="M0 -28 C24 -6 22 30 2 52 C-18 30 -22 -6 0 -28 Z" fill="{GALE}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/><path d="M1 -22 V48 M1 -4 l12 -8 M1 10 l12 -8 M1 24 l11 -8 M1 -4 l-12 -8 M1 10 l-12 -8 M1 24 l-11 -8" stroke="{INK}" stroke-width="2.6" stroke-linecap="round"/>'
    elif kind == 'kiln':
        g += f'<circle cy="12" r="30" fill="{EMBER}" opacity=".25"/><path d="M-20 -14 L18 -20 L26 18 L-4 40 L-26 16 Z" fill="{MUD}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/><path d="M-12 0 l10 8 l8 -10 l10 10" fill="none" stroke="{EMBER}" stroke-width="5" stroke-linecap="round"/>'
    elif kind == 'rime':
        g += f'<path d="M0 -28 L18 6 L0 52 L-18 6 Z" fill="{FROST}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/><path d="M0 -20 V44 M-10 6 H10" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".8"/>'
    return g + '</g>'


def cord(points):
    d = 'M' + ' Q'.join(points)
    return f'<path d="{d}" fill="none" stroke="{MUD}" stroke-width="5" stroke-linecap="round"/>'


def shards(cx, cy):
    out = ''
    for (dx, dy, r, a) in [(-70, -40, 16, -20), (70, -44, 14, 30), (-84, 20, 11, 50), (86, 16, 13, -40), (-40, -70, 10, 10), (44, -74, 12, -10)]:
        out += f'<path d="M0 {-r} L{r * .6:.1f} 0 L0 {r} L{-r * .6:.1f} 0 Z" transform="translate({cx + dx} {cy + dy}) rotate({a})" fill="{FROST}" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>'
    return out


def clods(cx, cy):
    return ''.join(f'<circle cx="{cx + dx}" cy="{cy + dy}" r="{r}" fill="{MUD}" stroke="{INK}" stroke-width="3"/>' for dx, dy, r in [(-80, -20, 9), (-60, -54, 7), (76, -30, 8), (60, -62, 6), (-20, -76, 6), (90, 4, 7)])


def pieces():
    # a sheared claw, a vent cap and plate shards lying on the ground
    out = f'<path d="M40 204 C40 188 56 180 70 184 L62 192 C54 190 48 196 50 204 Z" fill="{BONE2}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'
    out += f'<path d="M188 204 L194 186 L214 186 L220 204 Z" fill="{BONE2}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'
    out += f'<path d="M110 204 L120 194 L132 204 Z M140 204 L146 196 L156 204 Z" fill="{BONE}" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>'
    out += f'<path d="M78 200 l6 -8 M168 200 l-6 -8" stroke="{EMBER}" stroke-width="3.5" stroke-linecap="round"/>'
    return out


# ---------- the sixteen ----------
G = 'gore'
ICONS = {
    'FIRST_HUNT': lambda: f'{maul(160, 196, -34, 0.88)}{blade(96, 196, 34, 0.92)}',
    'RIDGE_CLEARED': lambda: ridge(True),
    'FIRST_CAPTURE': lambda: ground(204) + plate('gore_down', 20, 72, 216) + net(26, 60, 230, 206, 32),
    'RIDGE_CAPTURED': lambda: folio(plate('gore_tense', 30, 104, 96)),
    'TAKEN_APART': lambda: ground(206) + plate('cinder_broken', 4, 58, 248) + pieces(),
    'BARELY_SCRATCHED': lambda: shield(128, 128, 1.25, scratch=True),
    'LIGHTS_OUT': lambda: plate('gore_dazed', -10, 30, 300, (380, 0, 496, 380)) + star(64, 60, 18) + star(196, 52, 14),
    'STOPPED_COLD': lambda: plate('gore_tense', -150, 40, 330, (0, 60, 876, 429)) + shield(186, 132, 0.92),
    'GROUNDED': lambda: ground(206) + plate('gale_stuck', 0, 52, 256, (100, 100, 776, 389)),
    'UNEARTHED': lambda: clods(128, 120) + f'<path d="M30 206 C70 176 186 176 226 206 Z" fill="{MUD}" stroke="{INK}" stroke-width="5"/>' + plate('cinder_dazed', 14, 70, 228),
    'SHATTER': lambda: ground(204) + plate('rime_bare', 14, 92, 228) + shards(128, 120),
    'RARE_FIND': lambda: gem(128, 124, 1.25),
    'FIRST_FORGE': lambda: anvil_hammer(),
    'TEMPERED': lambda: tempered(),
    'FIRST_CHARM': lambda: cord(['92 40', '128 80 164 40']) + charm('tusk', 128, 118, 1.7),
    'ALL_CHARMS': lambda: cord(['30 60', '128 120 226 60']) + charm('tusk', 66, 112, 1.05) + charm('plume', 108, 130, 1.05) + charm('kiln', 150, 130, 1.0) + charm('rime', 192, 112, 1.05),
}


# ---------- Mirewood and the bounty board (full game) ----------
SEALRED, MOSS, WATER = '#a8402c', '#7f9159', '#3c5a5a'


def mire(flag=True):
    out = f'<ellipse cx="128" cy="190" rx="112" ry="22" fill="{WATER}" stroke="{INK}" stroke-width="5"/>'
    out += f'<path d="M50 188 C66 182 94 182 110 188 M140 194 C160 188 190 188 206 194" stroke="{BONE2}" stroke-width="3" stroke-linecap="round" opacity=".6"/>'
    hum = 'M70 186 C78 150 104 132 128 132 C152 132 178 150 186 186 Z'
    out += f'<clipPath id="hm"><path d="{hum}"/></clipPath><path d="{hum}" fill="{BONE}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/><g clip-path="url(#hm)">{hatch(70, 150, 190, 190, 7, -10)}</g>'
    for x, h, lean in [(40, 70, -6), (54, 92, 4), (66, 60, -2), (196, 84, 6), (210, 66, -4), (222, 96, 3)]:
        stem = f'M{x} 190 q{lean} -{h / 2} {lean * 2} -{h}'
        out += f'<path d="{stem}" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/><path d="{stem}" fill="none" stroke="{MOSS}" stroke-width="3" stroke-linecap="round"/>'
        out += f'<ellipse cx="{x + lean * 2}" cy="{190 - h + 6}" rx="5" ry="12" fill="{MUD}" stroke="{INK}" stroke-width="3"/>'
    if flag:
        out += f'<path d="M128 132 V62" stroke="{INK}" stroke-width="5" stroke-linecap="round"/><path d="M130 64 L170 74 L130 88 Z" fill="{EMBER}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'
    return out


def seal(cx, cy, s=1.0):
    blob = ('M0 -60 C14 -60 18 -50 32 -48 C46 -46 46 -32 54 -22 C62 -10 56 2 58 14 C60 30 46 36 38 46 C28 58 14 56 0 60 '
            'C-14 62 -26 54 -38 46 C-50 38 -58 28 -58 14 C-60 0 -52 -12 -54 -24 C-54 -40 -42 -46 -30 -50 C-18 -56 -12 -60 0 -60 Z')
    return (f'<g transform="translate({cx} {cy}) scale({s})">'
            f'<path d="{blob}" fill="{SEALRED}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
            f'<circle r="38" fill="none" stroke="{INK}" stroke-width="3.5" opacity=".55"/>'
            f'<path d="M-18 16 L0 -24 L18 16 M-10 0 H10" fill="none" stroke="{GOLDHI}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="M-40 -30 Q-30 -44 -14 -48" fill="none" stroke="#d4735d" stroke-width="4" stroke-linecap="round"/></g>')


def notice(x, y, w, h, ang, done=True):
    lines = ''.join(f'<path d="M8 {14 + i * 11} H{w - 10 - (i % 2) * 14}" stroke="{INK}" stroke-width="3" stroke-linecap="round" opacity=".5"/>' for i in range(int((h - 30) / 11)))
    return (f'<g transform="translate({x} {y}) rotate({ang})"><rect width="{w}" height="{h}" fill="{BONE}" stroke="{INK}" stroke-width="4"/>{lines}'
            f'<circle cx="{w / 2}" cy="4" r="4" fill="{STEEL}" stroke="{INK}" stroke-width="2"/>{seal(w - 16, h - 14, 0.24) if done else ""}</g>')


def board():
    out = f'<rect x="28" y="36" width="200" height="164" rx="4" fill="#6b4a32" stroke="{INK}" stroke-width="6"/>'
    out += ''.join(f'<path d="M30 {y} H226" stroke="{INK}" stroke-width="2.5" opacity=".45"/>' for y in (78, 120, 162))
    out += f'<path d="M48 200 V226 M208 200 V226" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>'
    out += notice(42, 48, 56, 66, -4) + notice(102, 44, 52, 72, 3) + notice(160, 50, 54, 64, -2)
    out += notice(48, 122, 54, 64, 3) + notice(108, 124, 50, 62, -3) + notice(164, 120, 52, 66, 2)
    return out


def blade_out(x=150, y=150):
    return (f'<g transform="translate({x} {y}) rotate(-28)"><path d="M-8 0 L-8 -70 L0 -86 L8 -70 L8 0 Z" fill="{STEEL}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
            f'<path d="M0 -78 L0 -6" stroke="#9e978a" stroke-width="3"/></g>{sparks(x - 18, y - 4, 5, 16, 34)}')


ICONS.update({
    'MIREWOOD_CLEARED': lambda: mire(True),
    'GUT_CHECK': lambda: plate('bog_digest', -10, 46, 280, (340, 110, 536, 376)) + blade_out(130, 196),
    'TWO_HEADS': lambda: plate('dusk_reel', 4, 20, 260, (430, 0, 446, 400)),
    'FIRST_BOUNTY': lambda: seal(128, 124, 1.5),
    'ALL_BOUNTIES': lambda: board(),
})


# ---------- Stormspire (full game) ----------
def spire(flag=True):
    d = 'M22 204 L60 150 L80 162 L104 96 L118 104 L128 40 L140 60 L150 34 L162 70 L178 110 L200 120 L234 204 Z'
    out = f'<clipPath id="sp"><path d="{d}"/></clipPath><path d="{d}" fill="{BONE}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
    out += f'<g clip-path="url(#sp)">{hatch(20, 120, 240, 210, 7, -12)}<path d="M150 34 L136 204 M104 96 L112 204 M178 110 L196 204" stroke="{INK}" stroke-width="3" opacity=".6"/></g>'
    out += f'<path d="M22 204 H234" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
    out += f'<path transform="translate(206 44) scale(.5)" d="M0 0 L-26 46 H-6 L-20 90 L24 34 H4 L18 0 Z" fill="{GOLDHI}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>'
    if flag:
        out += f'<path d="M150 34 V-4" stroke="{INK}" stroke-width="5" stroke-linecap="round" transform="translate(0 6)"/><path d="M152 4 L188 14 L152 26 Z" fill="{EMBER}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'
    return out


def arrow_through(x, y, ang):
    return (f'<g transform="translate({x} {y}) rotate({ang})"><path d="M-90 0 H70" stroke="{INK}" stroke-width="9" stroke-linecap="round"/>'
            f'<path d="M-90 0 H70" stroke="{MUD}" stroke-width="4" stroke-linecap="round"/>'
            f'<path d="M70 -12 L96 0 L70 12 Z" fill="{STEEL}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'
            f'<path d="M-90 0 l-14 -12 M-90 0 l-14 12 M-80 0 l-14 -12 M-80 0 l-14 12" stroke="{GOLD}" stroke-width="4" stroke-linecap="round"/></g>')


def steam(cx, cy):
    return ''.join(f'<circle cx="{cx + dx}" cy="{cy + dy}" r="{r}" fill="{BONE2}" opacity=".35"/>' for dx, dy, r in [(0, 0, 18), (22, -14, 14), (-20, -18, 12), (8, -34, 10)])


ICONS.update({
    'STORMSPIRE_CLEARED': lambda: f'<g transform="translate(14 34) scale(.88)">{spire(True)}</g>',
    'QUENCHED': lambda: plate('slag_shattered', -20, 64, 296, (0, 30, 876, 456)) + steam(170, 90) + steam(96, 110) + f'<g transform="translate(196 112) rotate(36) scale(.5)">{maul(0, 0, 0)}</g>',
    'SEARED_SHUT': lambda: plate('hydra_sealed', 4, 30, 248, (130, 60, 520, 420)),
    'STORM_CHASER': lambda: plate('roc_calm', -10, 20, 276, (380, 100, 380, 330)) + arrow_through(150, 92, -18),
})

# ---------- the changed Ashfall Ridge and the apex (full game, 6 Nov 2026) ----------
def plate_sz(name, x, y, w, size, crop=None):
    """A captured plate of any size (capture2.cjs). crop = (cx, cy, cw, ch) in PNG pixels."""
    data = base64.b64encode((POSES / f'{name}.png').read_bytes()).decode()
    pw, ph = size
    cx, cy, cw, ch = crop or (0, 0, pw, ph)
    h = w * ch / cw
    return f'<svg x="{x}" y="{y}" width="{w}" height="{h:.1f}" viewBox="{cx} {cy} {cw} {ch}"><image width="{pw}" height="{ph}" xlink:href="data:image/png;base64,{data}"/></svg>'


def no_salve(cx, cy):
    body = (f'<g transform="translate({cx - 34} {cy - 34}) scale(1.4)"><path d="M17 10 H31 V15 C37 18 40 24 40 30 C40 38 33 43 24 43 C15 43 8 38 8 30 C8 24 11 18 17 15 Z" fill="{BONE}" stroke="{INK}" stroke-width="3.4" stroke-linejoin="round"/>'
            f'<path d="M10 29 C14 33 34 33 38 29 C38 37 32 41 24 41 C16 41 10 37 10 29 Z" fill="#8aa56a"/><path d="M15 6 H33 V11 H15 Z" fill="{MUD}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/></g>')
    return body + f'<path d="M{cx - 36} {cy - 36} L{cx + 36} {cy + 36} M{cx + 36} {cy - 36} L{cx - 36} {cy + 36}" stroke="{INK}" stroke-width="15" stroke-linecap="round"/><path d="M{cx - 36} {cy - 36} L{cx + 36} {cy + 36} M{cx + 36} {cy - 36} L{cx - 36} {cy + 36}" stroke="{EMBER}" stroke-width="8" stroke-linecap="round"/>'


V = (886, 490)
ICONS.update({
    'RIDGE_CHANGED': lambda: ''.join(plate_sz(n, x, y, 112, V, (60, 40, 790, 450)) for n, x, y in [('squall_gather', 18, 44), ('rimeshrike_idle', 128, 44), ('quake_idle', 18, 132), ('ash_scaled', 128, 132)]),
    'SOVEREIGN': lambda: plate_sz('sov_rest', -14, 56, 284, (888, 510)),
    'BARE_HANDED': lambda: plate_sz('sov_rest', -30, 92, 250, (888, 510)) + no_salve(188, 74),
})

# ---------- the Gloamhollow (full game, Nov 2026) ----------
def crossed(cx, cy, body):
    # a ring with a slash (a "no" sign) round the motif, so the motif itself stays readable
    return f'<circle cx="{cx}" cy="{cy}" r="42" fill="#231b15"/>' + body + f'<circle cx="{cx}" cy="{cy}" r="42" fill="none" stroke="{INK}" stroke-width="13"/><circle cx="{cx}" cy="{cy}" r="42" fill="none" stroke="{EMBER}" stroke-width="6"/><path d="M{cx - 29} {cy - 29} L{cx + 29} {cy + 29}" stroke="{INK}" stroke-width="13" stroke-linecap="round"/><path d="M{cx - 29} {cy - 29} L{cx + 29} {cy + 29}" stroke="{EMBER}" stroke-width="6" stroke-linecap="round"/>'


def spores(cx, cy):
    d = ''.join(f'<path d="M{cx + dx} {cy + dy - 12} l12 12 l-12 12 l-12 -12 z" fill="#9fc062" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>' for dx, dy in [(-12, -8), (14, -2), (0, 18)])
    return crossed(cx, cy, d)


def drop(cx, cy):
    d = f'<path d="M{cx} {cy - 30} C{cx + 10} {cy - 14} {cx + 22} {cy - 2} {cx + 22} {cy + 10} A22 22 0 0 1 {cx - 22} {cy + 10} C{cx - 22} {cy - 2} {cx - 10} {cy - 14} {cx} {cy - 30} Z" fill="#c4565c" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
    return crossed(cx, cy, d)


def bolt(cx, cy):
    d = f'<path d="M{cx + 8} {cy - 32} L{cx - 16} {cy + 4} H{cx} L{cx - 8} {cy + 32} L{cx + 18} {cy - 6} H{cx + 3} Z" fill="#f0dd6e" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
    return crossed(cx, cy, d)


ICONS.update({
    'CLEAN_BILL': lambda: plate_sz('rot_idle', -6, 100, 230, V, (60, 40, 790, 450)) + spores(66, 70),
    'EARTHED': lambda: plate_sz('arc_idle', 20, 100, 230, V, (60, 40, 790, 450)) + bolt(66, 70),
    'BLOODLESS': lambda: plate_sz('fang_idle', 20, 104, 230, V, (60, 40, 790, 450)) + drop(66, 70),
    'GLOAMHOLLOW': lambda: ''.join(plate_sz(n, x, y, 78, V, (60, 40, 790, 450)) for n, x, y in [('rot_idle', 12, 60), ('arc_idle', 89, 60), ('fang_idle', 166, 60), ('blight_idle', 12, 132), ('glare_idle', 89, 132), ('grave_idle', 166, 132)]),
})

for aid, fn in ICONS.items():
    body = fn()
    (SVG / f'{aid}.svg').write_text(frame(body, True))
    (SVG / f'{aid}_locked.svg').write_text(frame(body, False))
print(len(ICONS) * 2, 'icons')
