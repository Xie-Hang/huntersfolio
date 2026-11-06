<script lang="ts">
  import * as E from '../engine';
  import { game, type View } from './game.svelte';
  import Modal from './parts/Modal.svelte';
  import RankMedal from './parts/RankMedal.svelte';
  import Coach from './parts/Coach.svelte';
  import Intro from './parts/Intro.svelte';
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
    const label = v === 'hunt' && h ? E.MONSTERS[h.mid].short : NAV.find(n => n[0] === v)?.[1] ?? '';
    return `${label}${v === 'hunt' && h ? ` · Turn ${h.turn}` : ''} · Hunts ${game.save.hunts}${game.newerSave ? ' · Not saving' : ''}`;
  });

  $effect(() => { if (settingsOpen) { setToast = ''; logCount = PL.counts(); } });

  // Music follows the game: town loop in town, hunt loop in a hunt, the danger layer on big telegraphs, a sting at the end.
  // On the desktop build autoplay is allowed, so start the music at launch instead of on the first click.
  $effect(() => { if ((window as unknown as { hf?: unknown }).hf) music.unlock(); });
  // The opening card: new players always; in the browser, every launch (its Begin click is what turns the sound on).
  // Automated runs (store captures, QA bots) skip it: navigator.webdriver is set only under automation.
  const freshPlayer = settings.prefs.tips && game.save.hunts === 0 && !game.save.tips.includes('begin');
  let introOpen = $state(!navigator.webdriver && (freshPlayer || !isDesktop()));
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
    setToast = 'Save reset. You’re back to 100 coin and starter gear.';
  }
</script>

<svelte:window onpointerdown={() => music.unlock()} onkeydown={e => { music.unlock(); onHuntKey(e); }} onclickcapture={uiClick} />

