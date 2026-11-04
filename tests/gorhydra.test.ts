import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';
import { matchup } from '../src/sim/scenarios';

const ready = (weapons: string[] = ['bogcleaver', 'miremaul']) => {
  const s = E.newSave();
  for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail', 'bogjaw', 'duskheron', 'emberwhelk', 'mistglass']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.weapons = Object.fromEntries(weapons.map(id => [id, { lv: 2 }]));
  s.loadout = { ...s.loadout, weapons, target: 'gorhydra' };
  return s;
};
const dice = (h: E.Hunt, f: string) => { h.dice = [...f].map(face => ({ face, used: null })) as never; };

describe('Tier 3: the Gorhydra', () => {
  it('telegraphs three heads and adds them up', () => {
    const h = E.startHunt(ready(), 2);
    h.intent = 'left:bite|middle:crush|right:breath';
    const i = E.intentInfo(h);
    expect(i.name).toBe('Bite + Crush + Frost Breath');
    expect(i.dmg).toBe(10 + 18 + 8);
  });
  it('a broken head regrows in 2 turns at half HP unless the stump is sealed', () => {
    const h = E.startHunt(ready(), 3);
    h.mon.parts.left.hp = 1; h.target = 'left'; dice(h, 'CCCC');
    E.useMove(h, 0);
    expect(h.mon.parts.left.broken).toBe(true); expect(h.mon.stump?.left).toBe(2); expect(h.mon.sealed?.left).toBeFalsy();
    h.intent = 'left:bite|middle:snap|right:bite'; E.endTurn(h); E.endTurn(h);
    expect(h.mon.parts.left.broken).toBe(false); expect(h.mon.parts.left.hp).toBe(65);
  });
  it('a later Cut hit on the stump seals it for good; an Ember hit does too', () => {
    const h = E.startHunt(ready(), 4);
    h.mon.parts.left.hp = 1; h.target = 'left'; dice(h, 'CCCC');
    E.useMove(h, 0); E.useMove(h, 0);
    expect(h.mon.sealed?.left).toBe(true); expect(h.mon.stump?.left).toBe(0);
    const g = E.startHunt(ready(['pearlhammer', 'miremaul']), 5);
    g.mon.parts.right.broken = true; g.mon.stump = { right: 2 }; g.target = 'right'; dice(g, 'CCCC');
    E.useMove(g, 0);
    expect(g.mon.sealed?.right).toBe(true);
  });
  it('with every head sealed it only Tail Slams, and its body takes +25%', () => {
    const h = E.startHunt(ready(), 6);
    for (const x of ['left', 'middle', 'right']) h.mon.parts[x].broken = true;
    h.mon.sealed = { left: true, middle: true, right: true }; h.mon.stump = {};
    E.endTurn(h);
    expect(h.intent).toBe('slam');
    expect(E.monsterOf(h).hitMod!(h, 'left', E.currentWeapon(h))!.mult).toBe(1.25);
  });
  it('is a Cut check (simulated, casual)', () => {
    const run = (w: [string, number][]) => matchup({ weapons: w, armor: 'bogcoat', armorLv: 2, item: 'salve', items: 3, target: 'gorhydra' }, { skill: 'casual', capture: false }, 200, 17).win;
    const cut = run([['bogcleaver', 2], ['miremaul', 2]]), none = run([['miremaul', 2], ['wartbow', 2]]);
    expect(cut).toBeGreaterThan(0.7);
    expect(cut - none).toBeGreaterThan(0.25);
  });
});
