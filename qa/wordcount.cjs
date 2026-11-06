const { chromium } = require('playwright'); const fs = require('fs');
// Words on every screen (Nov 2026 text audit). Run against a built game:
//   node qa/wordcount.cjs http://localhost:4175/ out-dir
// Uses qa/fixtures/midgame.json (9 hunts, rank F, everything shown) and prints each screen's visible word count.
const URL = process.argv[2] || 'http://localhost:4175/';
const OUT = (process.argv[3] || 'wordcount') + '/'; fs.mkdirSync(OUT, { recursive: true });
const words = t => (t.match(/[A-Za-z0-9’'×+−%\/.-]+/g) || []).filter(w => /[A-Za-z0-9]/.test(w)).length;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message, (e.stack || '').split('\n').slice(0, 8).join(' | ')));
  const st = JSON.parse(fs.readFileSync(__dirname + '/fixtures/midgame.json', 'utf8'));
  const res = [];
  async function measure(name) {
    await p.evaluate(() => document.querySelectorAll('.coach').forEach(c => c.remove()));
    await p.waitForTimeout(150);
    const r = await p.evaluate(() => {
      const vis = el => { const s = getComputedStyle(el); const rc = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && rc.width > 0 && rc.height > 0; };
      const regions = [...document.querySelectorAll('main > *, main section.panel, main .panel, header.top')].filter(vis);
      const seen = new Set(); const out = [];
      for (const el of regions) { if ([...seen].some(s => s.contains(el))) continue; seen.add(el);
        const label = el.getAttribute('aria-label') || el.querySelector('h2,h3')?.textContent?.trim()?.slice(0, 40) || el.className.toString().slice(0, 40);
        out.push({ label, text: el.innerText }); }
      // only text in the first viewport
      const all = document.body.innerText;
      return { all, out, h: document.documentElement.scrollHeight };
    });
    const total = words(r.all);
    res.push({ name, total, height: r.h, regions: r.out.map(x => ({ label: x.label, words: words(x.text) })) });
    await p.screenshot({ path: OUT + name + '.png', fullPage: true });
    fs.writeFileSync(OUT + name + '.txt', r.all);
    console.log(name, total, 'words', r.h + 'px');
  }
  await p.goto(URL);
  await p.evaluate(st => { localStorage.setItem('huntersfolio-save', JSON.stringify(st.save)); localStorage.setItem('huntersfolio-settings', JSON.stringify({ showAll: true, tips: false })); localStorage.removeItem('huntersfolio-hunt'); }, st);
  await p.reload(); await p.waitForTimeout(800); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await measure('board-grid');
  await p.click('.mcard[data-id="gorehorn"]'); await p.waitForTimeout(500); await measure('monster-parts');
  await p.click('[data-tab="habits"]'); await p.waitForTimeout(300); await measure('monster-habits');
  await p.click('[data-coach="nav-forge"]'); await p.waitForTimeout(500); await measure('forge');
  await p.click('[data-coach="nav-shop"]'); await p.waitForTimeout(500); await measure('shop-buy');
  await p.click('role=tab[name="Craft items"]'); await p.waitForTimeout(300); await measure('shop-craft');
  await p.click('role=tab[name="Sell"]'); await p.waitForTimeout(300); await measure('shop-sell');
  // hunt, full layer
  await p.evaluate(st => { localStorage.setItem('huntersfolio-hunt', JSON.stringify(st.hunt)); }, st);
  await p.reload(); await p.waitForTimeout(800); await measure('hunt-full');
  // result (win)
  await p.evaluate(() => { const h = JSON.parse(localStorage.getItem('huntersfolio-hunt')); h.mon.hp = 3; h.dice = h.dice.map(() => ({ face: 'C', used: null })); localStorage.setItem('huntersfolio-hunt', JSON.stringify(h)); });
  await p.reload(); await p.waitForTimeout(800); await p.locator('.move.ready').first().click(); await p.waitForTimeout(2800); await measure('result-win');
  for (const [name, label] of [['settings', 'Settings'], ['help', 'How to play']]) {
    await p.click(`button[aria-label="${label}"]`); await p.waitForTimeout(400);
    const t = await p.evaluate(() => [...document.querySelectorAll('dialog[open]')].map(d => d.innerText).join('\n'));
    res.push({ name, total: words(t), regions: [] }); console.log(name, words(t), 'words');
    await p.screenshot({ path: OUT + name + '.png' }); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  }
  fs.writeFileSync(OUT + 'counts.json', JSON.stringify(res, null, 1));
  await b.close();
})();
