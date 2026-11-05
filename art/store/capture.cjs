// Store screenshots at 1920×1080 (viewport 1477×831 at 1.3×): loads each played hunt (states.ts) into the build.
const { chromium } = require('playwright');
// collateral (store art, achievement icons): never show the build version
const COLLATERAL_CSS = '.sub .build{display:none!important}'; const fs = require('fs'); const path = require('path');
const [FILE, OUT] = process.argv.slice(2); const DIR = __dirname;
const TIPS = ['begin','g-next','g-hp','aim','move','g-blank','guard','end','g-pick','reroll','g-free','windup','charge','swap','open','mud','enraged','item','capture','forge','track','bounties','broke','sell'];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1477, height: 831 }, deviceScaleFactor: 1.3 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(FILE)); await p.waitForTimeout(500);
  const load = async (save, hunt) => { await p.evaluate(([save, hunt, TIPS]) => { save.tips = TIPS; save.hunts = 40;
    localStorage.setItem('huntersfolio-save', JSON.stringify(save)); if (hunt) localStorage.setItem('huntersfolio-hunt', JSON.stringify(hunt)); else localStorage.removeItem('huntersfolio-hunt');
    localStorage.setItem('huntersfolio-settings', JSON.stringify({ music: 0, sfx: 0, fullscreen: false, uiSize: 1, tips: false })); }, [save, hunt, TIPS]);
    await p.reload(); await p.addStyleTag({ content: COLLATERAL_CSS }); await p.waitForTimeout(1400); };
  for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.json')).sort()) {
    const { hunt, save } = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    await load(save, hunt); await p.mouse.move(2, 2); await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(OUT, f.replace('.json', '.png')) }); console.log(f);
  }
  // the Hunt Board and the Forge, from a save part-way through the game
  const { save } = JSON.parse(fs.readFileSync(path.join(DIR, '2-galeshrike-air.json'), 'utf8'));
  for (const id of Object.keys(save.record)) if (['monolith','stormroc','slagwyrm','gorhydra','sovereign','feverjaw','archeron','bloodwhelk','squallhorn','rimeshrike','quakeback','ashtail'].includes(id)) delete save.record[id];
  save.weapons = { blade: { lv: 3 }, saber: { lv: 2 }, gale: { lv: 3 }, storm: { lv: 1 }, maul: { lv: 2 }, tusk: { lv: 3 }, crusher: { lv: 1 }, bow: { lv: 2 }, windbow: { lv: 2 }, tempestbow: { lv: 0 }, ridgecleaver: { lv: 1 } };
  save.armors = { jerkin: { lv: 0 }, vest: { lv: 3 }, coat: { lv: 2 } }; save.coin = 640;
  save.mats = { hide: 6, tusk: 4, pelt: 3, sinew: 2, plume: 7, pinion: 3, talon: 2, crest: 1, tempesteye: 1, bogskin: 3, bogmolar: 1 };
  save.loadout = { ...save.loadout, target: 'bogjaw', weapons: ['storm', 'tusk'], armor: 'coat', item: 'salve', bounty: null }; save.items = { ...save.items, salve: 3 };
  await load(save, null); await p.screenshot({ path: path.join(OUT, '7-board.png') }); console.log('board');
  await p.getByRole('button', { name: /^Forge/ }).first().click(); await p.waitForTimeout(600);
  await p.getByText('Stormcleaver', { exact: false }).first().click().catch(() => {}); await p.waitForTimeout(400);
  await p.mouse.move(2, 2); await p.screenshot({ path: path.join(OUT, '8-forge.png') }); console.log('forge');
  console.log('errors', errs); await b.close();
})();
