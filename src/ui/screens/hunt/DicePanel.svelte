<script lang="ts">
  import Key from '../../parts/Key.svelte';
  import { input } from '../../pad.svelte';
  import { game } from '../../game.svelte';
  const h = $derived(game.hunt!);
  const over = $derived(!!h.over);
  const n = $derived(game.sel.length);
  const label = (f: string) => (f === 'C' ? 'Circle' : f === 'T' ? 'Triangle' : 'Blank');
</script>

<section class="panel" aria-label="Your dice">
  <div class="ph"><span class="label">Your dice · turn {h.turn}</span><span class="label">{input.mode === 'pad' ? 'Select any dice (A), then pick a move, or reroll them' : 'Click any dice to select them, then pick a move, or reroll them'}</span></div>
  <div class="diceline">
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
        <span class="dietag" class:used={!!d.used}>{#if d.used || sel}{d.used || 'Selected'}{:else if !over}<Key k={String(i + 1)} />{/if}</span>
      </div>
    {/each}
  </div>
  <div class="acts">
  <button class="btn primary endbtn" data-sound data-coach="end" disabled={over} onclick={() => game.endTurn()}><Key k="Space" pad="Y" />End turn</button>
    <div class="grp">
      <button class="btn quiet" data-sound data-coach="reroll" disabled={!n || h.rerolls < 1 || over} onclick={() => game.reroll()}><Key k="R" pad="X" />Reroll · {h.rerolls} left</button>
      <button class="btn quiet" disabled={!game.undoStack.length || over} onclick={() => game.undo()}><Key k="U" pad="LT" />Undo</button>
    </div>
  </div>
  </div>
</section>

<style>
  .diceline { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: space-between; }
  .diceline .tray { flex: 0 1 auto; justify-content: flex-start; padding: 4px 0 0; gap: 12px; }
  .endbtn { min-height: 52px; padding-inline: 22px; }
  .acts { flex: 1 0 230px; max-width: 300px; display: flex; flex-direction: column; gap: 8px; align-items: stretch; }
  .acts .grp { display: flex; gap: 8px; }
  .acts .grp .btn { flex: 1; white-space: nowrap; }
</style>
