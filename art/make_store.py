"""Store and library art built on the key art (keyart.py): the charging Gorehorn, the engraved logo, a thrown die.
Writes store/svg/*.svg (editable in Figma) and, with render_store.cjs, store/png/ at Steam's exact sizes."""
import pathlib
import keyart as K
OUT = pathlib.Path(__file__).parent / 'store' / 'svg'; OUT.mkdir(parents=True, exist_ok=True)
CSS = K.font_css()

def defs(uid):
    return (f'<defs><style>{CSS}</style>'
            f'<radialGradient id="{uid}g" cx="62%" cy="50%" r="72%"><stop offset="0" stop-color="#2a2019"/><stop offset=".55" stop-color="#16110e"/><stop offset="1" stop-color="#0a0806"/></radialGradient>'
            f'<pattern id="{uid}h" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><path d="M0 0 V10" stroke="#3b322a" stroke-width="1.2" opacity=".45"/></pattern></defs>')

def ridge(W, H, y, amp, colour='#241c16'):
    """a hatched mountain ridge across the back: Ashfall Ridge"""
    pts, n = [], 14
    for i in range(n + 1):
        x = W * i / n
        yy = y - amp * (0.4 + 0.6 * abs(((i * 7) % 5) - 2) / 2)
        pts.append(f'{x:.0f},{yy:.0f}')
    return f'<polygon points="0,{H} {" ".join(pts)} {W},{H}" fill="{colour}" opacity=".9"/>'

def frame(W, H):
    m = max(10, min(W, H) * 0.03)
    return (f'<rect x="{m}" y="{m}" width="{W-2*m}" height="{H-2*m}" fill="none" stroke="#5a4b3d" stroke-width="{max(1.5, m*0.12):.1f}"/>'
            f'<rect x="{m*1.5}" y="{m*1.5}" width="{W-3*m}" height="{H-3*m}" fill="none" stroke="#3b322a" stroke-width="{max(1, m*0.06):.1f}"/>')

def rule(x1, x2, y, w):
    mid, d = (x1 + x2) / 2, w * 3
    return (f'<path d="M{x1:.0f} {y:.0f} H{mid-d*2.2:.0f} M{mid+d*2.2:.0f} {y:.0f} H{x2:.0f}" stroke="{K.GOLD}" stroke-width="{w:.1f}" stroke-linecap="round" opacity=".9"/>'
            f'<path d="M{mid:.0f} {y-d:.0f} L{mid+d:.0f} {y:.0f} L{mid:.0f} {y+d:.0f} L{mid-d:.0f} {y:.0f}Z" fill="{K.GOLD}"/>')

def page(name, W, H, body, bg=True, framed=True, scene=True):
    uid = name[:3]
    out = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{defs(uid)}'
    if bg:
        out += f'<g id="background"><rect width="{W}" height="{H}" fill="url(#{uid}g)"/>'
        if scene: out += ridge(W, H, H * 0.86, H * 0.16)
        out += f'<rect width="{W}" height="{H}" fill="url(#{uid}h)" opacity=".45"/></g>'
    out += f'<g id="art">{body}</g>'
    if bg and framed: out += f'<g id="frame">{frame(W, H)}</g>'
    (OUT / f'{name}_{W}x{H}.svg').write_text(out + '</svg>')

def landscape(name, W, H):
    S = H * 0.19
    lx = W * 0.065
    body = K.logo(lx, H * 0.40, S) + rule(lx, lx + S * 2.5, H * 0.40 + S * 1.38, max(2, H * 0.006))
    gw = W * 0.66
    body += K.gorehorn_charge(W - gw - W * 0.005, H * 0.5 - gw * 0.30, gw)
    body += K.die(W * 0.29, H * 0.80, H * 0.2, 'C', -18)
    page(name, W, H, body)

for name, W, H in [('header_capsule', 920, 430), ('main_capsule', 1232, 706), ('library_header', 920, 430), ('event_cover', 800, 450)]:
    landscape(name, W, H)

# small capsule: the logo nearly fills it; one die as the mark
W, H = 462, 174
page('small_capsule', W, H, K.die(H * 0.46, H * 0.5, H * 0.5, 'C', -14) + K.logo(H * 0.92, H * 0.40, H * 0.43), framed=False, scene=False)

def portrait(name, W, H):
    S = W * 0.2
    body = K.logo(W / 2, H * 0.12, S, anchor='middle') + rule(W / 2 - S * 1.4, W / 2 + S * 1.4, H * 0.12 + S * 1.36, max(2, W * 0.005))
    gw = W * 1.05
    body += K.gorehorn_charge(-W * 0.02, H * 0.37, gw)
    body += K.die(W * 0.5, H * 0.86, W * 0.17, 'C', -16)
    page(name, W, H, body)
portrait('vertical_capsule', 748, 896)
portrait('library_capsule', 600, 900)

# library hero: art only, lower left kept quiet for Steam's logo
W, H = 3840, 1240
gw = W * 0.44
page('library_hero', W, H, K.gorehorn_charge(W * 0.44, H * 0.5 - gw * 0.33, gw) + K.die(W * 0.40, H * 0.80, H * 0.17, 'C', -18), framed=False)

# library logo: transparent, title only
W, H = 1280, 720
S = H * 0.33
page('library_logo', W, H, K.logo(W / 2, H * 0.36, S, anchor='middle') + rule(W / 2 - S * 1.5, W / 2 + S * 1.5, H * 0.36 + S * 1.38, 6), bg=False)

# page background: dark, quiet, ambient (Steam puts the page on top)
W, H = 1438, 810
page('page_background', W, H, '', framed=False)

# icons: the die with a gold tusk sweeping round it
def icon(W):
    tusk = (f'<path d="M{W*0.16:.0f} {W*0.82:.0f} C{W*0.40:.0f} {W*0.99:.0f} {W*0.88:.0f} {W*0.92:.0f} {W*0.88:.0f} {W*0.40:.0f} '
            f'C{W*0.80:.0f} {W*0.70:.0f} {W*0.50:.0f} {W*0.86:.0f} {W*0.16:.0f} {W*0.82:.0f} Z" fill="{K.GOLDHI}" stroke="{K.INK}" stroke-width="{W*0.025:.1f}"/>')
    return K.die(W * 0.45, W * 0.44, W * 0.56, 'C', -10) + tusk
for W in (256, 184, 1024):
    page({256: 'shortcut_icon', 184: 'app_icon', 1024: 'app_icon_master'}[W], W, W, icon(W), framed=False, scene=False)
print('store art', len(list(OUT.glob('*.svg'))))
