// QA: plays the whole demo from a fresh save to the "That's the demo" card through the real UI.
// Brain between hunts = the simulator's campaign choices (loadout, salves, counter items); the Forge is
// clicked through the UI; every hunt is played with the keyboard shortcuts. Records errors, crash screens,
// page overflow, turn times and memory.
//   npx tsx qa/playthrough.ts [width] [height] [outdir]
import { createRequire } from 'node:module';
import type { Page } from 'playwright';
const { chromium } = createRequire(import.meta.url)('playwright'); // the machine's own Playwright (not a project dependency)
import * as E from '../src/engine';
import { writeFileSync, mkdirSync } from 'node:fs';

const W = Number(process.argv[2] || 1366), H = Number(process.argv[3] || 768), OUT = process.argv[4] || 'qa/out';
mkdirSync(OUT, { recursive: true });
const URL = process.env.QA_URL || 'http://localhost:4173/';
const SAVE = 'huntersfolio-save', HUNT = 'huntersfolio-hunt';
const issues: string[] = [];
const note = (s: string) => { issues.push(s); console.log('!', s); };

async function getJSON(p: Page, k: string) { return p.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), k); }
async function setJSON(p: Page, k: string, v: unknown) { await p.evaluate(([k, v]) => localStorage.setItem(k as string, JSON.stringify(v)), [k, v]); }
async function check(p: Page, where: string) {
  const r = await p.evaluate(() => ({
    over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    crash: !!document.querySelector('.crash'),
    mem: (performance as any).memory?.usedJSHeapSize ?? 0
  }));
  if (r.over > 1) note(`${where}: page scrolls sideways by ${r.over}px at ${W}×${H}`);
  if (r.crash) { note(`${where}: CRASH SCREEN`); await p.screenshot({ path: `${OUT}/crash-${Date.now()}.png` }); }
  return r;
}

async function playHunt(p: Page, n: number) {
  const times: number[] = [];
  for (let turn = 0; turn < 60; turn++) {
    const h = await getJSON(p, HUNT) as E.Hunt | null;
    if (!h || h.over) break;
    const t0 = Date.now();
    await p.keyboard.press('x'); // capture if it's allowed (the UI ignores it otherwise)
    let cur = await getJSON(p, HUNT) as E.Hunt; if (!cur || cur.over) break;
    if (cur.item && E.itemUsable(cur) && cur.php < cur.pmax * 0.55 && E.ITEMS[cur.item].effect === 'heal30') await p.keyboard.press('i');
    if (cur.item && E.itemUsable(cur) && E.ITEMS[cur.item].effect !== 'heal30') {
      const fx = E.ITEMS[cur.item].effect;
      if ((fx === 'net' && (cur.intent === 'gust' || cur.intent === 'circle')) || (fx === 'thaw' && cur.mon.plating >= 2) || (fx === 'blast' && cur.intent === 'erupt')) await p.keyboard.press('i');
    }
    cur = await getJSON(p, HUNT) as E.Hunt;
    if (!E.canHit(cur, E.currentWeapon(cur)) && cur.weps.length > 1) { await p.keyboard.press('1'); await p.keyboard.press('s'); }
    for (let k = 0; k < 3; k++) for (const key of ['e', 'w', 'q']) { await p.keyboard.press(key); }
    cur = await getJSON(p, HUNT) as E.Hunt; if (!cur || cur.over) break;
    for (const key of ['1', '2', '3', '4']) await p.keyboard.press(key);
    await p.keyboard.press('g');
    await p.keyboard.press(' ');
    await p.waitForTimeout(120);
    times.push(Date.now() - t0);
    if (turn % 6 === 0) await check(p, `hunt ${n} turn ${turn}`);
  }
  return times;
}

