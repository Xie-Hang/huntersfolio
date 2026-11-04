// Renders art/ach2/svg/*.svg to 256x256 JPGs in art/ach2/out/ (locked versions greyed and dimmed, as Steam shows them).
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const SVG = path.join(__dirname, 'svg'), OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 256, height: 256 } });
  for (const f of fs.readdirSync(SVG).filter(f => f.endsWith('.svg'))) {
    const locked = f.includes('_locked');
    const svg = fs.readFileSync(path.join(SVG, f), 'utf8');
    await p.setContent(`<html><body style="margin:0;background:#000"><div style="${locked ? 'filter:grayscale(1) brightness(.6) contrast(.9)' : ''}">${svg}</div></body></html>`);
    await p.waitForTimeout(60);
    await p.screenshot({ path: path.join(OUT, f.replace('.svg', '.jpg')), type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 256, height: 256 } });
  }
  await b.close(); console.log('rendered', fs.readdirSync(OUT).length);
})();
