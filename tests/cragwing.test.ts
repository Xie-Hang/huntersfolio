// The Cragwing, the rank F → E promotion hunt (Nov 2026): an exam of every Ashfall Ridge lesson.
import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';
import { matchup } from '../src/sim/scenarios';

const hunt = (weapons: [string, number][]) => {
  const s = E.newSave();
  for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.weapons = Object.fromEntries(weapons.map(([id, lv]) => [id, { lv }]));
  s.loadout = { ...s.loadout, weapons: weapons.map(w => w[0]), target: 'cragwing' };
  const h = E.startHunt(s, 3); h.php = h.pmax = 999; return h;
};
const dice = (h: E.Hunt, f: string) => { h.dice = [...f].map(face => ({ face, used: null })) as never; };

describe('the Cragwing', () => {
  it('opens once every Ashfall Ridge monster is beaten, and opens the Mirewood', () => {
    const s = E.newSave(); expect(E.isUnlocked(s, 'cragwing')).toBe(false);
    for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    expect(E.isUnlocked(s, 'cragwing')).toBe(true); expect(E.isUnlocked(s, 'bogjaw')).toBe(false);
    s.record.cragwing = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    expect(E.isUnlocked(s, 'bogjaw')).toBe(true); expect(E.isUnlocked(s, 'rotcap')).toBe(true);
  });
  it('starts plated: a Cut hit clears both layers of slate, anything else one', () => {
    const h = hunt([['blade', 0], ['maul', 0]]); expect(h.mon.plating).toBe(2);
    dice(h, 'C'); E.useMove(h, 0); expect(h.mon.plating).toBe(0);
    const g = hunt([['maul', 0], ['blade', 0]]); dice(g, 'C'); E.useMove(g, 0); expect(g.mon.plating).toBe(1);
  });
  it('in the air only Pierce reaches it; a Weighted Net brings it down', () => {
    const h = hunt([['maul', 0], ['bow', 0]]); h.mon.plating = 0;
    h.intent = 'takeoff'; E.endTurn(h); expect(h.mon.air).toBe(true);
    expect(E.canHit(h, E.currentWeapon(h))).toBe(false);
  });
  it('under the scree only Blunt reaches it; a 2-dice Blunt move drives it up, and coming up it regrows its slate', () => {
    const h = hunt([['maul', 0], ['bow', 0]]); h.mon.plating = 0;
    h.intent = 'burrow'; E.endTurn(h); expect(h.mon.under).toBe(true); expect(h.intent).toBe('rockburst');
    dice(h, 'CTCC'); E.useMove(h, 1); expect(h.mon.under).toBe(false); expect(h.intent).toBe('unearthed');
    const g = hunt([['maul', 0], ['bow', 0]]); g.mon.plating = 0; g.mon.under = true; g.intent = 'rockburst'; g.guard = 999; E.endTurn(g);
    expect(g.mon.under).toBe(false); expect(g.mon.plating).toBe(2);
  });
  it('never flies and burrows back to back; a broken horn stops the burrowing', () => {
    const h = hunt([['blade', 0], ['maul', 0]]); const seen: string[] = [];
    for (let i = 0; i < 30; i++) { seen.push(h.intent); h.guard = 999; E.endTurn(h); }
    for (let i = 1; i < seen.length; i++) expect(['takeoff', 'burrow'].includes(seen[i]) && ['takeoff', 'burrow'].includes(seen[i - 1])).toBe(false);
    const g = hunt([['blade', 0], ['maul', 0]]); g.mon.parts.horn.broken = true; const s2: string[] = [];
    for (let i = 0; i < 20; i++) { s2.push(g.intent); g.guard = 999; E.endTurn(g); }
    expect(s2).not.toContain('burrow');
  });
  it('is a real test: prepared Ashfall gear mostly wins, starter gear doesn\'t (simulated)', () => {
    const run = (w: [string, number][], armor: string, armorLv: number) => matchup({ weapons: w, armor, armorLv, item: 'salve', items: 3, target: 'cragwing' }, { skill: 'casual', capture: false }, 120, 5).win;
    expect(run([['rimeshot', 1], ['tusk', 1]], 'vest', 1)).toBeGreaterThan(0.7);
    expect(run([['blade', 0], ['maul', 0]], 'jerkin', 0)).toBeLessThan(0.15);
  });
});

describe('after a lost hunt', () => {
  it('states facts about the monster against the gear you brought, never what to bring', () => {
    const s = E.newSave();
    for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    s.record.cragwing = { hunts: 3, wins: 0, captures: 0, breaks: {} };
    s.loadout = { ...s.loadout, weapons: ['blade', 'maul'], target: 'cragwing' };
    const h = E.startHunt(s, 1);
    const f = E.lossFacts(h, s);
    expect(f.length).toBe(3);
    expect(f[0]).toContain('only Pierce');
    expect(f.join(' ')).toContain('weak to Frost');
    s.weapons = { ...s.weapons, rimeshot: { lv: 0 } }; s.loadout.weapons = ['rimeshot', 'maul'];
    expect(E.lossFacts(E.startHunt(s, 1), s).join(' ')).not.toContain('only Pierce');
  });
});
