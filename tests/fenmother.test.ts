// The Fenmother, the rank E → D promotion hunt (Nov 2026): an exam of the Mirewood's lessons at once.
import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';
import { matchup } from '../src/sim/scenarios';

const MIRE = ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass'];
const hunt = (weapons: [string, number][]) => {
  const s = E.newSave();
  for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail', 'cragwing', ...MIRE]) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.weapons = Object.fromEntries(weapons.map(([id, lv]) => [id, { lv }]));
  s.loadout = { ...s.loadout, weapons: weapons.map(w => w[0]), target: 'fenmother' };
  const h = E.startHunt(s, 3); h.php = h.pmax = 999; return h;
};
const dice = (h: E.Hunt, f: string) => { h.dice = [...f].map(face => ({ face, used: null })) as never; };

describe('the Fenmother', () => {
  it('opens once the Mirewood four are beaten, and opens the Stormspire', () => {
    const s = E.newSave();
    for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail', 'cragwing']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    expect(E.isUnlocked(s, 'fenmother')).toBe(false);
    for (const id of MIRE) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    expect(E.isUnlocked(s, 'fenmother')).toBe(true); expect(E.isUnlocked(s, 'monolith')).toBe(false);
    expect(E.unlockHint('monolith')).toBe('Pass the Fenmother promotion hunt first');
    s.record.fenmother = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    expect(E.isUnlocked(s, 'monolith')).toBe(true);
  });
  it('swallows you; its gills heal it until they break', () => {
    const h = hunt([['bogcleaver', 2], ['wartbow', 2]]);
    h.intent = 'swallow'; h.guard = 0; E.endTurn(h); expect(h.mon.gut).toBe(2);
    const g = hunt([['bogcleaver', 2], ['wartbow', 2]]); g.mon.hp = 500; g.intent = 'lash'; g.guard = 999; E.endTurn(g); expect(g.mon.hp).toBe(518);
    g.mon.parts.gills.broken = true; g.mon.hp = 500; g.intent = 'lash'; E.endTurn(g); expect(g.mon.hp).toBe(500);
  });
  it('at half HP the steam rises: only the first hit each turn lands', () => {
    const h = hunt([['bogcleaver', 2], ['wartbow', 2]]);
    h.mon.hp = Math.floor(h.mon.max / 2) + 5; dice(h, 'CCTT'); E.useMove(h, 1);
    expect(h.mon.mirage).toBe(3);
    const before = h.mon.hp; dice(h, 'C'); E.useMove(h, 0); expect(h.mon.hp).toBe(before);
  });
  it('checks its weakness: Stone gear at +2 mostly wins, Ashfall gear can\'t (simulated)', () => {
    const run = (w: [string, number][], armor: string, lv: number) => matchup({ weapons: w, armor, armorLv: lv, item: 'salve', items: 3, target: 'fenmother' }, { skill: 'casual', capture: false }, 100, 5).win;
    expect(run([['bogcleaver', 2], ['wartbow', 2]], 'whelkplate', 2)).toBeGreaterThan(0.75);
    expect(run([['rimeshot', 2], ['boulder', 2]], 'cragmail', 1)).toBeLessThan(0.1);
  });
});
