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
  /** the targets, first found wins; a function when it depends on the screen (the result card's button vs the nav) */
  at: string[] | (() => string[]);
  when: () => boolean;
  text: () => string;
  /** the player did what the tip asks */
  done?: () => boolean;
  /** doing it counts even if the tip was never shown (they found it on their own) */
  learn?: boolean;
  /** a guided step: can't be dismissed, only done (or the whole tutorial skipped) */
  guide?: boolean;
  /** a guided step that only explains. Off the island the player clicks Next; on it (Nov 2026 playtest: no Got it
   *  buttons) the player selects the highlighted thing to move on */
  info?: boolean;
  /** an island prompt with nothing to select: it gets a Got it button instead */
  gotit?: boolean;
  /** the card's header (island prompts: what the prompt is about, not just "The Foothills") */
  head?: string;
  /** label for the Next button */
  next?: string;
  /** a Ridge lesson (8 Nov 2026: "the tutorial is too long"): one a hunt at most, then a hunt with none */
  lesson?: boolean;
  /** where the card goes when the usual spot (below, then above) would cover something the step needs */
  side?: 'right' | 'left';
}

/** prompts actually put on screen this session (a learn prompt can be done without ever showing) */
const onScreen = new Set<string>();
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
/** a Foothills make you can't pay for yet: its prompt holds back (it would lock you on a greyed button) */
const short = (k: E.RecipeKind, id: string) => { const r = E.recipeOf(game.save, k, id); return !!r.action && !!r.cost && !E.canPay(game.save, r.cost); };
/** what the island's Forge step asks you to make next */
const forgeNeed = (): [E.RecipeKind, string] | null => {
  const st = E.islandStep(game.save);
  return st === 2 ? ['w', 'blade'] : st === 5 ? ['a', 'hidevest'] : null;
};
const canMake = () => { const n = forgeNeed(); return !n || !short(...n); };
const huntOn = () => game.view === 'hunt' && !!game.hunt && !game.hunt.over;
const onIsland = (mid: string) => { const h = hunt(); return h && h.mid === mid ? h : null; };
const toForge = () => (game.view === 'hunt' ? ['to-forge'] : ['nav-forge']);
const toShop = () => (game.view === 'hunt' ? ['to-shop'] : ['nav-shop']);
const ISLAND: Tip[] = [
  {
    // a replayed lesson (Help → How to hunt) ends here
    id: 'i-lessondone', head: 'Lesson done', guide: true, info: true, at: ['end-lesson'],
    when: () => !!game.lesson && (game.hunt?.over != null && game.view === 'hunt' || (game.lesson.n === 3 && E.islandStep(game.save) >= E.EXAM_STEP)),
    text: () => "That’s the lesson! Nicely done."
  },
  {
    id: 'i-begin', head: 'Your first hunt', guide: true, learn: true, at: ['begin'],
    when: () => game.view === 'board' && !game.hunt && E.islandStep(game.save) === 0,
    text: () => "Hi, I’m Mell! I’ll be showing you the ropes. Let’s start with a Cragling.",
    done: () => game.view === 'hunt'
  },
  // ---- the Cragling: your turn ----
  {
    // the faces, said at the very start (Nov 2026 playtest: a tester read the old circle as a "1")
    id: 'i-die', guide: true, learn: true, at: ['dice'], head: 'Your dice',
    when: () => { const h = onIsland('scuttlehog'); return !!h && h.turn === 1 && unusedTurn(h) && !game.sel.length; },
    text: () => 'These are your dice. Right now they all show Fangs. Select one.',
    done: () => game.sel.length > 0 || !!hunt()?.dice.some(d => d.used)
  },
  {
    id: 'i-move', head: 'Moves', guide: true, learn: true, at: ['move'],
    when: () => { const h = onIsland('scuttlehog'); return !!h && h.turn === 1 && game.sel.length > 0 && unusedTurn(h); },
    text: () => '**Slash** needs one Fang, and you have one ready. Select **Slash**.',
    done: () => !!hunt()?.dice.some(d => d.used)
  },
  {
    // the first turn is played out to the end (Nov 2026 playtest): every die, then End turn
    id: 'i-again', guide: true, learn: true, at: ['move'], head: 'Moves',
    when: () => { const h = onIsland('scuttlehog'); return !!h && h.turn === 1 && !unusedTurn(h) && freeDice(h) > 0 && E.canUseMove(h, 0); },
    // the shortcut, taught here (Mekkman, 8 Nov 2026): with no die selected, a move picks its own
    text: () => "Here’s a shortcut. Select **Slash** on its own and it picks a Fang automatically.",
    done: () => { const h = hunt(); return !!h && h.mid === 'scuttlehog' && (h.turn > 1 || freeDice(h) === 0); }
  },
  {
    id: 'i-end', head: 'End turn', guide: true, learn: true, at: ['end'],
    when: () => { const h = onIsland('scuttlehog'); return !!h && h.turn === 1 && freeDice(h) === 0; },
    text: () => "That’s all your dice used. End your turn and see what it does.",
    done: () => (hunt()?.turn ?? 1) > 1
  },
  {
    // its next move, at the start of turn 2: it has just hit you once, so the panel means something. A Got it button:
    // the panel can't be selected (Mekkman, Nov 2026 playtest). Turn 2 is then played with no prompt
    id: 'i-tele', guide: true, info: true, gotit: true, at: ['tele'], head: 'Next move',
    when: () => { const h = onIsland('scuttlehog'); return !!h && h.turn === 2 && unusedTurn(h) && !game.sel.length; },
    text: () => "This shows what it’ll do next, and how hard. Keep an eye on it every turn."
  },
  {
    // turn 3 rolls two blanks (game.rerollLesson): Reroll, after two turns of fixed rolls (Mekkman, 8 Nov 2026)
    id: 'i-pick', head: 'Reroll', guide: true, learn: true, at: ['dice'],
    when: () => { const h = onIsland('scuttlehog'); return !!h && h.turn >= 3 && h.rerolls > 0 && h.stats.rerollsUsed === 0 && unusedTurn(h) && h.dice.some((d, i) => d.face === 'B' && !game.sel.includes(i)); },
    text: () => "Two blanks. They don’t fit any move. Select both of them.",
    // (only once there are blanks: the all-Fang turns before must not count as having done it)
    done: () => { const h = hunt(); return !!h && (h.stats.rerollsUsed > 0 || (h.dice.some(d => d.face === 'B') && h.dice.every((d, i) => d.face !== 'B' || game.sel.includes(i)))); }
  },
  {
    id: 'i-reroll', head: 'Reroll', guide: true, learn: true, at: ['reroll'], side: 'right',
    when: () => { const h = onIsland('scuttlehog'); return !!h && h.rerolls > 0 && h.stats.rerollsUsed === 0 && game.sel.some(i => h.dice[i]?.face === 'B'); },
    text: () => "Now select **Reroll** to roll them again. Let’s see what you get!",
    done: () => (hunt()?.stats.rerollsUsed ?? 0) > 0
  },
  {
    // where the lessons can be replayed, once, after the first hunt (Mekkman, 8 Nov 2026)
    id: 'i-lessons', head: 'Lessons', guide: true, info: true, gotit: true, at: ['help'],
    when: () => !game.lesson && E.islandStep(game.save) >= 1 && !huntOn() && game.save.hunts > 0,
    text: () => "Want to go over a lesson again? You’ll find them all in here."
  },
  // ---- the Rimekit: faces, several dice, Block ----
  {
    // only to read: a Got it button, not "select one" (Mekkman, Nov 2026)
    id: 'i-faces2', guide: true, info: true, gotit: true, at: ['dice'], head: 'New faces',
    when: () => { const h = onIsland('snapclaw'); return !!h && h.turn === 1 && unusedTurn(h) && !game.sel.length; },
    text: () => 'New faces! From now on, Claws and blanks join the Fangs.'
  },
  {
    // several dice, one move, used that many times (Nov 2026 playtest)
    // three Fangs, so it reads as "one Slash per Fang", not "a ×2 button" (Nov 2026 playtest: a tester thought ×2 was the cap)
    id: 'i-twice', guide: true, learn: true, at: ['dice'], head: 'Several dice',
    when: () => { const h = onIsland('snapclaw'); const f = h ? h.dice.filter(d => d.face === 'C' && !d.used).length : 0; return !!h && h.turn === 2 && f >= 2 && unusedTurn(h) && game.sel.filter(i => h.dice[i]?.face === 'C').length < f; },
    text: () => { const h = hunt(); const f = h ? h.dice.filter(d => d.face === 'C' && !d.used).length : 3; return f === 3 ? 'Three Fangs! Select all three.' : `${f} Fangs! Select all ${f}.`; },
    done: () => { const h = hunt(); return game.multi > 0 || (!!h && h.mid === 'snapclaw' && h.turn === 2 && game.sel.filter(i => h.dice[i]?.face === 'C').length >= h.dice.filter(d => d.face === 'C' && !d.used).length); }
  },
  {
    id: 'i-twice2', guide: true, learn: true, at: ['move'], head: 'Several dice',
    when: () => { const h = onIsland('snapclaw'); return !!h && game.save.tips.includes('i-twice') && E.repeatCount(h, 0, game.sel) >= 2; },
    text: () => `Now select **Slash**. It strikes once for each Fang, ${E.repeatCount(hunt()!, 0, game.sel)} times.`,
    done: () => game.multi > 0
  },
  {
    id: 'i-block', head: 'Block', guide: true, learn: true, at: ['guard'],
    when: () => { const h = onIsland('snapclaw'); return !!h && h.intent === 'pinch' && h.guard === 0 && freeDice(h) > 0; },
    // Block arrives here, after several dice (it's hidden until turn 3, game.rerollLesson); Any means any face
    text: () => 'Big hit coming! Put your dice into **Block** to take less. Any die works.',
    done: () => (hunt()?.guard ?? 0) > 0
  },
  // ---- the Forge: the blade (and the maul) ----
  {
    id: 'i-forge', head: 'The Forge', guide: true, learn: true, at: toForge,
    when: () => E.islandStep(game.save) === 2 && game.view !== 'forge' && !huntOn(),
    text: () => "That Kit Scale is just what we need. Let’s make you a proper blade.",
    done: () => game.view === 'forge'
  },
  {
    id: 'i-make', head: 'The Forge', guide: true, learn: true, at: ['forge-act'],
    when: () => E.islandStep(game.save) === 2 && game.view === 'forge' && canMake(),
    text: () => "The Hunter’s Blade. It’s yours to keep.",
    done: () => E.islandStep(game.save) >= 3
  },
  {
    id: 'i-maul', guide: true, info: true, gotit: true, at: ['slot-w1'], head: 'Two weapons',
    when: () => game.view === 'board' && E.islandStep(game.save) === 3 && !huntOn(),
    text: () => 'I asked the lodge to lend you a maul. You can now carry two weapons into hunts.'
  },
  // ---- the Tuskling: aim and Swap ----
  {
    id: 'i-aim', head: 'Aim', guide: true, learn: true, at: ['part-hide', 'parts'],
    when: () => { const h = onIsland('tuskling'); return !!h && E.islandStep(game.save) === 3 && h.target !== 'hide' && !h.mon.parts.hide.broken && E.currentWeapon(h).type === 'Cut'; },
    text: () => 'Your blade is **Cut**, and **Cut** can’t break tusks. Aim at the Hide instead.',
    done: () => hunt()?.target === 'hide'
  },
  {
    // Undo, once you've done something on turn 2 (Mekkman, 8 Nov 2026: it had no prompt)
    id: 'i-undo', head: 'Undo', guide: true, learn: true, at: ['undo'],
    when: () => { const h = onIsland('tuskling'); return !!h && E.islandStep(game.save) === 3 && h.turn === 2 && game.undoStack.length > 0 && game.save.tips.includes('i-aim'); },
    text: () => 'Changed your mind? **Undo** takes back your last action.',
    done: () => game.undos > 0
  },
  {
    // turn 3 rolls a blank for Swap to take (game.rerollLesson)
    id: 'i-swap', head: 'Swap', guide: true, learn: true, at: ['swap'],
    when: () => { const h = onIsland('tuskling'); return !!h && E.islandStep(game.save) === 3 && h.turn >= 3 && !h.mon.parts.tusks.broken && E.currentWeapon(h).type !== 'Blunt' && freeDice(h) > 0 && (game.sel.length === 1 || !!E.autoDice(h, 'swap')); },
    text: () => 'Those Tusks need **Blunt**. **Swap** to your maul.',
    done: () => { const h = hunt(); return !!h && E.currentWeapon(h).type === 'Blunt'; }
  },
  {
    id: 'i-tusks', head: 'Aim', guide: true, learn: true, at: ['part-tusks', 'parts'],
    when: () => { const h = onIsland('tuskling'); return !!h && E.islandStep(game.save) === 3 && E.currentWeapon(h).type === 'Blunt' && h.target !== 'tusks' && !h.mon.parts.tusks.broken; },
    text: () => 'Now aim at the Tusks.',
    // (the hunt opens aimed at the Tusks: that must not count)
    done: () => { const h = hunt(); return !!h && h.target === 'tusks' && E.currentWeapon(h).type === 'Blunt'; }
  },
  // ---- practice: the Cinderpup and the Shrikelet, no prompts ----
  {
    // the weapon types' own tricks (Mekkman, 8 Nov 2026): Flow is the first one met, on the blade's Cleave
    id: 'i-flow', head: 'Flow', guide: true, info: true, gotit: true, at: ['slot-w0'],
    when: () => E.islandStep(game.save) === 4 && game.view === 'board' && game.boardMon && !huntOn() && !game.lesson,
    text: () => 'Every weapon type has its own special trick. Your blade’s is **Flow**. Moves tagged **Flow** give you a free **Reroll**, once a turn.'
  },
  {
    id: 'i-practice', head: 'Practice', guide: true, info: true, gotit: true, at: ['begin'],
    when: () => E.islandStep(game.save) === 4 && game.view === 'board' && game.boardMon && !huntOn(),
    text: () => "Time to practise on your own! Beat the Cinderpup and the Shrikelet, in any order. I’ll be watching."
  },
  // ---- get ready: the vest, then a salve ----
  {
    id: 'i-vest', head: 'Get ready', guide: true, learn: true, at: toForge,
    when: () => E.islandStep(game.save) === 5 && game.view !== 'forge' && !huntOn(),
    text: () => "You’re nearly ready for your promotion hunt! First, let’s get you some armour.",
    done: () => game.view === 'forge'
  },
  {
    id: 'i-vest2', head: 'Armour', guide: true, learn: true, at: () => (game.forgeTab === 'armor' ? ['forge-act'] : ['tab-armor']),
    when: () => E.islandStep(game.save) === 5 && game.view === 'forge' && canMake(),
    text: () => (game.forgeTab === 'armor' ? "The Hide Vest. You’ll wear it as soon as it’s made." : onScreen.has('i-vest') ? "Armour’s in here." : "You’re nearly ready for your promotion hunt! Armour’s in here."),
    done: () => E.islandStep(game.save) >= 6
  },
  {
    // the island pays little: someone who spent it all can come up short at a make
    id: 'i-short', head: 'Coin', info: true, at: ['forge-act'],
    when: () => game.view === 'forge' && !canMake(),
    text: () => 'Not quite enough coin yet. One more hunt should do it.',
    next: 'Got it'
  },
  {
    id: 'i-shop', head: 'Get ready', guide: true, learn: true, at: toShop,
    when: () => E.islandStep(game.save) === 6 && game.view !== 'shop' && !huntOn(),
    text: () => "Next, something for emergencies. Let’s visit the Shop.",
    done: () => game.view === 'shop'
  },
  {
    id: 'i-buy', head: 'The Shop', guide: true, learn: true, at: ['buy-salve'],
    when: () => E.islandStep(game.save) === 6 && game.view === 'shop',
    text: () => 'A salve heals you mid-hunt. Good to have one, just in case.',
    done: () => E.islandStep(game.save) >= 7
  },
  {
    // the salve, on the Hunt Board before the exam, and in it the first time you're hurt (Mekkman, 8 Nov 2026)
    id: 'i-item', head: 'Items', guide: true, info: true, gotit: true, at: ['slot-item'],
    when: () => E.onExam(game.save) && game.view === 'board' && game.boardMon && !huntOn() && !game.lesson,
    text: () => "Your salve heals 30 during a hunt, and items don’t cost any dice."
  },
  {
    // Abandon hunt first shows here (hidden on the guided hunts before practice)
    id: 'i-abandon', head: 'Abandon hunt', guide: true, info: true, gotit: true, at: ['abandon'],
    when: () => { const h = hunt(); return !!h && h.exam === true && h.turn === 1 && unusedTurn(h) && !game.lesson; },
    text: () => "If it gets too rough, Abandon hunt gets you out. You’ll lose the items you carried, though."
  },
  {
    id: 'i-salve', head: 'Items', guide: true, learn: true, at: ['item'],
    when: () => { const h = hunt(); return !!h && h.exam === true && !!h.item && E.itemUsable(h) && h.php <= h.pmax * 0.7 && h.turn >= 2; },
    text: () => 'Ouch! Use your salve. It heals 30.',
    done: () => !!hunt()?.itemUsed
  },
  {
    id: 'i-exam', guide: true, info: true, at: ['begin', 'nav-board'],
    when: () => E.onExam(game.save) && game.view === 'board' && !huntOn() && !game.lesson,
    head: 'Promotion hunt',
    text: () => "This is your promotion hunt. Win it and you’re a real Hunter."
  },
  // ---- on rails until practice (Mekkman, 8 Nov 2026): every step points at the next thing. These never retire:
  // they show whenever their moment comes round (a lost hunt, a second try)
  {
    id: 'i-go', head: 'Next', guide: true, side: 'right', at: () => (game.hunt?.over === 'lose' ? ['to-retry'] : ['to-next', 'to-forge', 'to-shop']),
    when: () => !game.lesson && !!game.hunt?.over && game.view === 'hunt' && !!game.hunt.reward && !E.islandDone(game.save),
    text: () => game.hunt?.over === 'lose' ? 'That one got away. It happens to the best of us. Try again.' : E.islandTown(game.save) === 'forge' ? "You’ve got materials now. Let’s visit the Forge." : E.islandTown(game.save) === 'shop' ? "Let’s visit the Shop." : game.hunt?.mid === 'tuskling' && E.islandStep(game.save) === 4 ? 'Nicely done! Next up, some practice hunts.' : `Nicely done! The ${E.MONSTERS[game.save.loadout.target]?.short} is next.`
  },
  {
    id: 'i-hunt', head: 'Next hunt', guide: true, at: ['begin'],
    when: () => !game.lesson && game.view === 'board' && game.boardMon && !huntOn() && [0, 1, 3, 4, E.EXAM_STEP].includes(E.islandStep(game.save)) && E.isUnlocked(game.save, game.save.loadout.target),
    text: () => "Whenever you’re ready."
  },
  // done in town: back to the Hunt Board for the next hunt (once per town step)
  ...[3, 7].map((n): Tip => ({
    id: `i-back${n}`, head: 'Next hunt', guide: true, learn: true, at: ['nav-board'],
    when: () => E.islandStep(game.save) === n && (game.view === 'forge' || game.view === 'shop') && !game.lesson,
    text: () => `All done here. The ${E.MONSTERS[game.save.loadout.target]?.short ?? 'next hunt'} is next.`,
    done: () => game.view === 'board' && E.islandStep(game.save) === n
  })),
  {
    id: 'i-ridge', guide: true, info: true, at: ['begin', 'nav-board'],
    when: () => E.islandDone(game.save) && game.save.tips.includes('i-begin') && game.view !== 'hunt',
    head: 'Rank F',
    text: () => 'Rank F! I knew you could do it. Ashfall Ridge is open.'
  }
];
/** the first Ridge hunt's basics, already taught in the Foothills */
const ISLAND_TAUGHT = ['begin', 'g-next', 'g-hp', 'move', 'guard', 'end', 'aim', 'g-pick', 'reroll', 'g-free', 'swap', 'forge'];

