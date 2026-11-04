"""Hunter's Folio store and library art, composed as editable SVG from the game's own engravings.
Writes svg/<asset>.svg; render.cjs rasterises them to exact-size PNG/JPG."""
import base64, re, pathlib

ROOT = pathlib.Path(__file__).parent
REPO = ROOT.parent
SRC, OUT = ROOT / 'src', ROOT / 'svg'
OUT.mkdir(exist_ok=True)
FONTS = REPO / 'node_modules/@fontsource/barlow/files'

C = dict(bg='#14100d', bg2='#241c16', edge='#0b0907', line='#3b322a', line2='#4d4136', bone='#ecdfc8', soft='#c9b89c',
         muted='#a8977e', gold='#e9b949', goldhi='#f3cf7a', ember='#e8773a', frost='#b9d3f0', ink='#1a1410', boneedge='#8c7a62')

def font_css():
    f = lambda w: base64.b64encode((FONTS / f'barlow-latin-{w}-normal.woff2').read_bytes()).decode()
    return ("@font-face{font-family:'Barlow';font-weight:600;src:url(data:font/woff2;base64,%s) format('woff2')}"
            "@font-face{font-family:'Barlow';font-weight:400;src:url(data:font/woff2;base64,%s) format('woff2')}") % (f(600), f(400))
FONT_CSS = font_css()

# ---------- engravings, recoloured for key art (more contrast than in-game: they must read as thumbnails) ----------
ACCENT = {  # path starts that get the accent colour, per monster
    'gorehorn': ('M276 112', 'M266 115'),        # tusks
    'galeshrike': ('M150 84', 'M186 82'),        # wings
    'cinderback': (),
    'rimetail': (),
}
def plate(mon, weight=2.4, accent=None, ground=True):
    s = (SRC / f'plate-{mon}.svg').read_text()
    inner = re.sub(r'^<svg[^>]*>|</svg>$', '', s)
    if not ground: inner = re.sub(r'<path d="M10 15\d H310"[^>]*></path>', '', inner)
    inner = re.sub(r' style="[^"]*"', '', inner)
    def fix(m):
        el = m.group(0)
        d = re.search(r' d="([^"]*)"', el)
        stroke = re.search(r'stroke="([^"]*)"', el).group(1)
        hatch = '77, 65, 54' in stroke
        acc = d and any(d.group(1).startswith(a) for a in ACCENT[mon])
        if hatch: col, w = C['muted'], weight * 0.5
        elif acc: col, w = accent or C['goldhi'], weight * 1.25
        elif '185, 211, 240' in stroke: col, w = C['frost'], weight
        elif '232, 119, 58' in stroke: col, w = C['ember'], weight
        else: col, w = C['bone'], weight
        el = re.sub(r'stroke="[^"]*"', f'stroke="{col}"', el)
        el = re.sub(r'stroke-width="[^"]*"', f'stroke-width="{w:.2f}"', el)
        el = re.sub(r'fill="rgb\([^)]*\)"', f'fill="{col}"', el)
        el = re.sub(r' stroke-dasharray="[^"]*"', '', el)
        return el
    inner = re.sub(r'<(path|circle)[^>]*>', fix, inner)
    return inner  # in a 320 x 175 box

def place(mon, x, y, w, **kw):  # kw: weight, accent, ground
    s = w / 320
    return f'<g transform="translate({x:.1f},{y:.1f}) scale({s:.4f})">{plate(mon, **kw)}</g>'

# ---------- pieces ----------
def die(cx, cy, size, face='C', rot=0):
    r, e = size * 0.14, size * 0.07
    g = f'<g transform="translate({cx},{cy}) rotate({rot})">'
    g += f'<rect x="{-size/2}" y="{-size/2 + e}" width="{size}" height="{size}" rx="{r}" fill="{C["boneedge"]}"/>'
    g += f'<rect x="{-size/2}" y="{-size/2}" width="{size}" height="{size}" rx="{r}" fill="{C["bone"]}"/>'
    if face == 'C': g += f'<circle r="{size*0.19}" fill="{C["ink"]}"/>'
    elif face == 'T':
        a = size * 0.22
        g += f'<path d="M0 {-a*1.05} L{a*1.1} {a*0.85} L{-a*1.1} {a*0.85}Z" fill="{C["ink"]}"/>'
    return g + '</g>'

