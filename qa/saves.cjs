// QA: save safety in the real UI. A save from a newer build is left untouched; reloading in the middle of the
// monster's turn resumes cleanly; a save that isn't valid JSON doesn't crash the game.
const { chromium } = require('playwright');
const U = process.env.QA_URL || 'http://localhost:4173/';
const results = []; const ok = (name, pass, extra = '') => { results.push(`${pass ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); };
(async () => {
  const b = await chromium.launch();
  const fresh = async () => { const p = await b.newPage({ viewport: { width: 1440, height: 869 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(U); await p.waitForTimeout(300); return [p, errs]; };
  // 1. newer save
  { const [p, errs] = await fresh();
    const future = JSON.stringify({ version: 999, coin: 77777, hunts: 321, weapons: { blade: { lv: 3 } } });
    await p.evaluate(f => localStorage.setItem('huntersfolio-save', f), future); await p.reload(); await p.waitForTimeout(400);
    const shown = await p.locator('text=Your save is from a newer version').isVisible();
    await p.click('button:has-text("Play without saving")').catch(() => {});
    await p.click('.coach-skip').catch(() => {});
    await p.click('[data-coach="begin"]').catch(() => {}); await p.waitForTimeout(200);
    for (const k of ['e', 'w', 'q', ' ', 'e', ' ']) { await p.keyboard.press(k); await p.waitForTimeout(80); }
    await p.click('button:has-text("Abandon hunt")').catch(() => {});
    const after = await p.evaluate(() => localStorage.getItem('huntersfolio-save'));
    const hunt = await p.evaluate(() => localStorage.getItem('huntersfolio-hunt'));
    const head = await p.locator('header').innerText();
    ok('newer save: notice shown', shown); ok('newer save: untouched after playing', after === future); ok('newer save: no hunt written', hunt === null);
    ok('newer save: header says Not saving', head.includes('Not saving')); ok('newer save: no errors', !errs.length, errs.join('; '));
    await p.close(); }
  // 2. reload mid-monster-turn, many times
  { const [p, errs] = await fresh(); await p.click('.coach-skip').catch(() => {});
    await p.click('[data-coach="begin"]'); await p.waitForTimeout(200);
    let bad = 0;
    for (let i = 0; i < 12; i++) {
      const before = await p.evaluate(() => JSON.parse(localStorage.getItem('huntersfolio-hunt') || 'null'));
      if (!before || before.over) break;
      await p.keyboard.press('e'); await p.keyboard.press(' '); await p.waitForTimeout(i * 15); await p.reload(); await p.waitForTimeout(300);
      const h = await p.evaluate(() => JSON.parse(localStorage.getItem('huntersfolio-hunt') || 'null'));
      const onScreen = await p.locator('h2', { hasText: 'The dice' }).first().isVisible().catch(() => false);
      if (h && !h.over && (!onScreen || h.turn < before.turn)) { bad++; console.log('  iter', i, 'turn', before.turn, '->', h.turn, 'onScreen', onScreen, 'view', await p.evaluate(() => document.querySelector('header')?.innerText.replace(/\n/g, ' '))); }
    }
    ok('reload mid-turn: hunt resumes each time', bad === 0, `${bad} bad resumes`); ok('reload mid-turn: no errors', !errs.length, errs.join('; '));
    await p.close(); }
  // 3. broken JSON in the save
  { const [p, errs] = await fresh();
    await p.evaluate(() => { localStorage.setItem('huntersfolio-save', '{"version":6,"coin":12'); localStorage.setItem('huntersfolio-hunt', '[[['); });
    await p.reload(); await p.waitForTimeout(400);
    const crash = await p.locator('.crash').count();
    ok('broken save JSON: game starts, no crash screen', !crash && !errs.length, errs.join('; '));
    await p.close(); }
  console.log(results.join('\n')); await b.close();
})();
