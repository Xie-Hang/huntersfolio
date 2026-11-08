<script lang="ts">
  import Rich from '../parts/Rich.svelte';
  import Icon from '../parts/Icon.svelte';
  // Buy items, craft items from materials, sell materials (with a "keep what recipes need" guard).
  import * as E from '../../engine';
  import { game } from '../game.svelte';
  import Costs from '../parts/Costs.svelte';
  import { detail, full } from '../detail.svelte';

  type Tab = 'buy' | 'craft' | 'sell';
  let tab = $state<Tab>(game.shopTab);
  game.shopTab = 'buy';
  game.shopOpenTab = tab;
  let toast = $state('');
  let qty = $state<Record<string, number>>({});
  const s = $derived(game.save);

  const clamp = (key: string, max: number) => Math.max(1, Math.min(qty[key] ?? 1, Math.max(1, max)));
  function setQty(key: string, v: number, max: number) { qty[key] = Math.max(1, Math.min(Math.max(1, max), Math.floor(v) || 1)); }

  // only items for monsters you can hunt (Nov 2026 text audit: rank F saw the Mirewood's cures)
  const reach = $derived(Math.max(1, ...Object.values(E.MONSTERS).filter(M => E.isUnlocked(s, M.id)).map(M => M.tier)));
  // the Foothills (the tutorial island): the Shop sells the salve, then the smoke pouch and whetstone (step 14); nothing to craft yet
  const isl = $derived(!E.islandDone(s));
  const buyRows = $derived(Object.values(E.ITEMS).filter(it => it.price && (isl ? E.islandShop(s).includes(it.id) : full() || (it.tier ?? 1) <= reach)));
  const craftRows = $derived(Object.values(E.ITEMS).filter(it => it.craft));
  const sellRows = $derived(
    Object.values(E.MATERIALS).filter(m => (s.mats[m.id] ?? 0) > 0).map(m => {
      const have = s.mats[m.id], keep = Math.min(have, E.reserveFor(s, m.id));
      return { m, have, keep, spare: have - keep, uses: E.usedIn(s, m.id), tn: E.trackedNeed(s, m.id) };
    })
  );
  const surplusCoin = $derived(sellRows.reduce((n, r) => n + r.spare * r.m.sell, 0));

  function run(fn: (sv: E.Save) => string | null, resetKey?: string) {
    const msg = game.town(fn, 'coin');
    if (msg) { toast = msg; if (resetKey) qty[resetKey] = 1; }
  }
  function setTab(t: Tab) { tab = t; game.shopOpenTab = t; toast = ''; }
</script>

