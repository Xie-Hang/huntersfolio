"""Key art pieces for the store: the Gorehorn mid-charge (woodcut style: solid bone silhouette, ink hatching,
gold tusks) and the logo. Everything is plain SVG so it stays editable in Figma."""
import base64, pathlib
ROOT = pathlib.Path(__file__).parent
FONTS = ROOT / 'fonts'
INK, BONE, BONE2, EMBER, GOLD, GOLDHI, PAGE = '#1a1410', '#ecdfc8', '#c9b89c', '#e8773a', '#e9b949', '#f3cf7a', '#14100d'

def font_css():
    f = lambda n: base64.b64encode((FONTS / n).read_bytes()).decode()
    return (f"@font-face{{font-family:'IM Fell English';src:url(data:font/woff2;base64,{f('im-fell-english-latin-400-normal.woff2')}) format('woff2')}}"
            f"@font-face{{font-family:'IM Fell English';font-style:italic;src:url(data:font/woff2;base64,{f('im-fell-english-latin-400-italic.woff2')}) format('woff2')}}"
            f"@font-face{{font-family:'IM Fell English SC';src:url(data:font/woff2;base64,{f('im-fell-english-sc-latin-400-normal.woff2')}) format('woff2')}}")

# ---- the charging Gorehorn, in a 1000 x 600 box, facing left, head low, front legs reaching ----
BODY = ('M296 230 C320 170 388 124 476 108 C566 92 664 100 744 136 C808 164 848 212 858 266 '
        'C868 320 844 372 792 392 L762 404 C702 420 602 424 522 414 L432 404 '
        'C394 400 366 392 346 380 C318 364 300 340 294 312 Z')
# big wedge head, forehead high, snout low and forward
HEAD = ('M352 196 C320 200 284 214 250 238 C214 262 176 296 146 330 C128 350 116 366 116 384 '
        'C118 402 138 412 164 414 C214 418 270 412 316 398 C356 386 378 360 380 326 C382 280 376 230 352 196 Z')
SNOUT = (112, 382, 20, 32)          # disc at the front: cx, cy, rx, ry
EAR = 'M318 206 L338 142 L372 214 Z'
# legs as (shoulder, knee, hoof) joints; thick upper, thinner lower
LEGS = [((392, 372), (322, 438), (246, 470)),   # near front leg, reaching far forward
        ((456, 392), (430, 456), (372, 500)),   # far front leg
        ((720, 392), (790, 446), (862, 470)),   # far rear leg, pushing back
        ((790, 370), (852, 410), (930, 422))]   # near rear leg, fully extended
BRISTLES = ('M392 132 L404 82 L424 124 L442 70 L462 118 L482 64 L502 112 L524 66 L542 110 L566 70 '
            'L582 110 L608 78 L620 114 L648 90 L656 120 L686 104 L690 128 Z')
TUSK1 = 'M150 404 C128 372 130 324 158 292 C160 334 172 370 196 398 Z'
TUSK2 = 'M204 410 C190 374 198 330 230 302 C230 346 240 380 258 404 Z'
EYE = (266, 286, 10)

def hatch_lines(x0, y0, x1, y1, step, angle_dx):
    return ''.join(f'M{x} {y0} L{x + angle_dx} {y1} ' for x in range(int(x0), int(x1), step))

