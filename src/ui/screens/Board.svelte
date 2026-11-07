<script lang="ts">
  // The Hunt Board, in two pages. The first is a world map (Nov 2026 playtest: "a map instead" of the list): select a
  // place and its monsters list beside it, by rank. A monster's page holds its entry and your loadout, with a way back.
  // On the island the rest of the world is fogged and the board opens on the next monster's page.
  import { storeAvailable, openStore } from '../store';
  import Elem from '../parts/Elem.svelte';
  import * as E from '../../engine';
  import { game } from '../game.svelte';
  import { ELEMS, record } from '../fmt';
  import Plate from '../parts/Plate.svelte';
  import Bestiary from './board/Bestiary.svelte';
  import Loadout from './board/Loadout.svelte';
  import WorldMap from './board/WorldMap.svelte';
  import { full } from '../detail.svelte';

  let filter = $state<'All' | E.Element>('All');
  const M = $derived(E.MONSTERS[game.save.loadout.target]);

  const pass = (N: E.MonsterDef) => filter === 'All' || N.elem === filter || !!N.elemOf;
  // A group's unlock condition is said once, on its heading, when every locked card in it shares it
  // (Nov 2026 playtest: the same long line on four cards was noise). The cards then just say Locked.
  const groupOf = (t: number) => {
    const known = Object.values(E.MONSTERS).filter(N => N.tier === t && pass(N));
    const hints = known.filter(N => !E.isUnlocked(game.save, N.id)).map(N => E.unlockParts(N.id).base);
    return {
      known,
      unknown: E.UNKNOWN.filter(u => u.tier === t && (filter === 'All' || u.elem === filter || !u.elem)),
      // only when the whole group is shut: on Ashfall Ridge the Gorehorn is open, so its locked cards say why themselves
      lockHint: hints.length > 1 && hints.length === known.length && hints.every(h => h === hints[0]) ? hints[0] : null
    };
  };

  // The world map (Nov 2026 playtest: "a map instead"). Six places; each lists its monsters by rank, its promotion
  // hunt last, and (for the Ridge and the Mirewood) the changed version of the place that opens a rank later.
  type Part = { t: number; label: string | null; promo?: boolean };
  const REGIONS: { id: string; name: string; tag: string; parts: Part[] }[] = [
    { id: 'foothills', name: 'The Foothills', tag: 'Tutorial', parts: [{ t: 0.5, label: null }] },
    { id: 'ridge', name: 'Ashfall Ridge', tag: 'Rank F', parts: [{ t: 1, label: 'Rank F' }, { t: 1.5, label: null, promo: true }, { t: 2.5, label: 'Changed · rank E · optional' }] },
    { id: 'mire', name: 'The Mirewood', tag: 'Rank E', parts: [{ t: 2, label: 'Rank E' }, { t: 2.4, label: null, promo: true }, { t: 3.2, label: 'Changed · rank D · optional' }] },
    { id: 'gloam', name: 'The Gloamhollow', tag: 'Rank E · optional', parts: [{ t: 2.2, label: null }] },
    { id: 'spire', name: 'The Stormspire', tag: 'Rank D', parts: [{ t: 3, label: null }] },
    { id: 'caldera', name: 'The Caldera', tag: 'Apex', parts: [{ t: 4, label: null, promo: true }] }
  ];
  const tiersOf = (r: (typeof REGIONS)[number]) => r.parts.map(p => p.t);
  const regionOf = (id: string) => REGIONS.find(r => tiersOf(r).includes(E.MONSTERS[id]?.tier ?? -1))?.id ?? null;
  const isl = $derived(!E.islandDone(game.save));
  const foothills = $derived(Object.values(E.MONSTERS).filter(N => N.tier === 0.5));
  const footOpen = $derived(foothills.filter(N => E.isUnlocked(game.save, N.id)));
  const places = $derived(REGIONS.map(r => {
    const mons = Object.values(E.MONSTERS).filter(N => tiersOf(r).includes(N.tier));
    const open = isl ? r.id === 'foothills' : mons.some(N => E.isUnlocked(game.save, N.id));
    const fresh = open && mons.some(N => E.isUnlocked(game.save, N.id) && !record(game.save, N.id).wins);
    const tgt = game.save.loadout.target;
    const here = isl ? r.id === 'foothills' : regionOf(tgt) === r.id && E.isUnlocked(game.save, tgt);
    return { id: r.id, name: r.name, tag: r.tag, open, fresh, here };
  }));
  // opens on the place of the monster you last picked (or the Foothills)
  let region = $state(E.islandDone(game.save) ? regionOf(game.save.loadout.target) ?? 'ridge' : 'foothills');
  const cur = $derived(REGIONS.find(r => r.id === region));
  const curGroups = $derived((cur?.parts ?? []).map(p => {
    const g = groupOf(p.t);
    const promoMon = p.promo ? g.known[0] ?? null : null;
    return { label: p.label, promoMon, known: g.known, unknown: g.unknown, lockHint: promoMon ? null : g.lockHint };
  }).filter(g => g.promoMon || g.known.length || g.unknown.length));
  const done = (id: string) => { const bs = E.bountiesFor(id); return { n: bs.filter(b => game.save.bounties[b.id]).length, of: bs.length }; };

  // back to the grid with Escape (the pad's B already closes dialogs and clears selections)
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && game.view === 'board' && game.boardMon && !document.querySelector('dialog[open]')) { e.preventDefault(); game.boardMon = false; }
  }
