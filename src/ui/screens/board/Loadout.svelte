<script lang="ts">
  // Four slots; tapping one swaps the slots for a picker list (sortable, filterable, with deltas).
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { SLOT_LABEL, bestParts, movesLine, weaponVs } from '../../fmt';
  import { tick } from 'svelte';

  type Slot = 'w0' | 'w1' | 'armor' | 'item';
  type Sort = 'best' | 'avg' | 'name';
  let picker = $state<{ slot: Slot; ftype: 'All' | E.DamageType; sort: Sort } | null>(null);
  let root: HTMLElement;

  const L = $derived(game.save.loadout);
  const mon = $derived(L.target);
  const M = $derived(E.MONSTERS[mon]);
  const nWeapons = $derived(L.weapons.filter(Boolean).length);

  async function open(slot: Slot) {
    picker = { slot, ftype: 'All', sort: 'best' };
    await tick();
    (root.querySelector<HTMLElement>('.prow[aria-current="true"]') ?? root.querySelector<HTMLElement>('.prow'))?.focus();
  }
  async function close() {
    const sl = picker?.slot; picker = null;
    await tick();
    root.querySelector<HTMLElement>(`.slot[data-slot="${sl}"]`)?.focus();
  }
  function choose(id: string) {
    if (!picker) return;
    const s = picker.slot;
    if (s === 'w0' || s === 'w1') {
      const idx = s === 'w0' ? 0 : 1, o = 1 - idx;
      if (L.weapons[o] === id) L.weapons[o] = L.weapons[idx]; // picking the other slot's weapon swaps them
      L.weapons[idx] = id;
    } else if (s === 'armor') L.armor = id;
    else L.item = id || null;
    game.persist();
    close();
  }
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && picker) { e.preventDefault(); close(); } };

  const weaponIds = $derived.by(() => {
    if (!picker) return [];
    const p = picker;
    const ids = Object.keys(game.save.weapons).filter(id => p.ftype === 'All' || E.WEAPONS[id].type === p.ftype);
    const key: Record<Sort, (id: string) => number | string> = {
      best: id => -weaponVs(game.save, id, mon),
      avg: id => -E.avgDmg(E.ownedWeapon(game.save, id).moves),
      name: id => E.WEAPONS[id].name
    };
    return ids.sort((a, b) => { const ka = key[p.sort](a), kb = key[p.sort](b); return ka < kb ? -1 : ka > kb ? 1 : 0; });
  });
  const itemIds = $derived(Object.keys(E.ITEMS).filter(k => (game.save.items[k] ?? 0) > 0));
</script>

<svelte:window onkeydown={onKey} />

