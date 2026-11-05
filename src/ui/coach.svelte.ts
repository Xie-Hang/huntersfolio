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
  /** a guided step: can't be dismissed, only done (or the whole tutorial skipped) */
  guide?: boolean;
  /** a guided step that only explains: the player clicks Next */
  info?: boolean;
  /** label for the Next button */
  next?: string;
  /** where the card goes when the usual spot (below, then above) would cover something the step needs */
  side?: 'right' | 'left';
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
  // ---- the guided first hunt ----
  // Playtest (Nov 2026): players clicked "Got it" and were lost. These steps can't be dismissed: each stays, with
  // its highlight, until the player does it (info steps have Next). Only "Skip tutorial" turns them off.
  {
    id: 'begin', guide: true, learn: true, at: ['begin'],
    when: () => game.view === 'board' && game.save.hunts === 0 && !game.hunt,
    text: () => 'Your first hunt is the Gorehorn, a ridge boar. You start with a blade, a maul and leather armor. Click Hunt the Gorehorn.',
    done: () => game.view === 'hunt'
  },
  {
    id: 'g-next', guide: true, info: true, at: ['tele'],
    when: () => { const h = hunt(); return !!h && h.turn === 1 && unusedTurn(h); },
    text: () => {
      const h = hunt()!, i = E.intentInfo(h), inc = E.incoming(h);
      return `This is what the ${E.MONSTERS[h.mid].short} will do when you end your turn: ${i.name}${inc?.net ? `, ${inc.raw} damage to you` : ''}. Check it before every turn. It tells you when to attack and when to defend.`;
    }
  },
  {
    id: 'g-hp', guide: true, info: true, at: ['you'],
    when: () => { const h = hunt(); return !!h && h.turn === 1 && unusedTurn(h); },
    text: () => 'Your HP. The striped end is what that move will take off you if you do nothing about it.'
  },
  {
    id: 'aim', guide: true, learn: true, at: ['parts'],
    when: () => { const h = hunt(); return !!h && h.turn === 1 && unusedTurn(h) && h.target !== bestPart(h).id; },
    text: () => {
      const h = hunt()!, w = E.currentWeapon(h), p = bestPart(h), t = E.MONSTERS[h.mid].parts.find(x => x.id === h.target)!;
      const none = t.eff[w.type] === 0;
      return `Aim first. Your ${w.name} is a ${w.type} weapon${none ? `, and ${w.type} does nothing to the ${t.name.toLowerCase()}` : ''}. Click the ${p.name}: ${w.type} breaks it best, and broken parts weaken the monster and drop materials.`;
    },
    done: () => { const h = hunt(); return !!h && h.target === bestPart(h).id; }
  },
  {
    id: 'move', guide: true, learn: true, at: ['move'],
    when: () => { const h = hunt(); return !!h && unusedTurn(h) && anyMoveReady(h); },
    text: () => {
      const h = hunt()!, w = E.currentWeapon(h), best = [...w.moves.keys()].filter(i => E.canUseMove(h, i)).sort((a, b) => w.moves[b].dmg - w.moves[a].dmg)[0];
      return `To attack, click a move. Each move needs the dice shapes shown on its right, and the game takes them from your roll. You rolled what ${w.moves[best].name} needs. Click it.`;
    },
    done: () => { const h = hunt(); return !!h && h.dice.some(d => d.used && d.used !== 'Guard'); }
  },
  {
    id: 'g-blank', guide: true, at: ['die-blank'],
    when: () => { const h = hunt(); return !!h && h.turn === 1 && !unusedTurn(h) && !anyMoveReady(h) && freeDice(h) > 0 && h.guard === 0 && !game.sel.length; },
    text: () => {
      const h = hunt()!, n = freeDice(h);
      return `Your turn isn't over: you can keep acting until your dice run out. ${n === 1 ? 'This die fits no move' : 'These dice fit no move'}, but any die can Guard. Click ${n === 1 ? 'it' : 'one'} to select it.`;
    },
    done: () => game.sel.length > 0
  },
  {
    id: 'guard', guide: true, learn: true, at: ['guard'],
    when: () => {
      const h = hunt();
      return !!h && !unusedTurn(h) && freeDice(h) > 0 && !anyMoveReady(h) && h.guard === 0 && game.sel.length > 0;
    },
    text: () => { const h = hunt()!, inc = E.incoming(h); return `Now click Guard. Each die blocks ${h.arm.guard} damage this turn${inc?.net ? `, so the ${inc.raw} becomes ${Math.max(0, inc.raw - h.arm.guard * game.sel.length)}` : ''}.`; },
    done: () => (hunt()?.guard ?? 0) > 0
  },
  {
    id: 'end', guide: true, learn: true, at: ['end'],
    when: () => { const h = hunt(); return !!h && h.turn === 1 && !unusedTurn(h) && (freeDice(h) === 0 || h.guard > 0) && !anyMoveReady(h); },
    text: () => `Click End turn. The ${E.MONSTERS[hunt()!.mid].short} makes its move, then you roll 4 new dice.`,
    done: () => (hunt()?.turn ?? 1) > 1
  },
  {
    id: 'g-pick', guide: true, at: ['dice'],
    when: () => { const h = hunt(); return !!h && h.turn >= 2 && h.rerolls > 0 && unusedTurn(h) && h.dice.some((d, i) => d.face === 'B' && !game.sel.includes(i)); },
    text: () => { const n = hunt()!.dice.filter(d => d.face === 'B').length; return `A poor roll: ${n === 1 ? 'a blank' : `${n} blanks`}. You can reroll any dice you like, one or all of them. Click ${n === 1 ? 'the blank' : 'both blanks'} to select ${n === 1 ? 'it' : 'them'}.`; },
    done: () => { const h = hunt(); return !!h && h.dice.every((d, i) => d.face !== 'B' || game.sel.includes(i)); }
  },
  {
    id: 'reroll', guide: true, learn: true, at: ['reroll'], side: 'right',
    when: () => { const h = hunt(); return !!h && h.turn >= 2 && h.rerolls > 0 && unusedTurn(h) && game.sel.length > 0; },
    text: () => `Click Reroll. Only the dice you selected roll again. You have ${hunt()!.rerolls} rerolls for the whole hunt, and a reroll can't be undone.`,
    done: () => (hunt()?.stats.rerollsUsed ?? 0) > 0
  },
  {
    id: 'g-free', guide: true, info: true, at: ['tele'],
    when: () => { const h = hunt(); return !!h && h.turn >= 2 && (h.stats.rerollsUsed > 0 || game.save.tips.includes('reroll')); },
    text: () => 'That\'s the basics: read its next move, aim, spend your dice, end the turn. The rest of this hunt is yours. More tips appear when something new happens.',
    next: 'Start hunting'
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
    id: 'bounties', learn: true, at: ['bounties'],
    when: () => game.view === 'board' && E.BOUNTIES_ON && game.save.tips.includes('track') && !game.save.loadout.bounty && E.bountiesFor(game.save.loadout.target).length > 0 && (game.save.record[game.save.loadout.target]?.wins ?? 0) > 0,
    text: () => 'New: bounties. Take one before you hunt this monster again. Meet its goals and win for extra coin and Hunter\'s Seals.',
    done: () => !!game.save.loadout.bounty
  },
  {
    id: 'failed', at: ['tele'],
    when: () => game.view === 'hunt' && game.hunt?.over === 'lose',
    text: () => 'Hunts can fail. You keep your weapons and armor; only the items you carried are lost. Guard against its big hits, and break the part that powers them.'
  },
  {
    id: 'forge', guide: true, learn: true, at: ['to-forge', 'nav-forge'],
    when: () => game.save.hunts > 0 && game.view !== 'forge' && !(game.view === 'hunt' && game.hunt && !game.hunt.over) && Object.values(game.save.mats).some(n => n > 0),
    text: () => 'You brought back coin and materials. Open the Forge to turn them into better weapons and armor.',
    done: () => game.view === 'forge'
  },
  {
    id: 'track', guide: true, learn: true, at: ['track', 'forge-act'],
    when: () => game.view === 'forge',
    text: () => 'Pick a weapon or armor from the list. If you can\'t afford it yet, click Track: its materials are then flagged on the Hunt Board and in the Shop, so you know what to hunt next.',
    done: () => !!game.save.tracked || Object.keys(game.save.weapons).length > 2 || Object.keys(game.save.armors).length > 1
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
  /** Got it / Next. Guided action steps can't be dismissed: they wait until the player does them. */
  dismiss() { const c = this.current; if (c && (!c.guide || c.info)) this.markSeen(c.id); }
  skipAll() { settings.prefs.tips = false; settings.save(); }
  /** Turning tips back on replays them from the start. */
  setEnabled(on: boolean) {
    settings.prefs.tips = on; settings.save();
    if (on) { game.save.tips = []; this.shown = null; game.persist(); }
  }
  /** The first hunt opens on fixed dice, so the first lessons always work. */
  scriptFirstHunt() {
    return settings.prefs.tips && game.save.hunts === 0 && !game.save.tips.includes('g-free') && game.save.loadout.target === 'gorehorn';
  }
}

export const coach = new Coach();