</script>

<svelte:window onkeydown={onKey} />

{#if game.boardMon && M}
  <div class="monpage">
    <div class="backbar">
      <button class="btn quiet" data-sound onclick={() => (game.boardMon = false)}><span aria-hidden="true">←</span> All monsters</button>
    </div>
    <div class="mongrid">
      <section class="panel monmain" aria-label="Bestiary entry"><Bestiary mon={M.id} /></section>
      <div class="monload"><Loadout /></div>
    </div>
  </div>
{:else}
  <section class="panel boardpanel world" aria-label="Monsters">
    <div class="ph"><h2>Choose a monster</h2></div>
    <div class="worldgrid">
      <div class="mapcol"><WorldMap {places} sel={region} onpick={(id) => (region = id)} /></div>
      <div class="regionpane" aria-live="polite">
        {#if cur}
        <div class="rphead">
          <h3>{cur.name}</h3><span class="label">{cur.tag}</span>
        </div>
        {#if isl && cur.id !== 'foothills'}
          <!-- on the island the rest of the world is only a promise -->
          <p class="ital p0">Beyond the Foothills. It opens when you become a Hunter.</p>
        {:else if isl}
          <div class="mgrid">
            {#each footOpen as N (N.id)}{@render monCard(N, null)}{/each}
            {#if E.onExam(game.save)}
              <!-- the island's last step: the Gorehorn, as the promotion hunt -->
              <button class="mcard exam" aria-current={game.save.loadout.target === 'gorehorn'} data-id="gorehorn" aria-label="Gorehorn" onclick={() => game.openMonster('gorehorn')}>
                <span class="mthumb" aria-hidden="true"><Plate mon="gorehorn" /></span>
                <span class="nm">{E.MONSTERS.gorehorn.short}</span>
                <span class="meta"><span>Promotion hunt</span></span>
                <span class="st new">Win to become a Hunter</span>
              </button>
            {/if}
          </div>
          {#if foothills.length > footOpen.length}<p class="rankfold" style="padding-left:2px">{foothills.length - footOpen.length} more {foothills.length - footOpen.length === 1 ? 'monster' : 'monsters'} to meet in the Foothills</p>{/if}
        {:else}
          <div class="filters" aria-label="Filter by element">
            {#each ['All', ...ELEMS] as f}
              <button aria-pressed={filter === f} onclick={() => (filter = f as typeof filter)}>
                {#if f !== 'All'}<Elem e={f as E.Element} />{/if}{f}
              </button>
            {/each}
          </div>
          {#each curGroups as g, gi (gi)}
            <div class="region">
              {#if g.label || g.lockHint}<h4 class="group">{#if g.label}{g.label}{/if}{#if g.lockHint}<span class="lockline" class:solo={!g.label}><svg class="lk" viewBox="0 0 12 14" width="11" height="13" aria-hidden="true"><path d="M3 6V4.2a3 3 0 0 1 6 0V6" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="1.5" y="6" width="9" height="7" rx="1.2" fill="currentColor"/></svg>{g.lockHint}</span>{/if}</h4>{/if}
              {#if g.promoMon}
                {@render promoCard(g.promoMon)}
              {:else}
              <div class="mgrid">
                {#each g.known as N (N.id)}{@render monCard(N, g.lockHint)}{/each}
                {#each g.unknown as u}
                  <div class="mcard unknown" aria-disabled="true">
                    <span class="mthumb q" aria-hidden="true">?</span>
                    <span class="nm">Unknown{u.n > 1 ? ` ×${u.n}` : ''}</span>
                    <span class="meta">{#if u.elem}<span><Elem e={u.elem} />{u.elem}</span>{/if}</span>
                    <span class="st">{u.hint}</span>
                  </div>
                {/each}
              </div>
              {/if}
            </div>
          {:else}
            <p class="ital p0">{filter === 'All' ? 'Nothing sighted here yet.' : 'No monsters of that element here.'}</p>
          {/each}
        {/if}
        {/if}
      </div>
    </div>
    {#if E.EDITION === "demo" && storeAvailable() && game.save.endSeen}
      <div class="wishrow"><span class="md">The rest of the hunt is in the full game.</span><button class="btn quiet" onclick={() => openStore()}>Wishlist on Steam</button></div>
    {/if}
  </section>
{/if}

{#snippet monCard(N: E.MonsterDef, lockHint: string | null)}
  {@const r = record(game.save, N.id)}
  {@const open = E.isUnlocked(game.save, N.id)}
  <button class="mcard" class:locked={!open} aria-current={N.id === game.save.loadout.target} data-id={N.id}
    aria-label="{open ? N.short : `${N.short}, locked`}" onclick={() => open && game.openMonster(N.id)} aria-disabled={!open}>
    <span class="mthumb" aria-hidden="true"><Plate mon={N.id} /></span>
    <span class="nm">{N.short}</span>
    {#if N.tier === 0.5}
      <span class="meta"><span>{N.kind}</span></span>
    {:else}
      <span class="meta"><span>{#if N.elemOf}By stance{:else}<Elem e={N.elem} />{N.elem}{/if}</span><span>{N.elemOf ? 'Weakness changes' : `Weak to ${N.weak}`}</span></span>
    {/if}
    {#if open}
      <span class="st" class:new={!r.wins}>{r.wins ? `Hunted ×${r.wins}` : 'Not yet hunted'}{#if E.BOUNTIES_ON && r.wins && E.bountiesFor(N.id).length}{@const b = done(N.id)}{' '}· Bounties {b.n}/{b.of}{/if}</span>
    {:else}
      <span class="st"><svg class="lk" viewBox="0 0 12 14" width="11" height="13" aria-hidden="true"><path d="M3 6V4.2a3 3 0 0 1 6 0V6" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="1.5" y="6" width="9" height="7" rx="1.2" fill="currentColor"/></svg>{#if lockHint}{@const x = E.unlockParts(N.id).extra}Locked{x ? ` · also the ${x}` : ''}{:else}Locked · {E.unlockHint(N.id).replace(/ first$/, '')}{/if}</span>
    {/if}
  </button>
{/snippet}

{#snippet promoCard(N: E.MonsterDef)}
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
      {:else}<span class="st"><svg class="lk" viewBox="0 0 12 14" width="11" height="13" aria-hidden="true"><path d="M3 6V4.2a3 3 0 0 1 6 0V6" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="1.5" y="6" width="9" height="7" rx="1.2" fill="currentColor"/></svg>Locked · {E.unlockHint(N.id)}</span>{/if}
    </span>
  </button>
{/snippet}

<style>
  .worldgrid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 18px; align-items: start; }
  .mapcol { position: sticky; top: 12px; min-width: 0; }
  .regionpane { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .rphead { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .rphead h3 { margin: 0; font-family: 'IM Fell English', Georgia, serif; font-weight: 400; font-size: var(--fs-xl); }
  .regionpane :global(.mgrid) { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
  .regionpane :global(.mcard.promo) { max-width: none; }
  .regionpane :global(.mcard.promo .mthumb) { width: 150px; }
  @media (max-width: 900px) { .worldgrid { grid-template-columns: minmax(0, 1fr); } .mapcol { position: static; } }
  .rankfold { all: unset; cursor: pointer; display: block; padding: 4px 2px 12px 56px; color: var(--muted); font-size: var(--fs-sm); }
  .rankfold:hover, .rankfold:focus-visible { color: var(--fg); }
  .rankfold:focus-visible { outline: 2px solid var(--gold-hi); outline-offset: 2px; }
</style>
