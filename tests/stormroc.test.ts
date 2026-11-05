import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';
import { matchup } from '../src/sim/scenarios';

const ready = (weapons: string[] = ['gillbow', 'pearlhammer']) => {
  const s = E.newSave();
  for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail', 'bogjaw', 'duskheron', 'emberwhelk', 'mistglass']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.weapons = Object.fromEntries(weapons.map(id => [id, { lv: 2 }]));
  s.loadout = { ...s.loadout, weapons, target: 'stormroc' };
  return s;
};
const dice = (h: E.Hunt, f: string) => { h.dice = [...f].map(face => ({ face, used: null })) as never; };

describe('Tier 3: the Stormcrown Roc', () => {
  it('builds a storm pip a turn and casts Thunderhead at three, then lands to recover', () => {
    const h = E.startHunt(ready(), 2);
    h.intent = 'rake'; E.endTurn(h); E.endTurn(h);
    h.mon.storm = 2; h.intent = 'rake'; E.endTurn(h);
    expect(h.mon.storm).toBe(3); expect(h.intent).toBe('thunder');
    E.endTurn(h);
    expect(h.mon.storm).toBe(0); expect(h.intent).toBe('perched'); expect(h.mon.air).toBe(false);
  });
  it('a Pierce hit on the crown drains a pip, and snuffs out a telegraphed Thunderhead', () => {
    const h = E.startHunt(ready(), 3);
    h.mon.storm = 3; h.intent = 'thunder'; h.target = 'crown'; h.weapon = 0; dice(h, 'CCCC');
    E.useMove(h, 0);
    expect(h.mon.storm).toBe(2); expect(h.intent).toBe('gutter');
    expect(h.feats).toContain('interrupt');
  });
  it('phase 2: it takes to the air for good, and a net grounds it for one turn only', () => {
    const s = ready(); s.items.net = 2; s.loadout.item = 'net';
    const h = E.startHunt(s, 4);
    h.mon.hp = Math.floor(h.mon.max / 2) + 5; h.target = 'wings'; h.weapon = 0; dice(h, 'CCCC');
    E.useMove(h, 0);
    expect(h.mon.enraged).toBe(true); expect(h.mon.skyLock).toBe(true); expect(h.mon.air).toBe(true);
    E.useItem(h);
    expect(h.mon.air).toBe(false); expect(h.intent).toBe('crashed');
    E.endTurn(h);
    expect(h.mon.air).toBe(true);
  });
  it('the Stormfeather Cloak halves Thunderhead', () => {
    const s = ready(); s.armors = { stormcloak: { lv: 0 } } as never; s.loadout.armor = 'stormcloak';
    const h = E.startHunt(s, 5); h.intent = 'thunder';
    expect(E.intentInfo(h).dmg).toBe(35);
  });
  it('is a Pierce check (simulated, casual)', () => {
    const run = (w: [string, number][]) => matchup({ weapons: w, armor: 'glassmantle', armorLv: 2, item: 'salve', items: 3, target: 'stormroc' }, { skill: 'casual', capture: false }, 200, 17).win;
    const bow = run([['gillbow', 2], ['pearlhammer', 2]]), none = run([['pearlhammer', 2], ['whelkedge', 2]]);
    expect(bow).toBeGreaterThan(0.75);
    expect(bow - none).toBeGreaterThan(0.25); // the casual bot now guards when it can't reach the flier, so no-bow is softer
  });
});
