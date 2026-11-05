<script lang="ts">
  import WeaponArt from '../../parts/WeaponArt.svelte';
  import Icon from '../../parts/Icon.svelte';
  // Four slots; tapping one swaps the slots for a picker list (sortable, filterable, with deltas).
  import Elem from '../../parts/Elem.svelte';
  import { coach } from '../../coach.svelte';
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { SLOT_LABEL, bestParts, movesLine, weaponVs } from '../../fmt';
  import { tick } from 'svelte';

  type Slot = 'w0' | 'w1' | 'armor' | 'charm' | 'item';
  type Sort = 'best' | 'avg' | 'name';
  let picker = $state<{ slot: Slot; ftype: 'All' | E.DamageType; sort: Sort } | null>(null);
  let root: HTMLElement;

  const L = $derived(game.save.loadout);
  const mon = $derived(L.target);
  const M = $derived(E.MONSTERS[mon]);
  const nWeapons = $derived(L.weapons.filter(Boolean).length);
  const openBounties = $derived(E.BOUNTIES_ON ? E.bountiesFor(mon).filter(b => E.bountyOpen(game.save, b.id) && !game.save.bounties[b.id]).length : 0);
  const B = $derived(L.bounty && E.BOUNTIES[L.bounty]?.mon === mon && E.bountyOpen(game.save, L.bounty) ? E.BOUNTIES[L.bounty] : null);
  const breaks = $derived(B ? E.loadoutBreaks(game.save) : null);

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
    else if (s === 'charm') L.charm = id || null;
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
  const itemIds = $derived(Object.keys(E.ITEMS).filter(k => !E.ITEMS[k].pouch && (game.save.items[k] ?? 0) > 0));
</script>

<svelte:window onkeydown={onKey} />