def logo(x, y, S, anchor='start', stacked=True, colour=None):
    """Title only (Steam allows no other text). S = cap height-ish of 'Folio'."""
    hunters = colour or C['bone']
    if stacked:
        t = (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="Barlow" font-weight="600" font-size="{S*0.5:.1f}" '
             f'letter-spacing="{S*0.01:.2f}" fill="{hunters}">Hunter’s</text>'
             f'<text x="{x}" y="{y + S*0.95:.1f}" text-anchor="{anchor}" font-family="Barlow" font-weight="600" font-size="{S*1.15:.1f}" '
             f'letter-spacing="{-S*0.01:.2f}" fill="{C["ember"]}">Folio</text>')
        rule_y = y + S * 1.22
    else:
        t = (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="Barlow" font-weight="600" font-size="{S:.1f}" fill="{hunters}">'
             f'Hunter’s <tspan fill="{C["ember"]}">Folio</tspan></text>')
        rule_y = y + S * 0.32
    return t, rule_y

def rule(x1, x2, y, w=2):
    mid = (x1 + x2) / 2
    d = w * 3
    return (f'<path d="M{x1} {y} H{mid-d*2.2} M{mid+d*2.2} {y} H{x2}" stroke="{C["gold"]}" stroke-width="{w}" stroke-linecap="round" opacity=".85"/>'
            f'<path d="M{mid} {y-d} L{mid+d} {y} L{mid} {y+d} L{mid-d} {y}Z" fill="{C["gold"]}"/>')

def page(W, H, body, frame=True, transparent=False):
    defs = (f'<defs><style>{FONT_CSS}</style>'
            f'<radialGradient id="glow" cx="62%" cy="48%" r="75%"><stop offset="0" stop-color="{C["bg2"]}"/>'
            f'<stop offset=".6" stop-color="{C["bg"]}"/><stop offset="1" stop-color="{C["edge"]}"/></radialGradient>'
            f'<pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">'
            f'<path d="M0 0 V9" stroke="{C["line"]}" stroke-width="1" opacity=".35"/></pattern></defs>')
    bg = '' if transparent else f'<rect width="{W}" height="{H}" fill="url(#glow)"/><rect width="{W}" height="{H}" fill="url(#hatch)" opacity=".5"/>'
    fr = ''
    if frame and not transparent:
        m = max(10, min(W, H) * 0.035)
        fr = (f'<rect x="{m}" y="{m}" width="{W-2*m}" height="{H-2*m}" fill="none" stroke="{C["line2"]}" stroke-width="{max(1.5, m*0.12):.1f}"/>'
              f'<rect x="{m*1.45}" y="{m*1.45}" width="{W-2.9*m}" height="{H-2.9*m}" fill="none" stroke="{C["line"]}" stroke-width="{max(1, m*0.06):.1f}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{defs}{bg}{fr}{body}</svg>')

def ground(x1, x2, y, w=2):
    return f'<path d="M{x1} {y} H{x2}" stroke="{C["line2"]}" stroke-width="{w}" stroke-linecap="round"/>'

def write(name, svg): (OUT / f'{name}.svg').write_text(svg)

# ---------- landscape key art (header, main, library header, event cover) ----------
def landscape(W, H):
    S = H * 0.2
    lx = W * 0.075
    t, ry = logo(lx, H * 0.40, S)
    body = t + rule(lx, lx + S * 2.35, ry, max(2, H * 0.005))
    mw = W * 0.56
    mx, my = W - mw - W * 0.05, H * 0.5 - mw * 175 / 320 * 0.52
    body += place('gorehorn', mx, my, mw, weight=2.6)
    ds = H * 0.17
    body += die(mx + mw * 0.12, H * 0.80, ds, 'C', -14) + die(mx + mw * 0.12 + ds * 1.25, H * 0.83, ds, 'T', 9)
    return page(W, H, body)

