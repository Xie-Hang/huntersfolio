<script lang="ts">
  import { game } from '../../game.svelte';
  const h = $derived(game.hunt!);
  const over = $derived(!!h.over);
  const n = $derived(game.sel.length);
  const label = (f: string) => (f === 'C' ? 'Circle' : f === 'T' ? 'Triangle' : 'Blank');
</script>

<section class="panel" aria-label="Your dice">
  <div class="ph"><h2>The dice</h2><span class="label">Turn {h.turn} · Click dice to select them</span></div>
  <div class="tray">
    {#each h.dice as d, i}
      {@const sel = game.sel.includes(i)}
      <div class="diebox">
        <button
          class="die"
          class:blank={d.face === 'B'}
          class:sel
          class:used={!!d.used}
          class:rolling={game.rolling.includes(i)}
          aria-pressed={sel}
          aria-label="{label(d.face)} die{d.used ? `, used for ${d.used}` : ''}"
          disabled={!!d.used || over}
          onclick={() => game.toggleDie(i)}
        >
          {#if d.face === 'C'}<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="14" fill="#2a1f17" /></svg>
          {:else if d.face === 'T'}<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 5l16 29H4z" fill="#2a1f17" /></svg>
          {:else}<span class="bl">Blank</span>{/if}
        </button>
        <span class="dietag" class:used={!!d.used}>{d.used || (sel ? 'Selected' : '')}</span>
      </div>
    {/each}
  </div>
  <div class="tools">
    <div class="grp">
      <button class="btn quiet" data-sound data-coach="reroll" disabled={!n || h.rerolls < 1 || over} onclick={() => game.reroll()}>Reroll selected · {h.rerolls} left</button>
      <button class="btn quiet" disabled={!game.undoStack.length || over} onclick={() => game.undo()}>Undo</button>
    </div>
    <button class="btn primary" data-sound data-coach="end" disabled={over} onclick={() => game.endTurn()}>End turn</button>
  </div>
</section>