async function forgeAll(p: Page) {
  await p.click('[data-coach="nav-forge"]');
  const box = p.locator('label.readyto input'); if (!(await box.isChecked())) await box.check();
  for (let k = 0; k < 6; k++) {
    const node = p.locator('.fnode').first(); if (!(await node.count())) break;
    await node.click(); const act = p.locator('[data-coach="forge-act"]');
    if (!(await act.count()) || await act.isDisabled()) break;
    const before = JSON.stringify((await getJSON(p, SAVE)).weapons);
    await act.click(); await p.waitForTimeout(80);
    if (JSON.stringify((await getJSON(p, SAVE)).weapons) === before && k > 3) break;
  }
  await check(p, 'forge');
  await box.uncheck();
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H } }); p.setDefaultTimeout(8000);
  p.on('pageerror', e => note(`page error: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') note(`console error: ${m.text()}`); });
  await p.goto(URL); await p.waitForTimeout(500);
  const t1 = ['gorehorn', 'galeshrike', 'cinderback', 'rimetail', 'cragwing']; // the Cragwing promotion ends the demo (Nov 2026)
  const COUNTER: Record<string, string> = { galeshrike: 'net', cinderback: 'blast', rimetail: 'firepot' };
  let streak = 0, endSeenAt = 0; const allTimes: number[] = [], mem: number[] = [];
  for (let n = 1; n <= 45; n++) {
    await p.click('[data-coach="nav-board"]').catch(() => {});
    const s = await getJSON(p, SAVE) as E.Save | null;
    if (s) {
      const beaten = (id: string) => (s.record[id]?.wins ?? 0) > 0;
      if (t1.every(beaten) && endSeenAt) break;
      const todo = t1.filter(id => E.isUnlocked(s, id) && !beaten(id));
      const target = streak >= 2 || !todo.length ? 'gorehorn' : todo[0];
      const wpn = (id: string) => E.weaponInst(id, E.lvOf(s.weapons, id));
      const owned = Object.keys(s.weapons).sort((a, c) => E.avgVs(wpn(c), target) - E.avgVs(wpn(a), target));
      const first = owned[0], second = owned.find(id => E.WEAPONS[id].type !== E.WEAPONS[first].type) ?? owned[1];
      const c = COUNTER[target];
      if (c && (s.items[c] ?? 0) < 1 && s.coin >= E.ITEMS[c].price! * 2) E.buyItem(s, c, 2);
      while ((s.items.salve ?? 0) < 3 && s.coin >= 120) E.buyItem(s, 'salve', 1);
      const item = c && s.items[c] > 0 ? c : (s.items.salve ?? 0) > 0 ? 'salve' : null;
      s.loadout = { ...s.loadout, target, weapons: [first, second].filter(Boolean) as string[], item };
      await setJSON(p, SAVE, s); await p.reload(); await p.waitForTimeout(250);
    }
    // the Hunt Board opens on the grid: pick the monster to reach its page (new saves open on the Gorehorn's page)
    const tgt = ((await getJSON(p, SAVE)) as E.Save | null)?.loadout.target ?? 'gorehorn';
    if (await p.locator('.mcard').count()) await p.click(`.mcard[data-id="${tgt}"]`);
    await p.click('[data-coach="begin"]'); await p.waitForTimeout(150);
    const mid = (await getJSON(p, HUNT) as E.Hunt | null)?.mid ?? '?';
    const winsBefore = ((await getJSON(p, SAVE)) as E.Save).record[mid]?.wins ?? 0;
    const times = await playHunt(p, n); allTimes.push(...times);
    const left = await getJSON(p, HUNT) as E.Hunt | null; // a finished hunt is removed from storage
    if (left && !left.over) { note(`hunt ${n} (${mid}) not over after 60 turns`); await p.click('button:has-text("Abandon hunt")').catch(() => {}); }
    const won = (((await getJSON(p, SAVE)) as E.Save).record[mid]?.wins ?? 0) > winsBefore;
    console.log(`hunt ${n}: ${mid} ${won ? 'won' : 'lost'} in ${times.length} turns`);
    streak = won ? 0 : streak + 1;
    await check(p, `result ${n}`);
    await p.waitForTimeout(150);
    const dismissEnd = async () => {
      const keep = p.locator('button:has-text("Keep hunting")');
      if (await keep.waitFor({ state: 'visible', timeout: 1500 }).then(() => true, () => false)) {
        if (!endSeenAt) { endSeenAt = n; await p.screenshot({ path: `${OUT}/demo-end.png` }); }
        await keep.click();
      }
    };
    await dismissEnd();
    await p.click('button:has-text("Hunt Board")').catch(() => {});
    await dismissEnd();
    await forgeAll(p);
    mem.push((await check(p, `board ${n}`)).mem);
  }
  const s = await getJSON(p, SAVE) as E.Save;
  const res = { size: `${W}x${H}`, hunts: s.hunts, record: s.record, achievements: s.achievements, endSeenAt, weapons: s.weapons,
    turnMsMedian: allTimes.sort((a, b) => a - b).at(Math.floor(allTimes.length / 2)), memMB: mem.map(m => Math.round(m / 1e6)), issues };
  writeFileSync(`${OUT}/playthrough.json`, JSON.stringify(res, null, 2));
  console.log(JSON.stringify({ ...res, record: undefined }, null, 1));
  await b.close();
})();
