// Rasterise every svg/*.svg to an exact-size image in png/ (JPG for the app icon, which Steam wants as .jpg).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch(); fs.mkdirSync(path.join(__dirname, 'png'), { recursive: true });
  for (const f of fs.readdirSync(path.join(__dirname, 'svg'))) {
    const svg = fs.readFileSync(path.join(__dirname, 'svg', f), 'utf8');
    const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/).map(Number);
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const jpg = f.startsWith('app_icon_184');
    await p.setContent(`<html><body style="margin:0;background:${jpg ? '#14100d' : 'transparent'}">${svg}</body></html>`);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(100);
    const out = path.join(__dirname, 'png', f.replace('.svg', jpg ? '.jpg' : '.png'));
    await p.screenshot({ path: out, omitBackground: !jpg, type: jpg ? 'jpeg' : 'png', quality: jpg ? 95 : undefined, clip: { x: 0, y: 0, width: w, height: h } });
    await p.close(); console.log(path.basename(out), w + 'x' + h);
  }
  await b.close();
})();
