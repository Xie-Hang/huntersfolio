// Tutorial tips: short prompts that appear the moment they're relevant, point at the thing
// they describe, and go away when the player does it. One at a time, in priority order.
// Each tip shows once per save (Save.tips). Players can switch them off in Settings.
//
// A tip is "pending" while unseen and its `when` holds. Once shown, it is marked seen when
// `done` holds, when the player clicks Got it, or when the moment passes (`when` stops holding).
import * as E from '../engine';
import { game } from './game.svelte';
import { settings } from './settings.svelte';
import { shows } from './reveal';

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

/** the Foothills (the tutorial island, Nov 2026): one short prompt at a time, eight words or fewer, each pointing at
 *  the one thing to press. These are the only tips while the island is on; the Ridge's own tips come after. */
const onIsland = (mid: string) => { const h = hunt(); return h && h.mid === mid ? h : null; };
const ISLAND: Tip[] = [
  {
    id: 'i-begin', guide: true, learn: true, at: ['begin'],
    when: () => game.view === 'board' && !game.hunt && E.islandStep(game.save) === 0,
    text: () => 'Your first hunt: a Scuttlehog. Tap Hunt.',
    done: () => game.view === 'hunt'
  },
  {
    id: 'i-die', guide: true, learn: true, at: ['dice'],
    when: () => { const h = onIsland('scuttlehog'); return !!h && h.turn === 1 && unusedTurn(h) && !game.sel.length; },
    text: () => 'Tap a die.',
    done: () => game.sel.length > 0 || !!hunt()?.dice.some(d => d.used)
  },
  {
    id: 'i-move', guide: true, learn: true, at: ['move'],
    when: () => { const h = onIsland('scuttlehog'); return !!h && h.turn === 1 && game.sel.length > 0 && unusedTurn(h); },
    text: () => 'Now tap Slash.',
    done: () => !!hunt()?.dice.some(d => d.used)
  },
  {
    id: 'i-end', guide: true, learn: true, at: ['end'],
    when: () => { const h = onIsland('scuttlehog'); return !!h && h.turn === 1 && freeDice(h) === 0; },
    text: () => 'Dice spent. End your turn.',
    done: () => (hunt()?.turn ?? 1) > 1
  },
  {
    id: 'i-tele', guide: true, info: true, at: ['tele'],
    when: () => { const h = onIsland('snapclaw'); return !!h && h.turn === 1 && unusedTurn(h); },
    text: () => 'This is its next move. Watch it.',
    next: 'Got it'
  },
  {
    id: 'i-block', guide: true, learn: true, at: ['guard'],
    when: () => { const h = onIsland('snapclaw'); return !!h && h.intent === 'pinch' && h.guard === 0 && freeDice(h) > 0; },
    text: () => 'A big hit is coming. Block it.',
    done: () => (hunt()?.guard ?? 0) > 0
  },
  {
    id: 'i-forge', guide: true, learn: true, at: ['to-forge', 'nav-forge'],
    when: () => E.islandStep(game.save) === 2 && game.view !== 'forge' && !(game.view === 'hunt' && game.hunt && !game.hunt.over),
    text: () => 'You have Shell. Make a blade.',
    done: () => game.view === 'forge'
  },
  {
    id: 'i-make', guide: true, learn: true, at: ['forge-act'],
    when: () => E.islandStep(game.save) === 2 && game.view === 'forge',
    text: () => 'Make the Hunter\'s Blade.',
    done: () => E.islandDone(game.save)
  },
  // ---- slice 2: the Tuskling, the lodge, the Burrowmole, the Shop, the Tuskling again ----
  {
    id: 'i-aim', guide: true, learn: true, at: ['parts'],
    when: () => { const h = onIsland('tuskling'); return !!h && E.islandStep(game.save) === 3 && h.target !== 'hide' && !h.mon.parts.hide.broken; },
    text: () => 'Blades can\u2019t break tusks. Tap the Hide.',
    done: () => hunt()?.target === 'hide'
  },
  {
    // the shortcut (Mekkman, Nov 2026): a move picks its own dice when none are selected
    id: 'i-quick', guide: true, learn: true, at: ['move'],
    when: () => { const h = onIsland('tuskling'); return !!h && E.islandStep(game.save) === 3 && game.save.tips.includes('i-aim') && unusedTurn(h) && !game.sel.length && E.currentWeapon(h).moves.some((_, i) => E.canUseMove(h, i)); },
    text: () => 'Shortcut: tap a move. It picks the dice.',
    done: () => { const h = hunt(); return !!h && !unusedTurn(h); }
  },
  {
    id: 'i-maul', guide: true, info: true, at: ['slot-w1'],
    when: () => game.view === 'board' && E.islandStep(game.save) === 4 && !(game.hunt && !game.hunt.over),
    text: () => 'A gift from the lodge: a maul. Carry both.',
    next: 'Got it'
  },
  {
    id: 'i-swap', guide: true, learn: true, at: ['swap'],
    when: () => { const h = onIsland('burrowmole'); return !!h && h.mon.under && E.currentWeapon(h).type !== 'Blunt' && freeDice(h) > 0; },
    text: () => 'It\u2019s underground. Swap to your maul.',
    done: () => { const h = hunt(); return !!h && E.currentWeapon(h).type === 'Blunt'; }
  },
  {
    id: 'i-pick', guide: true, at: ['dice'],
    when: () => { const h = onIsland('burrowmole'); return !!h && h.turn >= 2 && h.rerolls > 0 && unusedTurn(h) && !game.sel.length && h.dice.some(d => d.face === 'B'); },
    text: () => 'Don\u2019t like a die? Tap it.',
    done: () => game.sel.length > 0 || (hunt()?.stats.rerollsUsed ?? 0) > 0
  },
  {
    id: 'i-reroll', guide: true, learn: true, at: ['reroll'], side: 'right',
    when: () => { const h = onIsland('burrowmole'); return !!h && h.rerolls > 0 && unusedTurn(h) && game.sel.length > 0 && game.save.tips.includes('i-pick'); },
    text: () => 'Now Reroll it. New face, same turn.',
    done: () => (hunt()?.stats.rerollsUsed ?? 0) > 0
  },
  {
    id: 'i-shop', guide: true, learn: true, at: ['to-shop', 'nav-shop'],
    when: () => E.islandStep(game.save) === 6 && game.view !== 'shop' && !(game.view === 'hunt' && game.hunt && !game.hunt.over),
    text: () => 'The Shop is open. Buy a salve.',
    done: () => game.view === 'shop'
  },
  {
    id: 'i-buy', guide: true, learn: true, at: ['buy-salve'],
    when: () => E.islandStep(game.save) === 6 && game.view === 'shop',
    text: () => 'A salve heals you mid-hunt. Buy one.',
    done: () => E.islandStep(game.save) >= 7
  },
  {
    id: 'i-sell', info: true, at: ['shop-sell'],
    when: () => E.islandStep(game.save) === 7 && game.view === 'shop' && (game.save.mats.tuft ?? 0) > 0,
    text: () => 'Spare tufts sell for coin, on Sell.',
    next: 'Got it'
  },
  {
    id: 'i-salve', guide: true, learn: true, at: ['item'],
    when: () => { const h = onIsland('tuskling'); return !!h && !!h.item && E.itemUsable(h) && h.php <= h.pmax * 0.75; },
    text: () => 'Hurt? Use your salve. It costs no dice.',
    done: () => !!hunt()?.itemUsed
  },
  {
    id: 'i-snare', guide: true, learn: true, at: ['capture'],
    when: () => { const h = onIsland('tuskling'); return !!h && E.canCapture(h) && E.captureReady(h) && !h.snareSet && freeDice(h) >= 2; },
    text: () => 'It\u2019s weak. Set a Snare to catch it.',
    done: () => !!hunt()?.snareSet || !!game.hunt?.captured
  },
  {
    id: 'i-ridge', guide: true, info: true, at: ['begin', 'nav-board'],
    when: () => E.islandDone(game.save) && game.save.tips.includes('i-begin') && game.view !== 'hunt' && !(game.save.record.gorehorn?.hunts ?? 0),
    text: () => 'You know the basics. Ashfall Ridge is open.',
    next: 'Got it'
  }
];
/** the first Ridge hunt's basics, already taught in the Foothills */
const ISLAND_TAUGHT = ['begin', 'g-next', 'g-hp', 'move', 'guard', 'end', 'aim', 'g-pick', 'reroll', 'g-free', 'item'];

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
      return `Its next move: ${i.name}${inc?.net ? `, ${inc.raw} damage to you` : ''}. Check it every turn: it tells you when to attack and when to defend.`;
    }
  },
  {
    id: 'g-hp', guide: true, info: true, at: ['you'],
    when: () => { const h = hunt(); return !!h && h.turn === 1 && unusedTurn(h); },
    text: () => 'Your HP. The striped end is what that move will take if you do nothing.'
  },
  {
    id: 'aim', guide: true, learn: true, at: ['parts'],
    // the second hunt's new layer (the first hunt has no parts row: it aims for you)
    when: () => { const h = hunt(); return !!h && shows(h, 'parts') && h.turn === 1 && unusedTurn(h) && h.target !== bestPart(h).id; },
    text: () => {
      const h = hunt()!, w = E.currentWeapon(h), p = bestPart(h), t = E.MONSTERS[h.mid].parts.find(x => x.id === h.target)!;
      const none = t.eff[w.type] === 0;
      return `New: aim. Your ${w.name}${none ? ` can’t break the ${t.name.toLowerCase()}` : ` breaks less on the ${t.name.toLowerCase()}`}. Click the ${p.name}: it breaks more. A broken part drops materials.`;
    },
    done: () => { const h = hunt(); return !!h && h.target === bestPart(h).id; }
  },
  {
    id: 'move', guide: true, learn: true, at: ['move'],
    when: () => { const h = hunt(); return !!h && unusedTurn(h) && anyMoveReady(h); },
    text: () => {
      const h = hunt()!, w = E.currentWeapon(h), best = [...w.moves.keys()].filter(i => E.canUseMove(h, i)).sort((a, b) => w.moves[b].dmg - w.moves[a].dmg)[0];
      return `To attack, click a move. Each move needs the dice shapes on its right. You rolled what ${w.moves[best].name} needs: click it.`;
    },
    done: () => { const h = hunt(); return !!h && h.dice.some(d => d.used && d.used !== 'Block'); }
  },
  {
    id: 'guard', guide: true, learn: true, at: ['guard'],
    when: () => { const h = hunt(); return !!h && !unusedTurn(h) && freeDice(h) > 0 && !anyMoveReady(h) && h.guard === 0; },
    text: () => {
      const h = hunt()!, inc = E.incoming(h), d = game.sel.length ? game.sel : E.autoDice(h, 'guard') ?? [], g = d.reduce((a, i) => a + E.guardOf(h, i), 0);
      const blank = d.length && d.every(i => h.dice[i].face === 'B');
      return `${blank ? 'A blank fits no move, but it blocks best.' : 'Dice that fit no move can Block.'} Click Block: it stops ${g}${inc?.net ? `, so the ${inc.raw} becomes ${Math.max(0, inc.raw - g)}` : ''}.`;
    },
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
    text: () => `Click Reroll. Only the selected dice roll again. You have ${hunt()!.rerolls} for the whole hunt.`,
    done: () => (hunt()?.stats.rerollsUsed ?? 0) > 0
  },
  {
    id: 'g-free', guide: true, info: true, at: ['tele'],
    when: () => { const h = hunt(); return !!h && h.turn >= 2 && (h.stats.rerollsUsed > 0 || game.save.tips.includes('reroll')); },
    text: () => 'That\'s it: read its next move, spend your dice, end the turn. The rest of this hunt is yours. Your next few hunts add a little more each time.',
    next: 'Start hunting'
  },
  // ---- the first big attack: the most important lesson ----
  {
    id: 'windup', at: ['tele'],
    when: () => hunt()?.intent === 'windup',
    text: () => 'It\'s winding up: next turn it charges, and that hits hard. This turn is safe: put every die into damage.'
  },
  {
    id: 'charge', at: ['guard'],
    when: () => { const h = hunt(); const inc = h && E.incoming(h); return !!h && (E.intentInfo(h).threat >= 3) && !!inc?.net && h.guard === 0; },
    text: () => {
      const h = hunt()!, inc = E.incoming(h)!, n = freeDice(h);
      return `This one hurts: ${inc.raw} damage. Blocking with all ${n} dice blocks ${E.freeDice(h).reduce((t, i) => t + E.guardOf(h, i), 0)}. Block, hit back, or split them: your call.`;
    },
    done: () => (hunt()?.guard ?? 0) > 0
  },
  {
    id: 'item', learn: true, at: ['item'],
    when: () => { const h = hunt(); return !!h && shows(h, 'item') && !!h.item && E.itemUsable(h) && E.ITEMS[h.item].effect === 'heal30' && h.php <= h.pmax * 0.6; },
    text: () => { const h = hunt()!; return `Running low? Your ${E.ITEMS[h.item!].name} heals 30 and costs no dice. One item per turn, ${h.itemCharges} left.`; },
    done: () => !!hunt()?.itemUsed
  },
  {
    // traps (Nov 2026): the first hunt you carry one, say what it catches and what it's for, once
    id: 'trap', learn: true, at: ['item'],
    when: () => { const h = hunt(); return !!h && shows(h, 'item') && !!h.item && E.ITEMS[h.item].effect.startsWith('trap') && h.turn === 1 && unusedTurn(h); },
    text: () => {
      const h = hunt()!, it = E.ITEMS[h.item!], mv = E.trapMoves(h.mid)[it.effect as 'trapRush' | 'trapLand'];
      return `Your ${it.name} catches ${it.effect === 'trapRush' ? 'charges, lunges and pounces' : 'dives, and bursts up from underground'}${mv.length ? ` (the ${E.MONSTERS[h.mid].short}'s ${mv.join(', ')})` : ''}. Set it, free, on a turn its next move is one of those: you take no damage and it's held for ${E.TRAP_HOLD[it.effect as 'trapRush']} turns. If it's weak enough to capture when it springs, it's captured. Set on any other move, the trap is wasted.`;
    },
    done: () => !!hunt()?.itemUsed || (hunt()?.turn ?? 1) > 3
  },
  {
    id: 'swap', learn: true, at: ['swap'],
    when: () => {
      const h = hunt(); if (!h || !shows(h, 'swap') || h.turn < 2 || !unusedTurn(h)) return false;
      const M = E.MONSTERS[h.mid], o = E.otherWeapon(h), w = E.currentWeapon(h);
      return M.parts.some(p => !h.mon.parts[p.id].broken && p.eff[o.type] > p.eff[w.type]);
    },
    text: () => {
      const h = hunt()!, o = E.otherWeapon(h), M = E.MONSTERS[h.mid], w = E.currentWeapon(h);
      const p = M.parts.find(p => !h.mon.parts[p.id].broken && p.eff[o.type] > p.eff[w.type])!;
      return `New: you carry two weapons. Swapping costs 1 die. Your ${o.name} is ${o.type}: it breaks the ${p.name.toLowerCase()} better.`;
    },
    done: () => { const h = hunt(); return !!h && h.dice.some(d => d.used === 'Swap'); }
  },
  // ---- resist armor only cuts elemental attacks (Nov 2026): say so the first time it matters, or it looks like a bug ----
  {
    id: 'physical', at: ['tele'],
    when: () => { const h = hunt(); const inc = h && E.incoming(h); return !!h && shows(h, 'all') && !!inc && inc.wearsResist && inc.elem === 0 && inc.raw > 0; },
    text: () => {
      const h = hunt()!, M = E.MONSTERS[h.mid], i = E.intentInfo(h);
      return `Your ${h.arm.name} resists ${M.elem} attacks only. ${i.name} is a physical attack, so it hits in full. It's the ${M.elemental?.join(' and ') ?? 'elemental attacks'} your armor cuts by 30%.`;
    }
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
    // the fourth hunt's layer: Charge (Capture has its own tip when it's ready)
    id: 'chargeNew', learn: true, at: ['charge'],
    when: () => { const h = hunt(); return !!h && shows(h, 'all') && h.turn >= 2 && unusedTurn(h) && (E.incoming(h)?.net ?? 0) < E.CHARGE_BREAK && !h.chargePending && !h.chargeReady; },
    text: () => `New: Charge. Spend ${E.chargeDice(hunt()!)} dice now and your first hit next turn deals double. A hit of ${E.CHARGE_BREAK}+ on you breaks it.`,
    done: () => !!hunt()?.chargePending
  },
  {
    id: 'open', at: ['move', 'tele'],
    when: () => { const h = hunt(); return !!h && E.intentInfo(h).threat === 0 && E.intentInfo(h).dmg === 0 && h.turn > 1 && h.intent !== 'windup'; },
    text: () => 'It won\'t attack this turn. No need to Block: put every die into damage.'
  },
  {
    id: 'enraged', at: ['tele'],
    when: () => !!hunt()?.mon.enraged,
    text: () => 'Below half HP it\'s enraged: its attacks hit harder. Check the panel before you end each turn.'
  },
  {
    id: 'capture', at: ['capture'],
    when: () => { const h = hunt(); return !!h && shows(h, 'parts') && E.captureReady(h); },
    text: () => `New: it's weak enough to capture. Capture sets a Snare with 2 dice. It closes when you end your turn, unless its move hits you for ${E.CHARGE_BREAK} or more. A capture gives double part materials.`
  },
  // ---- back in town ----
  {
    // playtest (Nov 2026): three testers never found out that materials sell for coin
    id: 'sell', learn: true, at: ['to-shop', 'nav-shop'],
    when: () => game.save.hunts > 0 && game.save.tips.includes('track') && game.view !== 'shop' && !(game.view === 'hunt' && game.hunt && !game.hunt.over) && E.surplusValue(game.save) >= 40,
    text: () => `Short on coin? Materials no recipe needs sell at the Shop. Yours are worth ${E.surplusValue(game.save)} coin right now: open the Shop's Sell tab.`,
    done: () => game.view === 'shop'
  },
  {
    id: 'bounties', learn: true, at: ['bounties'],
    when: () => game.view === 'board' && game.boardMon && E.BOUNTIES_ON && game.save.tips.includes('track') && !game.save.loadout.bounty && E.bountiesFor(game.save.loadout.target).length > 0 && (game.save.record[game.save.loadout.target]?.wins ?? 0) > 0,
    text: () => 'New: bounties. Choose one here before you hunt this monster again. Meet its goals and win for extra coin. Completing bounties also unlocks three charms at the Forge.',
    done: () => !!game.save.loadout.bounty
  },
  {
    id: 'failed', at: ['tele'],
    when: () => game.view === 'hunt' && game.hunt?.over === 'lose',
    text: () => 'Hunts can fail. You keep your weapons, armor and the materials of any part you broke; you lose the coin and the items you carried. Block against its big hits, and break the part that powers them.'
  },
  {
    id: 'forge', guide: true, learn: true, at: ['to-forge', 'nav-forge'],
    // Nov 2026 playtest: straight after the first win this was "more info". It now waits until something can be made.
    when: () => game.save.hunts > 1 && game.view !== 'forge' && !(game.view === 'hunt' && game.hunt && !game.hunt.over) && E.forgeReady(game.save),
    text: () => 'You have enough to make something at the Forge.',
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
    if (!E.islandDone(game.save) || (seen.includes('i-begin') && !seen.includes('i-ridge'))) return ISLAND.find(t => !seen.includes(t.id) && t.when()) ?? null;
    const did = seen.includes('i-begin');
    return TIPS.find(t => !seen.includes(t.id) && !(did && ISLAND_TAUGHT.includes(t.id)) && t.when()) ?? null;
  });
  private shown: string | null = null;

  /** Call from an effect: retires the tip on screen once it's done or its moment has passed. */
  sync() {
    if (settings.prefs.tips) for (const t of [...ISLAND, ...TIPS]) if (t.learn && !game.save.tips.includes(t.id) && t.done?.()) this.markSeen(t.id);
    const cur = this.current;
    // an island prompt waits for its moment: one shown and not yet done stays pending (only retire it once done)
    if (this.shown && this.shown !== cur?.id && !this.shown.startsWith('i-')) this.markSeen(this.shown);
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
  /** `veteran`: skipping the tutorial itself also skips the one-layer-per-hunt screen */
  skipAll(veteran = false) { settings.prefs.tips = false; if (veteran) { settings.prefs.showAll = true; game.skipIsland(); } settings.save(); }
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
