<script lang="ts">
  import * as E from '../engine';
  import { game, type View } from './game.svelte';
  import Modal from './parts/Modal.svelte';
  import RankMedal from './parts/RankMedal.svelte';
  import Coach from './parts/Coach.svelte';
  import Intro from './parts/Intro.svelte';
  import DetailTip from './parts/DetailTip.svelte';
  import { detail } from './detail.svelte';
  import { onHuntKey } from './keys';
  import { storeAvailable, openStore, feedbackInfo, openFeedback, feedbackButton } from './store';
  import * as PL from './playlog';
  import { saveTextFile } from './files';
  import { setReportExporter } from './crash';
  import { coach } from './coach.svelte';
  import Board from './screens/Board.svelte';
  import Forge from './screens/Forge.svelte';
  import Shop from './screens/Shop.svelte';
  import Hunt from './screens/Hunt.svelte';
  import BountyPanel from './screens/hunt/BountyPanel.svelte';
  import { music } from './audio';
  import { setSfxVolume, sfx } from './sfx';
  import { settings } from './settings.svelte';
  import { UI_SIZES, isDesktop, isFullscreen, setFullscreen, onFullscreenChange, setUiSize } from './display';

  const BUILD = `v${__APP_VERSION__}`;
  game.load();
  PL.sessionStart();
  /** The feedback report: hunt log + save summary + settings, as one JSON file the player can send. */
  async function exportReport() {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    return saveTextFile(`huntersfolio-report-${stamp}.json`, JSON.stringify(PL.report($state.snapshot(game.save), $state.snapshot(settings.prefs)), null, 1));
  }
  setReportExporter(exportReport);
  let logCount = $state(PL.counts());
  async function exportFromSettings() {
    setToast = (await exportReport()) ? 'Report saved. Send the file to the developer.' : 'Not saved.';
  }

  let settingsOpen = $state(false);
  // "That's the demo": once, the first time every monster in the build has been beaten, after the result card.
  let endOpen = $state(false);
  let newerOpen = $state(game.newerSave);
  $effect(() => {
    if (E.EDITION === 'demo' && !game.save.endSeen && !game.inHunt && game.view !== 'hunt' && E.contentComplete(game.save)) {
      endOpen = true; game.save.endSeen = true; game.persist();
    }
  });
  const totals = $derived.by(() => {
    const r = Object.values(game.save.record);
    return { captures: r.reduce((n, x) => n + x.captures, 0), breaks: r.reduce((n, x) => n + Object.values(x.breaks).reduce((a, b) => a + b, 0), 0) };
  });
  let helpOpen = $state(false);
  let resetArmed = $state(false);
  let setToast = $state('');
  let resetTimer: ReturnType<typeof setTimeout>;

  const NAV: [View, string][] = [['board', 'Hunt Board'], ['forge', 'Forge'], ['shop', 'Shop']];
  const sub = $derived.by(() => {
    const v = game.view, h = game.hunt;
    // in a hunt, where you are: the monster and the turn are in the health bar (Nov 2026)
    if (v === 'hunt' && h?.exam) return `The Foothills · Promotion hunt${game.newerSave ? ' · Not saving' : ''}`;
    if (v === 'hunt' && h) return `${(E.TIERS[E.MONSTERS[h.mid].tier] ?? E.MONSTERS[h.mid].short).replace(/^Tier [\d.]+ · /, '')}${game.newerSave ? ' · Not saving' : ''}`;
    const label = NAV.find(n => n[0] === v)?.[1] ?? '';
    return `${label} · Hunts ${game.save.hunts}${game.newerSave ? ' · Not saving' : ''}`;
  });

  $effect(() => { if (settingsOpen) { setToast = ''; logCount = PL.counts(); } });

  // Music follows the game: town loop in town, hunt loop in a hunt, the danger layer on big telegraphs, a sting at the end.
  // On the desktop build autoplay is allowed, so start the music at launch instead of on the first click.
  $effect(() => { if ((window as unknown as { hf?: unknown }).hf) music.unlock(); });
  // The opening card: new players always; in the browser, every launch (its Begin click is what turns the sound on).
  // Automated runs (store captures, QA bots) skip it: navigator.webdriver is set only under automation.
  // (a new player is one who hasn't started: a save reset counts, so it's worked out live, not once at launch)
  const freshPlayer = $derived(settings.prefs.tips && game.save.hunts === 0 && !game.save.tips.includes('begin') && !game.save.tips.includes('i-begin'));
  let introOpen = $state(!navigator.webdriver && ((settings.prefs.tips && game.save.hunts === 0) || !isDesktop()));
  $effect(() => { music.setVolume(settings.prefs.music); });
  $effect(() => { setSfxVolume(settings.prefs.sfx); });
  $effect(() => { setUiSize(settings.prefs.uiSize); });
  // The desktop window opens in the saved mode; F11 and Esc keep the setting in step.
  let fullscreen = $state(isFullscreen());
  onFullscreenChange(on => {
    fullscreen = on;
    if (isDesktop() && settings.prefs.fullscreen !== on) { settings.prefs.fullscreen = on; settings.save(); }
  });
  function toggleFullscreen() {
    const on = !fullscreen;
    settings.prefs.fullscreen = on; settings.save();
    setFullscreen(on);
  }
  function setSize(f: number) { settings.prefs.uiSize = f; settings.save(); }
  $effect(() => { void music.setScene(game.view === 'hunt' && game.hunt ? (game.hunt.over ? 'none' : 'hunt') : 'town'); });
  $effect(() => { const h = game.hunt; music.setDanger(!!h && !h.over && game.view === 'hunt' && E.intentInfo(h).threat >= 3); });
  /** Buttons with no sound of their own get a soft click. Dice and moves sound in the game state; others opt out with data-sound. */
  function uiClick(e: MouseEvent) {
    const b = (e.target as HTMLElement | null)?.closest?.('button');
    if (!b || b.disabled || b.getAttribute('aria-disabled') === 'true') return;
    if (b.hasAttribute('data-sound') || b.classList.contains('die') || b.classList.contains('move')) return;
    sfx('click');
  }
  let stungFor: object | null = null;
  $effect(() => {
    const h = game.hunt;
    if (h?.over && game.view === 'hunt' && stungFor !== h) { stungFor = h; void music.sting(h.over === 'win' ? 'victory' : 'defeat'); }
  });

  function reset() {
    clearTimeout(resetTimer);
    if (!resetArmed) { resetArmed = true; resetTimer = setTimeout(() => (resetArmed = false), 3000); return; }
    resetArmed = false;
    game.reset();
    // a reset starts over as a new player: the Foothills, the tutorial prompts, and the opening card
    settings.prefs.tips = true; settings.prefs.showAll = false; settings.save();
    settingsOpen = false; introOpen = !navigator.webdriver;
    setToast = 'Save reset. You start again in the Foothills.';
  }
