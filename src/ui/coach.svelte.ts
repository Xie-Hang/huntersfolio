// Tutorial tips: short prompts that appear the moment they're relevant, point at the thing
// they describe, and go away when the player does it. One at a time, in priority order.
// Each tip shows once per save (Save.tips). Players can switch them off in Settings.
//
// A tip is "pending" while unseen and its `when` holds. Once shown, it is marked seen when
// `done` holds, when the player clicks Got it, or when the moment passes (`when` stops holding).
import * as E from '../engine';
import { game } from './game.svelte';
import { settings } from './settings.svelte';

export interface Tip {
  id: string;
  /** data-coach value of the element to point at, in order of preference */
  at: string[];
  when: () => boolean;
  text: () => string;
  /** the player did what the tip asks */
  done?: () => boolean;
  /** doing it counts even if the tip was never shown (they found it on their own) */
  learn?: boolean;
}

const hunt = () => (game.view === 'hunt' && game.hunt && !game.hunt.over ? game.hunt : null);
const anyMoveReady = (h: E.Hunt) => E.currentWeapon(h).moves.some((_, i) => E.canUseMove(h, i));
const freeDice = (h: E.Hunt) => E.freeDice(h).length;
const unusedTurn = (h: E.Hunt) => h.dice.every(d => !d.used);
/** the part the current weapon breaks best */
const bestPart = (h: E.Hunt) => {
  const w = E.currentWeapon(h), M = E.MONSTERS[h.mid];
  return M.parts.filter(p => !h.mon.parts[p.id].broken).sort((a, b) => b.eff[w.type] - a.eff[w.type])[0];
};

export const TIPS: Tip[] = [
  // ---- before the first hunt ----
  {
    id: 'begin', learn: true, at: ['begin'],
    when: () => game.view === 'board' && game.save.hunts === 0 && !game.hunt,
    text: () => 'Your first hunt: the Gorehorn, with the two weapons and armor you start with. Click Hunt the Gorehorn when you\'re ready.',
    done: () => game.view === 'hunt'
  },
  // ---- the first turns ----
  {
    id: 'aim', learn: true, at: ['parts'],
    when: () => { const h = hunt(); return !!h && h.turn === 1 && unusedTurn(h); },
    text: () => {
      const h = hunt()!, w = E.currentWeapon(h), p = bestPart(h);
      return `Click a part to aim at it. Your ${w.name} is ${w.type}, so it breaks the ${p.name.toLowerCase()} best. Broken parts weaken the monster and drop materials.`;
    },
    done: () => { const h = hunt(); return !!h && h.target !== E.MONSTERS[h.mid].parts[0].id; }
  },
  {
    id: 'move', learn: true, at: ['move'],
    when: () => { const h = hunt(); return !!h && unusedTurn(h) && anyMoveReady(h); },
    text: () => 'You rolled 4 dice. Each move needs the shapes shown on its right. This one matches your roll: click it.',
    done: () => { const h = hunt(); return !!h && h.dice.some(d => d.used && d.used !== 'Guard'); }
  },
  {
    id: 'guard', learn: true, at: ['guard'],
    when: () => {
      const h = hunt(); const inc = h && E.incoming(h);
      return !!h && !!inc?.net && freeDice(h) > 0 && !anyMoveReady(h) && h.guard === 0 && !unusedTurn(h);
    },
    text: () => `Dice that don't fit a move can still help. Click a die to select it, then click Guard: each die blocks ${hunt()!.arm.guard} damage this turn.`,
    done: () => (hunt()?.guard ?? 0) > 0
  },
  {
    id: 'end', learn: true, at: ['end'],
    when: () => { const h = hunt(); return !!h && h.turn === 1 && !anyMoveReady(h) && (freeDice(h) === 0 || h.guard > 0); },
    text: () => 'When you\'re done, click End turn. The Gorehorn then does what the panel above says, for the damage it shows.',
    done: () => (hunt()?.turn ?? 1) > 1
  },
  {
    id: 'reroll', learn: true, at: ['reroll'],
    when: () => { const h = hunt(); return !!h && h.turn >= 2 && h.rerolls > 0 && unusedTurn(h) && h.dice.some(d => d.face === 'B'); },
    text: () => `Not the roll you wanted? Select the dice to change, then click Reroll. Blanks never fit a move. You have ${hunt()!.rerolls} rerolls for the whole hunt, so spend them when a bigger move is close.`,
    done: () => (hunt()?.stats.rerollsUsed ?? 0) > 0
  },
  // ---- the first big attack: the most important lesson ----
  {
    id: 'windup', at: ['tele'],
    when: () => hunt()?.intent === 'windup',
    text: () => 'It\'s winding up: next turn it charges, and that hits hard. This turn is safe, so put your dice into damage.'
  },
  {
    id: 'charge', at: ['guard'],
    when: () => { const h = hunt(); const inc = h && E.incoming(h); return !!h && (E.intentInfo(h).threat >= 3) && !!inc?.net && h.guard === 0; },
    text: () => {
      const h = hunt()!, inc = E.incoming(h)!, n = freeDice(h);
      return `This one hurts: ${inc.raw} damage when you end your turn. Each die you Guard with blocks ${h.arm.guard}, so all ${n} would block ${n * h.arm.guard}. Guard, hit back, or split your dice: your call.`;
    },
    done: () => (hunt()?.guard ?? 0) > 0
  },
  {
    id: 'item', learn: true, at: ['item'],
    when: () => { const h = hunt(); return !!h && !!h.item && E.itemUsable(h) && E.ITEMS[h.item].effect === 'heal30' && h.php <= h.pmax * 0.6; },
    text: () => { const h = hunt()!; return `Running low? Your ${E.ITEMS[h.item!].name} heals 30 and costs no dice. One item per turn, ${h.itemCharges} left.`; },
    done: () => !!hunt()?.itemUsed
  },
  {
    id: 'swap', learn: true, at: ['swap'],
    when: () => {
      const h = hunt(); if (!h || h.turn < 5 || !unusedTurn(h)) return false;
      const M = E.MONSTERS[h.mid], o = E.otherWeapon(h), w = E.currentWeapon(h);
      return M.parts.some(p => !h.mon.parts[p.id].broken && p.eff[o.type] > p.eff[w.type]);
    },
    text: () => {
      const h = hunt()!, o = E.otherWeapon(h), M = E.MONSTERS[h.mid], w = E.currentWeapon(h);
      const p = M.parts.find(p => !h.mon.parts[p.id].broken && p.eff[o.type] > p.eff[w.type])!;
      return `You carry two weapons. Swapping costs 1 die. Your ${o.name} is ${o.type} and breaks the ${p.name.toLowerCase()} better.`;
    },
    done: () => { const h = hunt(); return !!h && h.dice.some(d => d.used === 'Swap'); }
  },
  // ---- moments the Gorehorn creates ----
  {
    id: 'broke', at: ['parts'],
    when: () => { const h = hunt(); return !!h && h.stats.broken > 0; },
    text: () => 'A part broke. Its effect is permanent for this hunt, and it drops extra materials. The other parts are still worth breaking.'
  },
  {
    id: 'mud', at: ['parts'],
    when: () => { const h = hunt(); return !!h && h.mon.wallow > 0 && !h.mon.parts.hide?.broken; },
    text: () => 'Mud halves damage to its hide for 2 turns. Aim at another part until it dries.'
  },
  {
    id: 'open', at: ['move', 'tele'],
    when: () => { const h = hunt(); return !!h && E.intentInfo(h).threat === 0 && E.intentInfo(h).dmg === 0 && h.turn > 1 && h.intent !== 'windup'; },
    text: () => 'It won\'t attack this turn. No need to Guard: put every die into damage.'
  },
  {
    id: 'enraged', at: ['tele'],
    when: () => !!hunt()?.mon.enraged,
    text: () => 'Below half HP it\'s enraged: its attacks hit harder. Check the panel before you end each turn.'
  },
  {
    id: 'capture', at: ['capture'],
    when: () => { const h = hunt(); return !!h && E.canCapture(h) && !E.captureBlocked(h); },
    text: () => 'It\'s weak enough to capture. Select 2 dice and click Capture to end the hunt with double part materials, or keep fighting to slay it.'
  },
  // ---- back in town ----
  {
    id: 'failed', at: ['tele'],
    when: () => game.view === 'hunt' && game.hunt?.over === 'lose',
    text: () => 'Hunts can fail. You keep your weapons and armor; only the items you carried are lost. Guard against its big hits, and break the part that powers them.'
  },
  {
    id: 'forge', learn: true, at: ['to-forge', 'nav-forge'],
    when: () => game.save.hunts > 0 && game.view !== 'forge' && !(game.view === 'hunt' && game.hunt && !game.hunt.over) && Object.values(game.save.mats).some(n => n > 0),
    text: () => 'You brought back coin and materials. Spend them at the Forge on better weapons and armor.',
    done: () => game.view === 'forge'
  },
  {
    id: 'track', learn: true, at: ['track', 'forge-act'],
    when: () => game.view === 'forge',
    text: () => 'Pick something to make. If you can\'t afford it yet, click Track: its materials are then flagged on the Hunt Board and in the Shop, so you know what to hunt.',
    done: () => !!game.save.tracked
  }
];

