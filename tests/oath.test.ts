import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';

// The Oath line (Nov 2026): no element, the signature on every move, unlocked by bounties, coin only.
const ready = () => { const s = E.newSave(); s.coin = 5000; return s; };
const bounties = (s: E.Save, n: number) => { s.bounties = Object.fromEntries(Object.keys(E.BOUNTIES).slice(0, n).map(k => [k, true])) as Record<string, true>; };

describe('the Oath line', () => {
  it('stays locked until enough bounties are done, then costs coin only', () => {
    const s = ready();
    expect(E.recipeOf(s, 'w', 'oathblade').locked).toBe(true);
    expect(E.recipeState(s, 'w', 'oathblade').text).toMatch(/Complete 4 bounties/);
    bounties(s, 4);
    const r = E.recipeOf(s, 'w', 'oathblade');
    expect(r.action).toBe('craft');
    expect(Object.keys(r.cost!)).toEqual(['coin']);
  });
  it('grows in three steps, each needing more bounties', () => {
    const s = ready(); bounties(s, 4); s.weapons.oathmaul = { lv: 0 };
    expect(E.recipeOf(s, 'w', 'oathmaul2').locked).toBe(true);
    bounties(s, 10);
    expect(E.recipeOf(s, 'w', 'oathmaul2').action).toBe('upgrade');
    expect(E.WEAPONS.oathmaul3.mult).toBeGreaterThan(E.WEAPONS.oathmaul2.mult);
  });
  it('has its signature on every move', () => {
    expect(E.WEAPONS.oathblade.moves.every(m => m.flow)).toBe(true);
    expect(E.WEAPONS.oathmaul.moves.every(m => m.daze)).toBe(true);
    expect(E.WEAPONS.oathbow.moves.every(m => m.expose)).toBe(true);
    expect(E.WEAPONS.oathbow.elem).toBeNull();
  });
});

describe('Flow', () => {
  it('gives one reroll a turn, however many Flow moves you use', () => {
    const s = E.newSave(); s.weapons.oathblade = { lv: 0 }; s.loadout.weapons = ['oathblade', 'maul'];
    const h = E.startHunt(s, 2);
    h.dice = [{ face: 'C', used: null }, { face: 'C', used: null }, { face: 'C', used: null }, { face: 'T', used: null }];
    const r0 = h.rerolls;
    E.useMove(h, 0); E.useMove(h, 0);
    expect(h.rerolls).toBe(r0 + 1);
    E.endTurn(h);
    if (!h.over) { h.dice = h.dice.map(() => ({ face: 'C' as const, used: null })); const r1 = h.rerolls; E.useMove(h, 0); expect(h.rerolls).toBe(r1 + 1); }
  });
});

describe('dice patterns (Nov 2026)', () => {
  it('each weapon type has its own pattern: blades Fangs, bows Claws, mauls a mix', () => {
    expect(E.WEAPONS.blade.moves.map(m => m.need)).toEqual(['C', 'CC', 'CCT']);
    expect(E.WEAPONS.bow.moves.map(m => m.need)).toEqual(['T', 'TT', 'TTC']);
    expect(E.WEAPONS.maul.moves.map(m => m.need)).toEqual(['C', 'CT', 'CTT']);
    expect(E.WEAPONS.gale.moves.map(m => m.need)).toEqual(['C', 'CC', 'CCT']); // curved blades cost what blades cost
  });
});