{#snippet stepper(key: string, max: number)}
  {@const q = clamp(key, max)}
  <span class="stepper">
    <button aria-label="One fewer" disabled={q <= 1} onclick={() => setQty(key, q - 1, max)}>−</button>
    <input type="number" min="1" max={Math.max(1, max)} value={q} aria-label="Quantity" onchange={e => setQty(key, +e.currentTarget.value, max)} />
    <button aria-label="One more" disabled={q >= max} onclick={() => setQty(key, q + 1, max)}>+</button>
  </span>
  <button class="btn quiet" disabled={max <= 1} onclick={() => setQty(key, max, max)}>Max</button>
{/snippet}

<div>
  <section class="panel shoppanel" aria-label="Shop">
    <div class="ph"><h2>The Shop</h2><span class="label">{E.trackedLine(s)}</span></div>
    <div class="tabs" role="tablist">
      <button role="tab" aria-selected={tab === 'buy'} onclick={() => setTab('buy')}>Buy</button>
      {#if !isl}<button role="tab" aria-selected={tab === 'craft'} onclick={() => setTab('craft')}>Craft items</button>{/if}
      <button role="tab" aria-selected={tab === 'sell'} data-coach="shop-sell" onclick={() => setTab('sell')}>Sell</button>
    </div>
    <div class="toast" aria-live="polite">{toast}</div>
    <!-- A grid of cards (Mekkman, Nov 2026: the one-column rows left most of a wide screen empty). Each card puts
         its controls at the bottom, so cards in a row line up whatever the description length. -->
    {#if tab === 'sell' && sellRows.length}
      <div class="sellbar">
        <button class="btn quiet" data-sound disabled={!surplusCoin} onclick={() => run(sv => E.sellSurplus(sv))}>Sell surplus · {surplusCoin} coin</button>
      </div>
    {/if}
    <div class="scards">
      {#if tab === 'buy'}
        {#each buyRows as it (it.id)}
          {@const max = Math.max(1, Math.floor(s.coin / it.price!))}
          {@const q = clamp(it.id, max)}
          <article class="scard">
            <!-- the price once, on the button; quiet buttons (gold means "do this now", and eleven of them meant nothing) -->
            <div class="sc-top"><Icon id={it.id} size={34} /><span class="sc-nm"><span class="nm">{it.name}</span><span class="have">Have {s.items[it.id] ?? 0} · max {it.max}</span></span></div>
            {#if it.short && !full()}<p class="md"><span use:detail={it.desc}><Rich text={it.short} /></span></p>{:else}<p class="md"><Rich text={it.desc.replace(/\n/g, ' ')} /></p>{/if}
            <div class="sc-ctl">{@render stepper(it.id, max)}</div>
            <button class="btn sc-go" data-sound data-coach="buy-{it.id}" disabled={s.coin < it.price! * q} onclick={() => run(sv => E.buyItem(sv, it.id, q), it.id)}>Buy {q} · {it.price! * q} coin</button>
          </article>
        {/each}
      {:else if tab === 'craft'}
        {#each craftRows as it (it.id)}
          <article class="scard">
            <div class="sc-top"><Icon id={it.id} size={34} /><span class="sc-nm"><span class="nm">{it.name}</span><span class="have">Have {s.items[it.id] ?? 0} · makes {it.yields ?? 1}</span></span></div>
            <p class="md"><span use:detail={it.desc}><Rich text={it.short ?? it.desc} /></span></p>
            <Costs cost={it.craft!} />
            <button class="btn sc-go" data-sound disabled={!E.canPay(s, it.craft!)} onclick={() => run(sv => E.craftItem(sv, it.id))}>Craft {it.yields ?? 1}</button>
          </article>
        {/each}
      {:else}
        {#each sellRows as r (r.m.id)}
          {@const key = `s:${r.m.id}`}
          {@const q = clamp(key, r.have)}
          <article class="scard">
            <div class="sc-top"><Icon id={r.m.id} size={34} /><span class="sc-nm"><span class="nm">{r.m.base}{#if r.m.rare}<span class="rare"> · rare</span>{/if}</span><span class="have">{r.m.src} · have {r.have}</span></span></div>
            {#if r.tn}<p class="warn">Tracked: {r.tn}</p>
            {:else if r.uses.length}<p class="warn">Keep {r.keep} for {r.uses.slice(0, 2).join(', ')}{r.uses.length > 2 ? ` +${r.uses.length - 2} more` : ''}</p>
            {:else}<p class="md">No recipe you can still make needs it.</p>{/if}
            <div class="sc-ctl">{@render stepper(key, r.have)}</div>
            <button class="btn sc-go" data-sound data-coach={!r.tn && !r.uses.length ? 'sell-spare' : undefined} onclick={() => { run(sv => E.sellMat(sv, r.m.id, q), key); game.sold++; }}>Sell {q} · {r.m.sell * q} coin</button>
          </article>
        {/each}
      {/if}
    </div>
    {#if tab === 'craft'}<p class="md foot">More item recipes arrive with each new monster.</p>{/if}
    {#if tab === 'sell' && !sellRows.length}<p class="md foot">No materials to sell. Hunt to bring some back.</p>{/if}
  </section>
</div>

<style>
  .scards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  .scard { display: grid; grid-template-rows: auto 1fr auto auto; gap: 10px; padding: 14px; border: 1px solid var(--line); border-radius: 3px; min-width: 0; }
  .scard:hover { border-color: var(--line-2); }
  .sc-top { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .sc-nm { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
  .sc-nm .nm { font-family: var(--f-body); font-weight: 600; font-size: var(--fs-md); }
  .have { font-size: var(--fs-sm); color: var(--muted); font-variant-numeric: tabular-nums; }
  .price { flex: none; text-align: right; color: var(--gold-hi); font-weight: 600; font-variant-numeric: tabular-nums; display: flex; flex-direction: column; line-height: 1.15; }
  .price small { font-size: var(--fs-sm); color: var(--muted); font-weight: 400; }
  .scard .md, .foot { margin: 0; font-size: var(--fs-sm); color: var(--soft); }
  .scard .warn { margin: 0; font-size: var(--fs-sm); color: var(--gold-hi); }
  .sc-ctl { display: flex; gap: 8px; align-items: center; }
  .sc-go { width: 100%; text-align: center; font-variant-numeric: tabular-nums; }
  .foot { margin-top: 12px; }
  .rare { color: var(--gold-hi); font-weight: 400; font-size: var(--fs-sm); }
  .sellbar { margin-bottom: 12px; border: 1px solid var(--line); border-radius: 3px; }
</style>
