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
  it('steps: Scuttlehog, Snapclaw, the Hunter’s Blade; then the Ridge opens with the maul', () => {
    const s = E.newPlayerSave();
    win(s, 'scuttlehog');
    expect(s.island).toBe(1);
    expect(E.isUnlocked(s, 'snapclaw')).toBe(true);
    win(s, 'snapclaw');
    expect(s.island).toBe(2);
    expect(E.forgeOpen(s)).toBe(true);
    expect(s.mats.shell).toBeGreaterThanOrEqual(2);
    expect(E.recipeState(s, 'w', 'blade').cls).toBe('ready');
    expect(E.forgeDo(s, 'w', 'blade')).toContain('Ashfall Ridge is open');
    expect(E.islandDone(s)).toBe(true);
    expect(s.weapons.maul).toBeTruthy();
    expect(s.loadout.weapons).toEqual(['blade', 'maul']);
    expect(E.isUnlocked(s, 'gorehorn')).toBe(true);
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
