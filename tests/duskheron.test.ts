import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';
import { matchup } from '../src/sim/scenarios';

const ready = () => {
  const s = E.newSave();
  for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.weapons = { tusk: { lv: 2 }, bow: { lv: 2 } };
  s.loadout = { ...s.loadout, weapons: ['tusk', 'bow'], target: 'duskheron' };
  return s;
};

describe('Tier 2: the Duskheron', () => {
  it('telegraphs both heads and adds their damage', () => {
    const h = E.startHunt(ready(), 2);
    h.intent = 'upper:thrust|lower:peck';
    const i = E.intentInfo(h);
    expect(i.dmg).toBe(26 + 14);
    expect(i.name).toBe('Spear Thrust + Peck');
  });
  it('dazing one head cancels only that head, this turn and the next', () => {
    const h = E.startHunt(ready(), 3);
    h.intent = 'upper:thrust|lower:peck'; h.target = 'upper'; h.weapon = 0;
    h.mon.headDaze = { upper: E.HEAD_DAZE_MAX - 1, lower: 0 };
    h.dice = [{ face: 'C', used: null }, { face: 'T', used: null }, { face: 'T', used: null }, { face: 'C', used: null }];
    E.useMove(h, 2); // Skullcrack: only the strongest move dazes
    expect(h.mon.reel?.upper).toBe(2);
    expect(E.intentInfo(h).dmg).toBe(14); // only the lower head's peck is left
    E.endTurn(h);
    if (h.intent.includes(':')) expect(E.intentInfo(h).name.startsWith('Reeling')).toBe(true);
  });
  it('Screech halves your guard on its next turn; the Duskweave Coat ignores that', () => {
    const h = E.startHunt(ready(), 4);
    h.intent = 'upper:screech|lower:peck';
    E.endTurn(h);
    expect(E.intentInfo(h).halfGuard).toBe(true);
    h.arm = { ...h.arm, steady: true }; h.guard = 10;
    expect(E.incoming(h)!.half).toBe(false);
  });
  it('Rear Up always leads to the Twin Spear', () => {
    const h = E.startHunt(ready(), 5);
    h.intent = 'rear'; E.endTurn(h);
    expect(h.intent).toBe('twin');
  });
  it('is a Blunt check on element-neutral gear (simulated, casual)', () => {
    const blunt = matchup({ weapons: [['tusk', 2], ['bow', 2]], armor: 'vest', armorLv: 2, item: 'salve', items: 3, target: 'duskheron' }, { skill: 'casual', capture: false }, 200, 17);
    const none = matchup({ weapons: [['blade', 3], ['bow', 2]], armor: 'vest', armorLv: 2, item: 'salve', items: 3, target: 'duskheron' }, { skill: 'casual', capture: false }, 200, 17);
    expect(blunt.win).toBeGreaterThan(0.85);
    expect(blunt.win - none.win).toBeGreaterThan(0.25);
  });
});