export const tipTargets = (t: Tip | null | undefined) => (typeof t?.at === 'function' ? t.at() : t?.at ?? []);

export const TIPS: Tip[] = [
  // ---- the guided first hunt ----
  // Playtest (Nov 2026): players clicked "Got it" and were lost. These steps can't be dismissed: each stays, with
  // its highlight, until the player does it (info steps have Next). Only "Skip tutorial" turns them off.
  {
    id: 'begin', guide: true, learn: true, at: ['begin'],
    when: () => game.view === 'board' && game.save.hunts === 0 && !game.hunt,
    text: () => "Hi, I’m Mell! Your first hunt is the Gorehorn, a ridge boar. You’ve got a blade, a maul and leather armour.",
    done: () => game.view === 'hunt'
  },
  {
    id: 'g-next', guide: true, info: true, at: ['tele'],
    when: () => { const h = hunt(); return !!h && h.turn === 1 && unusedTurn(h); },
    text: () => {
      const h = hunt()!, i = E.intentInfo(h), inc = E.incoming(h);
      return `Its next move is **${i.name}**.${inc?.net ? ` It takes ${inc.raw} HP off you.` : ''} Check it every turn. It tells you when to attack and when to defend.`;
    }
  },
  {
    id: 'g-hp', guide: true, info: true, at: ['you'],
    when: () => { const h = hunt(); return !!h && h.turn === 1 && unusedTurn(h); },
    text: () => "That’s your HP. The striped end is what that move will take if you do nothing."
  },
  {
    id: 'aim', guide: true, learn: true, at: ['parts'],
    // the second hunt's new layer (the first hunt has no parts row: it aims for you)
    when: () => { const h = hunt(); return !!h && shows(h, 'parts') && h.turn === 1 && unusedTurn(h) && h.target !== bestPart(h).id; },
    text: () => {
      const h = hunt()!, w = E.currentWeapon(h), p = bestPart(h), t = E.MONSTERS[h.mid].parts.find(x => x.id === h.target)!;
      const none = t.eff[w.type] === 0;
      return `Aim at a part! Your ${w.name}${none ? ` can’t break the ${t.name.toLowerCase()}` : ` breaks less on the ${t.name.toLowerCase()}`}. Select the ${p.name}, it breaks more. Broken parts drop materials.`;
    },
    done: () => { const h = hunt(); return !!h && h.target === bestPart(h).id; }
  },
  {
    id: 'move', guide: true, learn: true, at: ['move'],
    when: () => { const h = hunt(); return !!h && unusedTurn(h) && anyMoveReady(h); },
    text: () => {
      const h = hunt()!, w = E.currentWeapon(h), best = [...w.moves.keys()].filter(i => E.canUseMove(h, i)).sort((a, b) => w.moves[b].dmg - w.moves[a].dmg)[0];
      return `To attack, select a move. Each one needs the faces shown on its right. You rolled what **${w.moves[best].name}** needs, so select it.`;
    },
    done: () => { const h = hunt(); return !!h && h.dice.some(d => d.used && d.used !== 'Block'); }
  },
  {
    id: 'guard', guide: true, learn: true, at: ['guard'],
    when: () => { const h = hunt(); return !!h && !unusedTurn(h) && freeDice(h) > 0 && !anyMoveReady(h) && h.guard === 0; },
    text: () => {
      const h = hunt()!, inc = E.incoming(h), d = game.sel.length ? game.sel : E.autoDice(h, 'guard') ?? [], g = d.reduce((a, i) => a + E.guardOf(h, i), 0);
      const blank = d.length && d.every(i => h.dice[i].face === 'B');
      return `${blank ? 'A blank fits no move, but it blocks best.' : 'Dice that fit no move can **Block**.'} Select **Block**. It stops ${g}${inc?.net ? `, so the ${inc.raw} becomes ${Math.max(0, inc.raw - g)}` : ''}.`;
    },
    done: () => (hunt()?.guard ?? 0) > 0
  },
  {
    id: 'end', guide: true, learn: true, at: ['end'],
    when: () => { const h = hunt(); return !!h && h.turn === 1 && !unusedTurn(h) && (freeDice(h) === 0 || h.guard > 0) && !anyMoveReady(h); },
    text: () => `Select End turn. The ${E.MONSTERS[hunt()!.mid].short} makes its move, then you roll 4 new dice.`,
    done: () => (hunt()?.turn ?? 1) > 1
  },
  {
    id: 'g-pick', guide: true, at: ['dice'],
    when: () => { const h = hunt(); return !!h && h.turn >= 2 && h.rerolls > 0 && unusedTurn(h) && h.dice.some((d, i) => d.face === 'B' && !game.sel.includes(i)); },
    text: () => { const n = hunt()!.dice.filter(d => d.face === 'B').length; return `Not a great roll, ${n === 1 ? 'a blank' : `${n} blanks`}. You can **Reroll** any dice you like. Select ${n === 1 ? 'the blank' : 'both blanks'}.`; },
    done: () => { const h = hunt(); return !!h && h.dice.every((d, i) => d.face !== 'B' || game.sel.includes(i)); }
  },
  {
    id: 'reroll', guide: true, learn: true, at: ['reroll'], side: 'right',
    when: () => { const h = hunt(); return !!h && h.turn >= 2 && h.rerolls > 0 && unusedTurn(h) && game.sel.length > 0; },
    text: () => `Select **Reroll**. Only the selected dice roll again. You have ${hunt()!.rerolls} for the whole hunt.`,
    done: () => (hunt()?.stats.rerollsUsed ?? 0) > 0
  },
  {
    id: 'g-free', guide: true, info: true, at: ['tele'],
    when: () => { const h = hunt(); return !!h && h.turn >= 2 && (h.stats.rerollsUsed > 0 || game.save.tips.includes('reroll')); },
    text: () => "That’s the basics! Read its next move, spend your dice, end the turn. The rest of this hunt is yours.",
    next: 'Start hunting'
  },
  // ---- the first big attack: the most important lesson ----
  {
    id: 'windup', at: ['tele'],
    when: () => hunt()?.intent === 'windup',
    text: () => "It’s winding up for a big charge next turn. This turn is safe, so go all in!"
  },
  {
    id: 'charge', at: ['guard'],
    when: () => { const h = hunt(); const inc = h && E.incoming(h); return !!h && (E.intentInfo(h).threat >= 3) && !!inc?.net && h.guard === 0; },
    text: () => {
      const h = hunt()!, inc = E.incoming(h)!, n = freeDice(h);
      return `This one’s going to hurt. It takes ${inc.raw} HP off you. All ${n} dice in **Block** stops ${E.freeDice(h).reduce((t, i) => t + E.guardOf(h, i), 0)}. **Block**, hit back, or split them. Your call!`;
    },
    done: () => (hunt()?.guard ?? 0) > 0
  },
  {
    id: 'item', learn: true, at: ['item'],
    when: () => { const h = hunt(); return !!h && shows(h, 'item') && !!h.item && E.itemUsable(h) && E.ITEMS[h.item].effect === 'heal30' && h.php <= h.pmax * 0.6; },
    text: () => { const h = hunt()!; return `Running low? Your ${E.ITEMS[h.item!].name} heals 30 and costs no dice. One item a turn, ${h.itemCharges} left.`; },
    done: () => !!hunt()?.itemUsed
  },
  {
    // traps (Nov 2026): the first hunt you carry one, say what it catches and what it's for, once
    id: 'trap', learn: true, at: ['item'],
    when: () => { const h = hunt(); return !!h && shows(h, 'item') && !!h.item && E.ITEMS[h.item].effect.startsWith('trap') && h.turn === 1 && unusedTurn(h); },
    text: () => {
      const h = hunt()!, it = E.ITEMS[h.item!], mv = E.trapMoves(h.mid)[it.effect as 'trapRush' | 'trapLand'];
      return `Your ${it.name} catches ${it.effect === 'trapRush' ? 'charges, lunges and pounces' : 'dives, and bursts up from underground'}${mv.length ? `, like the ${E.MONSTERS[h.mid].short}’s ${mv.join(', ')}` : ''}. Set it when its next move is one of those. It won’t hit you, and it’s held for ${E.TRAP_HOLD[it.effect as 'trapRush']} turns. If it’s weak enough, that captures it. On any other move, the trap is wasted.`;
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
      return `Try your other weapon! **Swap** costs 1 die. Your ${o.name} is **${o.type}**, so it breaks the ${p.name.toLowerCase()} better.`;
    },
    done: () => { const h = hunt(); return !!h && h.dice.some(d => d.used === 'Swap'); }
  },
  // ---- resist armor only cuts elemental attacks (Nov 2026): say so the first time it matters, or it looks like a bug ----
  {
    id: 'physical', at: ['tele'],
    when: () => { const h = hunt(); const inc = h && E.incoming(h); return !!h && shows(h, 'all') && !!inc && inc.wearsResist && inc.elem === 0 && inc.raw > 0; },
    text: () => {
      const h = hunt()!, M = E.MONSTERS[h.mid], i = E.intentInfo(h);
      return `Heads up! Your ${h.arm.name} only resists **${M.elem}** attacks. **${i.name}** is physical, so it hits in full. Your armour cuts its ${M.elemental?.join(' and ') ?? 'elemental attacks'} by 30%.`;
    }
  },
  // ---- moments the Gorehorn creates ----
  {
    id: 'broke', at: ['parts'],
    when: () => { const h = hunt(); return !!h && h.stats.broken > 0; },
    text: () => 'You broke a part! It stays broken for this hunt and drops extra materials. The others are worth breaking too.'
  },
  {
    id: 'mud', at: ['parts'],
    when: () => { const h = hunt(); return !!h && h.mon.wallow > 0 && !h.mon.parts.hide?.broken; },
    text: () => 'Mud on its hide! It takes half there for 2 turns. Aim somewhere else until it dries.'
  },
  {
    // the fourth hunt's layer: Charge (Capture has its own tip when it's ready)
    id: 'chargeNew', lesson: true, learn: true, at: ['charge'],
    when: () => { const h = hunt(); return !!h && shows(h, 'all') && h.turn >= 2 && unusedTurn(h) && (E.incoming(h)?.net ?? 0) === 0 && !h.chargePending && !h.chargeReady; },
    text: () => `Here’s a new one, **Charge**. Spend ${E.chargeDice(hunt()!)} dice now and your first hit next turn does double. Careful, any hit that gets through your **Block** breaks it.`,
    done: () => !!hunt()?.chargePending
  },
  {
    id: 'open', at: ['move', 'tele'],
    when: () => { const h = hunt(); return !!h && E.intentInfo(h).threat === 0 && E.intentInfo(h).dmg === 0 && h.turn > 1 && h.intent !== 'windup'; },
    text: () => "It’s not attacking this turn. A free turn, so go all in!"
  },
  {
    id: 'enraged', at: ['tele'],
    when: () => !!hunt()?.mon.enraged,
    text: () => "It’s enraged below half HP, so it hits harder now. Check its next move before you end each turn."
  },
  {
    id: 'capture', lesson: true, at: ['capture'],
    when: () => { const h = hunt(); return !!h && shows(h, 'parts') && E.captureReady(h); },
    text: () => `It’s weak enough to capture! Set a **Snare** with 2 dice. It closes at the end of your turn, unless it hits you for ${E.CHARGE_BREAK} or more. Captures give double part materials.`
  },
  // ---- back in town ----
  {
    // playtest (Nov 2026): three testers never found out that materials sell for coin
    id: 'sell', lesson: true, learn: true, at: () => (game.view === 'hunt' ? ['to-shop'] : ['nav-shop']),
    when: () => game.save.hunts > 0 && game.save.tips.includes('track') && game.view !== 'shop' && !(game.view === 'hunt' && game.hunt && !game.hunt.over) && E.surplusValue(game.save) >= 40,
    text: () => `Short on coin? Materials no recipe needs sell at the Shop. Yours are worth ${E.surplusValue(game.save)} coin right now.`,
    done: () => game.view === 'shop'
  },
  {
    id: 'bounties', lesson: true, learn: true, at: ['bounties'],
    when: () => game.view === 'board' && game.boardMon && E.BOUNTIES_ON && game.save.tips.includes('track') && !game.save.loadout.bounty && E.bountiesFor(game.save.loadout.target).length > 0 && (game.save.record[game.save.loadout.target]?.wins ?? 0) > 0,
    text: () => 'Bounties are open! Pick one before you hunt this monster again. Meet its goals and win for extra coin. They unlock three charms at the Forge too.',
    done: () => !!game.save.loadout.bounty
  },
  {
    id: 'failed', at: ['tele'],
    when: () => game.view === 'hunt' && game.hunt?.over === 'lose',
    text: () => 'That one got away. You keep your weapons, armour and the materials from parts you broke. You lose the coin and the items you carried. Next time, **Block** its big hits and break the part that powers them.'
  },
  {
    id: 'forge', guide: true, learn: true, at: () => (game.view === 'hunt' ? ['to-forge'] : ['nav-forge']),
    // Nov 2026 playtest: straight after the first win this was "more info". It now waits until something can be made.
    when: () => game.save.hunts > 1 && game.view !== 'forge' && !(game.view === 'hunt' && game.hunt && !game.hunt.over) && E.forgeReady(game.save),
    text: () => "You’ve got enough to make something. Let’s head to the Forge.",
    done: () => game.view === 'forge'
  },
  {
    id: 'track', lesson: true, guide: true, learn: true, at: ['track', 'forge-act'],
    when: () => game.view === 'forge',
    text: () => "Pick a weapon or armour you like. Can’t afford it yet? Select Track, and its materials get flagged on the Hunt Board and in the Shop.",
    done: () => !!game.save.tracked || Object.keys(game.save.weapons).length > 2 || Object.keys(game.save.armors).length > 1
  },
  {
    id: 'charmNew', lesson: true, info: true, at: ['tab-charms'], next: 'Got it',
    when: () => game.view === 'forge' && game.forgeTab !== 'charms' && Object.keys(E.CHARMS).some(id => { const r = E.recipeOf(game.save, 'c', id); return r.action === 'craft' && !!r.cost && E.canPay(game.save, r.cost); }),
    text: () => 'You can make a charm now! Each one gives a small perk, and you wear one at a time.'
  },
  {
    id: 'reinforceNew', lesson: true, info: true, at: ['forge-act'], next: 'Got it',
    when: () => { if (game.view !== 'forge' || !game.forgeSel) return false; const k: E.RecipeKind = game.forgeTab === 'armor' ? 'a' : 'w'; const r = E.recipeOf(game.save, k, game.forgeSel); return r.action === 'reinforce' && !!r.cost && E.canPay(game.save, r.cost); },
    text: () => 'Reinforcing makes gear you love even better. A weapon hits 5% harder, or armour gets 10 more HP and 1 more **Block**. You can do it up to 3 times.'
  }
];

