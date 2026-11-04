// QA: how busy the page keeps the CPU while the player just looks at it (animated monster plates).
// Reports main-thread busy time per second over 20 s idle, for each screen.
const { chromium } = require('playwright');
const U = process.env.QA_URL || 'http://localhost:4173/';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const cdp = await p.context().newCDPSession(p); await cdp.send('Performance.enable');
  await p.goto(U); await p.waitForTimeout(300); await p.click('.coach-skip');
  const busy = async (label, secs = 20) => {
    const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
    await p.mouse.move(5, 5); await p.waitForTimeout(800);
    const a = await m(); await p.waitForTimeout(secs * 1000); const z = await m();
    const per = k => ((z[k] - a[k]) / secs * 1000).toFixed(0);
    console.log(`${label.padEnd(28)} main thread busy ${per('TaskDuration')} ms/s · script ${per('ScriptDuration')} · layout ${per('LayoutDuration')} · style ${per('RecalcStyleDuration')}`);
  };
  await busy('Hunt Board (Gorehorn plate)');
  await p.click('[data-coach="begin"]'); await p.waitForTimeout(400);
  await busy('Hunt, calm turn');
  await p.evaluate(() => { const h = JSON.parse(localStorage.getItem('huntersfolio-hunt')); h.intent = 'charge'; localStorage.setItem('huntersfolio-hunt', JSON.stringify(h)); }); await p.reload(); await p.waitForTimeout(400);
  await busy('Hunt, danger turn (pulsing)');
  await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForTimeout(300);
  await busy('Same, reduced motion');
  await b.close();
})();
