// Status effects and the Gloamhollow (Nov 2026).
import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';
import { matchup } from '../src/sim/scenarios';

const hunt = (target: string, weapons: [string, number][], armor = 'jerkin', item: string | null = null) => {
  const s = E.newSave();
  for (const id of Object.keys(E.MONSTERS)) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.weapons = Object.fromEntries(weapons.map(([id, lv]) => [id, { lv }]));
  s.armors = { ...s.armors, [armor]: { lv: 0 } };
  if (item) s.items[item] = 2;
  s.loadout = { ...s.loadout, weapons: weapons.map(w => w[0]), armor, item, target };
  const h = E.startHunt(s, 7); h.php = h.pmax = 999; return h;
};
const dice = (h: E.Hunt, f: string) => { h.dice = [...f].map(face => ({ face, used: null })) as never; };

describe('status weapons', () => {
  it('fill a meter by the dice each move uses; a full meter fires and then needs more (tolerance)', () => {
    const h = hunt('gorehorn', [['rotblade', 0], ['maul', 0]]);
    dice(h, 'CCTC'); E.useMove(h, 2); // Rend: 3 dice
    expect(E.statusOf(h, 'Infect').value).toBe(3);
    dice(h, 'CCTC'); E.useMove(h, 2);
    expect(h.mon.infected).toBe(E.INFECT_TURNS); expect(E.statusOf(h, 'Infect')).toEqual({ value: 0, max: E.STATUS_FIRST + E.STATUS_TOL });
    const hp = h.mon.hp; E.endTurn(h); expect(hp - h.mon.hp).toBeGreaterThanOrEqual(20); // the monster's turn, then the infection
  });
  it('Spark discharges for its power; Drain heals a share of your max HP', () => {
    const s = hunt('gorehorn', [['arcblade', 0], ['maul', 0]]); s.mon.sm = { Spark: 5 };
    const before = s.mon.hp; dice(s, 'C'); E.useMove(s, 0);
    expect(before - s.mon.hp).toBeGreaterThan(70);
    const d = hunt('gorehorn', [['fangblade', 0], ['maul', 0]]); d.php = 500; d.mon.sm = { Drain: 5 };
    dice(d, 'C'); E.useMove(d, 0); expect(d.php).toBe(500 + Math.round(999 * 0.15));
    expect(d.mon.smax!.Drain).toBe(E.STATUS_FIRST + E.DRAIN_TOL);
  });
  it('carry no element, and come in all three types for each status, in two steps', () => {
    const st = Object.values(E.WEAPONS).filter(w => w.status);
    expect(st.length).toBe(18);
    for (const w of st) { expect(w.elem).toBeNull(); expect(w.tier === 2.2 ? !w.from : E.WEAPONS[w.from!]?.status === w.status).toBe(true); }
  });
  it('Bare-handed: healing with Drain counts like using an item', () => {
    const h = hunt('sovereign', [['fangblade', 0], ['maul', 0]]); h.over = 'win'; h.feats = ['drainheal'];
    expect(E.ACHIEVEMENTS.find(a => a.id === 'BARE_HANDED')!.hunt!(h, E.newSave())).toBe(false);
  });
});

