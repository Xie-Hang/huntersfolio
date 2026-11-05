# Apex sketches (6 Nov 2026): the Wanderer Sovereign as a slime, in the plate style (ink edge, bone fill, hatching).
# A vast slime that has swallowed the four elements: their cores float inside it, and each stance reshapes the body.
INK='#1a1410'; BONE='#ecdfc8'; BONE2='#c9b89c'; GOLD='#f3cf7a'; EMBER='#e8773a'; GALE='#8fc3c9'; FROST='#b9d3f0'; STONE='#a99f90'; BG='#201a15'
S=f'stroke="{INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"'

def body_path(sx=1, sy=1, y0=520):
    # dome on a dripping base, centred at x=500
    def P(x, y): return f'{500 + (x - 500) * sx:.0f} {y0 - (y0 - y) * sy:.0f}'
    return (f'M{P(170,520)} C{P(150,380)} {P(250,190)} {P(500,180)} C{P(750,190)} {P(850,380)} {P(830,520)} '
            f'C{P(800,540)} {P(780,500)} {P(750,530)} C{P(720,560)} {P(690,505)} {P(650,526)} C{P(600,548)} {P(560,505)} {P(500,528)} '
            f'C{P(440,550)} {P(410,504)} {P(360,526)} C{P(310,548)} {P(280,500)} {P(240,528)} C{P(210,548)} {P(185,530)} {P(170,520)} Z')

def core(kind, x, y, r=34, glow=False):
    c = {'stone': STONE, 'gale': GALE, 'ember': EMBER, 'frost': FROST}[kind]
    out = f'<circle cx="{x}" cy="{y}" r="{r + 18}" fill="{c}" opacity=".45"/>' if glow else ''
    out += f'<circle cx="{x}" cy="{y}" r="{r}" fill="{BONE2}" {S} stroke-width="6"/>'
    if kind == 'stone': out += f'<rect x="{x-15}" y="{y-15}" width="30" height="30" rx="3" fill="{c}" {S} stroke-width="5"/>'
    if kind == 'gale': out += f'<path d="M{x-20} {y-6} c8 -8 16 8 24 0 s16 -8 16 0 M{x-20} {y+10} c8 -8 16 8 24 0 s16 -8 16 0" fill="none" stroke="{INK}" stroke-width="10" stroke-linecap="round"/><path d="M{x-20} {y-6} c8 -8 16 8 24 0 s16 -8 16 0 M{x-20} {y+10} c8 -8 16 8 24 0 s16 -8 16 0" fill="none" stroke="{c}" stroke-width="5" stroke-linecap="round"/>'
    if kind == 'ember': out += f'<path d="M{x} {y-24} C{x+8} {y-10} {x+20} {y-4} {x+20} {y+8} A20 20 0 0 1 {x-20} {y+8} C{x-20} {y-2} {x-12} {y-8} {x-8} {y-12} C{x-6} {y-4} {x-2} {y} {x+2} {y} C{x} {y-8} {x-2} {y-16} {x} {y-24} Z" fill="{c}" {S} stroke-width="5"/>'
    if kind == 'frost': out += f'<path d="M{x} {y-22} V{y+22} M{x-19} {y-11} L{x+19} {y+11} M{x-19} {y+11} L{x+19} {y-11}" stroke="{INK}" stroke-width="10" stroke-linecap="round"/><path d="M{x} {y-22} V{y+22} M{x-19} {y-11} L{x+19} {y+11} M{x-19} {y+11} L{x+19} {y-11}" stroke="{c}" stroke-width="5" stroke-linecap="round"/>'
    return out

