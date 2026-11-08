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
  it('the whole ladder: Cragling, Rimekit, blade and maul, Tuskling, two practice hunts, vest, salve, exam', () => {
    const s = E.newPlayerSave();
    win(s, 'scuttlehog');
    expect(s.island).toBe(1);
    expect(s.mats.tuft).toBe(2);
    expect(E.isUnlocked(s, 'snapclaw')).toBe(true);
    win(s, 'snapclaw');
    expect(s.island).toBe(2);
    expect(E.forgeOpen(s)).toBe(true);
    expect(E.shopOpen(s)).toBe(false);
    expect(E.recipeState(s, 'w', 'blade').cls).toBe('ready');
    expect(E.forgeDo(s, 'w', 'blade')).toBeTruthy();
    expect(s.island).toBe(3);
    expect(s.weapons.training).toBeUndefined();
    expect(s.loadout).toMatchObject({ weapons: ['blade', 'maul'], target: 'tuskling' });
    expect(E.twoWeapons(s)).toBe(true);
    expect(E.isUnlocked(s, 'gorehorn')).toBe(false);
    win(s, 'tuskling');
    expect(s.island).toBe(4);
    expect(s.mats.tuskhide).toBeGreaterThanOrEqual(2); // enough for the vest, always
    expect(E.isUnlocked(s, 'burrowmole') && E.isUnlocked(s, 'gustmarmot')).toBe(true);
    expect(s.loadout.target).toBe('burrowmole');
    win(s, 'burrowmole');
    expect(s.island).toBe(4); // both practice hunts are needed
    expect(s.loadout.target).toBe('gustmarmot');
    win(s, 'gustmarmot');
    expect(s.island).toBe(5);
    expect(E.shopOpen(s)).toBe(true);
    expect(E.isUnlocked(s, 'gorehorn')).toBe(false);
    expect(E.forgeDo(s, 'a', 'hidevest')).toBeTruthy();
    expect(s.island).toBe(6);
    expect(s.loadout.armor).toBe('hidevest');
    expect(E.buyItem(s, 'salve', 1)).toContain('item slot');
    expect(s.island).toBe(7);
    expect(s.loadout.item).toBe('salve');
    expect(E.onExam(s)).toBe(true);
    expect(E.isUnlocked(s, 'gorehorn')).toBe(true);
    expect(s.loadout.target).toBe('gorehorn');
    expect(E.startHunt(s, 3).exam).toBe(true);
    const h = win(s, 'gorehorn');
    expect(h.reward?.rankUp).toBe('F');
    expect(E.islandDone(s)).toBe(true);
    expect(s.loadout.weapons).toEqual(['blade', 'maul']);
  });
  it('get ready skips what you already have: a vest made in practice, a salve made from Hatchling Down', () => {
    const s = E.newPlayerSave();
    s.island = 4; s.weapons = { blade: { lv: 0 }, maul: { lv: 0 } }; s.loadout.weapons = ['blade', 'maul']; s.coin = 300; s.mats.tuskhide = 2; s.mats.tuft = 3;
    expect(E.forgeDo(s, 'a', 'hidevest')).toBeTruthy();
    expect(s.island).toBe(4);
    expect(s.loadout.armor).toBe('hidevest');
    win(s, 'gustmarmot'); win(s, 'burrowmole');
    expect(s.island).toBe(6); // the vest step is skipped
    expect(E.craftItem(s, 'salve')).toContain('item slot');
    expect(s.island).toBe(7);
  });
  it('old 16-step saves move onto the new steps', () => {
    const at = (old: number, extra: Partial<E.Save> = {}) => { const s = { ...E.newPlayerSave(), ...extra, island: old } as any; delete s.islandV; return E.loadSave(JSON.parse(JSON.stringify(s))); };
    expect(at(0).island).toBe(0);
    expect(at(2).island).toBe(2);
    const t = at(4, { weapons: { blade: { lv: 0 }, maul: { lv: 0 } } });
    expect(t.island).toBe(3);
    expect(t.loadout.weapons).toEqual(['blade', 'maul']);
    expect(at(9, { weapons: { blade: { lv: 0 }, maul: { lv: 0 } } }).island).toBe(4);
    expect(at(9, { weapons: { blade: { lv: 0 }, maul: { lv: 0 } }, armors: { leather: { lv: 0 }, hidevest: { lv: 0 } }, record: { burrowmole: { hunts: 1, wins: 1, captures: 0, breaks: {} }, gustmarmot: { hunts: 1, wins: 1, captures: 0, breaks: {} } } }).island).toBe(6);
    expect(at(14, { weapons: { blade: { lv: 0 }, maul: { lv: 0 } } }).island).toBe(6);
    expect(at(15, { weapons: { blade: { lv: 0 }, maul: { lv: 0 } } }).island).toBe(7);
    expect(E.islandDone(at(16))).toBe(true);
    // a new save isn't moved twice
    const n = E.newPlayerSave(); n.island = 3;
    expect(E.loadSave(JSON.parse(JSON.stringify(n))).island).toBe(3);
  });
  it('each hunt shows what the island has taught by then', () => {
    const s = E.newPlayerSave();
    const show = (step: number, mid: string) => { s.island = step; s.loadout.target = mid; s.weapons = { blade: { lv: 0 }, maul: { lv: 0 } }; s.loadout.weapons = ['blade', 'maul']; return E.startHunt(s, 1).show; };
    expect(show(0, 'scuttlehog')).toEqual(expect.arrayContaining(['intent', 'reroll']));
    expect(show(3, 'tuskling')).toEqual(expect.arrayContaining(['intent', 'block', 'parts', 'swap']));
    expect(show(3, 'tuskling')).not.toContain('daze');
    expect(show(4, 'burrowmole')).toEqual(expect.arrayContaining(['swap', 'reroll', 'daze', 'rend']));
    expect(show(4, 'burrowmole')).not.toContain('charge');
    expect(show(4, 'burrowmole')).not.toContain('capture');
  });
  it('a replayed lesson starts from a copy of a new player at that step', () => {
    expect(E.lessonSave(0).island).toBe(0);
    expect(E.lessonSave(2)).toMatchObject({ island: 3, loadout: { target: 'tuskling', weapons: ['blade', 'maul'] } });
    const g = E.lessonSave(3); expect(g.island).toBe(5);
    expect(E.forgeDo(g, 'a', 'hidevest')).toBeTruthy();
    expect(E.buyItem(g, 'salve', 1)).toBeTruthy();
    expect(g.island).toBe(7);
  });
  it('the Burrowmole digs in, only a maul reaches it, and a maul hit drives it up', () => {
    const s = E.newPlayerSave(); s.island = 4; s.weapons = { blade: { lv: 0 }, maul: { lv: 0 } }; s.loadout.weapons = ['blade', 'maul']; s.loadout.target = 'burrowmole';
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
    const s = E.newPlayerSave(); s.island = 4; s.weapons = { blade: { lv: 0 }, maul: { lv: 0 } }; s.loadout.weapons = ['blade', 'maul']; s.loadout.target = 'burrowmole';
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
