// Tutorial tips: short prompts that appear the moment they're relevant, point at the thing
// they describe, and go away when the player does it. One at a time, in priority order.
// Each tip shows once per save (Save.tips). Players can switch them off in Settings.
//
// A tip is "pending" while unseen and its `when` holds. Once shown, it is marked seen when
// `done` holds, when the player clicks Got it, or when the moment passes (`when` stops holding).
import * as E from '../engine';
import { game } from './game.svelte';
import { settings } from './settings.svelte';
import { shows, techHold } from './reveal';

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
/** the town tour after the promotion hunt (the island is done, and its last prompt hasn't shown yet) */
const tour = () => E.islandDone(game.save) && game.save.tips.includes('i-begin') && !game.save.tips.includes('i-ridge') && !game.lesson;
/** practice hasn't started: neither practice monster hunted yet (the practice prompts belong before the first one) */
const beforePractice = () => E.PRACTICE.every(id => !(game.save.record[id]?.hunts));
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
    text: () => "Two blanks. They’re not wild, so they don’t fit any move. Select both of them.",
    // (only once there are blanks: the all-Fang turns before must not count as having done it)
    done: () => { const h = hunt(); return !!h && (h.stats.rerollsUsed > 0 || (h.dice.some(d => d.face === 'B') && h.dice.every((d, i) => d.face !== 'B' || game.sel.includes(i)))); }
  },
  {
    id: 'i-reroll', head: 'Reroll', guide: true, learn: true, at: ['reroll'], side: 'right',
    when: () => { const h = onIsland('scuttlehog'); return !!h && h.rerolls > 0 && h.stats.rerollsUsed === 0 && game.sel.some(i => h.dice[i]?.face === 'B'); },
    text: () => "Now select **Reroll** to roll them again. Remember, you can select as many dice as you want to **Reroll**. Let’s see what you get!",
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
    // turn 1 (C, T, B): the Fang on Slash first, so the Claw and blank are left for the Block prompt. Without it a
    // player could Block straight after "New faces" and skip the Block lesson (Mekkman, 8 Nov 2026 playtest)
    id: 'i-slash1', guide: true, learn: true, at: ['move'], head: 'More than one',
    when: () => { const h = onIsland('snapclaw'); return !!h && h.turn === 1 && game.save.tips.includes('i-faces2') && h.guard === 0 && E.canUseMove(h, 0); },
    text: () => 'You can do more than one thing in a turn. Your Fang goes on **Slash** first.',
    done: () => { const h = hunt(); return !!h && h.mid === 'snapclaw' && (h.turn > 1 || h.dice.some(d => d.face === 'C' && !!d.used)); }
  },
  {
    // several dice, one move, used that many times (Nov 2026 playtest)
    // three Fangs, so it reads as "one Slash per Fang", not "a ×2 button" (Nov 2026 playtest: a tester thought ×2 was the cap)
    id: 'i-twice', guide: true, learn: true, at: ['dice'], head: 'Several dice',
    when: () => { const h = onIsland('snapclaw'); const f = h ? h.dice.filter(d => d.face === 'C' && !d.used).length : 0; return !!h && h.turn === 2 && f >= 2 && unusedTurn(h) && game.sel.filter(i => h.dice[i]?.face === 'C').length < f; },
    text: () => 'Three Fangs! Select all three.', // (turn 2 is always three Fangs: rerollLesson scripts it)
    done: () => { const h = hunt(); return game.multi > 0 || (!!h && h.mid === 'snapclaw' && h.turn === 2 && game.sel.filter(i => h.dice[i]?.face === 'C').length >= h.dice.filter(d => d.face === 'C' && !d.used).length); }
  },
  {
    id: 'i-twice2', guide: true, learn: true, at: ['move'], head: 'Several dice',
    when: () => { const h = onIsland('snapclaw'); return !!h && game.save.tips.includes('i-twice') && E.repeatCount(h, 0, game.sel) >= 2; },
    text: () => `Now select **Slash**. It strikes once for each Fang, ${E.repeatCount(hunt()!, 0, game.sel)} times.`,
    done: () => game.multi > 0
  },
  {
    // the moment the dice left fit no move (Mekkman, 8 Nov 2026: turn 1's Claw and blank, after Slash). Before the
    // several-dice lesson, so a Block on turn 1 can't skip it
    id: 'i-block', head: 'Block', guide: true, learn: true, at: ['guard'],
    when: () => { const h = onIsland('snapclaw'); return !!h && h.guard === 0 && freeDice(h) > 0 && !anyMoveReady(h) && (E.incoming(h)?.net ?? 0) > 0; },
    // Block arrives here, after several dice (it's hidden until turn 3, game.rerollLesson); Any means any face
    text: () => 'Those dice fit no move, but they can still help. Put them into **Block** to take less from its next move. Any die works.',
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
    text: () => 'Here, take my spare maul. You can now carry two weapons into hunts.'
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
    when: () => E.islandStep(game.save) === 4 && beforePractice() && game.view === 'board' && game.boardMon && !huntOn() && !game.lesson,
    text: () => 'Every weapon type has its own special trick. Your blade’s is **Flow**. Moves tagged **Flow** give you a free **Reroll**, once a turn.'
  },
  {
    // the maul's trick, straight after the blade's (Mekkman, 8 Nov 2026)
    id: 'i-dazemaul', head: 'Daze', guide: true, info: true, gotit: true, at: ['slot-w1'],
    when: () => E.islandStep(game.save) === 4 && beforePractice() && game.view === 'board' && game.boardMon && !huntOn() && !game.lesson && game.save.tips.includes('i-flow'),
    text: () => 'Your maul’s trick is **Daze**. Moves tagged **Daze** fill its **Daze** meter, and when the meter is full, it loses its turn.'
  },
  {
    // no Got it: selecting Hunt is the way on (Mekkman, 8 Nov 2026)
    id: 'i-practice', head: 'Practice', guide: true, info: true, at: ['begin'],
    when: () => E.islandStep(game.save) === 4 && beforePractice() && game.view === 'board' && game.boardMon && !huntOn(),
    text: () => "Time to practise on your own! Beat the Cinderpup and the Shrikelet, in any order. I’ll be watching."
  },
  // ---- get ready: the vest, then a salve ----
  {
    id: 'i-vest', head: 'Get ready', guide: true, learn: true, at: toForge,
    when: () => E.islandStep(game.save) === 5 && game.view !== 'forge' && !huntOn(),
    text: () => "You’re nearly ready for your promotion hunt! First, let’s get you some armour.",
    // (only on this step: the Forge visit for the blade must not count)
    done: () => E.islandStep(game.save) === 5 && game.view === 'forge'
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
    // (9 Nov 2026: no Forge or Shop lines here; at those steps i-forge, i-vest and i-shop come first and say it)
    id: 'i-go', head: 'Next', guide: true, side: 'right', at: () => (game.hunt?.over === 'lose' ? ['to-retry'] : ['to-next', 'to-forge', 'to-shop']),
    when: () => !game.lesson && !!game.hunt?.over && game.view === 'hunt' && !!game.hunt.reward && !E.islandDone(game.save),
    text: () => game.hunt?.over === 'lose' ? (game.hunt.reward?.lost ? 'That one got away, and the items you carried are gone. It happens to the best of us. Try again.' : 'That one got away. It happens to the best of us. Try again.') : game.hunt?.mid === 'tuskling' && E.islandStep(game.save) === 4 ? 'Nicely done! Next up, some practice hunts.' : `Nicely done! The ${E.MONSTERS[game.save.loadout.target]?.short} is next.`
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
  // ---- the town tour, right after the promotion hunt (Mekkman, 8 Nov 2026): tracking, charms, reinforcing, selling
  // and bounties, in one go, instead of one a hunt on the Ridge. Locked like the island (testers wandered off and the
  // cards landed in the wrong place): selecting what each points at moves on
  {
    id: 'i-tforge', head: 'Town', guide: true, learn: true, at: () => (game.view === 'hunt' ? ['to-forge', 'nav-forge'] : ['nav-forge']),
    when: () => tour() && game.view !== 'forge' && !huntOn(),
    text: () => 'Rank F! I knew you could do it. Before you head out, let me show you around town. First, the Forge.',
    done: () => tour() && game.view === 'forge'
  },
  {
    id: 'i-ttrack', head: 'Tracking', guide: true, info: true, at: ['track'],
    when: () => tour() && game.view === 'forge',
    text: () => 'Can’t afford something yet? Select Track, and its materials get flagged on the Hunt Board and in the Shop.'
  },

  {
    // (Got it, not the button: selecting it would spend coin and materials)
    id: 'i-treinf', head: 'Reinforcing', guide: true, info: true, gotit: true, at: ['forge-act'],
    when: () => tour() && game.view === 'forge' && game.forgeTab === 'weapons',
    text: () => 'Reinforcing makes gear you love even better. A weapon hits 5% harder, or armour gets 10 more HP and 1 more **Block**. You can do it up to 3 times.'
  },  {
    id: 'i-tcharm', head: 'Charms', guide: true, info: true, at: ['tab-charms'],
    when: () => tour() && game.view === 'forge',
    text: () => 'Charms give one small perk, and you wear one at a time. You’ll find them here.'
  },
  {
    id: 'i-tshop', head: 'Town', guide: true, learn: true, at: ['nav-shop'],
    when: () => tour() && game.view !== 'shop' && !huntOn() && game.save.tips.includes('i-tcharm'),
    text: () => 'Next, the Shop.',
    done: () => tour() && game.view === 'shop'
  },
  {
    id: 'i-tsell', head: 'Selling', guide: true, info: true, at: ['shop-sell'],
    when: () => tour() && game.view === 'shop',
    text: () => 'Materials no recipe needs sell here for coin. Handy when you’re short.'
  },
  {
    id: 'i-tboard', head: 'Town', guide: true, learn: true, at: ['nav-board'],
    when: () => tour() && E.BOUNTIES_ON && game.view !== 'board' && !huntOn() && game.save.tips.includes('i-tsell'),
    text: () => 'Last stop, the Hunt Board.',
    done: () => tour() && game.view === 'board' && game.save.tips.includes('i-tsell')
  },
  {
    id: 'i-tbounty', head: 'Bounties', guide: true, info: true, at: ['bounties'],
    when: () => tour() && E.BOUNTIES_ON && game.view === 'board' && game.save.tips.includes('i-tsell'),
    text: () => 'Bounties! Pick one before you hunt a monster you’ve beaten. Meet its goals and win for extra coin. They unlock three charms at the Forge too.'
  },
  {
    id: 'i-ridge', guide: true, info: true, at: ['nav-board', 'begin'],
    when: () => tour() && game.save.tips.includes('i-tsell') && (!E.BOUNTIES_ON || game.save.tips.includes('i-tbounty')) && !huntOn(),
    head: 'Ashfall Ridge',
    text: () => 'That’s the tour! Ashfall Ridge is open. I’ll tag along for your first few hunts out there. I’ve still got a trick or two to show you.'
  }
];
/** the first Ridge hunt's basics, already taught in the Foothills */

