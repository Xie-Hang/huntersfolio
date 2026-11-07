// The Foothills (the tutorial island, Nov 2026): a new player starts with one weapon and one move, and each step
// unlocks the next. Old saves and skipped players are done.
import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';

const win = (s: E.Save, mid: string) => {
  s.loadout.target = mid;
  const h = E.startHunt(s, 7);
  h.mon.hp = 0; h.over = 'win';
  E.settleHunt(s, h);
  return h;
};

describe('the Foothills', () => {
  it('a new player has the Training Blade only, and only the Scuttlehog is open', () => {
    const s = E.newPlayerSave();
    expect(Object.keys(s.weapons)).toEqual(['training']);
    expect(E.isUnlocked(s, 'scuttlehog')).toBe(true);
    expect(E.isUnlocked(s, 'snapclaw')).toBe(false);
    expect(E.isUnlocked(s, 'gorehorn')).toBe(false);
    expect(E.forgeOpen(s)).toBe(false);
  });
  it('the Scuttlehog rolls two circles; the Snapclaw three dice of any face', () => {
    const s = E.newPlayerSave();
    s.loadout.target = 'scuttlehog';
    const h = E.startHunt(s, 3);
    expect(h.dice.length).toBe(2);
    expect(h.dice.every(d => d.face === 'C')).toBe(true);
    expect(h.weps.length).toBe(1);
    expect(E.otherWeapon(h).id).toBe('training');
    expect(E.canUseMove(h, 0)).toBe(true);
    const r = E.useMove(h, 0)!; expect(r.dmg).toBe(12);
    s.island = 1; s.loadout.target = 'snapclaw';
    const g = E.startHunt(s, 3);
    expect(g.dice.length).toBe(3);
    E.endTurn(g); expect(g.dice.length).toBe(3);
  });
  it('the whole ladder: Scuttlehog, Snapclaw, the blade, Tuskling, the maul, Burrowmole, a salve, Tuskling again', () => {
    const s = E.newPlayerSave();
    win(s, 'scuttlehog');
    expect(s.island).toBe(1);
    expect(E.isUnlocked(s, 'snapclaw')).toBe(true);
    win(s, 'snapclaw');
    expect(s.island).toBe(2);
    expect(E.forgeOpen(s)).toBe(true);
    expect(E.recipeState(s, 'w', 'blade').cls).toBe('ready');
    expect(E.forgeDo(s, 'w', 'blade')).toBeTruthy();
    expect(s.island).toBe(3);
    expect(s.weapons.training).toBeUndefined();
    expect(s.loadout).toMatchObject({ weapons: ['blade'], target: 'tuskling' });
    expect(E.isUnlocked(s, 'gorehorn')).toBe(false);
    win(s, 'tuskling');
    expect(s.island).toBe(4);
    expect(s.weapons.maul).toBeTruthy();
    s.loadout.weapons = ['blade', 'maul'];
    expect(E.advanceIsland(s, { loadout: true })).toBe(true);
    expect(s.island).toBe(5);
    win(s, 'burrowmole');
    expect(s.island).toBe(6);
    expect(E.shopOpen(s)).toBe(true);
    expect(E.buyItem(s, 'salve', 1)).toContain('Snare');
    expect(s.island).toBe(7);
    expect(s.loadout.item).toBe('salve');
    expect(s.items.snare).toBeGreaterThanOrEqual(1);
    win(s, 'tuskling');
    expect(E.islandDone(s)).toBe(true);
    expect(s.loadout.weapons).toEqual(['blade', 'maul']);
    expect(E.isUnlocked(s, 'gorehorn')).toBe(true);
  });
  it('each hunt shows what the island has taught by then', () => {
    const s = E.newPlayerSave();
    const show = (step: number, mid: string) => { s.island = step; s.loadout.target = mid; s.weapons = { blade: { lv: 0 }, maul: { lv: 0 } }; s.loadout.weapons = step >= 4 ? ['blade', 'maul'] : ['blade']; return E.startHunt(s, 1).show; };
    expect(show(3, 'tuskling')).toEqual(expect.arrayContaining(['intent', 'block', 'parts']));
    expect(show(3, 'tuskling')).not.toContain('swap');
    expect(show(5, 'burrowmole')).toEqual(expect.arrayContaining(['swap', 'reroll', 'daze', 'rend']));
    expect(show(7, 'tuskling')).toEqual(expect.arrayContaining(['item', 'capture', 'flow']));
  });
  it('the Burrowmole digs in, only a maul reaches it, and a maul hit drives it up', () => {
    const s = E.newPlayerSave(); s.island = 5; s.weapons = { blade: { lv: 0 }, maul: { lv: 0 } }; s.loadout.weapons = ['blade', 'maul']; s.loadout.target = 'burrowmole';
    const h = E.startHunt(s, 2);
    h.intent = 'dig'; E.endTurn(h);
    expect(h.mon.under).toBe(true);
    expect(E.canHit(h, E.currentWeapon(h))).toBe(false);
    h.dice = h.dice.map(() => ({ face: 'C' as const, used: null }));
    E.swap(h, [0]);
    expect(E.currentWeapon(h).type).toBe('Blunt');
    E.useMove(h, 0);
    expect(h.mon.under).toBe(false);
  });
  it('old saves and skipped players are done; skipping kits you out', () => {
    expect(E.islandDone(E.newSave())).toBe(true);
    expect(E.islandDone(E.loadSave({ ...E.newSave(), island: undefined }))).toBe(true);
    const s = E.newPlayerSave(); E.skipIsland(s);
    expect(E.islandDone(s)).toBe(true);
    expect(s.loadout.weapons).toEqual(['blade', 'maul']);
    expect(s.items.salve).toBeGreaterThan(0);
  });
  it('a save mid-island keeps its one weapon through a reload', () => {
    const s = E.newPlayerSave();
    const t = E.loadSave(JSON.parse(JSON.stringify(s)));
    expect(Object.keys(t.weapons)).toEqual(['training']);
    expect(t.island).toBe(0);
  });
  it('the Training Blade never shows at the Forge and the Hunter’s Blade still reinforces with Gorehorn hide', () => {
    expect(E.TREES.flatMap(t => t.nodes.map(n => n[0]))).not.toContain('training');
    expect(Object.keys(E.reinforceCost(0, 'w', 'blade'))).toContain('hide');
  });
});

describe('the Burrowmole lesson order', () => {
  it('digs in on its second turn and can’t be finished before it has dug in once', () => {
    const s = E.newPlayerSave(); s.island = 5; s.weapons = { blade: { lv: 0 }, maul: { lv: 0 } }; s.loadout.weapons = ['blade', 'maul']; s.loadout.target = 'burrowmole';
    const h = E.startHunt(s, 9);
    expect(h.intent).toBe('scratch');
    h.mon.hp = 5; h.dice = h.dice.map(() => ({ face: 'C' as const, used: null }));
    E.useMove(h, 0);
    expect(h.mon.hp).toBe(1);
    expect(h.over).toBeFalsy();
    E.endTurn(h);
    expect(h.intent).toBe('dig');
    E.endTurn(h);
    expect(h.mon.under).toBe(true);
    expect(h.intent).toBe('bite');
  });
});
