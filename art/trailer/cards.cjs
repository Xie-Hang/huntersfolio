// Title cards and the end card, 1920×1080 PNG:  node art/trailer/cards.cjs <dir>/cards   (needs art/store/png from render_store.cjs)
const { chromium } = require('playwright'); const path = require('path');
const OUTD = process.argv[2] || path.join(__dirname, 'cards'); require('fs').mkdirSync(OUTD, { recursive: true });
const F = path.join(__dirname, '..', 'fonts'), LOGO = path.join(__dirname, '..', 'store', 'png', 'library_logo_1280x720.png');
const CARDS = {
  c1: ['Every monster tells you', 'what it will do next.'],
  c2: ['Answer it with four dice.'],
  c3: ['Break its parts.', 'Forge what the next hunt needs.'],
  c4: ['Forge what the next hunt needs.'],
  c5: ['Every hunt is a different problem.'],
  end: null
};
const css = `@font-face{font-family:Fell;src:url(file://${F}/im-fell-english-latin-400-normal.woff2)}
@font-face{font-family:FellSC;src:url(file://${F}/im-fell-english-sc-latin-400-normal.woff2)}
html,body{margin:0;width:1920px;height:1080px;overflow:hidden}
body{background:radial-gradient(ellipse at 50% 46%,#241c16 0%,#16110d 55%,#0c0a08 100%);display:flex;align-items:center;justify-content:center;flex-direction:column;color:#ecdfc8}
.t{font-family:Fell,serif;font-size:96px;line-height:1.12;text-align:center;letter-spacing:.005em}
.rule{margin-top:46px;width:520px;height:22px;position:relative}
.rule:before,.rule:after{content:"";position:absolute;top:10px;height:2px;width:232px;background:#e9b949;opacity:.9}
.rule:before{left:0}.rule:after{right:0}
.rule i{position:absolute;left:250px;top:0;width:16px;height:16px;background:#e9b949;transform:rotate(45deg);margin-top:2px}
.logo{width:1180px;margin-top:-40px}
.cta{font-family:FellSC,serif;font-size:64px;letter-spacing:.14em;color:#f3cf7a;margin-top:-30px}
.sub{font-family:Fell,serif;font-size:36px;color:#c9b89c;margin-top:26px}`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  for (const [k, lines] of Object.entries(CARDS)) {
    const body = lines ? `<div class="t">${lines.join('<br>')}</div><div class="rule"><i></i></div>`
      : `<img class="logo" src="file://${LOGO}"><div class="cta">Wishlist on Steam</div><div class="sub">A turn-based monster hunt, played with four dice.</div>`;
    require('fs').writeFileSync(path.join(OUTD, 'c.html'), `<!doctype html><meta charset=utf-8><style>${css}</style>${body}`); await p.goto('file://' + path.join(OUTD, 'c.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(OUTD, `${k}.png`) });
  }
  await b.close();
})();