class Coach {
  /** the tip on screen, if any */
  current = $derived.by<Tip | null>(() => {
    if (!settings.prefs.tips) return null;
    const seen = game.save.tips;
    return TIPS.find(t => !seen.includes(t.id) && t.when()) ?? null;
  });
  private shown: string | null = null;

  /** Call from an effect: retires the tip on screen once it's done or its moment has passed. */
  sync() {
    if (settings.prefs.tips) for (const t of TIPS) if (t.learn && !game.save.tips.includes(t.id) && t.done?.()) this.markSeen(t.id);
    const cur = this.current;
    if (this.shown && this.shown !== cur?.id) this.markSeen(this.shown);
    this.shown = cur?.id ?? null;
    if (cur?.done?.()) this.markSeen(cur.id);
  }
  markSeen(id: string) {
    if (game.save.tips.includes(id)) return;
    game.save.tips = [...game.save.tips, id];
    if (this.shown === id) this.shown = null;
    game.persist();
  }
  dismiss() { const c = this.current; if (c) this.markSeen(c.id); }
  skipAll() { settings.prefs.tips = false; settings.save(); }
  /** Turning tips back on replays them from the start. */
  setEnabled(on: boolean) {
    settings.prefs.tips = on; settings.save();
    if (on) { game.save.tips = []; this.shown = null; game.persist(); }
  }
  /** The first hunt opens on fixed dice, so the first lessons always work. */
  scriptFirstHunt() {
    return settings.prefs.tips && game.save.hunts === 0 && !game.save.tips.includes('move') && game.save.loadout.target === 'gorehorn';
  }
}

export const coach = new Coach();
