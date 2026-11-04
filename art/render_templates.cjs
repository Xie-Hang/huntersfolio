const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => { const b = await chromium.launch(); const dir = path.join(__dirname, 'templates');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.svg'))) {
    const svg = fs.readFileSync(path.join(dir, f), 'utf8'); const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/).map(Number);
    const p = await b.newPage({ viewport: { width: w, height: h } }); await p.setContent(`<body style="margin:0">${svg}</body>`);
    await p.evaluate(() => document.fonts.ready); await p.screenshot({ path: path.join(dir, f.replace('.svg', '.png')) }); await p.close();
  } await b.close(); })();
