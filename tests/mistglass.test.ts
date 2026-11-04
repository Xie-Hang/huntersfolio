import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';
import { matchup } from '../src/sim/scenarios';

const ready = (extra: (s: ReturnType<typeof E.newSave>) => void = () => {}) => {
  const s = E.newSave();
  for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.weapons = { tusk: { lv: 2 }, bow: { lv: 2 } };
  s.loadout = { ...s.loadout, weapons: ['tusk', 'bow'], target: 'mistglass' };
  extra(s);
  return s;
};
const dice = (h: E.Hunt, faces: string) => { h.dice = [...faces].map(face => ({ face, used: null })) as never; };
const light = (h: E.Hunt) => E.currentWeapon(h).moves.findIndex(m => m.need.length === 1);

describe('Tier 2: the Mistglass', () => {
  it('Split: for 3 turns only the first hit each turn lands', () => {
    const h = E.startHunt(ready(), 2);
    h.intent = 'split'; E.endTurn(h);
    expect(h.mon.mirage).toBe(3);
    dice(h, 'CCCC'); h.weapon = 0; h.target = 'facets';
    const first = E.useMove(h, light(h))!, second = E.useMove(h, light(h))!;
    expect(first.dmg).toBeGreaterThan(0);
    expect(second.dmg).toBe(0);
    h.intent = 'rake'; E.endTurn(h); E.endTurn(h); E.endTurn(h);
    expect(h.mon.mirage).toBe(0);
  });
  it('breaking the tail shards shortens the images to 2 turns', () => {
    const h = E.startHunt(ready(), 3);
    h.mon.parts.tail.broken = true;
    h.intent = 'split'; E.endTurn(h);
    expect(h.mon.mirage).toBe(2);
  });
  it('Freezing Mist freezes one of your dice next turn only', () => {
    const h = E.startHunt(ready(), 4);
    h.intent = 'mist'; E.endTurn(h);
    expect(h.dice.filter(d => d.used === E.FROZEN).length).toBe(1);
    h.intent = 'rake'; E.endTurn(h);
    expect(h.dice.filter(d => d.used === E.FROZEN).length).toBe(0);
  });
  it('the Glassmist Mantle guards while you charge; the Glass Charm doubles a charged hit toward breaks', () => {
    const h = E.startHunt(ready(s => { s.armors = { ...s.armors, glassmantle: { lv: 0 } } as never; s.loadout = { ...s.loadout, armor: 'glassmantle' }; }), 5);
    dice(h, 'CCTT');
    E.charge(h, [0, 1].slice(0, E.chargeDice(h)));
    expect(h.guard).toBeGreaterThanOrEqual(12);
    const a = E.startHunt(ready(), 6), b = E.startHunt(ready(s => { s.charms = { glasscharm: 1 } as never; s.loadout = { ...s.loadout, charm: 'glasscharm' }; }), 6);
    for (const h2 of [a, b]) { h2.chargeReady = true; h2.weapon = 0; h2.target = 'facets'; dice(h2, 'CCCC'); E.useMove(h2, light(h2)); }
    const lostA = 240 - a.mon.parts.facets.hp, lostB = 240 - b.mon.parts.facets.hp;
    expect(lostB).toBe(lostA * 2);
  });
  it('is hard without charging, easy with it (simulated)', () => {
    const set = { weapons: [['blade', 3], ['bow', 2]] as [string, number][], armor: 'vest', armorLv: 2, item: 'salve', items: 3, target: 'mistglass' };
    const casual = matchup(set, { skill: 'casual', capture: false }, 200, 17);
    const skilled = matchup(set, { skill: 'skilled', capture: false }, 200, 17);
    expect(skilled.win).toBeGreaterThan(0.95);
    expect(skilled.win - casual.win).toBeGreaterThan(0.3);
  });
});
