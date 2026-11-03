import { describe, expect, it } from 'vitest';
import * as E from '../src/engine';
import { playHunt } from '../src/sim/bot';

const starter = () => E.newSave();

describe('hunts are deterministic', () => {
  it('replays exactly from the same seed', () => {
    const a = playHunt(E.startHunt(starter(), 42), { skill: 'skilled', capture: true });
    const b = playHunt(E.startHunt(starter(), 42), { skill: 'skilled', capture: true });
    expect(a.log).toEqual(b.log);
    expect(a.over).toBe(b.over);
  });
});

describe('average damage shown on weapons', () => {
  it('matches the tuned values', () => {
    expect(E.avgDmg(E.WEAPONS.blade.moves)).toBe(30);
    expect(E.avgDmg(E.WEAPONS.maul.moves)).toBe(33);
    expect(E.avgDmg(E.WEAPONS.bow.moves)).toBe(29);
    expect(E.avgDmg(E.movesAt('tusk', 0))).toBe(42);
  });
});

describe('items', () => {
  it('carried charges leave the stash and return on a win', () => {
    const s = starter();
    const h = E.startHunt(s, 7);
    expect(s.items.salve).toBe(0);
    expect(h.itemCharges).toBe(3);
    h.mon.hp = 1; E.useMove(h, 0) ?? E.guard(h, [0]);
    if (h.over !== 'win') { h.over = 'win'; }
    E.settleHunt(s, h);
    expect(s.items.salve).toBe(h.itemCharges);
  });
  it('a failed hunt loses the carried charges', () => {
    const s = starter();
    const h = E.startHunt(s, 7);
    E.abandon(h); E.settleHunt(s, h);
    expect(s.items.salve).toBe(0);
    expect(h.reward?.lost).toBe(3);
  });
});

describe('Gorehorn', () => {
  it('a Pinning Shot during the wind-up cancels the charge', () => {
    const s = starter(); s.weapons = { bow: { lv: 0 }, maul: { lv: 0 } }; s.loadout.weapons = ['bow', 'maul'];
    const h = E.startHunt(s, 1);
    h.intent = 'windup';
    h.dice = [{ face: 'C', used: null }, { face: 'T', used: null }, { face: 'T', used: null }, { face: 'B', used: null }];
    expect(E.useMove(h, 2)).not.toBeNull();
    expect(h.intent).toBe('pinned');
  });
  it('only Blunt (Best) and Pierce (Half) count toward breaking the tusks', () => {
    const s = starter(); const h = E.startHunt(s, 3);
    h.target = 'tusks'; h.dice = [{ face: 'C', used: null }, { face: 'T', used: null }, { face: 'C', used: null }, { face: 'B', used: null }];
    E.useMove(h, 1); // blade Cleave
    expect(h.mon.parts.tusks.hp).toBe(h.mon.parts.tusks.max);
  });
});

describe('Galeshrike', () => {
  it('airborne: Cut deals half damage and cannot reach the crest; a net grounds it', () => {
    const s = starter(); s.loadout.target = 'galeshrike'; s.items.net = 2; s.loadout.item = 'net';
    const h = E.startHunt(s, 5);
    h.mon.air = true; h.intent = 'gust'; h.target = 'crest';
    h.dice = [{ face: 'C', used: null }, { face: 'B', used: null }, { face: 'B', used: null }, { face: 'B', used: null }];
    const hit = E.useMove(h, 0)!; // Slash 12 → 6 airborne
    expect(hit.dmg).toBe(6);
    expect(h.mon.parts.crest.hp).toBe(h.mon.parts.crest.max);
    expect(E.useItem(h)).toBe(true);
    expect(h.mon.air).toBe(false);
    expect(h.intent).toBe('crashed');
  });
  it('gust ignores half your guard', () => {
    const s = starter(); s.loadout.target = 'galeshrike';
    const h = E.startHunt(s, 9); h.intent = 'gust'; h.mon.air = true; h.guard = 16;
    expect(E.incoming(h)!.net).toBe(28 - 8);
  });
});

