// Captures the Gloamhollow plates (Nov 2026) from a built single-file game (same method as capture2.cjs).
//   node art/ach2/capture2.cjs <path to test.html>   → art/ach2/poses/<name>.png
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const OUT = path.join(__dirname, 'poses'); const FILE = process.argv[2];
const POSES = {
  rot_idle: ['rotcap', { intent: 'slam' }, '.plate svg.wc'],
  arc_idle: ['arcmoth', { intent: 'rake' }, '.plate svg.wc'],
  fang_idle: ['hollowfang', { intent: 'bite' }, '.plate svg.wc'],
  blight_idle: ['blightcrown', { intent: 'slam' }, '.plate .variant'],
  glare_idle: ['glarewing', { intent: 'rake' }, '.plate .variant'],
  grave_idle: ['gravefang', { intent: 'bite' }, '.plate .variant']
};
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
  await p.goto('file://' + path.resolve(FILE)); await p.waitForTimeout(500); await p.click('[data-coach="begin"]').catch(() => {}); await p.waitForTimeout(300);
  const cdp = await p.context().newCDPSession(p); await cdp.send('Animation.enable');
  for (const [name, [mon, st, sel]] of Object.entries(POSES)) {
    await p.evaluate(mon => { const s = JSON.parse(localStorage.getItem('huntersfolio-save')); s.tips = ['begin','g-next','g-hp','aim','move','g-blank','guard','end','g-pick','reroll','g-free','windup','charge','swap','open','mud','enraged','item','capture','forge','track','bounties','broke','sell'];
      for (const id of ['gorehorn','galeshrike','cinderback','rimetail','bogjaw','duskheron','emberwhelk','mistglass','squallhorn','rimeshrike','quakeback','ashtail','monolith','stormroc','slagwyrm','gorhydra','rotcap','arcmoth','hollowfang']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
      s.loadout = { ...s.loadout, target: mon, bounty: null }; localStorage.setItem('huntersfolio-save', JSON.stringify(s)); localStorage.removeItem('huntersfolio-hunt');
      localStorage.setItem('huntersfolio-settings', JSON.stringify({ music: 0, sfx: 0, fullscreen: false, uiSize: 1, tips: false })); }, mon);
    await p.reload(); await p.waitForTimeout(300); await p.click('[data-coach="begin"]'); await p.waitForTimeout(400);
    await p.evaluate(st => { const h = JSON.parse(localStorage.getItem('huntersfolio-hunt')); h.intent = st.intent; h.target = '__none'; Object.assign(h.mon, st.mon || {}); if (st.over) { h.over = st.over; h.mon.hp = 0; } localStorage.setItem('huntersfolio-hunt', JSON.stringify(h)); }, st);
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
    await p.reload(); await p.waitForTimeout(1600);
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
    await p.addStyleTag({ content: '.plate{background:transparent!important;border-color:transparent!important} body,html{background:transparent!important} svg.wc > path:first-of-type{opacity:0} svg.scene{display:none!important} .scene{display:none!important} .panel,.stage,.plate-stage,.stagebody,.wrap,main,#app{background:transparent!important;box-shadow:none!important}' });
    const el = await p.$(sel); await el.screenshot({ path: path.join(OUT, `${name}.png`), omitBackground: true });
    const sz = await el.boundingBox(); console.log(name, Math.round(sz.width * 3), Math.round(sz.height * 3));
  }
  await b.close();
})();