def gorehorn_charge(x, y, w, ink=INK, bone=BONE, accent=GOLDHI, dust=True):
    s = w / 1000
    uid = f'gc{int(x)}{int(y)}{int(w)}'
    # shading: hatching on the underside and the rear, clipped to the body and head
    shade = hatch_lines(260, 300, 900, 430, 14, -40)
    shade2 = hatch_lines(130, 330, 360, 400, 12, -26)
    g = f'<g transform="translate({x:.1f},{y:.1f}) scale({s:.4f})">'
    g += f'<defs><clipPath id="{uid}b"><path d="{BODY}"/><path d="{HEAD}"/></clipPath>'
    g += f'<linearGradient id="{uid}u" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="1"/></linearGradient>'
    g += f'<mask id="{uid}m"><rect x="0" y="0" width="1000" height="600" fill="url(#{uid}u)"/></mask></defs>'
    if dust:  # speed lines and kicked-up earth behind the rear legs
        for i, (yy, len_) in enumerate([(200, 150), (250, 210), (300, 130), (350, 180)]):
            g += f'<path d="M{880 + i*6} {yy} H{880 + i*6 + len_}" stroke="{bone}" stroke-width="6" stroke-linecap="round" opacity="{0.35 - i*0.05:.2f}"/>'
        for cx, cy, r in [(904, 452, 12), (952, 440, 8), (890, 492, 9), (980, 462, 6), (940, 486, 7), (210, 492, 8), (180, 478, 6)]:
            g += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{BONE2}" opacity=".7"/>'
        g += f'<path d="M150 500 C260 494 380 520 470 512 M820 486 C880 480 940 470 990 474" fill="none" stroke="{BONE2}" stroke-width="5" stroke-linecap="round" opacity=".5"/>'
    for (sh, kn, hf) in LEGS:  # legs behind the body: ink-edged bone, thick thigh, thinner shin, dark hoof
        for wdt, col in ((70, ink), (56, bone)):
            g += f'<path d="M{sh[0]} {sh[1]} L{kn[0]} {kn[1]}" stroke="{col}" stroke-width="{wdt}" stroke-linecap="round"/>'
        for wdt, col in ((44, ink), (30, bone)):
            g += f'<path d="M{kn[0]} {kn[1]} L{hf[0]} {hf[1]}" stroke="{col}" stroke-width="{wdt}" stroke-linecap="round"/>'
        import math
        ang = math.degrees(math.atan2(hf[1] - kn[1], hf[0] - kn[0]))
        # cloven hoof: two dark wedges at the end of the shin, rimmed in bone so they read on the dark page
        g += (f'<g transform="translate({hf[0]},{hf[1]}) rotate({ang:.1f})">'
              f'<path d="M-6 -17 L26 -14 L30 -2 L-6 -1 Z M-6 1 L30 2 L26 14 L-6 17 Z" fill="{ink}" stroke="{BONE2}" stroke-width="3" stroke-linejoin="round"/></g>')
    g += f'<path d="{BRISTLES}" fill="{bone}" stroke="{ink}" stroke-width="8" stroke-linejoin="round"/>'
    g += f'<path d="{BODY}" fill="{bone}" stroke="{ink}" stroke-width="10" stroke-linejoin="round"/>'
    g += f'<path d="{EAR}" fill="{bone}" stroke="{ink}" stroke-width="9" stroke-linejoin="round"/>'
    g += f'<path d="{HEAD}" fill="{bone}" stroke="{ink}" stroke-width="10" stroke-linejoin="round"/>'
    g += f'<ellipse cx="{SNOUT[0]}" cy="{SNOUT[1]}" rx="{SNOUT[2]}" ry="{SNOUT[3]}" fill="{BONE2}" stroke="{ink}" stroke-width="8"/>'
    g += f'<ellipse cx="{SNOUT[0]-4}" cy="{SNOUT[1]-10}" rx="4" ry="7" fill="{ink}"/><ellipse cx="{SNOUT[0]-4}" cy="{SNOUT[1]+10}" rx="4" ry="7" fill="{ink}"/>'
    g += f'<g clip-path="url(#{uid}b)"><path d="{shade}{shade2}" stroke="{ink}" stroke-width="5" stroke-linecap="round"/>'
    g += f'<rect x="0" y="0" width="1000" height="600" fill="{ink}" opacity=".85" mask="url(#{uid}m)"/></g>'
    # fur: short strokes along the spine and the shoulder, following the form
    for k in range(9):
        x0 = 420 + k * 46
        g += f'<path d="M{x0} {150 + abs(k-4)*6} q10 22 4 44" fill="none" stroke="{ink}" stroke-width="5" stroke-linecap="round" opacity=".6"/>'
    g += f'<path d="M338 236 C372 260 392 300 392 344 M360 222 C398 252 418 296 420 344" fill="none" stroke="{ink}" stroke-width="6" stroke-linecap="round" opacity=".7"/>'
    g += f'<circle cx="{EYE[0]}" cy="{EYE[1]}" r="{EYE[2]}" fill="{ink}"/><path d="M244 270 C258 258 278 256 294 262" fill="none" stroke="{ink}" stroke-width="8" stroke-linecap="round"/>'
    g += f'<path d="M166 404 C200 396 236 396 268 404" fill="none" stroke="{ink}" stroke-width="6" stroke-linecap="round"/>'
    for d in (TUSK1, TUSK2):
        g += f'<path d="{d}" fill="{accent}" stroke="{ink}" stroke-width="8" stroke-linejoin="round"/>'
    return g + '</g>'

def die(cx, cy, size, face='C', rot=0, ink=INK, bone=BONE, edge='#8c7a62', outline=True):
    r, e = size * 0.14, size * 0.08
    g = f'<g transform="translate({cx:.1f},{cy:.1f}) rotate({rot})">'
    if outline: g += f'<rect x="{-size/2 - size*.05}" y="{-size/2 - size*.05}" width="{size*1.1}" height="{size*1.1 + e}" rx="{r*1.2}" fill="{ink}"/>'
    g += f'<rect x="{-size/2}" y="{-size/2 + e}" width="{size}" height="{size}" rx="{r}" fill="{edge}"/>'
    g += f'<rect x="{-size/2}" y="{-size/2}" width="{size}" height="{size}" rx="{r}" fill="{bone}"/>'
    if face == 'C': g += f'<circle r="{size*0.2}" fill="{ink}"/>'
    elif face == 'T':
        a = size * 0.23
        g += f'<path d="M0 {-a*1.05} L{a*1.12} {a*0.86} L{-a*1.12} {a*0.86}Z" fill="{ink}"/>'
    return g + '</g>'

def logo(x, y, S, anchor='start', hunters=BONE, folio=EMBER, rule=GOLD):
    """Stacked: small caps HUNTER'S over a large 'Folio' in an engraved old-style face, with a gold rule."""
    t = (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="IM Fell English SC" font-size="{S*0.42:.1f}" letter-spacing="{S*0.06:.2f}" fill="{hunters}">Hunter’s</text>'
         f'<text x="{x}" y="{y + S*1.0:.1f}" text-anchor="{anchor}" font-family="IM Fell English" font-size="{S*1.32:.1f}" fill="{folio}">Folio</text>')
    return t
