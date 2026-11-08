// The 9 Nov 2026 text audit (Mekkman): breaking a part does what its text says, and the achievements match their text.
import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';

const ready = (target: string) => {
  const s = E.newSave();
  for (const id of Object.keys(E.MONSTERS)) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.loadout = { ...s.loadout, target };
  return E.startHunt(s, 3);
};
const breakNow = (h: E.Hunt, part: string) => { h.mon.parts[part].broken = true; return E.MONSTERS[h.mid].onBreak?.(h, part, E.currentWeapon(h)); };

describe('Breaking parts does what the text says', () => {
  it('Emberwhelk and Bloodwhelk: broken gills stop the Shell Retreat heal', () => {
    for (const id of ['emberwhelk', 'bloodwhelk']) {
      const h = ready(id); h.mon.hp = 100; h.mon.parts.gills.broken = true;
      E.MONSTERS[id].resolve(h, 'retreat', false);
      expect(h.mon.hp, id).toBe(100);
      expect(E.MONSTERS[id].intent(h, 'retreat').note, id).not.toMatch(/heals/);
    }
  });
  it('Feverjaw: breaking its warts stops a belch already coming', () => {
    const h = ready('feverjaw'); h.intent = 'belch';
    breakNow(h, 'warts');
    expect(h.intent).toBe('fizzle');
    expect(E.intentInfo(h).dmg).toBe(0);
  });
  it('Quakeback: breaking its claws while it is about to dig keeps it above ground', () => {
    const h = ready('quakeback'); h.intent = 'burrow';
    breakNow(h, 'claws');
    E.endTurn(h);
    expect(h.mon.under).toBe(false);
    expect(h.intent).not.toBe('tremor');
  });
  it('Slagwyrm in Meltdown: no text promises the Eruption can be stopped', () => {
    const h = ready('slagwyrm'); h.mon.melt = true;
    expect(E.MONSTERS.slagwyrm.intent(h, 'eruption').note ?? '').not.toMatch(/stops/);
    expect(E.MONSTERS.slagwyrm.intent(h, 'stoke').note ?? '').not.toMatch(/stops/);
  });
});

describe('Achievements match their text', () => {
  const ach = (id: string) => E.ACHIEVEMENTS.find(a => a.id === id)!;
  it('Fresh from the forge needs something made, not the Training Blade and maul you are given', () => {
    const s = E.newPlayerSave(); s.weapons.maul = { lv: 0 };
    expect(ach('FIRST_FORGE').save!(s)).toBe(false);
    s.weapons.blade = { lv: 0 };
    expect(ach('FIRST_FORGE').save!(s)).toBe(true);
  });
  it('Grounded, Unearthed and Shatter count only the monster they name', () => {
    for (const [id, feat, mid, other] of [['GROUNDED', 'grounded', 'galeshrike', 'cragwing'], ['UNEARTHED', 'unearthed', 'cinderback', 'quakeback'], ['SHATTER', 'shatter', 'rimetail', 'cragwing']]) {
      const h = ready(mid); h.feats = [feat];
      expect(ach(id).hunt!(h, E.newSave()), id).toBe(true);
      const o = ready(other); o.feats = [feat];
      expect(ach(id).hunt!(o, E.newSave()), id + ' on ' + other).toBe(false);
    }
  });
});

describe('Blanks and the Bristlehide Vest (9 Nov 2026)', () => {
  it('a blank blocks the same as any die', () => {
    const h = ready('gorehorn'); h.dice = [{ face: 'B', used: null }, { face: 'C', used: null }] as never;
    expect(E.guardOf(h, 0)).toBe(E.guardOf(h, 1));
  });
  it('the Bristlehide Vest hits back for 15 when its attack is fully blocked', () => {
    const s = E.newSave();
    for (const id of Object.keys(E.MONSTERS)) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    s.armors = { ...s.armors, vest: { lv: 0 } }; s.loadout = { ...s.loadout, armor: 'vest', target: 'gorehorn' };
    const h = E.startHunt(s, 3); h.guard = 999; const hp = h.mon.hp;
    while (E.intentInfo(h).dmg === 0) { h.guard = 0; E.endTurn(h); h.guard = 999; }
    const before = h.mon.hp; E.endTurn(h);
    expect(hp).toBeGreaterThan(0); expect(before - h.mon.hp).toBe(E.BRISTLE_BACK);
  });
});

describe('Squallhorn: Pinned', () => {
  it('a pin while it gathers stops the gather: no hit and no Wind gained', () => {
    const h = ready('squallhorn'); h.intent = 'gather'; h.mon.wind = 1;
    const line = E.MONSTERS.squallhorn.onPin!(h);
    expect(line).toBeTruthy(); expect(h.intent).toBe('pinned');
    const hp = h.php; E.endTurn(h);
    expect(h.php).toBe(hp); expect(h.mon.wind).toBe(1);
  });
});
