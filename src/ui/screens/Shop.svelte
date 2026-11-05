<script lang="ts">
  import Icon from '../parts/Icon.svelte';
  // Buy items, craft items from materials, sell materials (with a "keep what recipes need" guard).
  import * as E from '../../engine';
  import { game } from '../game.svelte';
  import Costs from '../parts/Costs.svelte';

  type Tab = 'buy' | 'craft' | 'sell';
  let tab = $state<Tab>(game.shopTab);
  game.shopTab = 'buy';
  let toast = $state('');
  let qty = $state<Record<string, number>>({});
  const s = $derived(game.save);

  const clamp = (key: string, max: number) => Math.max(1, Math.min(qty[key] ?? 1, Math.max(1, max)));
  function setQty(key: string, v: number, max: number) { qty[key] = Math.max(1, Math.min(Math.max(1, max), Math.floor(v) || 1)); }

  const buyRows = $derived(Object.values(E.ITEMS).filter(it => it.price));
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
  function setTab(t: Tab) { tab = t; toast = ''; }
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
  <section class="panel" aria-label="Shop">
    <div class="ph"><h2>The Shop</h2><span class="label">{E.trackedLine(s)}</span></div>
    <div class="tabs" role="tablist">
      <button role="tab" aria-selected={tab === 'buy'} onclick={() => setTab('buy')}>Buy</button>
      <button role="tab" aria-selected={tab === 'craft'} onclick={() => setTab('craft')}>Craft items</button>
      <button role="tab" aria-selected={tab === 'sell'} onclick={() => setTab('sell')}>Sell</button>
    </div>
    <div class="toast" aria-live="polite">{toast}</div>
    <div class="srows">
      {#if tab === 'buy'}
        {#each buyRows as it (it.id)}
          {@const max = Math.max(1, Math.floor(s.coin / it.price!))}
          {@const q = clamp(it.id, max)}
          <div class="srow">
            <span><span class="nm"><Icon id={it.id} />{it.name}</span><span class="md">{it.desc} Carry up to {it.max} per hunt · you have {s.items[it.id] ?? 0}.</span></span>
            <span class="ctl">
              <span class="price">{it.price} each</span>
              {@render stepper(it.id, max)}
              <button class="btn primary" data-sound disabled={s.coin < it.price! * q} onclick={() => run(sv => E.buyItem(sv, it.id, q), it.id)}>Buy {q} · {it.price! * q} coin</button>
            </span>
          </div>
        {/each}
      {:else if tab === 'craft'}
        {#each craftRows as it (it.id)}
          <div class="srow">
            <span><span class="nm"><Icon id={it.id} />{it.name}</span><span class="md">{it.desc} Makes {it.yields ?? 1} · you have {s.items[it.id] ?? 0}.</span><Costs cost={it.craft!} /></span>
            <span class="ctl"><button class="btn primary" data-sound disabled={!E.canPay(s, it.craft!)} onclick={() => run(sv => E.craftItem(sv, it.id))}>Craft {it.yields ?? 1}</button></span>
          </div>
        {/each}
        <div class="srow"><span class="md">More item recipes arrive with each new monster.</span></div>
      {:else}
        {#if sellRows.length}
          <div class="sellbar">
            <span class="md">Surplus = what no recipe you can still make needs.</span>
            <button class="btn quiet" data-sound disabled={!surplusCoin} onclick={() => run(sv => E.sellSurplus(sv))}>Sell surplus · {surplusCoin} coin</button>
          </div>
        {/if}
        {#each sellRows as r (r.m.id)}
          {@const key = `s:${r.m.id}`}
          {@const q = clamp(key, r.have)}
          <div class="srow">
            <span>
              <span class="nm"><Icon id={r.m.id} />{E.matName(r.m.id)}</span><span class="md">You have {r.have} · {r.m.sell} coin each</span>
              {#if r.tn}<span class="warn">Tracked: {r.tn}</span>
              {:else if r.uses.length}<span class="warn">Keep {r.keep} for {r.uses.slice(0, 2).join(', ')}{r.uses.length > 2 ? ` +${r.uses.length - 2} more` : ''}</span>{/if}
            </span>
            <span class="ctl">
              {@render stepper(key, r.have)}
              <button class="btn primary" data-sound onclick={() => run(sv => E.sellMat(sv, r.m.id, q), key)}>Sell {q} · {r.m.sell * q} coin</button>
            </span>
          </div>
        {:else}
          <div class="srow"><span class="md">No materials to sell. Hunt to bring some back.</span></div>
        {/each}
      {/if}
    </div>
  </section>
</div>