describe('statuses on you', () => {
  it('Rotcap: its spores infect you; the infection never knocks you out; the Purging Tonic cures it', () => {
    const h = hunt('rotcap', [['blade', 0], ['maul', 0]], 'jerkin', 'purge');
    h.intent = 'puff'; E.endTurn(h); expect(h.mon.pInf).toBeGreaterThan(0);
    h.php = 3; h.intent = 'wilt'; E.endTurn(h); expect(h.php).toBe(1); expect(h.over).toBeNull();
    expect(E.useItem(h)).toBe(true); expect(h.mon.pInf).toBe(0);
  });
  it('Rotcap: a 2-dice Pierce hit on the swollen cap pops it, and the Burst never comes', () => {
    const h = hunt('rotcap', [['bow', 0], ['maul', 0]]); h.intent = 'burst'; h.target = 'cap';
    dice(h, 'CCTT'); E.useMove(h, 1); expect(h.intent).toBe('popped');
    expect(E.monsterOf(h).priority!(h, E.currentWeapon(h))).toBeNull();
  });
  it('Arcmoth: pips build to a Discharge guard can’t stop; any Blunt move grounds one', () => {
    const h = hunt('arcmoth', [['maul', 0], ['bow', 0]]);
    h.intent = 'rake'; E.endTurn(h); expect(h.mon.pSpark).toBe(1);
    dice(h, 'CCCC'); E.useMove(h, 0); expect(h.mon.pSpark).toBe(0);
    h.mon.pSpark = 2; h.intent = 'rake'; h.guard = 999; const hp = h.php; E.endTurn(h);
    expect(h.mon.pSpark).toBe(0); expect(hp - h.php).toBe(65);
  });
  it('Archeron: a Static Cry charges your dice; a charged die can only attack (guarding or leaving it sets it off)', () => {
    const h = hunt('archeron', [['blade', 0], ['maul', 0]]);
    h.intent = 'upper:screech|lower:peck'; E.endTurn(h);
    const charged = h.dice.map((d, i) => (d.charged ? i : -1)).filter(i => i >= 0); expect(charged.length).toBe(2);
    const hp = h.php; E.guard(h, [charged[0]]); expect(hp - h.php).toBe(E.CHARGED_HIT);
    h.intent = 'upper:peck|lower:peck'; const hp2 = h.php; h.guard = 999; E.endTurn(h); expect(hp2 - h.php).toBe(E.CHARGED_HIT);
    const p = hunt('archeron', [['blade', 0], ['maul', 0]], 'heroncloak'); p.intent = 'upper:screech|lower:peck'; E.endTurn(p);
    expect(p.dice.some(d => d.charged)).toBe(false);
  });
  it('Archeron: a landed Spear Thrust sparks you; a reeling head’s strike carries nothing', () => {
    const h = hunt('archeron', [['blade', 0], ['maul', 0]]);
    h.intent = 'upper:thrust|lower:thrust'; E.endTurn(h); expect(h.mon.pSpark).toBe(2);
    h.mon.pSpark = 0; h.mon.reel = { upper: 2 }; h.intent = 'upper:thrust|lower:peck'; E.endTurn(h); expect(h.mon.pSpark ?? 0).toBe(0);
  });
  it('Hollowfang: a latch drinks past your guard and heals it; a 2-dice Cut move tears it off; the sac gives it back', () => {
    const h = hunt('hollowfang', [['blade', 0], ['maul', 0]]);
    h.intent = 'latch'; E.endTurn(h); expect(h.intent).toBe('drink');
    h.mon.hp = 300; h.guard = 999; const hp = h.php; E.endTurn(h);
    expect(hp - h.php).toBe(30); expect(h.mon.hp).toBe(330);
    h.target = 'sac'; h.mon.parts.sac.hp = 1; dice(h, 'CTCC'); E.useMove(h, 1);
    expect(h.mon.latch).toBe(0); expect(h.intent).toBe('torn'); expect(h.mon.hp).toBeLessThan(300);
  });
  it('Feverjaw: being swallowed infects you, and the infection keeps going while you’re inside', () => {
    const h = hunt('feverjaw', [['blade', 0], ['maul', 0]]);
    h.intent = 'swallow'; E.endTurn(h); expect(h.mon.gut).toBe(2); expect(h.mon.pInf).toBeGreaterThan(0);
    h.mon.pInf = 1; E.endTurn(h); expect(h.intent).toBe('digest'); E.endTurn(h); expect(h.mon.pInf).toBeGreaterThan(0);
  });
  it('Bloodwhelk: its slime drinks past your guard and heals it; broken gills stop it feeding', () => {
    const h = hunt('bloodwhelk', [['bow', 0], ['maul', 0]]);
    h.intent = 'slime'; E.endTurn(h); expect(h.mon.slime).toBe(3);
    h.mon.hp = 300; h.mon.parts.gills.broken = false; h.intent = 'spit'; h.guard = 999; const hp = h.php; E.endTurn(h);
    expect(hp - h.php).toBe(12); expect(h.mon.hp).toBe(300 + 12 + 18);
    h.mon.hp = 300; h.mon.parts.gills.broken = true; h.intent = 'spit'; E.endTurn(h); expect(h.mon.hp).toBe(300);
    const p = hunt('bloodwhelk', [['bow', 0], ['maul', 0]], 'bloodplate'); p.intent = 'slime'; E.endTurn(p); expect(p.mon.slime ?? 0).toBe(0);
  });
});

describe('the Gloamhollow', () => {
  it('opens beside the Mirewood; the changed Mirewood needs the Mirewood and the Gloamhollow monster with its status', () => {
    const s = E.newSave();
    for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    expect(E.isUnlocked(s, 'rotcap')).toBe(true); expect(E.isUnlocked(s, 'feverjaw')).toBe(false);
    expect(E.unlockHint('feverjaw')).toBe('Beat every monster in the Mirewood and the Rotcap first');
    expect(E.MONSTERS.feverjaw.inflicts).toBe(E.MONSTERS.rotcap.inflicts);
  });
  it('is optional: the Sovereign doesn’t need it', () => {
    expect(E.MONSTERS.sovereign.requires).not.toContain('rotcap');
  });
  it('a status pair is forgiving at the apex but doesn’t beat a planned elemental pair (simulated)', () => {
    const run = (w: [string, number][]) => matchup({ weapons: w, armor: 'slagplate', armorLv: 1, item: 'salve', items: 3, target: 'sovereign' }, { skill: 'casual', capture: false }, 80, 3).win;
    const elem = run([['slaghammer', 1], ['monolithbow', 1]]), status = run([['fevermaul', 1], ['heronbow', 1]]);
    expect(status).toBeGreaterThan(0.45); expect(status).toBeLessThanOrEqual(elem + 0.05);
  });
});
