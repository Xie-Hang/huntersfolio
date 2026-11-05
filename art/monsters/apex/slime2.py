# Apex sketches v2 (6 Nov 2026, Mekkman: "parts that are actual monster parts"): the Wanderer Sovereign as a slime
# that has swallowed parts of the four Ashfall Ridge monsters and wears them: Gorehorn tusks (Stone stance: the
# charge), Galeshrike wings (Gale: flight), Cinderback vents and claws (Ember: burrowing), Rimetail barbed tail (Frost:
# ice plating). Each stance uses its part; tearing the part out ends that stance for good.
INK='#1a1410'; BONE='#ecdfc8'; BONE2='#c9b89c'; GOLD='#f3cf7a'; EMBER='#e8773a'; GALE='#8fc3c9'; FROST='#b9d3f0'; STONE='#a99f90'; SLIME='#d9e3c8'
S=f'stroke="{INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"'

def body(sx, sy):
    def P(x, y): return f'{500 + (x - 500) * sx:.0f} {520 - (520 - y) * sy:.0f}'
    return (f'M{P(170,520)} C{P(150,380)} {P(250,190)} {P(500,180)} C{P(750,190)} {P(850,380)} {P(830,520)} '
            f'C{P(800,540)} {P(780,500)} {P(750,530)} C{P(720,560)} {P(690,505)} {P(650,526)} C{P(600,548)} {P(560,505)} {P(500,528)} '
            f'C{P(440,550)} {P(410,504)} {P(360,526)} C{P(310,548)} {P(280,500)} {P(240,528)} C{P(210,548)} {P(185,530)} {P(170,520)} Z')

def wing(x, y, spread, flip=1):
    # a Galeshrike wing growing out of the slime: folded (spread 0) to fully open (1)
    a = -20 - 60 * spread
    tip = (x + flip * (170 + 60 * spread), y - 40 - 160 * spread)
    d = f'M{x} {y} C{x + flip * 40} {y - 60 - 80 * spread} {tip[0] - flip * 60} {tip[1] - 20} {tip[0]} {tip[1]} C{tip[0] - flip * 20} {tip[1] + 50} {x + flip * 120} {y + 10} {x + flip * 20} {y + 30} Z'
    out = f'<path d="{d}" fill="{BONE}" {S}/>'
    for k in range(1, 5):
        t = k / 5
        fx, fy = x + (tip[0] - x) * t, y + (tip[1] - y) * t
        out += f'<path d="M{fx:.0f} {fy:.0f} l{flip * 30:.0f} {50 - 10 * spread:.0f}" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
    out += f'<path d="M{tip[0] - flip * 50:.0f} {tip[1] + 6:.0f} L{tip[0]:.0f} {tip[1]:.0f}" stroke="{GALE}" stroke-width="7" stroke-linecap="round"/>'
    return out

