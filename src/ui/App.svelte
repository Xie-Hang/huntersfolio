<script lang="ts">
  import * as E from '../engine';
  import { game, type View } from './game.svelte';
  import Modal from './parts/Modal.svelte';
  import Board from './screens/Board.svelte';
  import Forge from './screens/Forge.svelte';
  import Shop from './screens/Shop.svelte';
  import Hunt from './screens/Hunt.svelte';

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

  // Settings are hidden mid-hunt; close the dialog if a hunt starts.
  $effect(() => { if (game.inHunt) settingsOpen = false; });
  $effect(() => { if (settingsOpen) setToast = ''; });

  function reset() {
    clearTimeout(resetTimer);
    if (!resetArmed) { resetArmed = true; resetTimer = setTimeout(() => (resetArmed = false), 3000); return; }
    resetArmed = false;
    game.reset();
    setToast = 'Save reset. You’re back to 100 coin and starter gear.';
  }
</script>

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
      <button class="iconbtn" aria-label="How to play" aria-expanded={helpOpen} onclick={() => (helpOpen = true)}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5" /><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8" /><circle cx="12" cy="17.2" r=".6" fill="currentColor" /></svg>
      </button>
      {#if game.inHunt}
        <button class="btn quiet" onclick={() => game.abandon()}>Abandon hunt</button>
      {:else}
        <button class="iconbtn" aria-label="Settings" aria-expanded={settingsOpen} onclick={() => (settingsOpen = true)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
        </button>
      {/if}
    </div>
  </header>

  <Modal bind:open={settingsOpen} title="Settings">
    <div class="setrow">
      <span><span class="nm">Save data</span><span class="md">Progress is saved automatically. Hunts so far: <b>{game.save.hunts}</b>.</span></span>
      <button class="btn quiet danger" onclick={reset}>{resetArmed ? 'Tap again to erase everything' : 'Reset save'}</button>
    </div>
    <div class="toast" aria-live="polite">{setToast}</div>
  </Modal>

  <Modal bind:open={helpOpen} title="How to play" wide>
    <ul class="helplist">
      <li><strong>Loop:</strong> pick a monster and gear at the Hunt Board, hunt, bring back coin and materials, then craft, upgrade or reinforce at the Forge and stock up at the Shop.</li>
      <li>Each turn you roll 4 dice (circle, triangle or blank). The panel above the dice shows what the monster will do when you end your turn, and how much it will hurt.</li>
      <li>Weapon moves take the dice they need. Aim at a part on the left; the chip shows how well your weapon type breaks it.</li>
      <li>Select dice to <strong>Reroll</strong>, <strong>Guard</strong>, <strong>Charge</strong>, <strong>Swap</strong>, or <strong>Capture</strong> (when the monster is at 20% HP or less; doubles part materials).</li>
      <li><span class="tag flow" style="margin:0">Flow</span> Cut: light moves give a reroll. <span class="tag daze" style="margin:0">Daze</span> Blunt: hits to the head part fill a daze meter. <span class="tag pin" style="margin:0">Pin</span> Pierce: ×1.5 toward breaks, ignores mud and flight, Pinning Shot interrupts.</li>
      <li><strong>Airborne</strong> monsters take half damage from Cut and Blunt, and their crest can't be reached. A Pinning Shot or a Weighted Net brings them down.</li>
      <li><strong>Underground</strong> monsters can only be hit by Blunt, at half damage. A Blunt move that uses 2 or more dice drives them up and cancels their attack. So does Blast Powder.</li>
      <li><strong>Molten</strong> monsters burn you a little each time you hit them with Cut or Blunt. Pierce attacks from range and is safe.</li>
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
