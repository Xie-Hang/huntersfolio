// Regressions from the Nov 2026 bug hunt (a fresh-eyes code review plus fuzzing). One test per bug.
import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';
import { BOUNTIES } from '../src/engine/data/bounties';

const RIDGE = ['gorehorn', 'galeshrike', 'cinderback', 'rimetail'];
const win = (s: E.Save, ids: string[]) => { for (const id of ids) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} }; };
const hunt = (target: string, weapons: string[], extra: (s: E.Save) => void = () => {}) => {
  const s = E.newSave(); win(s, Object.keys(E.MONSTERS));
  s.weapons = Object.fromEntries(weapons.map(w => [w, { lv: 0 }]));
  s.loadout = { ...s.loadout, weapons, target };
  extra(s);
  const h = E.startHunt(s, 3); h.php = h.pmax = 999; return { s, h };
};
const dice = (h: E.Hunt, faces: string) => { h.dice = [...faces].map(face => ({ face, used: null })) as never; };
const lastLog = (h: E.Hunt) => h.log.map(l => l.t).join(' | ');

describe('Nov 2026 bug hunt', () => {
  it('a Pinning Shot still grounds a plated Cragwing (the slate takes the damage, not the pin)', () => {
    const { h } = hunt('cragwing', ['bow', 'maul']);
    h.mon.air = true; h.mon.airLeft = 2; h.mon.plating = 2; h.intent = 'gust';
    dice(h, 'CTTB'); E.useMove(h, E.currentWeapon(h).moves.findIndex(m => m.pin));
    expect(h.mon.air).toBe(false); expect(h.intent).toBe('crashed'); expect(h.mon.plating).toBe(1);
  });

  it('a heavy Blunt hit still drives a plated Cragwing up out of the scree', () => {
    const { h } = hunt('cragwing', ['maul', 'bow']);
    h.mon.under = true; h.mon.plating = 2; h.intent = 'rockburst';
    dice(h, 'CTCC'); E.useMove(h, 1);
    expect(h.mon.under).toBe(false); expect(h.intent).toBe('unearthed');
  });

  it('a Sovereign dazed in the air comes down', () => {
    const { h } = hunt('sovereign', ['blade', 'maul']);
    h.mon.air = true; h.mon.airLeft = 2; h.intent = 'dazed'; h.guard = 999;
    E.endTurn(h); expect(h.mon.air).toBe(false);
  });

  it('a Cinderback or Quakeback dazed underground keeps to its underground moves', () => {
    const c = hunt('cinderback', ['blade', 'maul']).h; c.mon.under = true; c.intent = 'dazed'; c.guard = 999;
    E.endTurn(c); expect(c.intent).toBe('erupt');
    const q = hunt('quakeback', ['blade', 'maul']).h; q.mon.under = true; q.mon.charges = 0; q.intent = 'dazed'; q.guard = 999;
    E.endTurn(q); expect(q.intent).toBe('tremor');
  });

  it('breaking the throat sac on the Swallow turn turns it into a Snap', () => {
    for (const mid of ['bogjaw', 'feverjaw', 'fenmother']) {
      const { h } = hunt(mid, ['blade', 'maul']);
      h.intent = 'swallow'; h.mon.parts.sac.hp = 1; h.target = 'sac';
      dice(h, 'CCTB'); E.useMove(h, 0);
      expect(h.mon.parts.sac.broken, mid).toBe(true); expect(h.intent, mid).toBe('snap');
      h.guard = 999; E.endTurn(h); expect(h.mon.gut ?? 0, mid).toBe(0);
    }
  });

  it('older saves past Ashfall Ridge are rank E, so the Gloamhollow stays open', () => {
    const s = E.newSave(); win(s, [...RIDGE, 'arcmoth']);
    expect(E.hunterRank(s)).toBe('E'); expect(E.isUnlocked(s, 'rotcap')).toBe(true);
  });

  it('the Ashtail’s loss fact says how its scales actually break', () => {
    const { s, h } = hunt('ashtail', ['blade', 'maul'], s => { s.record.ashtail = { hunts: 3, wins: 0, captures: 0, breaks: {} }; });
    const f = E.lossFacts(h, s).join(' ');
    expect(f).toContain('Pierce or Frost'); expect(f).not.toContain('One Cut hit');
  });

  it('a repeat bounty you took survives a restart', () => {
    const id = Object.keys(BOUNTIES)[0], s = E.newSave(); win(s, Object.keys(E.MONSTERS));
    s.bounties[id] = 1 as never; s.loadout = { ...s.loadout, bounty: id };
    expect(E.loadSave(JSON.parse(JSON.stringify(s))).loadout.bounty).toBe(id);
  });

  it('“Promoted!” only when the hunt changes your rank', () => {
    const fresh = E.newSave(); win(fresh, RIDGE); fresh.loadout = { ...fresh.loadout, target: 'cragwing' };
    const a = E.startHunt(fresh, 1); a.over = 'win'; E.settleHunt(fresh, a); expect(a.reward?.rankUp).toBe('E');
    const veteran = E.newSave(); win(veteran, [...RIDGE, 'bogjaw', 'monolith']); veteran.loadout = { ...veteran.loadout, target: 'cragwing' };
    expect(E.hunterRank(veteran)).toBe('D');
    const b = E.startHunt(veteran, 1); b.over = 'win'; E.settleHunt(veteran, b); expect(b.reward?.rankUp).toBeUndefined();
  });

  it('the capture-blocked line says underground when it is underground', () => {
    const { h } = hunt('cragwing', ['blade', 'maul']);
    h.mon.under = true; h.mon.hp = Math.floor(h.mon.max * 0.1); h.snares = 2; dice(h, 'CCTB');
    expect(E.capture(h, [0, 1])).toBe(false); expect(lastLog(h)).toContain('underground');
  });

  it('a free swap never spends a die, even with one selected', () => {
    const { h } = hunt('gorehorn', ['blade', 'maul'], s => { s.armors = { cragmail: { lv: 0 } }; s.loadout.armor = 'cragmail'; });
    dice(h, 'CCTB'); expect(E.swap(h, [0])).toBe(true);
    expect(h.dice[0].used).toBeNull(); expect(h.swapOnceUsed).toBe(true);
  });
});
