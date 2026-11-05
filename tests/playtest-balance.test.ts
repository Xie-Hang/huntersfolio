// Rules from the Nov 2026 playtest pass: Snares, moves daze can't cancel, Tier 2 hitting harder than Tier 1.
import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';

const dice = (h: E.Hunt, faces: string) => { h.dice = [...faces].map(face => ({ face, used: null })) as never; };
const weak = (target: string, extra: (s: ReturnType<typeof E.newSave>) => void = () => {}) => {
  const s = E.newSave();
  for (const id of Object.keys(E.MONSTERS)) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.loadout = { ...s.loadout, target };
  extra(s);
  const h = E.startHunt(s, 5);
  h.mon.hp = Math.floor(h.mon.max * 0.15);
  return { s, h };
};

describe('Snares', () => {
  it('a new save starts with 2, carried outside the item slot', () => {
    const { s, h } = weak('gorehorn');
    expect(h.snares).toBe(2);
    expect(h.item).toBe('salve');
    expect(s.items.snare).toBe(0);
  });
  it('holds when the monster\'s move hits for less than the break threshold', () => {
    const { s, h } = weak('gorehorn');
    h.intent = 'jab'; dice(h, 'CCBB');
    expect(E.capture(h, [0, 1])).toBe(true);
    expect(h.over).toBeNull();
    E.guard(h, [2, 3]);
    E.endTurn(h);
    expect(h.captured).toBe(true);
    expect(h.over).toBe('win');
    E.settleHunt(s, h);
    expect(s.items.snare).toBe(1);
  });
  it('tears free on a big hit, and the snare is lost', () => {
    const { s, h } = weak('gorehorn');
    h.intent = 'charge'; dice(h, 'CCBB');
    E.capture(h, [0, 1]);
    E.endTurn(h);
    expect(h.captured).toBe(false);
    expect(h.snares).toBe(1);
    if (!h.over) { E.abandon(h); }
    E.settleHunt(s, h);
    expect(s.items.snare).toBe(1);
  });
  it('can\'t be set without a Snare', () => {
    const { h } = weak('gorehorn', s => { s.items.snare = 0; });
    dice(h, 'CCCC');
    expect(E.captureReady(h)).toBe(false);
    expect(E.capture(h, [0, 1])).toBe(false);
  });
});

describe('Moves daze can\'t cancel', () => {
  it('a full daze meter during the Mistglass Pounce makes it reel next turn instead', () => {
    const s = E.newSave();
    for (const id of Object.keys(E.MONSTERS)) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    s.weapons = { maul: { lv: 2 }, bow: { lv: 0 } };
    s.loadout = { ...s.loadout, weapons: ['maul', 'bow'], target: 'mistglass' };
    const h = E.startHunt(s, 3);
    h.intent = 'pounce'; h.mon.mirage = 0; h.weapon = 0; h.target = E.MONSTERS.mistglass.head;
    h.mon.daze = h.mon.dazeMax - 1; h.php = 999;
    dice(h, 'CTTC');
    const i = E.currentWeapon(h).moves.findIndex(m => (m.daze ?? 0) > 0);
    E.useMove(h, i);
    expect(h.intent).toBe('pounce');
    E.endTurn(h);
    expect(h.intent).toBe('dazed');
  });
});