{#if introOpen}<Intro fresh={freshPlayer} onbegin={() => (introOpen = false)} onskip={() => { coach.skipAll(); introOpen = false; }} />{/if}

<div class="wrap" class:hunting={game.inHunt} inert={introOpen}>
  <header class="top">
    <div>
      <h1 aria-label="Hunter's Folio"><span class="hn">Hunter’s</span> <span>Folio</span></h1>
      <!-- the build version has its own span so collateral captures can hide it (Mekkman, Nov 2026: no build version on store art) -->
      <div class="sub"><span class="build">{BUILD} · </span>{sub}</div>
    </div>
    <div class="top-right">
      {#if !game.inHunt}
        <nav class="nav" aria-label="Town">
          {#each NAV.filter(([v]) => v === 'board' || game.save.hunts > 0) as [v, label]}
            <button aria-current={game.view === v ? 'page' : 'false'} data-coach="nav-{v}" onclick={() => game.go(v)}>{label}</button>
          {/each}
        </nav>
      {/if}
      <!-- Hunter Rank (Nov 2026): a seal with your rank's letter -->
      <span class="rankseal" title="Hunter Rank {E.hunterRank(game.save)}: {E.promotionFor(game.save) ? `pass the ${E.promotionFor(game.save)!.short} promotion hunt to rank up` : E.hunterRank(game.save) === 'C' ? 'Low Rank cleared' : 'the next promotion hunt is in the full game'}"><RankMedal rank={E.hunterRank(game.save)} size={46} /><span class="rl"><span>Hunter</span><span>Rank {E.hunterRank(game.save)}</span></span></span>
      <span class="purse">{game.save.coin} coin</span>
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
    <div class="setrow">
      <span><span class="nm">Save data</span><span class="md">Progress is saved automatically. Hunts so far: <b>{game.save.hunts}</b>.{#if game.inHunt}{' '}Finish or abandon this hunt before resetting.{/if}</span></span>
      <button class="btn quiet danger" disabled={game.inHunt} onclick={reset}>{resetArmed ? 'Click again to erase everything' : 'Reset save'}</button>
    </div>
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
      <span><span class="nm">Interface size</span><span class="md">Scales text and everything around it together, so nothing gets cramped or cut off.</span></span>
      <span class="seg" role="radiogroup" aria-label="Interface size">
        {#each UI_SIZES as f}
          <button role="radio" aria-checked={settings.prefs.uiSize === f} onclick={() => setSize(f)}>{Math.round(f * 100)}%</button>
        {/each}
      </span>
    </div>
    <div class="setrow">
      <span><span class="nm">Tutorial tips</span><span class="md">Short prompts the first time something happens. Turning them on again replays them from the start.</span></span>
      <button class="btn quiet" role="switch" aria-checked={settings.prefs.tips} onclick={() => coach.setEnabled(!settings.prefs.tips)}>{settings.prefs.tips ? 'On' : 'Off'}</button>
    </div>
    <div class="setrow">
      <span><span class="nm">Feedback</span><span class="md">The game keeps a hunt log on this PC ({logCount.hunts} hunt{logCount.hunts === 1 ? '' : 's'} so far): what you hunted, how it went, how long turns took. Nothing is sent anywhere. Export it{feedbackInfo() ? ', then attach the file when you send feedback' : ' to send to the developer'}.</span></span>
      <span class="btnrow">
        <button class="btn quiet" onclick={exportFromSettings}>Export report</button>
        {#if feedbackInfo()}<button class="btn quiet" onclick={() => openFeedback()}>{feedbackButton()}</button>{/if}
      </span>
    </div>
    <div class="setrow"><span><span class="nm">Credits</span><span class="md">Music: placeholder tracks composed in code for Hunter's Folio. Final music to come. Sound effects: synthesized in code. Logo type: IM Fell English, digitised by Igino Marini (SIL Open Font License).</span></span></div>
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
    <ul class="helplist">
      <li><strong>Loop:</strong> pick a monster and gear at the Hunt Board, hunt, bring back coin and materials, then craft, upgrade or reinforce at the Forge and stock up at the Shop.</li>
      <li>Each turn you roll 4 dice (circle, triangle or blank). The panel above the dice shows what the monster will do when you end your turn, and how much it will hurt.</li>
      <li>Weapon moves take the dice they need. Aim at a part on the left; the chip shows how well your weapon type breaks it.</li>
      <li>Select dice to <strong>Reroll</strong>, <strong>Guard</strong>, <strong>Charge</strong>, <strong>Swap</strong>, or <strong>Capture</strong> (when the monster is at 20% HP or less; doubles part materials).</li>
      <li><span class="tag flow" style="margin:0">Flow</span> Cut: light moves give a reroll. <span class="tag daze" style="margin:0">Daze</span> Blunt: hits to the head part fill a daze meter. <span class="tag expose" style="margin:0">Expose</span> Pierce: hits expose the part for 2 turns, so every hit there from either weapon deals +15% and counts double toward breaking it. Shoot first, then swap and cash in.</li>
      <li><strong>Bows</strong> attack from range: they ignore mud, hit fliers at full damage and are safe from molten shells. The Pinning Shot interrupts wind-ups and brings fliers down.</li>
      <li><strong>Airborne</strong> monsters can only be hit with Pierce (bows). A Pinning Shot or a Weighted Net brings them down; when they land, every weapon reaches them again.</li>
      <li><strong>Underground</strong> monsters can only be hit by Blunt, at half damage. A Blunt move that uses 2 or more dice drives them up and cancels their attack. So does Blast Powder.</li>
      <li><strong>Ice plating</strong> breaks before a monster takes damage: a hit breaks layers of ice instead. A Cut hit breaks 2 layers, anything else 1. A Firepot melts all of it.</li>
      <li><strong>Molten</strong> monsters burn you a little each time you hit them with Cut or Blunt. Pierce attacks from range and is safe.</li>
      <li><strong>Charms</strong> go in their own slot and give one small perk each. Craft them at the Forge from monster materials.</li>
      <li><strong>Avg</strong> next to a weapon = expected damage per turn if all 4 dice go to attacking, without rerolls.</li>
      <li>Reinforcing (+1 to +3) adds 5% weapon damage, or 10 HP and 1 guard to armor, per level. Upgrades keep the reinforcement.</li>
      <li>Rare materials (8%, 12% on capture) get 3% likelier with every miss and are guaranteed on the 12th break of their part.</li>
      <li><strong>Keys in a hunt:</strong> <kbd>1</kbd>–<kbd>4</kbd> select dice · <kbd>Q</kbd> <kbd>W</kbd> <kbd>E</kbd> moves · <kbd>G</kbd> guard · <kbd>C</kbd> charge · <kbd>S</kbd> swap · <kbd>X</kbd> capture · <kbd>I</kbd> item · <kbd>R</kbd> reroll · <kbd>Space</kbd> end turn · <kbd>Ctrl</kbd>+<kbd>Z</kbd> undo · <kbd>Esc</kbd> clear selection.</li>
      <li><strong>Controller:</strong> d-pad or left stick moves between controls, <kbd>A</kbd> selects, <kbd>B</kbd> goes back. In a hunt: <kbd>Y</kbd> end turn · <kbd>X</kbd> reroll selected · <kbd>LB</kbd> <kbd>RB</kbd> aim at a part · <kbd>LT</kbd> undo · <kbd>RT</kbd> swap weapon · <kbd>B</kbd> clear selection. Elsewhere <kbd>LB</kbd> <kbd>RB</kbd> switch screens. <kbd>Menu</kbd> settings, <kbd>View</kbd> this help.</li>
      <li>Progress is saved automatically. Reset it from Settings (the gear).</li>
    </ul>
  </Modal>

  {#if game.view === 'board'}<Board />
  {:else if game.view === 'forge'}<Forge />
  {:else if game.view === 'shop'}<Shop />
  {:else if game.view === 'hunt' && game.hunt}<Hunt />
  {/if}
</div>

{#if !introOpen}<Coach />{/if}

