<script lang="ts">
  // The Hunt Board, in two pages (grouped by Hunter Rank since Nov 2026) (Nov 2026 playtest: with 23 monsters the side list ran long). The first page is
  // every monster as a small bestiary plate, grouped by region; a monster's page holds its entry and your loadout,
  // with a way back. New players open straight on the Gorehorn's page (the guided first hunt starts there).
  import { storeAvailable, openStore } from '../store';
  import Elem from '../parts/Elem.svelte';
  import * as E from '../../engine';
  import { game } from '../game.svelte';
  import { ELEMS, record } from '../fmt';
  import Plate from '../parts/Plate.svelte';
  import Bestiary from './board/Bestiary.svelte';
  import Loadout from './board/Loadout.svelte';

  let filter = $state<'All' | E.Element>('All');
  const known = Object.keys(E.MONSTERS).length;
  const total = known + E.UNKNOWN.reduce((n, u) => n + u.n, 0);
  const M = $derived(E.MONSTERS[game.save.loadout.target]);

  // grouped by Hunter Rank (Nov 2026): each rank's main region, its optional regions, and the promotion hunt that
  // takes you to the next rank (shown last, on its own card)
  const SECTIONS: { rank: E.Rank; main: number[]; optional: number[]; promo: number }[] = [
    { rank: 'F', main: [1], optional: [], promo: 1.5 },
    { rank: 'E', main: [2], optional: [2.2, 2.5], promo: 2.4 },
    { rank: 'D', main: [3], optional: [3.2], promo: 4 }
  ];
  const pass = (N: E.MonsterDef) => filter === 'All' || N.elem === filter || !!N.elemOf;
  const groupOf = (t: number) => ({
    t,
    known: Object.values(E.MONSTERS).filter(N => N.tier === t && pass(N)),
    unknown: E.UNKNOWN.filter(u => u.tier === t && (filter === 'All' || u.elem === filter || !u.elem))
  });
  const sections = $derived(SECTIONS.map(sec => ({
    ...sec,
    promoMon: Object.values(E.MONSTERS).find(N => N.tier === sec.promo && pass(N)) ?? null,
    groups: [...sec.main, ...sec.optional].map(groupOf).concat(E.UNKNOWN.some(u => u.tier === sec.promo) ? [groupOf(sec.promo)] : []).filter(g => g.known.length || g.unknown.length)
  })).filter(sec => sec.promoMon || sec.groups.length));
  const myRank = $derived(E.hunterRank(game.save));
  const rankState = (r: E.Rank) => (r === myRank ? 'Your rank' : E.rankAtLeast(game.save, r) ? 'Passed' : 'Not yet');
  const done = (id: string) => { const bs = E.bountiesFor(id); return { n: bs.filter(b => game.save.bounties[b.id]).length, of: bs.length }; };

  // back to the grid with Escape (the pad's B already closes dialogs and clears selections)
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && game.view === 'board' && game.boardMon && !document.querySelector('dialog[open]')) { e.preventDefault(); game.go('board'); }
  }
</script>

<svelte:window onkeydown={onKey} />