describe('Cinderback', () => {
  const burrowed = (weapons: string[], item: string | null = null) => {
    const s = starter(); s.weapons = Object.fromEntries(weapons.map(w => [w, { lv: 0 }])); s.loadout = { weapons, armor: 'jerkin', item, target: 'cinderback' };
    if (item) s.items[item] = 2;
    const h = E.startHunt(s, 11); h.mon.under = true; h.intent = 'erupt';
    h.dice = [{ face: 'C', used: null }, { face: 'T', used: null }, { face: 'T', used: null }, { face: 'C', used: null }];
    return h;
  };
  it('underground, Cut and Pierce cannot hit at all', () => {
    const h = burrowed(['blade', 'bow']);
    expect(E.canUseMove(h, 0)).toBe(false);
    expect(E.useMove(h, 0)).toBeNull();
  });
  it('a 2-die Blunt hit drives it up and cancels the eruption; a 1-die hit does not', () => {
    const h = burrowed(['maul', 'blade']);
    expect(E.useMove(h, 0)!.dmg).toBe(6); // Thump 12, half through the ground
    expect(h.intent).toBe('erupt');
    E.useMove(h, 1); // Smash
    expect(h.mon.under).toBe(false);
    expect(h.intent).toBe('unearthed');
  });
  it('Blast Powder forces it up', () => {
    const h = burrowed(['blade', 'bow'], 'blast');
    expect(E.useItem(h)).toBe(true);
    expect(h.intent).toBe('unearthed');
  });
  it('a molten shell burns melee hits but not Pierce, and Kilnplate is immune', () => {
    const h = burrowed(['blade', 'bow']); h.mon.under = false; h.intent = 'venting'; h.mon.molten = 2;
    const hp = h.php; E.useMove(h, 0); expect(h.php).toBe(hp - 5);
    E.swap(h, [1]); const hp2 = h.php; E.useMove(h, 0); expect(h.php).toBe(hp2);
    const k = burrowed(['blade', 'bow']); k.arm = E.armorInst('kilnplate', 0); k.mon.under = false; k.mon.molten = 2;
    const hp3 = k.php; E.useMove(k, 0); expect(k.php).toBe(hp3);
  });
  it('keeps its swipe-swipe-burrow rhythm even when its claws break mid-cycle', () => {
    const s = starter(); s.loadout.target = 'cinderback';
    const h = E.startHunt(s, 5); const seen: string[] = [h.intent];
    for (let t = 0; t < 4; t++) { if (t === 1) h.mon.parts.claws.broken = true; h.php = 999; E.endTurn(h); seen.push(h.intent); }
    expect(seen).toEqual(['swipe', 'swipe', 'swipe', 'burrow', 'erupt']);
  });
});

describe('forge', () => {
  it('an upgrade replaces its parent, keeps reinforcement and updates the loadout', () => {
    const s = starter(); s.coin = 1000; s.mats.tusk = 3; s.mats.hide = 2; s.weapons.maul.lv = 2;
    expect(E.forgeDo(s, 'w', 'tusk')).toMatch(/Tuskbreaker/);
    expect(s.weapons.maul).toBeUndefined();
    expect(s.weapons.tusk.lv).toBe(2);
    expect(s.loadout.weapons).toContain('tusk');
  });
  it('sell surplus keeps what recipes still need', () => {
    const s = starter(); s.mats.tusk = 5;
    E.sellSurplus(s);
    expect(s.mats.tusk).toBe(3); // Tuskbreaker and Crusher each need 3
  });
});

describe('saves', () => {
  it('migrates a browser-prototype save (no version, numeric pity)', () => {
    const proto = { coin: 640, mats: { hide: 4, tusk: 2 }, weapons: { blade: { lv: 1 }, maul: { lv: 0 } }, armors: { jerkin: { lv: 0 } }, items: { salve: 2 }, loadout: { weapons: ['blade', 'maul'], armor: 'jerkin', item: 'salve', target: 'gorehorn' }, pity: 3, hunts: 7 };
    const s = E.loadSave(proto);
    expect(s.version).toBe(E.SAVE_VERSION);
    expect(s.coin).toBe(640);
    expect(s.pity.heartstone).toBe(3);
    expect(s.mats.plume).toBe(0);
    expect(s.weapons.blade.lv).toBe(1);
  });
  it('v1 saves carry Cinderack records over to the Cinderback', () => {
    const s = E.loadSave({ version: 1, coin: 50, record: { cinderack: { hunts: 2, wins: 1, captures: 0, breaks: {} } }, loadout: { weapons: ['blade', 'maul'], armor: 'jerkin', item: null, target: 'cinderack' } });
    expect(s.record.cinderback.hunts).toBe(2);
    expect(s.record.cinderack).toBeUndefined();
    expect(s.loadout.target).toBe('cinderback');
  });
  it('garbage gives a fresh save', () => {
    expect(E.loadSave('nonsense').coin).toBe(100);
    expect(E.loadSave({ version: 999 }).coin).toBe(100);
  });
});