describe('Tier 2 hits harder than Tier 1', () => {
  it('each Mirewood monster has a telegraphed hit bigger than the Gorehorn\'s Double Jab and close to its charge', () => {
    const top = (id: string) => {
      const { h } = weak(id); let best = 0;
      for (const k of ['slam', 'swallow', 'twin', 'lunge', 'pounce', 'charge', 'dive']) { try { best = Math.max(best, E.MONSTERS[id].intent(h, k).dmg); } catch { /* not this monster's move */ } }
      return best;
    };
    for (const id of ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass']) expect(top(id)).toBeGreaterThanOrEqual(54);
  });
});

describe('Failed hunts', () => {
  it('keep one of each broken part\'s material, and nothing else', () => {
    const s = E.newSave(); s.loadout = { ...s.loadout, target: 'gorehorn' };
    const h = E.startHunt(s, 9);
    h.mon.parts.hide.broken = true;
    const before = { ...s.mats }, coin = s.coin;
    E.abandon(h); E.settleHunt(s, h);
    expect(s.mats.pelt).toBe((before.pelt ?? 0) + 1);
    expect(s.mats.hide ?? 0).toBe(before.hide ?? 0);
    expect(s.coin).toBe(coin);
    expect(h.reward!.mats).toEqual({ pelt: 1 });
  });
});

describe('Dice actions pick their own dice (no selection)', () => {
  const hunt = () => { const s = E.newSave(); s.loadout = { ...s.loadout, target: 'gorehorn' }; return E.startHunt(s, 4); };
  it('Guard takes the blanks; with none, the dice left if no move can use them', () => {
    const h = hunt(); dice(h, 'CBTB');
    expect(E.autoDice(h, 'guard')).toEqual([1, 3]);
    dice(h, 'CTCT'); expect(E.autoDice(h, 'guard')).toBeNull();
    h.dice[0].used = 'x' as never; h.dice[1].used = 'x' as never; h.dice[2].used = 'x' as never;
    expect(E.autoDice(h, 'guard')).toEqual([3]);
  });
  it('Charge, Swap and Capture take blanks first, else exactly the dice left, else ask', () => {
    const h = hunt(); dice(h, 'BCBT');
    expect(E.autoDice(h, 'charge')).toEqual([0, 2]);
    expect(E.autoDice(h, 'swap')).toEqual([0]);
    dice(h, 'CTCB'); expect(E.autoDice(h, 'charge')).toBeNull();
    h.dice[0].used = 'x' as never; h.dice[1].used = 'x' as never;
    expect(E.autoDice(h, 'capture')).toEqual([2, 3]);
  });
});

describe('Items say why they can\'t be used yet', () => {
  it('the Net on a Galeshrike that is only about to take off', () => {
    const s = E.newSave(); for (const id of Object.keys(E.MONSTERS)) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    s.items.net = 2; s.loadout = { ...s.loadout, target: 'galeshrike', item: 'net' };
    const h = E.startHunt(s, 3);
    h.intent = 'takeoff'; h.mon.air = false;
    expect(E.itemUsable(h)).toBe(false);
    expect(E.itemBlockReason(h)).toMatch(/takes off after this turn/);
    E.endTurn(h);
    expect(h.mon.air).toBe(true);
    expect(E.itemUsable(h)).toBe(true);
    expect(E.itemBlockReason(h)).toBeNull();
  });
});

describe('Resist armor only cuts elemental attacks', () => {
  const at = (target: string, armor: string, intent: string) => {
    const s = E.newSave(); for (const id of Object.keys(E.MONSTERS)) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    s.armors = { ...s.armors, [armor]: { lv: 0 } }; s.loadout = { ...s.loadout, target, armor };
    const h = E.startHunt(s, 2); h.intent = intent; return h;
  };
  it('a physical attack hits in full through resist armor, and says so', () => {
    const h = at('mistglass', 'rimehide', 'rake');
    const inc = E.incoming(h)!;
    expect(inc).toMatchObject({ elem: 0, res: false, wearsResist: true });
    expect(inc.after).toBe(inc.raw);
  });
  it('an elemental attack is cut by 30%', () => {
    const h = at('mistglass', 'rimehide', 'mist');
    const inc = E.incoming(h)!;
    expect(inc.res).toBe(true);
    expect(inc.after).toBe(Math.round(inc.raw * E.GUARD_RESIST));
  });
  it('the Gorhydra: only the Frost Breath heads are elemental', () => {
    const h = at('gorhydra', 'glassmantle', 'left:breath|middle:bite|right:snap');
    const inc = E.incoming(h)!;
    expect(inc.elem).toBeGreaterThan(0); expect(inc.phys).toBeGreaterThan(0);
    expect(inc.after).toBe(inc.phys + Math.round(inc.elem * E.GUARD_RESIST));
  });
});