export const tipTargets = (t: Tip | null | undefined) => (typeof t?.at === 'function' ? t.at() : t?.at ?? []);

export const TIPS: Tip[] = [
  // (9 Nov 2026, Mekkman: only the Ridge lessons are left. The basics and the town tips taught on the Foothills
  // were for saves from before the island and are gone; see git history before this date)
  // ---- the first big attack: the most important lesson ----
  {
    // Mell's first Hunter technique: Charge (Capture has its own tip when it's ready)
    id: 'chargeNew', lesson: true, learn: true, at: ['charge'],
    // (any turn from 2 on without a big hit coming: it used to wait for a turn with no attack at all, which some monsters
    // rarely give, and the Charge button now waits for this lesson)
    when: () => { const h = hunt(); return !!h && shows(h, 'all') && h.turn >= 2 && unusedTurn(h) && E.intentInfo(h).threat < 3 && !h.chargePending && !h.chargeReady; },
    text: () => `${game.save.tips.includes('capture') ? 'Here’s another Hunter technique,' : 'Now that you’re a Hunter, I can show you this one,'} **Charge**. Spend ${E.chargeDice(hunt()!)} dice now and your first hit next turn does double damage. Careful, if its attack damages you, the charge fails.`,
    done: () => !!hunt()?.chargePending
  },
  {
    id: 'capture', lesson: true, at: ['capture'],
    when: () => { const h = hunt(); return !!h && shows(h, 'parts') && E.captureReady(h); },
    text: () => `${game.save.tips.includes('chargeNew') ? 'Another Hunter technique!' : 'Now that you’re a Hunter, I can show you this one.'} It’s weak enough to capture. Set a **Snare** with 2 dice. It closes at the end of your turn, unless it hits you for ${E.CHARGE_BREAK} or more. Captures give double part materials.`
  },
];