{#snippet weaponNotes(w: E.WeaponInst)}
  {@const m = E.elemMult(w.elem, mon)}
  {@const best = bestParts(mon, w.type)}
  {#if m > 1}<span class="good">Hits weakness</span>{:else if m < 1}<span class="bad">Resisted</span>{/if}
  {#if best.length}{m !== 1 ? ' · ' : ''}<span class="best">Breaks {best.join(', ')}</span>{/if}
  {#if M.flier}{' · '}{#if w.type === 'Pierce'}<span class="good">Full damage in the air</span>{:else}<span class="bad">Half damage in the air</span>{/if}{/if}
{/snippet}

{#snippet armorNote(a: E.ArmorInst)}
  {#if !a.resist}<span class="neutral">No resistance</span>
  {:else if a.resist === M.elem}<span class="good">Resists its {M.elem} attacks</span>
  {:else}<span class="bad">{a.resist} resist does nothing here</span>{/if}
{/snippet}

{#snippet delta(v: number, cur: number)}
  {@const d = v - cur}
  {#if !d}<small class="delta same">same</small>
  {:else}<small class="delta {d > 0 ? 'up' : 'down'}">{d > 0 ? '▲ +' : '▼ '}{d}</small>{/if}
{/snippet}

<section class="panel loadout" aria-label="Loadout" bind:this={root}>
  <div class="ph"><h2>Loadout</h2><span class="label">For the {M.short}</span></div>

  {#if !picker}
    <div class="slots">
      {#each ['w0', 'w1'] as const as slot, idx}
        {@const id = L.weapons[idx]}
        {#if !id}
          <button class="slot empty" data-slot={slot} onclick={() => open(slot)}><span class="sl">{SLOT_LABEL[slot]}</span><span><span class="nm">Empty</span></span><span class="chg">Choose</span></button>
        {:else}
          {@const w = E.ownedWeapon(game.save, id)}
          {@const sg = E.SIGNATURES[w.type]}
          <button class="slot" data-slot={slot} onclick={() => open(slot)}>
            <span class="sl">{SLOT_LABEL[slot]}</span>
            <span>
              <span class="nm">{w.name}{#if w.lv}{' '}<span class="lv">+{w.lv}</span>{/if}{' '}<span class="avg">{weaponVs(game.save, id, mon)} avg</span></span>
              <span class="sub2"><span><span class="tag {sg.tag}" style="margin:0 4px 0 0">{sg.name}</span>{w.type} · {w.elem ?? 'No element'}</span><span>{@render weaponNotes(w)}</span></span>
            </span>
            <span class="chg">Change</span>
          </button>
        {/if}
      {/each}
      {#if L.armor}
        {@const a = E.ownedArmor(game.save, L.armor)}
        <button class="slot" data-slot="armor" onclick={() => open('armor')}>
          <span class="sl">Armor</span>
          <span><span class="nm">{a.name}{#if a.lv}{' '}<span class="lv">+{a.lv}</span>{/if}</span><span class="sub2"><span>{a.hp} HP · guard {a.guard} · {a.rerolls} rerolls</span><span>{@render armorNote(a)}</span></span></span>
          <span class="chg">Change</span>
        </button>
      {/if}
      {#if L.item}
        {@const it = E.ITEMS[L.item]}
        {@const have = game.save.items[L.item] ?? 0}
        <button class="slot" data-slot="item" onclick={() => open('item')}>
          <span class="sl">Item</span>
          <span><span class="nm">{it.name}</span><span class="sub2"><span>Carry {Math.min(have, it.max)} of {have}</span><span>{it.desc}</span></span></span>
          <span class="chg">Change</span>
        </button>
      {:else}
        <button class="slot empty" data-slot="item" onclick={() => open('item')}>
          <span class="sl">Item</span>
          <span><span class="nm">No item</span><span class="sub2"><span>Free action, once per turn. Carried charges are lost if the hunt fails.</span></span></span>
          <span class="chg">Choose</span>
        </button>
      {/if}
    </div>
  {:else}
    <div class="picker">
      <div class="pickhead"><h3>Choose {SLOT_LABEL[picker.slot]}</h3><button class="btn quiet" onclick={close}>Done</button></div>

      {#if picker.slot === 'w0' || picker.slot === 'w1'}
        {@const idx = picker.slot === 'w0' ? 0 : 1}
        {@const cur = L.weapons[idx]}
        {@const other = L.weapons[1 - idx]}
        {@const curV = cur ? weaponVs(game.save, cur, mon) : 0}
        <div class="pickbar">
          <div class="filters">
            {#each ['All', 'Cut', 'Blunt', 'Pierce'] as const as t}
              <button aria-pressed={picker.ftype === t} onclick={() => (picker!.ftype = t)}>{t}</button>
            {/each}
          </div>
          <label class="label" for="psort">Sort
            <select id="psort" bind:value={picker.sort}>
              <option value="best">Best for this hunt</option><option value="avg">Raw damage</option><option value="name">Name</option>
            </select>
          </label>
        </div>
        <div class="plisthead one"><span>{weaponIds.length} weapon{weaponIds.length === 1 ? '' : 's'}</span><span title="Expected damage per turn in this hunt, and the change vs your equipped weapon">Avg dmg</span></div>
        <div class="plist one">
          {#each weaponIds as id (id)}
            {@const w = E.ownedWeapon(game.save, id)}
            {@const v = weaponVs(game.save, id, mon)}
            <button class="prow" aria-current={id === cur} onclick={() => choose(id)}>
              <span>
                <span class="nm">{w.name}{#if w.lv}{' '}<span class="lv">+{w.lv}</span>{/if}{#if id === cur}<span class="badge">Equipped</span>{:else if id === other}<span class="badge">In {SLOT_LABEL[idx ? 'w0' : 'w1']}</span>{/if}</span>
                <span class="ty">{w.type} · {w.elem ?? 'No element'} · {movesLine(w.moves)}</span>
                <span class="note">{@render weaponNotes(w)}</span>
              </span>
              <span class="num">{v}{#if id === cur}<small class="delta same">equipped</small>{:else}{@render delta(v, curV)}{/if}</span>
            </button>
          {:else}
            <p class="ital" style="padding:12px;margin:0">No weapons of that type yet. Craft some at the Forge.</p>
          {/each}
        </div>
      {:else if picker.slot === 'armor'}
        {@const cur = E.ownedArmor(game.save, L.armor)}
        {@const ids = Object.keys(game.save.armors)}
        <div class="plisthead"><span>{ids.length} armor</span><span>HP</span><span>Guard</span></div>
        <div class="plist">
          {#each ids as id (id)}
            {@const a = E.ownedArmor(game.save, id)}
            {@const eq = id === L.armor}
            <button class="prow" aria-current={eq} onclick={() => choose(id)}>
              <span>
                <span class="nm">{a.name}{#if a.lv}{' '}<span class="lv">+{a.lv}</span>{/if}{#if eq}<span class="badge">Equipped</span>{/if}</span>
                <span class="ty">{a.perk}</span><span class="note">{@render armorNote(a)}</span>
              </span>
              <span class="num">{a.hp}{#if eq}<small>—</small>{:else}{@render delta(a.hp, cur.hp)}{/if}</span>
              <span class="num">{a.guard}{#if eq}<small>—</small>{:else}{@render delta(a.guard, cur.guard)}{/if}</span>
            </button>
          {/each}
        </div>
      {:else}
        <div class="plisthead"><span>{itemIds.length} in stash</span><span>Carry</span><span>Have</span></div>
        <div class="plist">
          <button class="prow" aria-current={!L.item} onclick={() => choose('')}>
            <span><span class="nm">No item{#if !L.item}<span class="badge">Equipped</span>{/if}</span><span class="ty">Nothing to lose. Nothing to fall back on.</span></span>
            <span class="num">—</span><span class="num">—</span>
          </button>
          {#each itemIds as k (k)}
            {@const it = E.ITEMS[k]}
            {@const have = game.save.items[k]}
            <button class="prow" aria-current={k === L.item} onclick={() => choose(k)}>
              <span>
                <span class="nm">{it.name}{#if k === L.item}<span class="badge">Equipped</span>{/if}</span>
                <span class="ty">{it.desc}</span>
                {#if it.effect === 'net'}<span class="note">{#if M.flier}<span class="good">Grounds the {M.short}</span>{:else}<span class="bad">Only works on fliers</span>{/if}</span>{/if}
              </span>
              <span class="num">{Math.min(have, it.max)}</span><span class="num">{have}</span>
            </button>
          {/each}
          {#if !itemIds.length}<p class="ital" style="padding:12px;margin:0">No items in your stash. Buy some at the Shop.</p>{/if}
        </div>
      {/if}
    </div>
  {/if}

  <div class="campfoot">
    <span class="ital">{nWeapons === 2 ? 'Swap weapons mid-hunt for 1 die.' : 'Choose two weapons to bring.'}</span>
    <button class="btn primary" disabled={nWeapons !== 2} onclick={() => game.begin()}>Hunt the {M.short}</button>
  </div>
</section>
