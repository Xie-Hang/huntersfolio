<script lang="ts">
  import * as E from '../engine';
  import { game, type View } from './game.svelte';
  import Modal from './parts/Modal.svelte';
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

  let settingsOpen = $state(false);
  let helpOpen = $state(false);
  let resetArmed = $state(false);
  let setToast = $state('');
  let resetTimer: ReturnType<typeof setTimeout>;

  const NAV: [View, string][] = [['board', 'Hunt Board'], ['forge', 'Forge'], ['shop', 'Shop']];
  const sub = $derived.by(() => {
    const v = game.view, h = game.hunt;
    const label = v === 'hunt' && h ? E.MONSTERS[h.mid].short : NAV.find(n => n[0] === v)?.[1] ?? '';
    return `${BUILD} · ${label}${v === 'hunt' && h ? ` · Turn ${h.turn}` : ''} · Hunts ${game.save.hunts}`;
  });

  $effect(() => { if (settingsOpen) setToast = ''; });

  // Music follows the game: town loop in town, hunt loop in a hunt, the danger layer on big telegraphs, a sting at the end.
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

<svelte:window onpointerdown={() => music.unlock()} onkeydown={() => music.unlock()} onclickcapture={uiClick} />

<div class="wrap">
  <header class="top">
    <div>
      <h1>Hunter's <span>Folio</span></h1>
      <div class="sub">{sub}</div>
    </div>
    <div class="top-right">
      {#if !game.inHunt}
        <nav class="nav" aria-label="Town">
          {#each NAV as [v, label]}
            <button aria-current={game.view === v ? 'page' : 'false'} onclick={() => game.go(v)}>{label}</button>
          {/each}
        </nav>
      {/if}
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
    <div class="setrow"><span><span class="nm">Credits</span><span class="md">Music: placeholder tracks composed in code for Hunter's Folio. Final music to come. Sound effects: synthesized in code.</span></span></div>
    <div class="toast" aria-live="polite">{setToast}</div>
  </Modal>

  <Modal bind:open={helpOpen} title="How to play" wide>
    <ul class="helplist">
      <li><strong>Loop:</strong> pick a monster and gear at the Hunt Board, hunt, bring back coin and materials, then craft, upgrade or reinforce at the Forge and stock up at the Shop.</li>
      <li>Each turn you roll 4 dice (circle, triangle or blank). The panel above the dice shows what the monster will do when you end your turn, and how much it will hurt.</li>
      <li>Weapon moves take the dice they need. Aim at a part on the left; the chip shows how well your weapon type breaks it.</li>
      <li>Select dice to <strong>Reroll</strong>, <strong>Guard</strong>, <strong>Charge</strong>, <strong>Swap</strong>, or <strong>Capture</strong> (when the monster is at 20% HP or less; doubles part materials).</li>
      <li><span class="tag flow" style="margin:0">Flow</span> Cut: light moves give a reroll. <span class="tag daze" style="margin:0">Daze</span> Blunt: hits to the head part fill a daze meter. <span class="tag expose" style="margin:0">Expose</span> Pierce: hits expose the part for 2 turns, so every hit there from either weapon deals +15% and counts double toward breaking it. Shoot first, then swap and cash in.</li>
      <li><strong>Bows</strong> attack from range: they ignore mud, hit fliers at full damage and are safe from molten shells. The Pinning Shot interrupts wind-ups and brings fliers down.</li>
      <li><strong>Airborne</strong> monsters take half damage from Cut and Blunt, and their crest can't be reached. A Pinning Shot or a Weighted Net brings them down.</li>
      <li><strong>Underground</strong> monsters can only be hit by Blunt, at half damage. A Blunt move that uses 2 or more dice drives them up and cancels their attack. So does Blast Powder.</li>
      <li><strong>Ice plating</strong> breaks before a monster takes damage: a hit breaks layers of ice instead. A Cut hit breaks 2 layers, anything else 1. A Firepot melts all of it.</li>
      <li><strong>Molten</strong> monsters burn you a little each time you hit them with Cut or Blunt. Pierce attacks from range and is safe.</li>
      <li><strong>Charms</strong> go in their own slot and give one small perk each. Craft them at the Forge from monster materials.</li>
      <li><strong>Avg</strong> next to a weapon = expected damage per turn if all 4 dice go to attacking, without rerolls.</li>
      <li>Reinforcing (+1 to +3) adds 5% weapon damage, or 10 HP and 1 guard to armor, per level. Upgrades keep the reinforcement.</li>
      <li>Rare materials (8%, 12% on capture) get 3% likelier with every miss and are guaranteed on the 12th break of their part.</li>
      <li>Progress is saved automatically. Reset it from Settings (the gear).</li>
    </ul>
  </Modal>

  {#if game.view === 'board'}<Board />
  {:else if game.view === 'forge'}<Forge />
  {:else if game.view === 'shop'}<Shop />
  {:else if game.view === 'hunt' && game.hunt}<Hunt />
  {/if}
</div>
