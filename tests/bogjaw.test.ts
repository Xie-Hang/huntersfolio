import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';
import { matchup } from '../src/sim/scenarios';

const ready = () => {
  const s = E.newSave();
  for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail', 'cragwing']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.weapons = { ridgecleaver: { lv: 2 }, boulder: { lv: 2 } };
  s.loadout = { ...s.loadout, weapons: ['ridgecleaver', 'boulder'], target: 'bogjaw' };
  return s;
};

describe('Tier 2: the Bogjaw', () => {
  it('opens with the Cragwing promotion, which opens once every Ashfall Ridge monster is beaten', () => {
    const s = E.newSave();
    expect(E.isUnlocked(s, 'bogjaw')).toBe(false);
    expect(E.unlockHint('bogjaw')).toBe('Pass the Cragwing promotion hunt first');
    expect(E.unlockHint('cragwing')).toBe('Beat every monster on Ashfall Ridge first');
    for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    expect(E.isUnlocked(s, 'cragwing')).toBe(true); expect(E.isUnlocked(s, 'bogjaw')).toBe(false);
    expect(E.isUnlocked(ready(), 'bogjaw')).toBe(true);
  });
  it('Swallow locks two dice; cutting free releases them', () => {
    const h = E.startHunt(ready(), 3);
    h.intent = 'swallow';
    E.endTurn(h);
    expect(h.mon.gut).toBe(2);
    expect(h.dice.filter(d => d.used === E.SWALLOWED).length).toBe(2);
    expect(h.intent).toBe('digest');
    // cut free: Cut counts double toward the 60
    h.weapon = 0; h.mon.gutHp = 10;
    h.dice[0] = { face: 'C', used: null }; h.dice[1] = { face: 'C', used: null };
    E.useMove(h, 0);
    expect(h.mon.gut).toBe(0);
    expect(h.dice.some(d => d.used === E.SWALLOWED)).toBe(false);
  });
  it('a Smoke Pouch makes the Swallow miss, so nothing gets stuck', () => {
    const h = E.startHunt(ready(), 4);
    h.intent = 'swallow'; h.evade = true;
    E.endTurn(h);
    expect(h.mon.gut ?? 0).toBe(0);
  });
  it('dazing it during Gape cancels the Swallow', () => {
    const h = E.startHunt(ready(), 5);
    h.intent = 'gape'; h.mon.daze = h.mon.dazeMax - 1; h.target = 'jaw'; h.weapon = 1;
    h.dice = [{ face: 'C', used: null }, { face: 'T', used: null }, { face: 'T', used: null }, { face: 'C', used: null }];
    E.useMove(h, 1);
    expect(h.intent).toBe('dazed');
    E.endTurn(h);
    expect(h.intent).not.toBe('swallow');
  });
  it('never heavy twice in a row, and Gape always leads to Swallow', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const h = E.startHunt(ready(), seed); let prev = '';
      for (let t = 0; t < 30 && !h.over; t++) {
        if (prev === 'gape') expect(['swallow', 'dazed']).toContain(h.intent);
        const threat = E.intentInfo(h).threat;
        if (prev && E.monsterOf(h).intent(h, prev).threat >= 3) expect(threat).toBeLessThan(3);
        prev = h.intent; h.php = h.pmax; E.endTurn(h);
      }
    }
  });
  it('is a Cut check (simulated, casual): clearly better with a Cut weapon', () => {
    const cut = matchup({ weapons: [['ridgecleaver', 2], ['boulder', 2]], armor: 'vest', armorLv: 2, item: 'salve', items: 3, target: 'bogjaw' }, { skill: 'casual', capture: false }, 200, 11);
    const noCut = matchup({ weapons: [['boulder', 2], ['ridgebow', 2]], armor: 'vest', armorLv: 2, item: 'salve', items: 3, target: 'bogjaw' }, { skill: 'casual', capture: false }, 200, 11);
    expect(cut.win).toBeGreaterThan(0.85);
    expect(cut.win - noCut.win).toBeGreaterThan(0.12);
  });
});
