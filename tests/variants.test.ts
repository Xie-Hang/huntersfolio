// The changed Ashfall Ridge (variants, Nov 2026): Squallhorn, Rimeshrike, Quakeback, Ashtail.
import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';
import { matchup } from '../src/sim/scenarios';

const dice = (h: E.Hunt, f: string) => { h.dice = [...f].map(face => ({ face, used: null })) as never; };
const ready = (target: string, weapons: [string, number][] = [['blade', 0], ['maul', 0]], armor = 'jerkin') => {
  const s = E.newSave();
  for (const id of Object.keys(E.MONSTERS)) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.weapons = Object.fromEntries(weapons.map(([id, lv]) => [id, { lv }]));
  s.armors = { ...s.armors, [armor]: { lv: 0 } };
  s.loadout = { ...s.loadout, weapons: weapons.map(w => w[0]), armor, target };
  return E.startHunt(s, 3);
};
const moveIdx = (h: E.Hunt, name: string) => E.currentWeapon(h).moves.findIndex(m => m.name === name);

describe('The changed Ashfall Ridge', () => {
  it('opens once the Mirewood is cleared, and sits between Mirewood and Stormspire', () => {
    const s = E.newSave();
    for (const id of ['squallhorn', 'rimeshrike', 'quakeback', 'ashtail']) {
      expect(E.MONSTERS[id].tier).toBe(2.5);
      expect(E.isUnlocked(s, id)).toBe(false);
    }
    for (const id of ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    expect(E.isUnlocked(s, 'squallhorn')).toBe(true);
    expect(E.TIERS[2.5]).toBe('Ashfall Ridge, changed');
  });
  it('each changes its original\'s element and weakness', () => {
    for (const id of ['squallhorn', 'rimeshrike', 'quakeback', 'ashtail']) {
      const V = E.MONSTERS[id], O = E.MONSTERS[V.variantOf!];
      expect(V.elem).not.toBe(O.elem); expect(V.weak).not.toBe(O.weak);
    }
  });
  it('Mirewood gear needs the matching variant\'s material for +3, and only for +3', () => {
    expect(E.reinforceCost(2, 'w', 'mirrorblade')).toMatchObject({ rimeplume: E.VARIANT_PLUS3 });
    expect(E.reinforceCost(1, 'w', 'mirrorblade').rimeplume).toBeUndefined();
    expect(E.reinforceCost(2, 'a', 'bogcoat')).toMatchObject({ quakescale: E.VARIANT_PLUS3 });
    expect(E.reinforceCost(2, 'w', 'cinderedge').ashscale).toBeUndefined(); // Ashfall gear: no
  });
});

describe('Squallhorn', () => {
  it('gathers a pip of wind a turn and charges when full', () => {
    const h = ready('squallhorn'); h.php = 999;
    h.intent = 'gather'; E.endTurn(h); expect(h.mon.wind).toBe(1); expect(h.intent).toBe('gather');
    E.endTurn(h); E.endTurn(h); expect(h.mon.wind).toBe(3); expect(h.intent).toBe('cyclone');
    E.endTurn(h); expect(h.mon.wind).toBe(0);
  });
  it('a daze scatters the wind; broken hind legs cap it at 2', () => {
    const h = ready('squallhorn'); h.php = 999;
    h.mon.wind = 2; h.intent = 'dazed'; E.endTurn(h); expect(h.mon.wind).toBe(0);
    h.mon.parts.legs.broken = true; h.mon.wind = 2; h.intent = 'gather';
    expect(E.monsterOf(h).next(h, 'gather')).toBe('cyclone');
  });
  it('is a Blunt check (simulated, casual)', () => {
    const run = (w: [string, number][]) => matchup({ weapons: w, armor: 'whelkplate', armorLv: 2, item: 'salve', items: 3, target: 'squallhorn' }, { skill: 'casual', capture: false }, 200, 7).win;
    const blunt = run([['pearlhammer', 2], ['gillbow', 2]]), none = run([['whelkedge', 2], ['gillbow', 2]]);
    expect(blunt).toBeGreaterThan(0.8);
    expect(blunt - none).toBeGreaterThan(0.35);
  });
});

describe('Rimeshrike', () => {
  it('in the air only bows reach it; after a dive its shroud lets only Cut and Blunt reach it', () => {
    const h = ready('rimeshrike', [['bow', 0], ['blade', 0]]); h.php = 999;
    h.mon.air = true; expect(E.canHit(h, h.weps[0])).toBe(true); expect(E.canHit(h, h.weps[1])).toBe(false);
    h.intent = 'dive'; E.endTurn(h);
    expect(h.mon.air).toBe(false); expect(h.mon.shroud).toBe(3);
    expect(E.canHit(h, h.weps[0])).toBe(false); expect(E.canHit(h, h.weps[1])).toBe(true);
    expect(E.cantHitReason(h, h.weps[0])).toMatch(/Frost-shrouded/);
  });
  it('breaking the crest ends the shroud for good; a Net brings it down unshrouded', () => {
    const h = ready('rimeshrike', [['maul', 0], ['bow', 0]]); h.php = 999;
    h.mon.shroud = 2; h.target = 'crest'; h.mon.parts.crest.hp = 1; dice(h, 'CCCC');
    E.useMove(h, 0);
    expect(h.mon.parts.crest.broken).toBe(true); expect(h.mon.shroud).toBe(0);
    h.intent = 'dive'; E.endTurn(h); expect(h.mon.shroud ?? 0).toBe(0);
  });
  it('wants a bow and a melee weapon (simulated, casual)', () => {
    const run = (w: [string, number][]) => matchup({ weapons: w, armor: 'bogcoat', armorLv: 2, item: 'salve', items: 3, target: 'rimeshrike' }, { skill: 'casual', capture: false }, 200, 7).win;
    const both = run([['wartbow', 2], ['bogcleaver', 2]]), melee = run([['bogcleaver', 2], ['miremaul', 2]]);
    expect(both).toBeGreaterThan(0.75);
    expect(both - melee).toBeGreaterThan(0.4);
  });
});

describe('Quakeback', () => {
  it('a tremor shakes one of your dice loose; the Quakestone Plate stops it', () => {
    const h = ready('quakeback'); h.php = 999;
    h.mon.under = true; h.intent = 'tremor'; E.endTurn(h);
    expect(h.dice.filter(d => d.used === E.SHAKEN).length).toBe(1);
    const g = ready('quakeback', undefined, 'quakemail'); g.php = 999;
    g.mon.under = true; g.intent = 'tremor'; E.endTurn(g);
    expect(g.dice.filter(d => d.used === E.SHAKEN).length).toBe(0);
  });
  it('only a 3-dice Blunt move drives it up; broken claws mean no more burrowing', () => {
    const h = ready('quakeback', [['maul', 0], ['blade', 0]]); h.php = 999;
    h.mon.under = true; h.intent = 'tremor'; dice(h, 'CTCT');
    E.useMove(h, moveIdx(h, 'Smash')); expect(h.mon.under).toBe(true);
    dice(h, 'CTTB'); E.useMove(h, moveIdx(h, 'Skullcrack')); expect(h.mon.under).toBe(false); expect(h.intent).toBe('unearthed');
    h.mon.parts.claws.broken = true;
    const seen = new Set<string>(); for (let i = 0; i < 12; i++) seen.add(E.monsterOf(h).next(h, 'swipe'));
    expect(seen.has('burrow')).toBe(false);
  });
});

describe('Ashtail', () => {
  it('Pierce clears 2 layers of scales, Cut 1 and burns you, Frost all of them', () => {
    const bow = ready('ashtail', [['bow', 0], ['blade', 0]]);
    expect(bow.mon.plating).toBe(2);
    dice(bow, 'CCCC'); E.useMove(bow, 0); expect(bow.mon.plating).toBe(0);
    const cut = ready('ashtail', [['blade', 0], ['bow', 0]]); const hp = cut.php;
    dice(cut, 'CCCC'); E.useMove(cut, 0); expect(cut.mon.plating).toBe(1); expect(cut.php).toBeLessThan(hp);
    const frost = ready('ashtail', [['rimefang', 0], ['bow', 0]]);
    dice(frost, 'CCCC'); E.useMove(frost, 0); expect(frost.mon.plating).toBe(0);
  });
  it('a Firepot does nothing, and says why', () => {
    const s = E.newSave(); for (const id of Object.keys(E.MONSTERS)) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    s.items.firepot = 2; s.loadout = { ...s.loadout, target: 'ashtail', item: 'firepot' };
    const h = E.startHunt(s, 2);
    expect(E.itemUsable(h)).toBe(false); expect(E.itemBlockReason(h)).toMatch(/already burning/);
  });
  it('is a Pierce check (simulated, casual)', () => {
    const run = (w: [string, number][]) => matchup({ weapons: w, armor: 'bogcoat', armorLv: 2, item: 'salve', items: 3, target: 'ashtail' }, { skill: 'casual', capture: false }, 200, 7).win;
    const pierce = run([['twilightbow', 2], ['duskblade', 2]]), cut = run([['duskblade', 2], ['pearlhammer', 2]]);
    expect(pierce).toBeGreaterThan(0.6);
    expect(pierce - cut).toBeGreaterThan(0.2);
  });
});