</script>

<svelte:window onpointerdown={() => music.unlock()} onkeydown={e => { music.unlock(); onHuntKey(e); }} onclickcapture={uiClick} />

{#if introOpen}<Intro fresh={freshPlayer} onbegin={() => (introOpen = false)} onskip={() => { coach.skipAll(true); introOpen = false; }} />{/if}

<div class="wrap" class:hunting={game.inHunt} inert={introOpen}>
  <header class="top">
    <div>
      <h1 aria-label="Hunter's Folio"><span class="hn">Hunter’s</span> <span>Folio</span></h1>
      <!-- no build version in the header (Mekkman, Nov 2026: every screenshot is collateral); it lives in Settings -->
      <div class="sub">{sub}</div>
    </div>
    {#if game.inHunt}<BountyPanel inhead />{/if}
    <div class="top-right">
      {#if !game.inHunt}
        <nav class="nav" aria-label="Town">
          {#each NAV.filter(([v]) => v === 'board' || (game.save.hunts > 0 && (v === 'forge' ? E.forgeOpen(game.save) : E.shopOpen(game.save)))) as [v, label]}
            <button aria-current={game.view === v ? 'page' : 'false'} data-coach="nav-{v}" onclick={() => game.go(v)}>{label}</button>
          {/each}
        </nav>
      {/if}
      <!-- Hunter Rank (Nov 2026): a seal with your rank's letter -->
      {#if E.islandDone(game.save)}
      <span class="rankseal" title="Hunter Rank {E.hunterRank(game.save)}: {E.promotionFor(game.save) ? `pass the ${E.promotionFor(game.save)!.short} promotion hunt to rank up` : E.hunterRank(game.save) === 'C' ? 'Low Rank cleared' : 'the next promotion hunt is in the full game'}"><RankMedal rank={E.hunterRank(game.save)} size={46} /><span class="rl"><span>Hunter</span><span>Rank {E.hunterRank(game.save)}</span></span></span>
      {:else}
      <!-- the Foothills: not a Hunter yet (the island ends with becoming one) -->
      <span class="rankseal" title="Apprentice: finish the Foothills to become a Hunter"><RankMedal rank="F" size={46} dim /><span class="rl"><span>Rank</span><span>Apprentice</span></span></span>
      {/if}
      {#if E.forgeOpen(game.save)}<span class="purse">{game.save.coin} coin</span>{/if}
      {#if game.inHunt}
        <button class="btn quiet" onclick={() => game.abandon()}>Abandon hunt</button>
      {/if}
      <button class="iconbtn" aria-label="How to play" aria-expanded={helpOpen} onclick={() => (helpOpen = true)}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5" /><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8" /><circle cx="12" cy="17.2" r=".6" fill="currentColor" /></svg>
      </button>
      <button class="iconbtn" aria-label="Settings" aria-expanded={settingsOpen} onclick={() => (settingsOpen = true)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
      </button>
    </div>
  </header>

  <Modal bind:open={settingsOpen} title="Settings">
    <!-- Nov 2026 text audit: one short line per row; Save data last, so Reset isn't the first thing under the cursor -->
    <div class="setrow">
      <label class="slider"><span class="nm">Music volume</span>
        <input type="range" min="0" max="1" step="0.05" bind:value={settings.prefs.music} onchange={() => settings.save()} />
        <span class="mono">{Math.round(settings.prefs.music * 100)}%</span>
      </label>
    </div>
    <div class="setrow">
      <label class="slider"><span class="nm">Sound effects volume</span>
        <input type="range" min="0" max="1" step="0.05" bind:value={settings.prefs.sfx} onchange={() => settings.save()} />
        <span class="mono">{Math.round(settings.prefs.sfx * 100)}%</span>
      </label>
    </div>
    <div class="setrow">
      <span><span class="nm">Fullscreen</span><span class="md">F11 also switches it.</span></span>
      <button class="btn quiet" role="switch" aria-checked={fullscreen} onclick={toggleFullscreen}>{fullscreen ? 'On' : 'Off'}</button>
    </div>
    <div class="setrow">
      <span><span class="nm">Interface size</span><span class="md">Scales text and layout together.</span></span>
      <span class="seg" role="radiogroup" aria-label="Interface size">
        {#each UI_SIZES as f}
          <button role="radio" aria-checked={settings.prefs.uiSize === f} onclick={() => setSize(f)}>{Math.round(f * 100)}%</button>
        {/each}
      </span>
    </div>
    <div class="setrow">
      <span><span class="nm">Text detail</span><span class="md">Compact keeps rules behind the <span class="dt" style="cursor:default">mark</span> (hover or select). Full shows them all.</span></span>
      <span class="seg" role="radiogroup" aria-label="Text detail">
        {#each [['compact', 'Compact'], ['full', 'Full']] as [v, l]}
          <button role="radio" aria-checked={settings.prefs.detail === v} onclick={() => { settings.prefs.detail = v as 'compact' | 'full'; settings.save(); }}>{l}</button>
        {/each}
      </span>
    </div>
    <div class="setrow">
      <span><span class="nm">Tutorial tips</span><span class="md">Turning them on again replays them.</span></span>
      <button class="btn quiet" role="switch" aria-checked={settings.prefs.tips} onclick={() => coach.setEnabled(!settings.prefs.tips)}>{settings.prefs.tips ? 'On' : 'Off'}</button>
    </div>
    <div class="setrow">
      <span><span class="nm">Show every action</span><span class="md">From your first hunt, instead of a little more each hunt. From your next hunt.</span></span>
      <button class="btn quiet" role="switch" aria-checked={settings.prefs.showAll} onclick={() => { settings.prefs.showAll = !settings.prefs.showAll; settings.save(); }}>{settings.prefs.showAll ? 'On' : 'Off'}</button>
    </div>
    <div class="setrow">
      <span><span class="nm">Feedback</span><span class="md">Your hunt log ({logCount.hunts} hunt{logCount.hunts === 1 ? '' : 's'}) stays on this PC. Export it to <span use:detail={'What you hunted, how each hunt went and how long turns took. Nothing is sent anywhere unless you attach the file yourself.'}>send with feedback</span>.</span></span>
      <span class="btnrow">
        <button class="btn quiet" onclick={exportFromSettings}>Export report</button>
        {#if feedbackInfo()}<button class="btn quiet" onclick={() => openFeedback()}>{feedbackButton()}</button>{/if}
      </span>
    </div>
    <div class="setrow">
      <span><span class="nm">Save data</span><span class="md">Saved automatically · {game.save.hunts} hunts.{#if game.inHunt}{' '}Finish this hunt to reset.{/if}</span></span>
      <button class="btn quiet danger" disabled={game.inHunt} onclick={reset}>{resetArmed ? 'Select again to erase everything' : 'Reset save'}</button>
    </div>
    <div class="setrow"><span><span class="nm">Credits</span><span class="md">Placeholder music and sound effects made in code. Logo type: IM Fell English by Igino Marini (SIL OFL).</span></span></div>
    <div class="setrow"><span><span class="nm">Version</span><span class="md">{BUILD}{E.EDITION === 'demo' ? ' (demo)' : ''}</span></span></div>
    <div class="toast" aria-live="polite">{setToast}</div>
  </Modal>

  <Modal bind:open={newerOpen} title={E.EDITION === 'demo' ? 'Your save is from the full game' : 'Your save is from a newer version'}>
    <div class="endcard">
      <p class="lead">The save on this PC was made by {E.EDITION === 'demo' ? 'the full game' : "a newer version of Hunter's Folio"}.</p>
      <p>This version can't open it, so it has left it untouched. Launch the full game to carry on where you left off.</p>
      <p class="md">You can still play here, but nothing will be saved.</p>
      <div class="acts"><button class="btn" onclick={() => (newerOpen = false)}>Play without saving</button></div>
    </div>
  </Modal>
  <Modal bind:open={endOpen} title="That's the demo">
    <div class="endcard">
      <p class="lead">You passed the promotion hunt. You're a rank {E.hunterRank(game.save)} hunter.</p>
      <div class="stats"><span>Hunts <b>{game.save.hunts}</b></span><span>Parts broken <b>{totals.breaks}</b></span><span>Captures <b>{totals.captures}</b></span></div>
      <p>The Mirewood waits beyond the ridge in the full game, with new regions, new monsters, the weapons forged from them, and the ranks above yours.</p>
      <p class="md">You can keep playing: there are still weapons to upgrade, charms to make and monsters to capture. Your progress carries over to the full game on this PC.</p>
      <div class="acts">
        {#if storeAvailable()}<button class="btn primary" onclick={() => openStore()}>Wishlist on Steam</button>{/if}
        <button class="btn" onclick={() => (endOpen = false)}>Keep hunting</button>
      </div>
      {#if feedbackInfo()}<p class="md">How was it? <button class="linkbtn" onclick={() => openFeedback()}>{feedbackButton()}</button>. Settings → Feedback can export your hunt log to attach.</p>{/if}
    </div>
  </Modal>

  <Modal bind:open={helpOpen} title="How to play" wide>
    <!-- Nov 2026 text audit: was one 466-word list. Now short sections, one open at a time, each line one rule -->
    <div class="helpsecs">
      <details name="help" open><summary>The loop</summary><ul class="helplist">
        <li>Pick a monster and gear at the Hunt Board, hunt it, bring back coin and materials.</li>
        <li>Make and reinforce gear at the Forge; buy items at the Shop.</li>
        <li>Progress saves itself. Reset it in Settings.</li>
      </ul></details>
      <details name="help"><summary>A turn</summary><ul class="helplist">
        <li>You roll 4 dice: fangs, claws and blanks. Each move needs certain faces.</li>
        <li>The panel by the monster shows its next move and how much it will hurt.</li>
        <li>Spend dice on moves, <strong>Block</strong> with the rest (a blank blocks best), then end the turn.</li>
        <li><strong>Reroll</strong> the dice you select; rerolls are counted for the whole hunt.</li>
        <li><strong>Charge</strong>: spend 2 dice, and your first hit next turn deals double.</li>
        <li><strong>Capture</strong> at 20% HP or less: a Snare closes at the end of your turn. Double part materials.</li>
      </ul></details>
      <details name="help"><summary>Parts and breaks</summary><ul class="helplist">
        <li>Aim at a part under the monster. Its chip says how fast the weapon in your hand breaks it; every hit still hurts the monster.</li>
        <li>A broken part weakens the monster and drops its material.</li>
        <li>Rare materials get likelier with every miss, and drop for sure on the 12th break of their part.</li>
      </ul></details>
      <details name="help"><summary>Weapons</summary><ul class="helplist">
        <li><span class="tag flow" style="margin:0">Flow</span> Cut: the middle move (Cleave) gives back a reroll, once a turn.</li>
        <li><span class="tag daze" style="margin:0">Daze</span> Blunt: Skullcrack to the head fills a daze meter; full, it loses a turn.</li>
        <li><span class="tag expose" style="margin:0">Expose</span> Pierce: Quick Shot exposes the part: it takes +20% and breaks twice as fast for 2 turns, from either weapon.</li>
        <li>You carry two weapons. Swapping costs 1 die (a blank is fine). <strong>Avg</strong> is damage a turn with all 4 dice.</li>
      </ul></details>
      <details name="help"><summary>Monster states</summary><ul class="helplist">
        <li><strong>Airborne:</strong> only <b>Pierce</b> reaches it. <b>Pinning Shot</b> or a <b>Weighted Net</b> brings it down.</li>
        <li><strong>Underground:</strong> only <b>Blunt</b> reaches it, and some take ½. A heavy <b>Blunt</b> hit or <b>Blast Powder</b> forces it up.</li>
        <li><strong>Ice plating:</strong> takes your hits before HP. Each hit breaks a layer, <b>Cut</b> breaks two, a <b>Firepot</b> all.</li>
        <li><strong>Molten:</strong> <b>Cut</b> and <b>Blunt</b> hits burn you.</li>
      </ul></details>
      <details name="help"><summary>Gear</summary><ul class="helplist">
        <li>Armor sets your HP and Block. Resist armor cuts one element's attacks by 30%.</li>
        <li>Charms give one small perk each. Items are a free action once a turn.</li>
        <li>Each reinforcement (+1 to +3) adds 5% damage, or 10 HP and 1 block to armor. Upgrades keep it.</li>
      </ul></details>
      <details name="help"><summary>Controls</summary><ul class="helplist">
        <li><strong>Keys:</strong> <kbd>1</kbd>–<kbd>4</kbd> dice · <kbd>Q</kbd> <kbd>W</kbd> <kbd>E</kbd> moves · <kbd>A</kbd> block · <kbd>C</kbd> charge · <kbd>S</kbd> swap · <kbd>X</kbd> capture · <kbd>F</kbd> item · <kbd>R</kbd> reroll · <kbd>Space</kbd> end turn · <kbd>Z</kbd> undo · <kbd>Esc</kbd> clear.</li>
        <li><strong>Controller:</strong> d-pad moves, <kbd>A</kbd> selects, <kbd>B</kbd> back. In a hunt: <kbd>Y</kbd> end turn · <kbd>X</kbd> reroll · <kbd>LB</kbd> <kbd>RB</kbd> aim · <kbd>LT</kbd> undo · <kbd>RT</kbd> swap. Elsewhere <kbd>LB</kbd> <kbd>RB</kbd> switch screens. <kbd>Menu</kbd> settings, <kbd>View</kbd> this help.</li>
      </ul></details>
    </div>
  </Modal>

  {#if game.view === 'board'}<Board />
  {:else if game.view === 'forge'}<Forge />
  {:else if game.view === 'shop'}<Shop />
  {:else if game.view === 'hunt' && game.hunt}<Hunt />
  {/if}
</div>

{#if !introOpen}<Coach />{/if}
<DetailTip />

