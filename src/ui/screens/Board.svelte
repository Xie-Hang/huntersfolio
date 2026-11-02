<script lang="ts">
  import * as E from '../../engine';
  import { game } from '../game.svelte';
  import { ELEMS, record } from '../fmt';
  import Plate from '../parts/Plate.svelte';
  import Bestiary from './board/Bestiary.svelte';
  import Loadout from './board/Loadout.svelte';

  let filter = $state<'All' | E.Element>('All');
  let bestiaryEl: HTMLElement;
  const known = Object.keys(E.MONSTERS).length;
  const total = known + E.UNKNOWN.reduce((n, u) => n + u.n, 0);

  const groups = $derived(
    [1, 2, 3, 4]
      .map(t => ({
        t,
        known: Object.values(E.MONSTERS).filter(M => M.tier === t && (filter === 'All' || M.elem === filter)),
        unknown: E.UNKNOWN.filter(u => u.tier === t && (filter === 'All' || u.elem === filter || !u.elem))
      }))
      .filter(g => g.known.length || g.unknown.length)
  );

  function pick(id: string) {
    game.save.loadout.target = id;
    game.persist();
    if (window.innerWidth <= 900) bestiaryEl?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }
  function onKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const rows = [...document.querySelectorAll<HTMLButtonElement>('.mrow[data-id]')];
    const i = rows.indexOf(e.target as HTMLButtonElement); if (i < 0) return;
    const n = rows[e.key === 'ArrowDown' ? Math.min(rows.length - 1, i + 1) : Math.max(0, i - 1)];
    if (n && n !== e.target) { e.preventDefault(); n.focus(); pick(n.dataset.id!); }
  }
</script>

<div class="campgrid">
  <section class="panel" aria-label="Monsters">
    <div class="ph"><h2>Monsters</h2><span class="label">{known} of {total} sighted</span></div>
    <div class="filters" aria-label="Filter by element">
      {#each ['All', ...ELEMS] as f}
        <button aria-pressed={filter === f} onclick={() => (filter = f as typeof filter)}>
          {#if f !== 'All'}<span class="edot {f}"></span>{/if}{f}
        </button>
      {/each}
    </div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="mlist" onkeydown={onKey}>
      {#each groups as g (g.t)}
        <div class="group">{E.TIERS[g.t]}</div>
        {#each g.known as M (M.id)}
          {@const r = record(game.save, M.id)}
          <button class="mrow" data-id={M.id} aria-current={M.id === game.save.loadout.target} onclick={() => pick(M.id)}>
            <span class="thumb" aria-hidden="true"><Plate mon={M.id} /></span>
            <span>
              <span class="nm">{M.short}</span>
              <span class="meta"><span><span class="edot {M.elem}"></span>{M.elem}</span><span>Weak: {M.weak}</span><span class={r.wins ? '' : 'new'}>{r.wins ? `Hunted ×${r.wins}` : 'Not yet hunted'}</span></span>
            </span>
          </button>
        {/each}
        {#each g.unknown as u}
          <div class="mrow unknown" aria-disabled="true">
            <span class="thumb" aria-hidden="true">?</span>
            <span><span class="nm">Unknown</span><span class="meta">{#if u.elem}<span><span class="edot {u.elem}"></span>{u.elem}</span>{/if}<span>{u.hint}</span></span></span>
          </div>
        {/each}
      {:else}
        <p class="ital p0">No monsters of that element sighted yet.</p>
      {/each}
    </div>
  </section>

  <section class="panel" aria-label="Bestiary entry" bind:this={bestiaryEl}>
    <Bestiary mon={game.save.loadout.target} />
  </section>

  <Loadout />
</div>