{#snippet weaponNotes(w: E.WeaponInst)}
  {@const m = E.elemMult(w.elem, mon)}
  {@const best = bestParts(mon, w.type)}
  {#if m > 1}<span class="good">Hits weakness</span>{:else if m < 1}<span class="bad">Resisted</span>{/if}
  {#if best.length}{m !== 1 ? ' · ' : ''}<span class="best">Breaks {best.join(', ')}</span>{/if}
  {#if M.flier}{' · '}{#if w.type === 'Pierce'}<span class="good">Full damage in the air</span>{:else}<span class="bad">Half damage in the air</span>{/if}{/if}
  {#if M.plated}{' · '}{#if w.type === 'Cut'}<span class="good">Clears its ice in one hit</span>{:else}<span class="bad">Takes two hits to clear its ice</span>{/if}{/if}
  {#if M.burrower}{' · '}{#if w.type === 'Blunt'}<span class="good">Reaches it underground</span>{:else}<span class="bad">Can’t reach it underground</span>{/if}{/if}
{/snippet}

{#snippet armorNote(a: E.ArmorInst)}
  {#if a.burnproof && M.burrower}<span class="good">Immune to its molten shell</span>{' · '}{/if}
  {#if !a.resist}<span class="neutral">No resistance</span>
  {:else if a.resist === M.elem}<span class="good">Resists its {M.elem} attacks</span>
  {:else}<span class="bad">{a.resist} resist does nothing here</span>{/if}
{/snippet}

{#snippet delta(v: number, cur: number)}
  {@const d = v - cur}
  {#if !d}<small class="delta same">Same</small>
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
              <span class="nm"><WeaponArt id={id} size={34} />{w.name}{#if w.lv}{' '}<span class="lv">+{w.lv}</span>{/if}{' '}<span class="avg">{weaponVs(game.save, id, mon)} avg</span></span>
              <span class="sub2"><span><span class="tag {sg.tag}" style="margin:0 4px 0 0">{sg.name}</span>{w.type} · <Elem e={w.elem} />{w.elem ?? 'No element'}</span><span>{@render weaponNotes(w)}</span></span>
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
      {#if L.charm}
        {@const c = E.CHARMS[L.charm]}
        <button class="slot" data-slot="charm" onclick={() => open('charm')}>
          <span class="sl">Charm</span>
          <span><span class="nm"><Icon id={L.charm} />{c.name}</span><span class="sub2"><span>{c.perk}</span></span></span>
          <span class="chg">Change</span>
        </button>
      {:else}
        <button class="slot empty" data-slot="charm" onclick={() => open('charm')}>
          <span class="sl">Charm</span>
          <span><span class="nm">No charm</span><span class="sub2"><span>{Object.keys(game.save.charms).length ? 'Choose one of your charms.' : 'Craft charms at the Forge from monster materials.'}</span></span></span>
          <span class="chg">Choose</span>
        </button>
      {/if}
      {#if L.item}
        {@const it = E.ITEMS[L.item]}
        {@const have = game.save.items[L.item] ?? 0}
        <button class="slot" data-slot="item" onclick={() => open('item')}>
          <span class="sl">Item</span>
          <span><span class="nm"><Icon id={L.item} />{it.name}</span><span class="sub2"><span>Carry {Math.min(have, it.max)} of {have}</span><span>{it.desc}</span></span></span>
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
                <span class="nm"><WeaponArt id={id} size={28} />{w.name}{#if w.lv}{' '}<span class="lv">+{w.lv}</span>{/if}{#if id === cur}<span class="badge">Equipped</span>{:else if id === other}<span class="badge">In {SLOT_LABEL[idx ? 'w0' : 'w1']}</span>{/if}</span>
                <span class="ty">{w.type} · <Elem e={w.elem} />{w.elem ?? 'No element'} · {movesLine(w.moves)}</span>
                <span class="note">{@render weaponNotes(w)}</span>
              </span>
              <span class="num">{v}{#if id === cur}<small class="delta same">Equipped</small>{:else}{@render delta(v, curV)}{/if}</span>
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
      {:else if picker.slot === 'charm'}
        {@const ids = Object.keys(game.save.charms)}
        <div class="plisthead one"><span>{ids.length} charm{ids.length === 1 ? '' : 's'}</span><span></span></div>
        <div class="plist one">
          <button class="prow" aria-current={!L.charm} onclick={() => choose('')}>
            <span><span class="nm">No charm{#if !L.charm}<span class="badge">Equipped</span>{/if}</span></span><span class="num"></span>
          </button>
          {#each ids as id (id)}
            {@const c = E.CHARMS[id]}
            <button class="prow" aria-current={id === L.charm} onclick={() => choose(id)}>
              <span><span class="nm"><Icon id={id} />{c.name}{#if id === L.charm}<span class="badge">Equipped</span>{/if}</span><span class="ty">{c.perk}</span></span><span class="num"></span>
            </button>
          {/each}
          {#if !ids.length}<p class="ital" style="padding:12px;margin:0">No charms yet. Craft them at the Forge from monster materials.</p>{/if}
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
                <span class="nm"><Icon id={k} />{it.name}{#if k === L.item}<span class="badge">Equipped</span>{/if}</span>
                <span class="ty">{it.desc}</span>
                {#if it.effect === 'net'}<span class="note">{#if M.flier}<span class="good">Grounds the {M.short}</span>{:else}<span class="bad">Only works on fliers</span>{/if}</span>{/if}
                {#if it.effect === 'thaw'}<span class="note">{#if M.plated}<span class="good">Melts the {M.short}’s ice</span>{:else}<span class="bad">Only works on plated monsters</span>{/if}</span>{/if}
                {#if it.effect === 'blast'}<span class="note">{#if M.burrower}<span class="good">Forces the {M.short} up</span>{:else}<span class="bad">Only works on burrowers</span>{/if}</span>{/if}
              </span>
              <span class="num">{Math.min(have, it.max)}</span><span class="num">{have}</span>
            </button>
          {/each}
          {#if !itemIds.length}<p class="ital" style="padding:12px;margin:0">No items in your stash. Buy some at the Shop.</p>{/if}
        </div>
      {/if}
    </div>
  {/if}

  {#if !B && openBounties > 0}
    <div class="bstrip quiet"><span><span class="bn">Bounties</span> <span class="ital">{openBounties} open for the {M.short}. Take one from its page to earn coin and Hunter’s Seals on this hunt.</span></span></div>
  {/if}
  {#if B}
    <div class="bstrip">
      <span><span class="bn">Bounty · {B.name}</span> <span class="ital">Win, and: {B.goals.map(g => E.goalText(g, mon)).join(' · ')}</span></span>
      {#if breaks}<span class="bad">{breaks}: change a weapon or it won’t pay.</span>{/if}
      <button class="btn quiet" onclick={() => { L.bounty = null; game.persist(); }}>Drop</button>
    </div>
  {/if}
  <div class="campfoot">
    {#if !E.isUnlocked(game.save, mon)}
      <span class="ital">{E.unlockHint(M.id)} to unlock this hunt. You can still read up and prepare.</span>
      <button class="btn primary" disabled>Locked</button>
    {:else}
      <span class="ital">{nWeapons === 2 ? 'Swap weapons mid-hunt for 1 die.' : 'Choose two weapons to bring.'}</span>
      <button class="btn primary" data-sound data-coach="begin" disabled={nWeapons !== 2} onclick={() => game.begin(coach.scriptFirstHunt())}>Hunt the {M.short}</button>
    {/if}
  </div>
</section>

<style>
  .bstrip { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 12px; padding: 10px 12px; border: 1px solid var(--gold); border-radius: 6px; }
  .bstrip .bn { color: var(--gold-hi); font-weight: 600; }
  .bstrip.quiet { border-color: var(--line-2); font-size: var(--fs-sm); }
  .bstrip .bad { color: var(--ember-soft); font-size: var(--fs-sm); }
</style>