for name, (w, h) in {'header_capsule_920x430': (920, 430), 'main_capsule_1232x706': (1232, 706),
                     'library_header_920x430': (920, 430), 'event_cover_800x450': (800, 450)}.items():
    write(name, landscape(w, h))

# ---------- small capsule: the logo nearly fills it ----------
def small(W, H):
    S = H * 0.40
    t, ry = logo(H * 0.92, H * 0.40, S)
    body = t + die(H * 0.46, H * 0.5, H * 0.52, 'C', -12)
    return page(W, H, body, frame=False)
write('small_capsule_462x174', small(462, 174))

# ---------- portrait (vertical capsule, library capsule) ----------
def portrait(W, H):
    S = W * 0.2
    t, ry = logo(W / 2, H * 0.17, S, anchor='middle')
    body = t + rule(W / 2 - S * 1.3, W / 2 + S * 1.3, ry, max(2, W * 0.005))
    mw = W * 0.92
    body += place('gorehorn', (W - mw) / 2, H * 0.40, mw, weight=2.6)
    ds = W * 0.15
    body += die(W / 2 - ds * 0.7, H * 0.86, ds, 'C', -14) + die(W / 2 + ds * 0.7, H * 0.88, ds, 'T', 10)
    return page(W, H, body)
write('vertical_capsule_748x896', portrait(748, 896))
write('library_capsule_600x900', portrait(600, 900))

# ---------- library hero: art only, no logo (Steam draws the library logo on top, lower left by default) ----------
FEET = {'gorehorn': 161, 'rimetail': 150, 'cinderback': 150, 'galeshrike': 150}
def hero(W, H):
    G = H * 0.74
    body = ground(W * 0.30, W * 0.97, G, 4)
    order = ['galeshrike', 'rimetail', 'cinderback', 'gorehorn']
    mw, step = W * 0.165, W * 0.168
    for i, mon in enumerate(order):
        x = W * 0.30 + i * step
        y = G - mw * FEET[mon] / 320 - (H * 0.16 if mon == 'galeshrike' else 0)
        body += place(mon, x, y, mw, weight=2.4, ground=False)
    return page(W, H, body, frame=False)
write('library_hero_3840x1240', hero(3840, 1240))

# ---------- library logo: transparent, title only ----------
def lib_logo(W, H):
    S = H * 0.36
    t, ry = logo(W / 2, H * 0.36, S, anchor='middle')
    return page(W, H, t + rule(W / 2 - S * 1.3, W / 2 + S * 1.3, ry, 6), frame=False, transparent=True)
write('library_logo_1280x720', lib_logo(1280, 720))

# ---------- icons: a die with the Gorehorn's tusk ----------
def icon(W, transparent_corners=True):
    r = W * 0.18
    body = f'<rect width="{W}" height="{W}" rx="{r}" fill="url(#glow)"/>'
    body += die(W * 0.46, W * 0.46, W * 0.56, 'C', -10)
    tusk = f'M{W*0.18} {W*0.80} C{W*0.40} {W*0.98} {W*0.86} {W*0.90} {W*0.86} {W*0.40}'
    body += f'<path d="{tusk}" fill="none" stroke="{C["ember"]}" stroke-width="{W*0.075:.1f}" stroke-linecap="round"/>'
    return page(W, W, body, frame=False, transparent=True)
write('shortcut_icon_256x256', icon(256))
write('app_icon_184x184', icon(184))
write('app_icon_1024x1024', icon(1024))

# ---------- source pieces for Figma ----------
for mon in ['gorehorn', 'galeshrike', 'cinderback', 'rimetail']:
    write(f'piece_engraving_{mon}', page(640, 350, place(mon, 0, 0, 640, weight=2.4), frame=False, transparent=True))
write('piece_dice', page(420, 140, die(70, 66, 110, 'C', 0) + die(210, 66, 110, 'T', 0) + die(350, 66, 110, 'B', 0)
                         .replace('</g>', f'<text y="8" text-anchor="middle" font-family="Barlow" font-weight="600" font-size="22" fill="{C["ink"]}" opacity=".72">Blank</text></g>'),
                         frame=False, transparent=True))
print('ok', len(list(OUT.glob('*.svg'))))
