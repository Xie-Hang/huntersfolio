# The nine monsters beyond Ashfall Ridge (Tier 2, Tier 3, apex), drawn in the in-game plate style:
# a 1000 x 600 space, ground at y 530, facing LEFT (the game mirrors plates to face right), bone fills,
# heavy ink edges, hatching on the shadow side, one accent colour per element.
# These are concept drawings: one pose each, no telegraph poses yet (those follow each monster's design).
#   python3 art/monsters/make_monsters.py  → art/monsters/svg/<id>.svg   (render with art/monsters/render.cjs)
import math, pathlib

OUT = pathlib.Path(__file__).parent / 'svg'; OUT.mkdir(exist_ok=True)
INK, BONE, BONE2, FAR = '#1a1410', '#ecdfc8', '#c9b89c', '#b9a88c'
GOLD, GOLDHI, EMBER, GALE, FROST, MUD = '#e9b949', '#f3cf7a', '#e8773a', '#8fc3c9', '#b9d3f0', '#5b4532'
STONE, MOSS, ASH = '#a99f90', '#7f9159', '#6e6257'
_n = [0]


def uid():
    _n[0] += 1
    return f'c{_n[0]}'


def part(d, fill=BONE, hatch=True, sw=10, hx=(0, 1000), hy=(0, 600), step=14, slant=-30, below=None):
    """A filled shape with an ink edge and hatching in its lower part (below=y where the shadow starts)."""
    out = f'<path d="{d}" fill="{fill}" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round"/>'
    if hatch:
        c = uid(); y0 = below if below is not None else hy[0]
        lines = ''.join(f'M{x} {y0} l{slant} {hy[1] - y0}' for x in range(hx[0], hx[1] + 60, step))
        out = (f'<clipPath id="{c}"><path d="{d}"/></clipPath>' + out.replace('/>', '/>', 1) +
               f'<path d="{lines}" stroke="{INK}" stroke-width="5" stroke-linecap="round" clip-path="url(#{c})"/>'
               f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round"/>')
    return out


def limb(x1, y1, x2, y2, w=44, fill=BONE, ink=INK):
    return (f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{ink}" stroke-width="{w + 14}" stroke-linecap="round"/>'
            f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{fill}" stroke-width="{w}" stroke-linecap="round"/>')


def neck(d, w=46, fill=BONE):
    return (f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{w + 14}" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="{fill}" stroke-width="{w}" stroke-linecap="round"/>')


def foot(x, y=530, w=60, claws=3):
    out = f'<path d="M{x - w / 2} {y} q{w / 2} -26 {w} 0 Z" fill="{INK}"/>'
    for i in range(claws):
        cx = x - w / 2 + 6 + i * (w - 12) / max(1, claws - 1)
        out += f'<path d="M{cx} {y - 2} l-10 6" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
    return out


def eye(x, y, r=11, color=INK):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}"/><circle cx="{x - r * .35}" cy="{y - r * .35}" r="{r * .3}" fill="{BONE}"/>'


def spikes(pts, fill, sw=7):
    return ''.join(f'<path d="M{a} L{b} L{c} Z" fill="{fill}" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round"/>' for a, b, c in pts)


def bolt(x, y, s=1.0):
    return f'<path transform="translate({x} {y}) scale({s})" d="M0 0 L-26 46 H-6 L-20 90 L24 34 H4 L18 0 Z" fill="{GOLDHI}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'


def ground():
    return '<path d="M60 532 H950" stroke="#4d4136" stroke-width="5" stroke-linecap="round"/>'


# ---------- Tier 2 · Mirewood ----------
def bogjaw():
    body = 'M300 420 C300 300 420 228 584 228 C748 228 866 300 872 420 C876 474 842 506 782 508 L380 508 C330 504 300 470 300 420 Z'
    head = 'M110 432 C110 352 196 312 300 312 C366 312 410 350 418 402 C424 456 384 498 300 502 C206 506 110 486 110 432 Z'
    out = limb(780, 430, 812, 512, 70, FAR) + foot(818, w=76, claws=4)
    out += part(body, BONE, hx=(300, 880), hy=(228, 510), below=380)
    out += ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{STONE}" stroke="{INK}" stroke-width="7"/>' for x, y, r in
                   [(470, 276, 20), (548, 250, 26), (632, 258, 20), (712, 284, 24), (590, 312, 15), (790, 330, 16)])
    out += f'<path d="M440 300 C470 286 500 292 516 310 M660 300 C690 292 724 302 740 324" fill="none" stroke="{MOSS}" stroke-width="12" stroke-linecap="round"/>'
    out += limb(360, 452, 330, 514, 56, BONE) + foot(326, w=70, claws=4)
    out += f'<ellipse cx="268" cy="474" rx="84" ry="34" fill="{BONE2}" stroke="{INK}" stroke-width="8"/>'
    out += part(head, BONE, hx=(110, 420), hy=(312, 504), below=430)
    out += f'<path d="M122 444 C200 462 310 462 414 430" fill="none" stroke="{INK}" stroke-width="9" stroke-linecap="round"/>'
    out += ''.join(f'<path d="M{x} {446 + (x - 140) * -.02:.0f} l9 14 l9 -14" fill="{BONE}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>' for x in range(150, 400, 34))
    out += f'<circle cx="246" cy="318" r="30" fill="{BONE}" stroke="{INK}" stroke-width="8"/>' + eye(240, 316, 12)
    out += f'<circle cx="336" cy="322" r="24" fill="{BONE}" stroke="{INK}" stroke-width="8"/>' + eye(332, 320, 9)
    return out


def duskheron():
    body = 'M470 300 C490 236 580 210 670 222 C760 234 820 284 820 340 C820 394 760 420 670 420 C580 420 490 384 470 300 Z'
    out = limb(620, 410, 600, 524, 18, FAR) + limb(680, 410, 700, 524, 18, BONE2) + foot(596, w=50) + foot(704, w=50)
    out += part(f'M790 300 C860 290 930 300 960 330 C920 336 880 350 820 366 Z', BONE, hatch=False, sw=8)
    out += neck('M520 300 C470 250 470 190 420 160 C380 136 340 140 312 160', 40)
    out += neck('M520 340 C460 360 420 400 380 400 C350 400 330 392 312 380', 40)
    out += part(body, BONE, hx=(470, 830), hy=(210, 420), below=330)
    out += f'<path d="M560 260 C640 240 730 250 790 290 M570 290 C650 276 720 284 780 312" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round" opacity=".6"/>'
    for (hx, hy, up) in [(300, 158, True), (300, 380, False)]:
        out += part(f'M{hx - 36} {hy} C{hx - 36} {hy - 30} {hx - 8} {hy - 44} {hx + 18} {hy - 40} C{hx + 44} {hy - 34} {hx + 48} {hy - 6} {hx + 36} {hy + 18} C{hx + 20} {hy + 34} {hx - 26} {hy + 30} {hx - 36} {hy} Z', BONE, hatch=False, sw=8)
        out += f'<path d="M{hx - 30} {hy - 6} L{hx - 170} {hy + 8} L{hx - 30} {hy + 16} Z" fill="{BONE2}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>'
        out += spikes([(f'{hx + 10} {hy - 38}', f'{hx + 40} {hy - 86}', f'{hx + 34} {hy - 30}'), (f'{hx + 26} {hy - 34}', f'{hx + 70} {hy - 66}', f'{hx + 40} {hy - 20}')], GALE, 6)
        out += eye(hx, hy - 8, 8)
    return out


def emberwhelk():
    foot_d = 'M160 500 C200 440 300 420 420 430 L860 440 C900 446 916 480 900 508 L200 512 C170 512 152 508 160 500 Z'
    out = part(foot_d, BONE2, hx=(150, 920), hy=(420, 514), below=470)
    out += neck('M250 446 C230 400 210 360 196 330', 18, BONE2) + neck('M282 444 C276 396 270 356 268 324', 18, BONE2)
    out += f'<circle cx="194" cy="322" r="14" fill="{BONE}" stroke="{INK}" stroke-width="6"/><circle cx="268" cy="316" r="14" fill="{BONE}" stroke="{INK}" stroke-width="6"/>' + eye(194, 322, 6) + eye(268, 316, 6)
    for i in range(4):  # gills: the regrowing frill behind the head
        x = 340 + i * 26
        out += f'<path d="M{x} 438 C{x - 20} 390 {x + 10} 360 {x + 26} 380 C{x + 34} 400 {x + 22} 420 {x + 16} 436 Z" fill="{EMBER}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
    shell = 'M470 440 C440 330 520 200 660 196 C800 192 900 290 880 400 C870 430 850 440 830 442 Z'
    out += part(shell, BONE, hx=(440, 900), hy=(190, 446), below=360)
    cx, cy = 680, 330
    spiral = ' '.join(f'{"M" if i == 0 else "L"}{cx + (10 + i * 1.5) * math.cos(i * .22):.0f} {cy + (10 + i * 1.5) * math.sin(i * .22):.0f}' for i in range(0, 92))
    out += f'<path d="{spiral}" fill="none" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>'
    out += f'<path d="M560 250 l24 30 l-10 20 l30 16 M770 240 l-16 34 l22 14 M820 360 l-30 6 l-6 26" fill="none" stroke="{EMBER}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'
    return out


def mistglass():
    def stag(dx, op):
        g = f'<g transform="translate({dx} 0)" opacity="{op}">'
        g += limb(420, 380, 400, 520, 22, FROST) + limb(470, 384, 486, 520, 22, FROST) + limb(700, 384, 690, 520, 22, FROST) + limb(750, 380, 776, 520, 22, FROST)
        g += part('M380 330 C400 270 500 250 620 252 C740 254 800 290 800 340 C800 380 760 400 620 400 C500 400 400 392 380 330 Z', FROST, hx=(380, 810), hy=(250, 404), below=350)
        g += f'<path d="M440 290 L520 340 L600 280 L680 340 L760 300" fill="none" stroke="#ffffff" stroke-width="4" opacity=".7"/>'
        g += neck('M420 320 C390 270 360 230 330 210', 40, FROST)
        g += part('M260 214 C270 180 320 168 350 184 C378 200 372 236 340 246 C310 254 270 250 258 236 Z', FROST, hatch=False, sw=8)
        g += spikes([('330 182', '300 90', '346 170'), ('300 96', '262 70', '308 120'), ('344 176', '392 96', '356 186'), ('380 120', '420 100', '372 138')], '#ffffff', 6)
        g += eye(300, 212, 8)
        return g + '</g>'
    return stag(150, .25) + stag(80, .4) + stag(0, 1)


# ---------- Tier 3 · Stormspire ----------
def monolith():
    out = limb(420, 380, 400, 516, 74, STONE) + limb(640, 380, 670, 516, 74, STONE)
    out += f'<rect x="352" y="500" width="110" height="30" rx="6" fill="{INK}"/><rect x="616" y="500" width="110" height="30" rx="6" fill="{INK}"/>'
    torso = 'M360 400 L340 200 L420 120 L640 120 L720 200 L700 400 Z'
    out += part(torso, STONE, hx=(340, 730), hy=(120, 404), below=300, step=16)
    out += f'<circle cx="530" cy="270" r="60" fill="{GOLD}" opacity=".35"/><path d="M530 220 L572 270 L530 320 L488 270 Z" fill="{GOLDHI}" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>'
    for d in ['M352 196 L430 130 L500 140 L470 250 L360 260 Z', 'M562 140 L630 130 L706 196 L700 262 L590 250 Z', 'M360 286 L470 290 L470 392 L366 396 Z', 'M592 290 L698 286 L694 396 L590 392 Z']:
        out += part(d, BONE2, hatch=False, sw=8)
    out += limb(350, 220, 250, 420, 64, STONE) + f'<rect x="206" y="416" width="90" height="70" rx="10" fill="{STONE}" stroke="{INK}" stroke-width="9"/>'
    out += part('M468 120 L470 60 L590 60 L592 120 Z', STONE, hatch=False, sw=9) + f'<rect x="496" y="80" width="68" height="14" rx="4" fill="{GOLDHI}" stroke="{INK}" stroke-width="5"/>'
    return out


def stormroc():
    wing = 'M560 260 C480 150 360 70 160 60 C230 110 270 150 300 190 C230 190 180 210 140 240 C240 250 330 270 420 320 Z'
    back = lambda svg: f'<g transform="translate(1064 26) scale(-0.9 0.9)">{svg}</g>'
    out = back(part(wing.replace('160 60', '230 40'), FAR, hatch=False, sw=9))
    out += neck('M620 430 L600 500', 16, BONE2) + neck('M680 430 L690 500', 16, BONE2)
    out += ''.join(f'<path d="M{x} 500 l-22 22 M{x} 500 l4 28 M{x} 500 l22 18" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>' for x in (600, 690))
    out += part('M780 330 C860 320 940 350 970 400 C910 398 860 410 800 430 Z', BONE, hatch=False, sw=8)
    out += part('M460 340 C480 260 580 230 680 240 C780 250 820 300 820 360 C820 420 760 450 660 450 C560 450 470 420 460 340 Z', BONE, hx=(460, 830), hy=(230, 452), below=360)
    out += back(part(wing, BONE, hx=(140, 570), hy=(50, 330), below=200) + f'<path d="M300 120 C380 140 450 190 520 250 M250 170 C340 190 420 230 480 280 M220 220 C300 230 380 260 440 300" fill="none" stroke="{INK}" stroke-width="5" opacity=".55"/>')
    out += part('M380 320 C380 280 410 254 450 254 C490 254 510 290 504 326 C498 356 470 372 440 370 C404 368 380 350 380 320 Z', BONE, hatch=False, sw=9)
    out += f'<path d="M384 310 L320 334 L380 350 C372 340 374 324 384 310 Z" fill="{GOLD}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>'
    out += bolt(430, 168, .8) + bolt(474, 176, .62) + bolt(392, 186, .55)
    out += eye(420, 312, 10, EMBER)
    return out


def slagwyrm():
    spine = [(860, 470), (760, 420), (660, 470), (560, 430), (460, 470), (380, 420), (320, 330), (290, 250)]
    d = 'M' + ' L'.join(f'{x} {y}' for x, y in spine)
    out = f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="104" stroke-linecap="round" stroke-linejoin="round"/>'
    out += f'<path d="{d}" fill="none" stroke="{BONE2}" stroke-width="84" stroke-linecap="round" stroke-linejoin="round"/>'
    out += f'<path d="{d}" fill="none" stroke="{EMBER}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 38"/>'
    for (x, y) in spine[1:-2]:  # molten armour plates
        out += f'<path d="M{x - 40} {y - 30} L{x} {y - 66} L{x + 40} {y - 30} L{x + 24} {y - 6} L{x - 24} {y - 6} Z" fill="{ASH}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/><path d="M{x - 12} {y - 40} l10 10 l12 -10" fill="none" stroke="{EMBER}" stroke-width="5" stroke-linecap="round"/>'
    out += part('M200 250 C200 200 250 176 300 180 C350 184 370 220 362 256 C354 290 320 306 280 304 C230 302 200 286 200 250 Z', BONE, hatch=False, sw=9)
    out += f'<path d="M208 258 L140 268 L210 284 Z" fill="{BONE2}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>'
    out += spikes([('300 184', '326 112', '334 196'), ('270 182', '262 120', '296 186')], ASH, 7)
    out += eye(262, 236, 11, EMBER)
    out = f'<path d="M840 440 C900 460 940 490 968 524 C930 512 890 500 840 500 Z" fill="{BONE2}" stroke="{INK}" stroke-width="9" stroke-linejoin="round"/>' + out
    return out


def gorhydra():
    out = limb(560, 440, 540, 516, 60, FAR) + limb(760, 440, 790, 516, 60, FAR) + foot(536, w=80) + foot(796, w=80)
    out += part('M800 380 C860 380 930 420 960 480 C900 470 850 460 800 460 Z', BONE, hatch=False, sw=8)
    necks = [('M560 360 C500 300 470 220 430 170', (400, 160)), ('M580 380 C500 360 420 330 360 320', (320, 316)), ('M590 410 C520 430 450 450 390 450', (350, 450))]
    for d, _ in necks:
        out += neck(d, 46, BONE)
    out += part('M520 400 C520 320 600 280 690 282 C790 284 850 340 850 410 C850 470 790 500 690 500 C600 500 520 470 520 400 Z', BONE, hx=(520, 860), hy=(280, 502), below=410)
    out += spikes([('600 290', '630 230', '650 288'), ('660 284', '700 220', '714 290'), ('726 292', '770 240', '780 306')], FROST)
    for _, (hx, hy) in necks:
        out += part(f'M{hx - 50} {hy} C{hx - 50} {hy - 30} {hx - 20} {hy - 46} {hx + 14} {hy - 42} C{hx + 46} {hy - 36} {hx + 54} {hy - 6} {hx + 42} {hy + 18} C{hx + 26} {hy + 34} {hx - 30} {hy + 34} {hx - 50} {hy} Z', BONE, hatch=False, sw=8)
        out += f'<path d="M{hx - 48} {hy + 4} C{hx - 20} {hy + 14} {hx + 10} {hy + 14} {hx + 30} {hy + 8}" fill="none" stroke="{INK}" stroke-width="5"/>'
        out += spikes([(f'{hx} {hy - 40}', f'{hx + 20} {hy - 82}', f'{hx + 30} {hy - 36}')], FROST, 6)
        out += eye(hx - 10, hy - 12, 8)
    return out


# ---------- Apex · the Caldera ----------
def sovereign():
    out = limb(700, 400, 730, 516, 66, FAR) + foot(736, w=86, claws=4)
    out += f'<path d="M820 360 C880 330 930 350 960 400" fill="none" stroke="{INK}" stroke-width="40" stroke-linecap="round"/><path d="M820 360 C880 330 930 350 960 400" fill="none" stroke="{BONE}" stroke-width="24" stroke-linecap="round"/>'
    out += spikes([('900 340', '930 290', '940 352'), ('936 360', '976 330', '960 382')], FROST, 6)
    out += part('M340 360 C350 250 460 200 600 200 C740 200 840 260 840 360 C840 440 760 470 600 470 C460 470 340 450 340 360 Z', BONE, hx=(340, 850), hy=(200, 474), below=380)
    for i, x in enumerate((560, 630, 700)):  # ember vents along the back
        out += f'<path d="M{x - 18} 218 L{x - 10} 180 H{x + 10} L{x + 18} 214 Z" fill="{BONE2}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/><ellipse cx="{x}" cy="180" rx="9" ry="4" fill="{EMBER}"/>'
    out += part('M420 230 L520 214 L540 300 L440 320 Z', STONE, hatch=False, sw=8)  # stone pauldron
    out += limb(440, 400, 400, 516, 66, BONE) + foot(394, w=86, claws=4)
    mane = 'M440 220 C400 170 330 160 280 190 C250 230 250 300 280 350 C330 380 400 360 440 320 Z'
    out += part(mane, GALE, hatch=False, sw=9)
    out += f'<path d="M300 200 C340 230 380 260 420 300 M280 260 C320 280 360 300 400 330 M320 180 C350 210 390 230 430 260" fill="none" stroke="{INK}" stroke-width="5" opacity=".6"/>'
    out += part('M180 300 C180 250 230 220 280 226 C330 232 350 270 344 310 C338 350 300 370 256 368 C210 366 180 340 180 300 Z', BONE, hatch=False, sw=9)
    out += f'<path d="M184 318 C210 330 250 334 290 326" fill="none" stroke="{INK}" stroke-width="6"/>'
    out += spikes([('250 230', '220 140', '280 224'), ('290 230', '320 150', '316 240'), ('226 150', '200 120', '240 170')], GOLDHI, 7)
    out += eye(236, 286, 12, EMBER)
    return out


MONSTERS = {'bogjaw': bogjaw, 'duskheron': duskheron, 'emberwhelk': emberwhelk, 'mistglass': mistglass,
            'monolith': monolith, 'stormroc': stormroc, 'slagwyrm': slagwyrm, 'gorhydra': gorhydra, 'sovereign': sovereign}
for mid, fn in MONSTERS.items():
    body = fn()
    # facing left like the plates; the export mirrors it to face right, as the game shows them
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 40 940 520" width="940" height="520">'
           f'<g transform="translate(1060 0) scale(-1 1)">{ground()}{body}</g></svg>')
    (OUT / f'{mid}.svg').write_text(svg)
print(len(MONSTERS), 'monsters')
