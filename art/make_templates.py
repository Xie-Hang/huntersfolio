"""Exact-size layout templates for the Steam art, as SVG with named layers for Figma:
'guides' (margins, zones, labels: hide or delete before export) and 'sketch' (where things go)."""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import importlib.util
spec = importlib.util.spec_from_file_location('m', pathlib.Path(__file__).parent / 'make_svgs.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
C, place, die, FONT_CSS = m.C, m.place, m.die, m.FONT_CSS
OUT = pathlib.Path(__file__).parent / 'templates'; OUT.mkdir(exist_ok=True)

def zone(x, y, w, h, colour, label, size):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{colour}" fill-opacity=".07" stroke="{colour}" stroke-width="{max(1.5, size/12):.1f}" stroke-dasharray="{size/2:.0f} {size/3:.0f}"/>'
            f'<text x="{x + size*.5}" y="{y + size*1.2}" font-family="Barlow" font-weight="600" font-size="{size}" fill="{colour}">{label}</text>')

def tpl(name, W, H, zones, sketch, note):
    s = max(11, min(W, H) * 0.035)  # label size
    mg = round(min(W, H) * 0.04)
    guides = f'<rect x="{mg}" y="{mg}" width="{W-2*mg}" height="{H-2*mg}" fill="none" stroke="#6d8bb0" stroke-width="{max(1, s/14):.1f}"/>'
    guides += ''.join(zone(*z, s) for z in zones)
    guides += (f'<text x="{W/2}" y="{H - mg - s*0.4}" text-anchor="middle" font-family="Barlow" font-size="{s*0.8:.1f}" fill="#6d8bb0">'
               f'{name} · {W}×{H} · {note}</text>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><defs><style>{FONT_CSS}</style></defs>'
           f'<g id="background"><rect width="{W}" height="{H}" fill="{C["bg"]}"/></g>'
           f'<g id="sketch" opacity=".55">{sketch}</g><g id="guides">{guides}</g></svg>')
    (OUT / f'{name}_{W}x{H}.svg').write_text(svg)

GOLD, EMBER, BLUE = C['gold'], C['ember'], '#6d8bb0'
def logo_box(x, y, w, h): return (x, y, w, h, EMBER, 'Logo')
def focal(x, y, w, h, label='Monster: the charge'): return (x, y, w, h, GOLD, label)
def title_sketch(x, y, S, anchor='start'):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="Barlow" font-weight="600" font-size="{S*0.5:.0f}" fill="{C["bone"]}">Hunter’s</text>'
            f'<text x="{x}" y="{y + S*0.95:.0f}" text-anchor="{anchor}" font-family="Barlow" font-weight="600" font-size="{S*1.15:.0f}" fill="{C["ember"]}">Folio</text>')

# landscape: header, main, library header, event cover
for name, W, H in [('header_capsule', 920, 430), ('main_capsule', 1232, 706), ('library_header', 920, 430), ('event_cover', 800, 450)]:
    sk = title_sketch(W*0.07, H*0.42, H*0.2) + place('gorehorn', W*0.40, H*0.22, W*0.56, weight=2.6) + die(W*0.42, H*0.74, H*0.18, 'C', -16)
    tpl(name, W, H, [logo_box(W*0.05, H*0.22, W*0.31, H*0.52), focal(W*0.38, H*0.10, W*0.58, H*0.80), (W*0.34, H*0.60, W*0.17, H*0.30, BLUE, 'Die')], sk,
        'logo left third, monster charging toward it, die between')

# small capsule: the logo nearly fills it
W, H = 462, 174
tpl('small_capsule', W, H, [(W*0.04, H*0.12, W*0.22, H*0.76, BLUE, 'Mark'), logo_box(W*0.29, H*0.10, W*0.67, H*0.80)],
    die(W*0.15, H*0.5, H*0.5, 'C', -12) + title_sketch(W*0.32, H*0.42, H*0.38), 'logo fills ~70%; one mark at most')

# portrait: vertical capsule, library capsule
for name, W, H in [('vertical_capsule', 748, 896), ('library_capsule', 600, 900)]:
    sk = title_sketch(W/2, H*0.14, W*0.19, 'middle') + place('gorehorn', W*0.04, H*0.36, W*0.92, weight=2.6) + die(W*0.5, H*0.85, W*0.16, 'C', -14)
    tpl(name, W, H, [logo_box(W*0.12, H*0.05, W*0.76, H*0.24), focal(W*0.05, H*0.32, W*0.90, H*0.44), (W*0.36, H*0.77, W*0.28, H*0.17, BLUE, 'Die')], sk,
        'logo top, monster centre, die low')

# library hero: art only; Steam lays the library logo over the lower left
W, H = 3840, 1240
tpl('library_hero', W, H, [(W*0.03, H*0.52, W*0.30, H*0.38, BLUE, 'Steam puts the library logo here: keep it quiet'), focal(W*0.36, H*0.14, W*0.60, H*0.72, 'Monster and scene (no logo, no text)')],
    place('gorehorn', W*0.45, H*0.18, W*0.40, weight=2.4), 'art only, extend the scene wide')

# library logo: transparent, title only
W, H = 1280, 720
tpl('library_logo', W, H, [logo_box(W*0.06, H*0.10, W*0.88, H*0.80)], title_sketch(W/2, H*0.38, H*0.34, 'middle'), 'transparent PNG, title only')

# icons
for name, W in [('shortcut_icon', 256), ('app_icon', 184)]:
    tpl(name, W, W, [(W*0.10, W*0.10, W*0.80, W*0.80, BLUE, 'Mark')], die(W*0.46, W*0.46, W*0.56, 'C', -10), 'one bold mark, no text')
print('templates', len(list(OUT.glob('*.svg'))))