class Coach {
  /** the tip on screen, if any */
  current = $derived.by<Tip | null>(() => {
    if (!settings.prefs.tips && !game.lesson) return null;
    const seen = game.save.tips;
    if (!E.islandDone(game.save) || (seen.includes('i-begin') && !seen.includes('i-ridge'))) return ISLAND.find(t => !seen.includes(t.id) && t.when()) ?? null;
    const did = seen.includes('i-begin');
    // Ridge lessons: one a hunt, then a hunt with none (save.lessonAt is the hunt count when the last one showed)
    const at = game.save.lessonAt, open = at == null || game.save.hunts >= at + 2;
    return TIPS.find(t => !seen.includes(t.id) && !(did && ISLAND_TAUGHT.includes(t.id)) && (!t.lesson || open || t.id === this.shown) && t.when()) ?? null;
  });
  private shown = $state<string | null>(null);

  /** Call from an effect: retires the tip on screen once it's done or its moment has passed. */
  sync() {
    if (settings.prefs.tips || game.lesson) for (const t of [...ISLAND, ...TIPS]) if (t.learn && !game.save.tips.includes(t.id) && t.done?.()) this.markSeen(t.id);
    const cur = this.current;
    // an island prompt waits for its moment: one shown and not yet done stays pending (only retire it once done)
    if (this.shown && this.shown !== cur?.id && !this.shown.startsWith('i-')) this.markSeen(this.shown);
    this.shown = cur?.id ?? null;
    if (cur) onScreen.add(cur.id);
    if (cur?.lesson && game.save.lessonAt !== game.save.hunts) { game.save.lessonAt = game.save.hunts; game.persist(); }
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
  /** Settings → Show tips again: the Ridge's tips and lessons come back (the island's stay done) */
  showAgain() {
    settings.prefs.tips = true; settings.save();
    game.save.tips = game.save.tips.filter(id => id.startsWith('i-')); game.save.lessonAt = undefined; this.shown = null; game.persist();
  }
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