def sovereign(stance='rest'):
    sx, sy, lift = 1, 1, 0
    if stance == 'stone': sx, sy = 1.06, .9
    if stance == 'gale': sx, sy, lift = .9, 1.1, -90
    if stance == 'ember': sy = .6
    d = body(sx, sy); X = lambda x: 500 + (x - 500) * sx; Y = lambda y: 520 - (520 - y) * sy
    out = f'<defs><clipPath id="c{stance}"><path d="{d}"/></clipPath></defs><path d="M60 532 H940" stroke="#4d4136" stroke-width="5" stroke-linecap="round"/>'
    if stance == 'gale': out += f'<ellipse cx="500" cy="530" rx="250" ry="16" fill="{INK}" opacity=".35"/>'
    if stance == 'ember': out += f'<path d="M190 532 l40 -14 l30 16 l50 -18 l40 14 M630 532 l44 -16 l36 14 l50 -14" fill="none" stroke="{EMBER}" stroke-width="7" stroke-linejoin="round"/>'
    out += f'<g transform="translate(0 {lift})">'
    # Rimetail tail, behind the body (Frost)
    tail_up = stance == 'frost'
    tx, ty = X(800), Y(440)
    td = f'M{tx} {ty} C{tx + 80} {ty - 10} {tx + 120} {ty - (150 if tail_up else 60)} {tx + 90} {ty - (230 if tail_up else 120)}'
    out += f'<path d="{td}" fill="none" stroke="{INK}" stroke-width="40" stroke-linecap="round"/><path d="{td}" fill="none" stroke="{BONE2}" stroke-width="24" stroke-linecap="round"/>'
    for k, (bx, by) in enumerate(((tx + 60, ty - 20), (tx + 100, ty - (90 if tail_up else 50)), (tx + 100, ty - (170 if tail_up else 95)))):
        out += f'<path d="M{bx - 14} {by + 6} L{bx + 22} {by - 30} L{bx + 14} {by + 18} Z" fill="{FROST}" {S} stroke-width="6"/>'
    # Galeshrike wings (Gale): folded against the back at rest, spread in the Gale stance
    sp = 1 if stance == 'gale' else 0.4
    # in flight the far wing opens too, from behind the top of the body (never across its face)
    if stance == 'gale': out += wing(X(560), Y(240), sp, -1)
    # the slime body: pale green-grey, translucent sheen
    out += f'<path d="{d}" fill="{SLIME}" {S}/>'
    hatch = ''.join(f'M{x} 400 L{x - 60} 560 ' for x in range(160, 900, 16))
    out += f'<g clip-path="url(#c{stance})"><path d="{hatch}" stroke="{INK}" stroke-width="5" opacity=".7"/>'
    # half-digested things inside: a hunter's blade, a bone
    if stance != 'ember':
        out += f'<path d="M{X(560)} {Y(300)} L{X(640)} {Y(420)}" stroke="{INK}" stroke-width="14" stroke-linecap="round" opacity=".3"/><path d="M{X(430)} {Y(430)} l70 -10" stroke="{INK}" stroke-width="18" stroke-linecap="round" opacity=".22"/>'
    out += '</g>'
    out += f'<path d="M{X(310)} {Y(290)} C{X(350)} {Y(230)} {X(440)} {Y(206)} {X(510)} {Y(208)}" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".7"/>'
    # the near Galeshrike wing lies over the body at the back (Mekkman's sketch, 6 Nov)
    if stance != 'ember': out += wing(X(620), Y(270), sp, 1)
    # Cinderback vents along the top, moved forward to leave the back to the wing (Ember), and its digging claws at the base
    for i, x in enumerate((360, 425, 490)):
        vx, vy = X(x), Y({360: 232, 425: 205, 490: 192}[x])
        hot = stance == 'ember'
        out += f'<path d="M{vx - 18} {vy + 6} L{vx - 10} {vy - 34} H{vx + 10} L{vx + 18} {vy + 6} Z" fill="{STONE if stance == "stone" else BONE2}" {S} stroke-width="6"/><ellipse cx="{vx}" cy="{vy - 34}" rx="9" ry="4" fill="{EMBER}"/>'
        if hot: out += f'<path d="M{vx} {vy - 44} q-12 -22 0 -44 q12 -22 0 -44" fill="none" stroke="{EMBER}" stroke-width="6" stroke-linecap="round" opacity=".85"/>'
    if stance != 'gale':
        for cx in (X(300), X(700)):
            out += f'<path d="M{cx - 30} 520 L{cx - 22} 548 M{cx - 8} 522 L{cx} 552 M{cx + 14} 520 L{cx + 22} 548" stroke="{INK}" stroke-width="9" stroke-linecap="round"/>'
    # Gorehorn tusks (Stone): curving out of the front; lowered for the charge
    lw = 1.25 if stance == 'stone' else 1
    for k, (x, y) in enumerate(((X(215), Y(440)), (X(260), Y(470)))):
        out += f'<path d="M{x + 30} {y} C{x - 40 * lw} {y + 10} {x - 80 * lw} {y - 50 * lw} {x - 60 * lw} {y - 110 * lw} C{x - 40 * lw} {y - 60 * lw} {x - 10} {y - 30} {x + 34} {y - 30} Z" fill="{GOLD}" {S} stroke-width="7"/>'
    if stance == 'stone':
        for x, y, w in ((330, 300, 90), (450, 240, 110), (720, 330, 90)):
            out += f'<path d="M{X(x)} {Y(y)} l{w * .3:.0f} -{w * .32:.0f} l{w * .55:.0f} {w * .06:.0f} l{w * .18:.0f} {w * .4:.0f} l-{w * .5:.0f} {w * .18:.0f} Z" fill="{STONE}" {S} stroke-width="6"/>'
    if stance == 'frost':
        for x, h in ((300, 60), (380, 80), (450, 70), (720, 70), (780, 56)):
            y = Y(300 if x in (300, 780) else 230)
            out += f'<path d="M{X(x) - 22} {y + 20} L{X(x)} {y - h} L{X(x) + 22} {y + 20} Z" fill="{FROST}" {S} stroke-width="6"/>'
    # eyes: small, many, unsettling
    for ex, ey, r in ((330, 330, 18), (385, 312, 22), (300, 375, 12)):
        out += f'<ellipse cx="{X(ex)}" cy="{Y(ey)}" rx="{r}" ry="{r * 1.3:.0f}" fill="{INK}"/><circle cx="{X(ex) - r * .3}" cy="{Y(ey) - r * .4}" r="{r * .3:.0f}" fill="{EMBER}"/>'
    out += '</g>'
    return out

LABEL = {'rest': 'At rest: Gorehorn tusks, Galeshrike wing, Cinderback vents and claws, Rimetail tail, all swallowed and worn',
         'stone': 'Stone stance · tusks lowered, crusted in rock (Gorehorn: the charge)', 'gale': 'Gale stance · wings spread, lifted (Galeshrike: flight)',
         'ember': 'Ember stance · sunk in, vents burning (Cinderback: burrowing)', 'frost': 'Frost stance · tail raised, iced over (Rimetail: plating)'}
def svg(st, w, h): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{"100 60 960 520" if st == "rest" else "60 -80 1000 700"}" width="{w}" height="{h}" style="transform:scaleX(-1)">{sovereign(st)}</svg>'
html = ['<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#201a15;font:600 22px Barlow,system-ui,sans-serif;color:#ecdfc8;width:2000px}',
        '.big{padding:30px}.row{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding:0 30px 30px}',
        '.card{background:#2a221c;border:2px solid #3b322a;border-radius:6px;padding:14px}.card p{margin:8px 4px 0}.card svg{width:100%;height:auto;display:block}h1{font:400 40px "IM Fell English",serif;margin:30px 30px 0;color:#e8773a}</style>',
        '<h1>Wanderer Sovereign · v2: a slime wearing what it ate</h1><div class="big">',
        f'<div class="card"><div style="width:1100px;margin:auto">{svg("rest", 1100, 596)}</div><p>{LABEL["rest"]}</p></div></div><div class="row">']
for st in ('stone', 'gale', 'ember', 'frost'): html.append(f'<div class="card">{svg(st, 460, 322)}<p>{LABEL[st]}</p></div>')
html.append('</div>')
open('sheet2.html', 'w').write(''.join(html))
