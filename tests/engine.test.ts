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
    expect(E.avgDmg(E.WEAPONS.bow.moves)).toBe(30); // includes Expose on follow-up arrows
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

describe('Expose (Pierce)', () => {
  it('a Pierce hit exposes the part; the next hit there, from any weapon, gets +15% and double break progress', () => {
    const s = starter(); s.weapons = { bow: { lv: 0 }, blade: { lv: 0 } }; s.loadout.weapons = ['bow', 'blade'];
    const h = E.startHunt(s, 2); h.target = 'hide';
    h.dice = [{ face: 'C', used: null }, { face: 'B', used: null }, { face: 'C', used: null }, { face: 'B', used: null }];
    E.useMove(h, 0); // Quick Shot 12: exposes, gets no bonus itself
    expect(h.mon.parts.hide.exposed).toBe(E.EXPOSE_TURNS);
    expect(h.mon.parts.hide.hp).toBe(240 - 6); // Pierce is Half on the hide
    E.swap(h, [1]);
    const hit = E.useMove(h, 0)!; // Slash 12 → 14 exposed; Cut is Best on the hide, ×2 toward the break
    expect(hit.dmg).toBe(14);
    expect(h.mon.parts.hide.hp).toBe(240 - 6 - 28);
  });
  it('wears off after two turns', () => {
    const s = starter(); const h = E.startHunt(s, 2); h.mon.parts.hide.exposed = E.EXPOSE_TURNS; h.php = 999;
    E.endTurn(h); expect(h.mon.parts.hide.exposed).toBe(1);
    E.endTurn(h); expect(h.mon.parts.hide.exposed).toBe(0);
  });
  it('the average-damage display uses the same bonus as combat', () => {
    expect(E.EXPOSE_DMG_FOR_AVG).toBe(E.EXPOSE_DMG);
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
  it('airborne: only Pierce reaches it (melee can\'t hit at all); a net grounds it', () => {
    const s = starter(); s.loadout.target = 'galeshrike'; s.items.net = 2; s.loadout.item = 'net';
    const h = E.startHunt(s, 5);
    h.mon.air = true; h.intent = 'gust'; h.target = 'crest';
    h.dice = [{ face: 'C', used: null }, { face: 'B', used: null }, { face: 'B', used: null }, { face: 'B', used: null }];
    expect(E.useMove(h, 0)).toBeNull(); // the blade can't reach it
    expect(E.cantHitReason(h, E.currentWeapon(h))).toMatch(/only Pierce/);
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
    const s = starter(); s.weapons = Object.fromEntries(weapons.map(w => [w, { lv: 0 }])); s.loadout = { weapons, armor: 'jerkin', charm: null, item, target: 'cinderback' };
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

describe('Rimetail (ice plating)', () => {
  const plated = (weapons: string[]) => {
    const s = starter(); s.weapons = Object.fromEntries(weapons.map(w => [w, { lv: 0 }])); s.loadout = { weapons, armor: 'jerkin', charm: null, item: null, target: 'rimetail' };
    const h = E.startHunt(s, 4); h.target = 'tail';
    h.dice = [{ face: 'C', used: null }, { face: 'C', used: null }, { face: 'C', used: null }, { face: 'B', used: null }];
    return h;
  };
  it('starts plated; one Cut hit clears both layers and deals no damage', () => {
    const h = plated(['blade', 'maul']);
    expect(h.mon.plating).toBe(2);
    const r = E.useMove(h, 0)!;
    expect(r.dmg).toBe(0);
    expect(h.mon.plating).toBe(0);
    expect(h.mon.hp).toBe(h.mon.max);
    expect(E.useMove(h, 0)!.dmg).toBe(12); // ice gone: hits land
  });
  it('any other hit breaks one layer, and a charged hit is wasted on the ice', () => {
    const h = plated(['maul', 'blade']); h.chargeReady = true;
    E.useMove(h, 0);
    expect(h.mon.plating).toBe(1);
    expect(h.chargeReady).toBe(false);
  });
  it('a Firepot melts it all; Rime Coat regrows it, thinner once the mantle breaks', () => {
    const s = starter(); s.items.firepot = 2; s.loadout = { ...s.loadout, item: 'firepot', target: 'rimetail' };
    const h = E.startHunt(s, 4);
    expect(E.useItem(h)).toBe(true); expect(h.mon.plating).toBe(0);
    h.intent = 'rimecoat'; h.php = 999; E.endTurn(h); expect(h.mon.plating).toBe(2);
    h.mon.parts.mantle.broken = true; h.intent = 'rimecoat'; E.endTurn(h); expect(h.mon.plating).toBe(1);
  });
});

describe('charms', () => {
  const withCharm = (charm: string, weapons: string[], target = 'gorehorn') => {
    const s = starter(); s.weapons = Object.fromEntries(weapons.map(w => [w, { lv: 0 }])); s.charms = { [charm]: true };
    s.loadout = { weapons, armor: 'jerkin', charm, item: null, target };
    const h = E.startHunt(s, 6); h.dice = [{ face: 'C', used: null }, { face: 'T', used: null }, { face: 'T', used: null }, { face: 'C', used: null }];
    return h;
  };
  it('crafting a charm equips it if the slot is empty, and it can only be made once', () => {
    const s = starter(); s.coin = 500; s.mats.tusk = 2; s.mats.hide = 4;
    expect(E.forgeDo(s, 'c', 'tuskcharm')).toMatch(/Tusk Charm/);
    expect(s.loadout.charm).toBe('tuskcharm');
    expect(E.recipeOf(s, 'c', 'tuskcharm').action).toBeNull();
  });
  it('Tusk Charm heals 20 when you daze', () => {
    const h = withCharm('tuskcharm', ['maul', 'blade']); h.target = 'tusks'; h.php = 100; h.mon.daze = h.mon.dazeMax - 1;
    E.useMove(h, 0);
    expect(h.intent).toBe('dazed');
    expect(h.php).toBe(120);
  });
  it('Plume Charm: the exposing hit gets the bonus too', () => {
    const h = withCharm('plumecharm', ['bow', 'maul']); h.target = 'legs';
    expect(E.useMove(h, 0)!.dmg).toBe(Math.round(12 * E.EXPOSE_DMG));
  });
  it('Kiln Charm: Charge costs 1 die', () => {
    const h = withCharm('kilncharm', ['blade', 'maul']);
    expect(E.chargeDice(h)).toBe(1);
    expect(E.charge(h, [0])).toBe(true);
  });
  it('Rime Charm: light Cut moves deal 4 more', () => {
    const h = withCharm('rimecharm', ['blade', 'maul']); h.target = 'hide';
    expect(E.useMove(h, 0)!.dmg).toBe(12 + E.LIGHT_CUT_BONUS);
  });
  it('v2 saves gain an empty charm slot', () => {
    const s = E.loadSave({ version: 2, coin: 10, loadout: { weapons: ['blade', 'maul'], armor: 'jerkin', item: null, target: 'gorehorn' } });
    expect(s.charms).toEqual({});
    expect(s.loadout.charm).toBeNull();
  });
});

describe('hunt unlocks', () => {
  it('only the Gorehorn is open at first; beating it unlocks the other Tier 1 monsters', () => {
    const s = starter();
    expect(E.isUnlocked(s, 'gorehorn')).toBe(true);
    expect(['galeshrike', 'cinderback', 'rimetail'].some(id => E.isUnlocked(s, id))).toBe(false);
    const h = E.startHunt(s, 1); h.over = 'win'; E.settleHunt(s, h);
    expect(h.reward?.unlocked?.sort()).toEqual(['cinderback', 'galeshrike', 'rimetail']);
    expect(E.isUnlocked(s, 'rimetail')).toBe(true);
  });
  it('a failed Gorehorn hunt unlocks nothing; older saves that already hunted a monster keep it open', () => {
    const s = starter(); const h = E.startHunt(s, 1); E.abandon(h); E.settleHunt(s, h);
    expect(E.isUnlocked(s, 'galeshrike')).toBe(false);
    s.record.galeshrike = { hunts: 2, wins: 0, captures: 0, breaks: {} };
    expect(E.isUnlocked(s, 'galeshrike')).toBe(true);
  });
});

describe('forge', () => {
  it('crafting the next weapon keeps the one before it and starts at +0 (weapon rework)', () => {
    const s = starter(); s.coin = 1000; s.mats.tusk = 3; s.mats.hide = 2; s.weapons.maul.lv = 2;
    expect(E.forgeDo(s, 'w', 'tusk')).toMatch(/Tuskbreaker/);
    expect(s.weapons.maul.lv).toBe(2);
    expect(s.weapons.tusk.lv).toBe(0);
  });
  it('reinforcing costs the common material of the monster the gear comes from', () => {
    expect(E.recipeOf({ ...starter(), weapons: { blade: { lv: 0 }, maul: { lv: 0 }, whelkedge: { lv: 1 } } } as never, 'w', 'whelkedge').cost).toEqual({ coin: 160, [E.MONSTERS.emberwhelk.common]: 4 });
    expect(E.recipeOf(starter(), 'w', 'blade').cost).toEqual({ coin: 80, hide: 2 });
  });
  it('old saves get back the weapons an upgrade used to consume (save v8)', () => {
    const old = { ...E.newSave(), version: 7, weapons: { blade: { lv: 1 }, crusher: { lv: 2 } } };
    const s = E.loadSave(JSON.parse(JSON.stringify(old)));
    expect(s.weapons.crusher.lv).toBe(2);
    expect(s.weapons.tusk.lv).toBe(0);
    expect(s.weapons.maul.lv).toBe(0);
  });
  it('sell surplus keeps what recipes still need', () => {
    const s = starter(); s.mats.tusk = 5;
    E.sellSurplus(s);
    expect(s.mats.tusk).toBe(3); // Tuskbreaker and Crusher each need 3
  });
});

describe('tutorial', () => {
  it('scripted opening turns use fixed faces, then the seed takes over', () => {
    const a = E.startHunt(starter(), 42, E.TUTORIAL_SCRIPT), b = E.startHunt(starter(), 42);
    expect(a.dice.map(d => d.face)).toEqual(E.TUTORIAL_SCRIPT[0]);
    expect(E.canUseMove(a, 2)).toBe(true); // Rend on turn 1
    E.endTurn(a); E.endTurn(b);
    expect(a.dice.map(d => d.face)).toEqual(E.TUTORIAL_SCRIPT[1]);
    E.endTurn(a); E.endTurn(b);
    expect(a.dice.length).toBe(4);
    expect(b.script).toBeUndefined();
  });
  it('the end of the content is every monster beaten once', () => {
    const s = starter();
    expect(E.contentComplete(s)).toBe(false);
    for (const id of Object.keys(E.MONSTERS)) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    expect(E.contentComplete(s)).toBe(true);
    expect(E.loadSave({ version: 4, coin: 5 }).endSeen).toBe(false);
  });
  it('saves keep the tips already shown, and old saves start with none', () => {
    expect(E.loadSave({ ...starter(), tips: ['aim', 7] }).tips).toEqual(['aim']);
    expect(E.loadSave({ version: 3, coin: 5 }).tips).toEqual([]);
  });
});

describe('achievements', () => {
  it('a new save has none; progress awards them once', () => {
    const s = starter();
    expect(E.award(s)).toEqual([]);
    s.record.gorehorn = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    expect(E.award(s)).toEqual(['FIRST_HUNT']);
    expect(E.award(s)).toEqual([]);
  });
  it('one Cut hit that clears the Rimetail\'s ice is a Shatter', () => {
    const s = starter(); s.loadout.target = 'rimetail';
    const h = E.startHunt(s, 7);
    h.dice = h.dice.map(() => ({ face: 'C' as const, used: null }));
    E.useMove(h, 0);
    expect(h.feats).toContain('shatter');
    h.over = 'lose';
    expect(E.award(s, h)).toContain('SHATTER');
  });
  it('filling the daze meter on the Gorehorn\'s charge stops it cold', () => {
    const s = starter(); s.loadout.weapons = ['maul', 'blade'];
    const h = E.startHunt(s, 3);
    h.intent = 'charge'; h.target = 'tusks'; h.mon.daze = h.mon.dazeMax - 5;
    h.dice = h.dice.map(() => ({ face: 'C' as const, used: null }));
    E.useMove(h, 0);
    expect(h.feats).toEqual(expect.arrayContaining(['daze', 'interrupt']));
  });
  it('every id is a valid Steam API name and unique', () => {
    const ids = E.ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[A-Z0-9_]{1,64}$/);
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

describe('Forge trees', () => {
  it('list every weapon in this edition exactly once, children after their parent', async () => {
    const E = await import('../src/engine');
    const ids = E.TREES.flatMap(t => t.nodes.map(n => n[0]));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual(Object.keys(E.WEAPONS).sort());
    for (const t of E.TREES) t.nodes.forEach(([id], i) => { const f = E.WEAPONS[id].from; if (f) expect(t.nodes.findIndex(n => n[0] === f)).toBeLessThan(i); });
  });
});
