import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';

const ready = (bounty: string, target: string) => {
  const s = E.newSave();
  s.record[target] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.loadout = { ...s.loadout, target, bounty };
  return s;
};
const win = (h: E.Hunt) => { h.mon.hp = 0; h.over = 'win'; };

describe('the bounty board', () => {
  it('every bounty names a real monster, real parts and a real reward material', () => {
    for (const b of Object.values(E.BOUNTIES)) {
      const M = E.MONSTERS[b.mon]; expect(M).toBeTruthy();
      for (const g of b.goals) if (g.k === 'break') expect(M.parts.some(p => p.id === g.part)).toBe(true);
      if (b.reward.mat) expect(E.MATERIALS[b.reward.mat]).toBeTruthy();
      expect(E.bountiesFor(b.mon).length).toBe(3);
    }
  });
  it('only opens once its monster is beaten, and only once', () => {
    const s = E.newSave();
    expect(E.bountyOpen(s, 'gore2')).toBe(false);
    s.record.gorehorn = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    expect(E.bountyOpen(s, 'gore2')).toBe(true);
    s.bounties.gore2 = true;
    expect(E.bountyOpen(s, 'gore2')).toBe(true); // done bounties can be repeated
    expect(E.bountyPay(s, 'gore2')).toEqual({ coin: 60, repeat: true });
  });
  it('pays coin and (hard ones) the rare material on a win that meets every goal; a repeat pays half the coin and no rare', () => {
    const s = ready('gore3', 'gorehorn');
    s.weapons = { blade: { lv: 0 }, bow: { lv: 0 } }; s.loadout.weapons = ['blade', 'bow'];
    const h = E.startHunt(s, 1);
    expect(h.bounty).toBe('gore3');
    h.mon.parts.tusks.broken = true; win(h);
    const coin = s.coin;
    E.settleHunt(s, h);
    expect(h.reward!.bounty).toMatchObject({ met: true, mat: 'heartstone', repeat: false });
    expect(s.mats.heartstone).toBeGreaterThanOrEqual(1);
    expect(s.coin - coin).toBe(h.reward!.coin + 250);
    expect(s.bounties.gore3).toBe(true); expect(s.loadout.bounty).toBeNull();
    s.loadout.bounty = 'gore3';
    const again = E.startHunt(s, 2); expect(again.bounty).toBe('gore3');
    again.mon.parts.tusks.broken = true; win(again);
    const coin2 = s.coin, hs = s.mats.heartstone;
    E.settleHunt(s, again);
    expect(again.reward!.bounty).toMatchObject({ met: true, repeat: true, coin: 125 });
    expect(again.reward!.bounty!.mat).toBeUndefined();
    expect(s.coin - coin2).toBe(again.reward!.coin + 125);
    expect(s.mats.heartstone - hs).toBe(again.reward!.mats.heartstone ?? 0);
  });
  it('says which goal was missed', () => {
    const s = ready('gore3', 'gorehorn'); // starter loadout carries the maul: Blunt is banned
    expect(E.loadoutBreaks(s)).toContain('Blunt');
    const h = E.startHunt(s, 3); win(h); E.settleHunt(s, h);
    expect(h.reward!.bounty).toMatchObject({ met: false, missed: 'Bring no Blunt weapon' });
    expect(s.loadout.bounty).toBe('gore3'); // still taken: try again
  });
  it('tracks goals live: turns and damage fail as soon as they are exceeded', () => {
    const h = E.startHunt(ready('gore2', 'gorehorn'), 4);
    const g = E.BOUNTIES.gore2.goals[0];
    expect(E.goalState(h, g)).toBe('open');
    h.turn = 9; expect(E.goalState(h, g)).toBe('failed');
  });
  it('Not on the menu fails once you are swallowed', () => {
    const s = ready('bog1', 'bogjaw');
    for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    const h = E.startHunt(s, 5);
    E.swallowPlayer(h, 2);
    expect(E.goalState(h, E.BOUNTIES.bog1.goals[0])).toBe('failed');
  });
  it('the bounty charms unlock by different bounties completed (3 / 6 / 10), then craft for coin', () => {
    const s = E.newSave(); s.coin = 1000;
    expect(E.recipeOf(s, 'c', 'scoutcharm').locked).toBe(true);
    expect(E.recipeState(s, 'c', 'scoutcharm').text).toMatch(/Complete 3 bounties/);
    for (const id of ['gore1', 'gore2', 'gale1']) s.bounties[id] = true;
    expect(E.recipeOf(s, 'c', 'scoutcharm').action).toBe('craft');
    expect(E.recipeOf(s, 'c', 'salvagecharm').locked).toBe(true);
    expect(E.nextBountyCharm(s)).toMatchObject({ id: 'salvagecharm', need: 6 });
    expect(E.forgeDo(s, 'c', 'scoutcharm')).toMatch(/Tracker/);
  });
  it('old saves: leftover seals become coin (save v9)', () => {
    const old = { ...E.newSave(), version: 8, coin: 100, mats: { seal: 5, hide: 2 } };
    const s = E.loadSave(JSON.parse(JSON.stringify(old)));
    expect(s.coin).toBe(300); expect(s.mats.seal).toBeUndefined(); expect(s.mats.hide).toBe(2);
  });
  it('a v6 save gains an empty bounty record', () => {
    const v6 = { ...E.newSave(), version: 6 } as Record<string, unknown>; delete v6.bounties;
    const s = E.loadSave(v6);
    expect(s.bounties).toEqual({}); expect(s.version).toBe(E.SAVE_VERSION);
  });
});

describe('full-game achievements', () => {
  it('Bounty hunter on the first bounty; Gut check and Two heads down from hunt feats', () => {
    const s = E.newSave(); s.bounties = { gore2: true };
    expect(E.award(s)).toContain('FIRST_BOUNTY');
    const h = E.startHunt(E.newSave(), 1); h.feats = ['escape', 'reelboth'];
    const got = E.award(E.newSave(), h);
    expect(got).toContain('GUT_CHECK'); expect(got).toContain('TWO_HEADS');
  });
});