/** Ashfall Ridge moments: first-time reads (a wind-up, a big hit, mud, a part breaking…). Off for now (Mekkman,
 *  8 Nov 2026: too many messages); kept here to bring back. Not in TIPS, so they never show. */

class Coach {
  /** the tip on screen, if any */
  current = $derived.by<Tip | null>(() => {
    if (!settings.prefs.tips && !game.lesson) return null;
    const seen = game.save.tips;
    if (!E.islandDone(game.save) || (seen.includes('i-begin') && !seen.includes('i-ridge'))) return ISLAND.find(t => !seen.includes(t.id) && t.when()) ?? null;
    // Ridge lessons: one a hunt, then a hunt with none (save.lessonAt is the hunt count when the last one showed)
    const at = game.save.lessonAt, open = at == null || game.save.hunts >= at + 1; // (one a hunt: with only Charge and Capture left, a free hunt between just delayed Capture)
    return TIPS.find(t => !seen.includes(t.id) && (!t.lesson || open || t.id === this.shown) && t.when()) ?? null;
  });
  private shown = $state<string | null>(null);

  /** Call from an effect: retires the tip on screen once it's done or its moment has passed. */
  sync() {
    // (the Ridge's tips only count as learned on the Ridge: a Shop visit on the island isn't the selling lesson)
    if (settings.prefs.tips || game.lesson) for (const t of [...ISLAND, ...(E.islandDone(game.save) ? TIPS : [])]) if (t.learn && !game.save.tips.includes(t.id) && t.done?.()) this.markSeen(t.id);
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

// the Hunter techniques show from Mell's lesson on (for island graduates with tips on; everyone else sees them as before)
techHold.untaught = k => {
  const id = k === 'charge' ? 'chargeNew' : 'capture', s = game.save;
  return settings.prefs.tips && s.tips.includes('i-begin') && !s.tips.includes(id) && coach.current?.id !== id;
};

/** A weapon type's trick tag (Flow, Daze, Expose) shows once Mell has taught it: on the island, from her line about it
 *  (Mekkman, 8 Nov 2026); after the island, always */
export function sigShown(type: string): boolean {
  if (E.islandDone(game.save) || E.islandStep(game.save) >= 5 || (E.islandStep(game.save) === 4 && !beforePractice())) return true;
  const id = type === 'Cut' ? 'i-flow' : type === 'Blunt' ? 'i-dazemaul' : '';
  return !!id && (game.save.tips.includes(id) || coach.current?.id === id);
}