def slime(stance='rest'):
    sx, sy, y0, lift = 1, 1, 520, 0
    if stance == 'stone': sx, sy = 1.08, .86
    if stance == 'gale': sx, sy, lift = .86, 1.18, -70
    if stance == 'ember': sy = .55
    d = body_path(sx, sy, y0)
    uid = stance
    out = f'<defs><clipPath id="c{uid}"><path d="{d}"/></clipPath></defs>'
    out += '<path d="M60 532 H940" stroke="#4d4136" stroke-width="5" stroke-linecap="round"/>'
    if stance == 'gale': out += f'<ellipse cx="500" cy="530" rx="260" ry="16" fill="{INK}" opacity=".35"/>'
    if stance == 'ember':
        out += f'<path d="M210 532 l40 -14 l30 16 l50 -18 l40 14 M620 532 l44 -16 l36 14 l50 -14" fill="none" stroke="{EMBER}" stroke-width="7" stroke-linejoin="round"/>'
    out += f'<g transform="translate(0 {lift})">'
    out += f'<path d="{d}" fill="{BONE}" {S}/>'
    # hatching on the lower body, and a highlight up top (the woodcut way to show a wet sheen)
    hatch = ''.join(f'M{x} 380 L{x - 60} 560 ' for x in range(160, 900, 16))
    out += f'<g clip-path="url(#c{uid})"><path d="{hatch}" stroke="{INK}" stroke-width="5" opacity=".75"/></g>'
    hy = 520 - (520 - 250) * sy
    out += f'<path d="M{500 - 190 * sx:.0f} {hy + 40:.0f} C{500 - 150 * sx:.0f} {hy - 10:.0f} {500 - 60 * sx:.0f} {hy - 28:.0f} {500 + 10 * sx:.0f} {hy - 26:.0f}" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".7"/>'
    # cores (the stance's core glows); a swallowed blade drifts inside
    cy = lambda y: 520 - (520 - y) * sy
    if stance != 'ember':
        out += f'<path d="M{500 + 190 * sx:.0f} {cy(300):.0f} L{500 + 270 * sx:.0f} {cy(430):.0f}" stroke="{INK}" stroke-width="16" stroke-linecap="round" opacity=".35"/><path d="M{500 + 182 * sx:.0f} {cy(318):.0f} l26 -10" stroke="{INK}" stroke-width="10" opacity=".35"/>'
    for k, x, y in (('stone', 470, 300), ('gale', 600, 330), ('ember', 520, 420), ('frost', 660, 430)):
        if stance == 'ember' and y < 380: continue
        out += core(k, 500 + (x - 500) * sx, cy(y), glow=(k == stance))
    # crown of gold spines on top: the sovereign
    top = 520 - (520 - 182) * sy
    for i, (x, h) in enumerate(((430, 70), (470, 96), (510, 110), (550, 92), (590, 66))):
        X = 500 + (x - 500) * sx
        out += f'<path d="M{X - 18:.0f} {top + 14 + abs(i - 2) * 6:.0f} L{X:.0f} {top - h * .8:.0f} L{X + 18:.0f} {top + 14 + abs(i - 2) * 6:.0f} Z" fill="{GOLD}" {S} stroke-width="6"/>'
    # eyes (facing left, as every plate is drawn)
    ey = cy(330)
    for ex in (500 + (300 - 500) * sx, 500 + (380 - 500) * sx):
        out += f'<ellipse cx="{ex:.0f}" cy="{ey:.0f}" rx="20" ry="26" fill="{INK}"/><circle cx="{ex - 6:.0f}" cy="{ey - 9:.0f}" r="6" fill="{EMBER}"/>'
    # stance dressing
    if stance == 'stone':
        for x, y, w in ((300, 330, 90), (430, 250, 110), (590, 262, 100), (700, 350, 90)):
            out += f'<path d="M{x} {cy(y):.0f} l{w * .3:.0f} -{w * .32:.0f} l{w * .55:.0f} {w * .06:.0f} l{w * .18:.0f} {w * .4:.0f} l-{w * .5:.0f} {w * .18:.0f} Z" fill="{STONE}" {S} stroke-width="6"/>'
    if stance == 'gale':
        for i, (x, y) in enumerate(((160, 280), (140, 380), (820, 300), (840, 400))):
            out += f'<path d="M{x} {y} q{40 if x < 500 else -40} -30 {80 if x < 500 else -80} 0" fill="none" stroke="{GALE}" stroke-width="8" stroke-linecap="round"/>'
        for x in (300, 420, 560, 680):
            out += f'<path d="M{x} 520 C{x - 10} 560 {x + 14} 580 {x} 600" fill="none" stroke="{INK}" stroke-width="8" stroke-linecap="round"/><path d="M{x} 520 C{x - 10} 560 {x + 14} 580 {x} 600" fill="none" stroke="{BONE}" stroke-width="3" stroke-linecap="round"/>'
    if stance == 'frost':
        for x, h in ((260, 60), (330, 84), (420, 70), (600, 74), (690, 88), (760, 58)):
            y = 520 - (520 - (330 if x < 300 or x > 740 else 230)) * sy
            out += f'<path d="M{x - 22} {y + 20:.0f} L{x} {y - h:.0f} L{x + 22} {y + 20:.0f} Z" fill="{FROST}" {S} stroke-width="6"/>'
    if stance == 'ember':
        for x in (380, 500, 620):
            out += f'<path d="M{x} {top - 40:.0f} q-14 -26 0 -52 q14 -26 0 -52" fill="none" stroke="{EMBER}" stroke-width="6" stroke-linecap="round" opacity=".8"/>'
    out += '</g>'
    return out

LABEL = {'rest': 'The Wanderer Sovereign · at rest', 'stone': 'Stone stance · crusted in rock plates', 'gale': 'Gale stance · stretched and lifted on the wind', 'ember': 'Ember stance · sunk into the caldera', 'frost': 'Frost stance · iced over'}
def svg(st, w=1000, h=600):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 -60 940 680" width="{w}" height="{h}" style="transform:scaleX(-1)">{slime(st)}</svg>'

html = ['<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#201a15;font:600 22px Barlow,system-ui,sans-serif;color:#ecdfc8;width:2000px}',
        '.big{display:flex;gap:30px;padding:30px}.row{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding:0 30px 30px}',
        '.card{background:#2a221c;border:2px solid #3b322a;border-radius:6px;padding:14px}.card p{margin:8px 4px 0}.card img,.card svg{width:100%;height:auto;display:block}h1{font:400 40px "IM Fell English",serif;margin:30px 30px 0;color:#e8773a}</style>',
        '<h1>Wanderer Sovereign · slime sketches</h1><div class="big">',
        f'<div class="card" style="flex:1.3">{svg("rest", 1000, 620)}<p>{LABEL["rest"]}: four swallowed element cores (the breakable parts), a crown of gold spines, a hunter’s blade drifting inside</p></div>',
        '<div class="card" style="flex:1"><img src="../png/sovereign.png"><p>For comparison: the 4 Nov beast concept (stone pauldron, gale mane, ember vents, frost tail)</p></div></div><div class="row">']
for st in ('stone', 'gale', 'ember', 'frost'): html.append(f'<div class="card">{svg(st, 460, 290)}<p>{LABEL[st]}</p></div>')
html.append('</div>')
open('sheet.html', 'w').write(''.join(html))
for st in LABEL: open(f'slime-{st}.svg', 'w').write(svg(st))
