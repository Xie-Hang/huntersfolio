// Counter stances (Nov 2026): a telegraphed turn that punishes one obvious play, so the right hit depends on the
// monster's stance as well as on your dice. Each punishment is one-off and, like a burn, never knocks you out.
import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';

const hunt = (target: string, weapons: string[]) => {
  const s = E.newSave(); for (const id of Object.keys(E.MONSTERS)) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.weapons = Object.fromEntries(weapons.map(w => [w, { lv: 0 }]));
  s.loadout = { ...s.loadout, weapons, target };
  const h = E.startHunt(s, 3); h.php = h.pmax = 999; return h;
};
const dice = (h: E.Hunt, faces: string) => { h.dice = [...faces].map(face => ({ face, used: null })) as never; };
const anyMove = (h: E.Hunt) => E.currentWeapon(h).moves.findIndex((_, i) => E.canUseMove(h, i));

describe('counter stances', () => {
  it('each Ashfall Ridge monster and the Cragwing has its stance in its cycle', () => {
    const want: Record<string, string> = { gorehorn: 'bristle', galeshrike: 'feint', rimetail: 'mirror', cragwing: 'brace' };
    for (const [mid, st] of Object.entries(want)) {
      const h = hunt(mid, ['blade', 'bow']); const seen = new Set<string>();
      for (let i = 0; i < 12 && !h.over; i++) { seen.add(h.intent); E.endTurn(h); }
      expect(seen, mid).toContain(st);
    }
  });
  it('Bristle Up: the first hit on the Hide strikes back 20, once; the Tusks are safe', () => {
    const h = hunt('gorehorn', ['blade', 'bow']); h.intent = 'bristle';
    h.target = 'tusks'; dice(h, 'CCCCTTTT'); E.useMove(h, anyMove(h)); expect(h.php).toBe(999);
    h.target = 'hide'; E.useMove(h, anyMove(h)); expect(h.php).toBe(979);
    E.useMove(h, anyMove(h)); expect(h.php).toBe(979);
  });
  it('a stance never knocks you out', () => {
    const h = hunt('gorehorn', ['blade', 'bow']); h.intent = 'bristle'; h.php = 5; h.target = 'hide';
    dice(h, 'CCCCTTTT'); E.useMove(h, anyMove(h)); expect(h.php).toBe(1); expect(h.over).toBeFalsy();
  });
  it('Feint: the first Cut hit is sidestepped, Pierce is not', () => {
    const h = hunt('galeshrike', ['blade', 'bow']); h.intent = 'feint'; dice(h, 'CCCCTTTT');
    const hp = h.mon.hp; E.useMove(h, anyMove(h)); expect(h.mon.hp).toBe(hp);
    E.useMove(h, anyMove(h)); expect(h.mon.hp).toBeLessThan(hp);
    const g = hunt('galeshrike', ['bow', 'blade']); g.intent = 'feint'; dice(g, 'CCCCTTTT');
    const ghp = g.mon.hp; E.useMove(g, anyMove(g)); expect(g.mon.hp).toBeLessThan(ghp);
  });
  it('Ice Mirror: a hit of 40 or more is halved and the shards hit back 12; small hits pass', () => {
    const h = hunt('rimetail', ['maul', 'bow']); h.intent = 'mirror'; h.mon.plating = 0;
    expect(E.monsterOf(h).absorb!(h, 60, E.currentWeapon(h))).toEqual({ dmg: 30, note: 'ice mirror ½' });
    expect(h.php).toBe(987);
    expect(E.monsterOf(h).absorb!(h, 30, E.currentWeapon(h))).toBeNull();
  });
  it('Slate Brace: Horn and Back hits deal half and the Wings are exposed', () => {
    const h = hunt('cragwing', ['blade', 'bow']); h.mon.seq = 4;
    expect(E.monsterOf(h).next(h, h.intent)).toBe('brace'); h.intent = 'brace';
    expect(h.mon.parts.wings.exposed).toBeGreaterThan(0);
    expect(E.monsterOf(h).hitMod!(h, 'horn', E.currentWeapon(h))?.mult).toBe(0.5);
    expect(E.monsterOf(h).hitMod!(h, 'wings', E.currentWeapon(h))).toBeNull();
  });
});
