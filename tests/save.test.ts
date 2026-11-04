import { describe, it, expect } from 'vitest';
import { loadSave, isNewerSave, startHunt, SAVE_VERSION } from '../src/engine';

describe('damaged and foreign saves', () => {
  it('flags a save from a newer build so it is never overwritten', () => {
    expect(isNewerSave({ version: SAVE_VERSION + 1 })).toBe(true);
    expect(isNewerSave({ version: SAVE_VERSION })).toBe(false);
    expect(isNewerSave(null)).toBe(false);
  });
  it('repairs junk: non-numbers, negative counts, bad records, a broken loadout', () => {
    const s = loadSave({ version: SAVE_VERSION, coin: 'lots', items: { salve: -5 }, mats: { tusk: 'x' }, record: { gorehorn: 'yes', galeshrike: { wins: 2 } },
      weapons: { blade: { lv: 0 } }, loadout: { weapons: 'blade', armor: 'nope' } });
    expect(s.coin).toBe(100);
    expect(s.items.salve).toBe(0);
    expect(s.mats.tusk).toBe(0);
    expect(s.record.gorehorn).toBeUndefined();
    expect(s.record.galeshrike.wins).toBe(2);
    expect(s.loadout.weapons).toEqual(['blade', 'maul']);
    expect(s.armors[s.loadout.armor]).toBeTruthy();
    expect(() => startHunt(s, 1)).not.toThrow();
  });
  it('drops loadout weapons the player no longer owns, and never leaves fewer than two', () => {
    const s = loadSave({ version: SAVE_VERSION, weapons: { blade: { lv: 0 } }, loadout: { weapons: ['blade', 'bow'] } });
    expect(s.loadout.weapons).toEqual(['blade', 'maul']);
    expect(() => startHunt(s, 1)).not.toThrow();
  });
});
