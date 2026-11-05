// Captures the changed Ashfall Ridge and Sovereign plates (Nov 2026) from a built single-file game.
//   node art/ach2/capture2.cjs <path to test.html>   → art/ach2/poses/<name>.png
const { chromium } = require('playwright');
// collateral (store art, achievement icons): never show the build version
const COLLATERAL_CSS = '.sub .build{display:none!important}'; const fs = require('fs'); const path = require('path');
const OUT = path.join(__dirname, 'poses'); const FILE = process.argv[2];
const POSES = {
  squall_gather: ['squallhorn', { intent: 'gather', mon: { wind: 2 } }, '.plate .variant'],
  rimeshrike_idle: ['rimeshrike', { intent: 'rake' }, '.plate .variant'],
  quake_idle: ['quakeback', { intent: 'swipe' }, '.plate .variant'],
  ash_scaled: ['ashtail', { intent: 'pounce', mon: { plating: 2 } }, '.plate .variant'],
  sov_rest: ['sovereign', { intent: 'slam', mon: { stance: 'bare' } }, '.plate svg.wc'],
  sov_down: ['sovereign', { intent: 'slam', over: 'win', mon: { stance: 'bare' } }, '.plate svg.wc']
};
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
  await p.goto('file://' + path.resolve(FILE)); await p.waitForTimeout(500); await p.click('[data-coach="begin"]').catch(() => {}); await p.waitForTimeout(300);
  const cdp = await p.context().newCDPSession(p); await cdp.send('Animation.enable');
  for (const [name, [mon, st, sel]] of Object.entries(POSES)) {
    await p.evaluate(mon => { const s = JSON.parse(localStorage.getItem('huntersfolio-save')); s.tips = ['begin','g-next','g-hp','aim','move','g-blank','guard','end','g-pick','reroll','g-free','windup','charge','swap','open','mud','enraged','item','capture','forge','track','bounties','broke','sell'];
      for (const id of ['gorehorn','galeshrike','cinderback','rimetail','bogjaw','duskheron','emberwhelk','mistglass','squallhorn','rimeshrike','quakeback','ashtail','monolith','stormroc','slagwyrm','gorhydra']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
      s.loadout = { ...s.loadout, target: mon, bounty: null }; localStorage.setItem('huntersfolio-save', JSON.stringify(s)); localStorage.removeItem('huntersfolio-hunt');
      localStorage.setItem('huntersfolio-settings', JSON.stringify({ music: 0, sfx: 0, fullscreen: false, uiSize: 1, tips: false })); }, mon);
    await p.reload(); await p.waitForTimeout(300); await p.click('[data-coach="begin"]'); await p.waitForTimeout(400);
    await p.evaluate(st => { const h = JSON.parse(localStorage.getItem('huntersfolio-hunt')); h.intent = st.intent; h.target = '__none'; Object.assign(h.mon, st.mon || {}); if (st.over) { h.over = st.over; h.mon.hp = 0; } localStorage.setItem('huntersfolio-hunt', JSON.stringify(h)); }, st);
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
    await p.reload(); await p.addStyleTag({ content: COLLATERAL_CSS }); await p.waitForTimeout(1600);
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
    await p.addStyleTag({ content: '.plate{background:transparent!important;border-color:transparent!important} body,html{background:transparent!important} svg.wc > path:first-of-type{opacity:0} svg.scene{display:none!important} .scene{display:none!important} .panel,.stage,.plate-stage,.stagebody,.wrap,main,#app{background:transparent!important;box-shadow:none!important}' });
    const el = await p.$(sel); await el.screenshot({ path: path.join(OUT, `${name}.png`), omitBackground: true });
    const sz = await el.boundingBox(); console.log(name, Math.round(sz.width * 3), Math.round(sz.height * 3));
  }
  await b.close();
})();