{#if game.boardMon && M}
  <div class="monpage">
    <div class="backbar">
      <button class="btn quiet" data-sound onclick={() => game.go('board')}><span aria-hidden="true">←</span> All monsters</button>
      <span class="label">{E.TIERS[M.tier]}</span>
    </div>
    <div class="mongrid">
      <section class="panel monmain" aria-label="Bestiary entry"><Bestiary mon={M.id} /></section>
      <div class="monload"><Loadout /></div>
    </div>
  </div>
{:else}
  <section class="panel boardpanel" aria-label="Monsters">
    <div class="ph">
      <h2>Choose a monster</h2>
      <span class="label">{known} of {total} sighted</span>
    </div>
    <div class="filters" aria-label="Filter by element">
      {#each ['All', ...ELEMS] as f}
        <button aria-pressed={filter === f} onclick={() => (filter = f as typeof filter)}>
          {#if f !== 'All'}<Elem e={f as E.Element} />{/if}{f}
        </button>
      {/each}
    </div>
    {#each sections as sec (sec.rank)}
      <div class="ranksec" class:current={sec.rank === myRank}>
        <h3 class="rankhead"><span class="rk" aria-hidden="true">{sec.rank}</span><span>Rank {sec.rank} · {E.RANK_REGION[sec.rank]}</span><span class="label rs">{rankState(sec.rank)}</span></h3>
        {#each sec.groups as g (g.t)}
          <div class="region">
            <h4 class="group">{E.TIERS[g.t]}{#if sec.optional.includes(g.t)}<span class="opt"> · optional</span>{/if}</h4>
            <div class="mgrid">
              {#each g.known as N (N.id)}
                {@const r = record(game.save, N.id)}
                {@const open = E.isUnlocked(game.save, N.id)}
                <button class="mcard" class:locked={!open} aria-current={N.id === game.save.loadout.target} data-id={N.id}
                  aria-label="{open ? N.short : `${N.short}, locked`}" onclick={() => open && game.openMonster(N.id)} aria-disabled={!open}>
                  <span class="mthumb" aria-hidden="true"><Plate mon={N.id} /></span>
                  <span class="nm">{N.short}</span>
                  <span class="meta"><span>{#if N.elemOf}By stance{:else}<Elem e={N.elem} />{N.elem}{/if}</span><span>{N.elemOf ? 'Weakness changes' : `Weak to ${N.weak}`}</span></span>
                  {#if open}
                    <span class="st" class:new={!r.wins}>{r.wins ? `Hunted ×${r.wins}` : 'Not yet hunted'}{#if E.BOUNTIES_ON && r.wins && E.bountiesFor(N.id).length}{@const b = done(N.id)}{' '}· Bounties {b.n}/{b.of}{/if}</span>
                  {:else}
                    <span class="st">Locked · {E.unlockHint(N.id)}</span>
                  {/if}
                </button>
              {/each}
              {#each g.unknown as u}
                <div class="mcard unknown" aria-disabled="true">
                  <span class="mthumb q" aria-hidden="true">?</span>
                  <span class="nm">Unknown{u.n > 1 ? ` ×${u.n}` : ''}</span>
                  <span class="meta">{#if u.elem}<span><Elem e={u.elem} />{u.elem}</span>{/if}</span>
                  <span class="st">{u.hint}</span>
                </div>
              {/each}
            </div>
          </div>
        {/each}
        <!-- the promotion hunt closes the rank: beat the region above, then take it (Mekkman, Nov 2026: below, not on top) -->
        {#if sec.promoMon}
          {@const N = sec.promoMon}
          {@const r = record(game.save, N.id)}
          {@const open = E.isUnlocked(game.save, N.id)}
          <button class="mcard promo" class:locked={!open} class:passed={r.wins > 0} aria-current={N.id === game.save.loadout.target} data-id={N.id}
            aria-label="Promotion hunt: {N.short}{open ? '' : ', locked'}" onclick={() => open && game.openMonster(N.id)} aria-disabled={!open}>
            <span class="mthumb" aria-hidden="true"><Plate mon={N.id} /></span>
            <span class="ptext">
              <span class="pk">Promotion hunt · to rank {N.promotion}</span>
              <span class="nm">{N.short}</span>
              <span class="meta"><span>{#if N.elemOf}By stance{:else}<Elem e={N.elem} />{N.elem}{/if}</span><span>{N.elemOf ? 'Weakness changes' : `Weak to ${N.weak}`}</span></span>
              {#if r.wins}<span class="st">Passed · hunted ×{r.wins}</span>
              {:else if open}<span class="st new">Ready: win it to become a rank {N.promotion} hunter</span>
              {:else}<span class="st">Locked · {E.unlockHint(N.id)}</span>{/if}
            </span>
          </button>
        {/if}
      </div>
    {:else}
      <p class="ital p0">No monsters of that element sighted yet.</p>
    {/each}
    {#if E.EDITION === "demo" && storeAvailable() && game.save.endSeen}
      <div class="wishrow"><span class="md">The rest of the hunt is in the full game.</span><button class="btn quiet" onclick={() => openStore()}>Wishlist on Steam</button></div>
    {/if}
  </section>
{/if}
