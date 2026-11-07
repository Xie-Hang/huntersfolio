<script lang="ts">
  import WeaponArt from '../../parts/WeaponArt.svelte';
  import Icon from '../../parts/Icon.svelte';
  // Four slots; tapping one swaps the slots for a picker list (sortable, filterable, with deltas).
  import Elem from '../../parts/Elem.svelte';
  import { coach } from '../../coach.svelte';
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { detail, full } from '../../detail.svelte';
  import { SLOT_LABEL, bestParts, weaponVs, elemLabel, markOf } from '../../fmt';
  import CostDie from '../../parts/CostDie.svelte';
  import { tick } from 'svelte';

  type Slot = 'w0' | 'w1' | 'armor' | 'charm' | 'item' | 'bounty';
  type Sort = 'best' | 'avg' | 'name';
  let picker = $state<{ slot: Slot; ftype: 'All' | E.DamageType; sort: Sort } | null>(null);
  let root: HTMLElement;

  const L = $derived(game.save.loadout);
  const mon = $derived(L.target);
  const M = $derived(E.MONSTERS[mon]);
  const nWeapons = $derived(L.weapons.filter(Boolean).length);
  // the Foothills (the tutorial island): one weapon, nothing else to choose yet
  const isl = $derived(!E.islandDone(game.save));
  const need = $derived(E.twoWeapons(game.save) ? 2 : 1);
  const openBounties = $derived(E.BOUNTIES_ON ? E.bountiesFor(mon).filter(b => E.bountyOpen(game.save, b.id) && !game.save.bounties[b.id]).length : 0);
  const B = $derived(L.bounty && E.BOUNTIES[L.bounty]?.mon === mon && E.bountyOpen(game.save, L.bounty) ? E.BOUNTIES[L.bounty] : null);
  const breaks = $derived(B ? E.loadoutBreaks(game.save) : null);
  const allB = $derived(E.BOUNTIES_ON ? E.bountiesFor(mon) : []);
  const beaten = $derived((game.save.record[mon]?.wins ?? 0) > 0);
  const doneN = $derived(allB.filter(b => game.save.bounties[b.id]).length);
  function takeB(id: string | null) { L.bounty = id; game.persist(); if (picker?.slot === 'bounty') close(); }

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
  {#if M.elemOf}{#if w.elem}<span class="neutral">Hits its {w.elem === 'Stone' ? 'Ember' : w.elem === 'Gale' ? 'Stone' : w.elem === 'Ember' ? 'Frost' : 'Gale'} stance's weakness</span>{/if}{:else if m > 1}<span class="good">Hits weakness</span>{:else if m < 1}<span class="bad">Resisted</span>{/if}
  {#if best.length}{m !== 1 ? ' · ' : ''}<span class="best">Breaks more: {best.join(', ')}</span>{/if}
  {#if M.flier}{' · '}{#if w.type === 'Pierce'}<span class="good">Reaches it in the air</span>{:else}<span class="bad">Can’t reach it in the air</span>{/if}{/if}
  {#if M.plated}{@const n = M.plateBreak?.(w) ?? (w.type === 'Cut' ? 2 : 1)}{@const word = M.plateWord === 'scale' ? 'scales' : (M.plateWord ?? 'ice')}{' · '}{#if n >= M.plated}<span class="good">Clears its {word} in one hit</span>{:else}<span class="bad">Takes {Math.ceil(M.plated / n)} hits to clear its {word}</span>{/if}{#if M.plateHot && w.type === 'Cut'}{' · '}<span class="bad">Hot scales burn your hand</span>{/if}{/if}
  {#if M.id === 'rimeshrike' && w.type === 'Pierce'}{' · '}<span class="bad">Glances off its shroud on the ground</span>{/if}
  {#if M.burrower}{' · '}{#if w.type === 'Blunt'}<span class="good">Reaches it underground</span>{:else}<span class="bad">Can’t reach it underground</span>{/if}{/if}
{/snippet}

{#snippet armorNote(a: E.ArmorInst)}
  {#if a.burnproof && M.burn}<span class="good">Immune to its {M.plateHot ? 'burning scales' : 'burns'}</span>{' · '}{/if}
  {#if a.infectLess && M.inflicts === 'Infect'}<span class="good">Shorter infections</span>{' · '}{/if}
  {#if (a.sparkLess || a.chargeProof) && M.inflicts === 'Spark'}<span class="good">{a.chargeProof && M.id === 'archeron' ? 'Your dice can’t be charged' : 'Weaker Discharge'}</span>{' · '}{/if}
  {#if a.latchMax && M.id === 'hollowfang'}<span class="good">Shorter latches</span>{' · '}{/if}
  {#if a.leechProof && M.id === 'bloodwhelk'}<span class="good">The slime can’t drink from you</span>{' · '}{/if}
  {#if a.adaptive}<span class="good">Resists whatever element it attacks with −30%</span>
  {:else if !a.resist}<span class="neutral">No resistance</span>
  {:else if M.elemOf}<span class="neutral">Resists its {a.resist} stance's attacks</span>
  {:else if a.resist === M.elem}{#if full() || !M.elemental?.length}<span class="good">Resists its {M.elem} attacks −30%{M.elemental?.length ? ` (${M.elemental.join(', ')}; not its physical ones)` : ''}</span>{:else}<span class="good" use:detail={`${M.elemental.join(', ')}. Its other attacks are physical, and resist doesn’t touch those.`}>Resists {M.elemental.length} of its moves −30%</span>{/if}
  {:else}<span class="bad">{a.resist} resist does nothing here</span>{/if}
{/snippet}

{#snippet delta(v: number, cur: number)}
  {@const d = v - cur}
  {#if !d}<small class="delta same">Same</small>
  {:else}<small class="delta {d > 0 ? 'up' : 'down'}">{d > 0 ? '↑ +' : '↓ '}{d}</small>{/if}
{/snippet}

<section class="panel loadout" aria-label="Loadout" bind:this={root}>
  <div class="ph"><h2>Loadout</h2></div>

  {#if !picker}
    <div class="slots">
      {#each (need === 1 ? ['w0'] : ['w0', 'w1']) as ('w0' | 'w1')[] as slot, idx}
        {@const id = L.weapons[idx]}
        {#if !id}
          <button class="slot empty" data-slot={slot} data-coach="slot-{slot}" onclick={() => open(slot)}><span class="sl">{SLOT_LABEL[slot]}</span><span><span class="nm">Empty</span></span><span class="chg">Choose</span></button>
        {:else}
          {@const w = E.ownedWeapon(game.save, id)}
          {@const sg = E.SIGNATURES[w.type]}
          {#if need === 1}
          <!-- the Foothills: one weapon and nothing to compare yet -->
          <div class="slot" data-slot={slot} data-coach="slot-{slot}">
            <span class="sl">Weapon</span>
            <span><span class="nm"><WeaponArt id={id} size={34} />{w.name}</span><span class="sub2"><span>{w.type}</span></span></span>
          </div>
          {:else}
          <button class="slot" data-slot={slot} data-coach="slot-{slot}" onclick={() => open(slot)}>
            <span class="sl">{SLOT_LABEL[slot]}</span>
            <span>
              <span class="nm"><WeaponArt id={id} size={34} />{w.name}{#if w.lv}{' '}<span class="lv">+{w.lv}</span>{/if}{' '}<span class="avg">{weaponVs(game.save, id, mon)} avg</span></span>
              <span class="sub2"><span>{#if w.moves.some(m => m.flow || m.daze || m.expose)}<span class="tag {sg.tag}" style="margin:0 4px 0 0">{sg.name}</span>{/if}{w.type} · <Elem e={markOf(w)} />{elemLabel(w)}</span><span>{@render weaponNotes(w)}</span></span>
            </span>
            <span class="chg">Change</span>
          </button>
          {/if}
        {/if}
      {/each}
      {#if isl}
        <!-- the island fills these slots for you as you make things (no Change yet) -->
        {#if E.armorSlot(game.save) && L.armor && game.save.armors[L.armor]}
          {@const a = E.ownedArmor(game.save, L.armor)}
          <div class="slot" data-slot="armor" data-coach="slot-armor"><span class="sl">Armor</span><span><span class="nm">{a.name}{#if a.lv}{' '}<span class="lv">+{a.lv}</span>{/if}</span><span class="sub2"><span>{a.hp} HP · block {a.guard} · {a.rerolls} rerolls</span></span></span></div>
        {/if}
        {#if E.charmSlot(game.save) && L.charm}
          {@const c = E.CHARMS[L.charm]}
          <div class="slot" data-slot="charm" data-coach="slot-charm"><span class="sl">Charm</span><span><span class="nm"><Icon id={L.charm} />{c.name}</span><span class="sub2"><span>{c.perk}</span></span></span></div>
        {/if}
        {#if E.itemSlot(game.save) && L.item}
          {@const it = E.ITEMS[L.item]}
          {#if E.islandStep(game.save) >= 14}
          <!-- step 14: the Shop's new stock, so the item can be changed -->
          <button class="slot" data-slot="item" data-coach="slot-item" onclick={() => open('item')}><span class="sl">Item</span><span><span class="nm"><Icon id={L.item} />{it.name}</span><span class="sub2"><span>Carry {Math.min(game.save.items[L.item] ?? 0, it.max)}</span></span></span><span class="chg">Change</span></button>
          {:else}
          <div class="slot" data-slot="item" data-coach="slot-item"><span class="sl">Item</span><span><span class="nm"><Icon id={L.item} />{it.name}</span><span class="sub2"><span>Carry {Math.min(game.save.items[L.item] ?? 0, it.max)}</span></span></span></div>
          {/if}
        {/if}
      {:else}
      {#if L.armor}
        {@const a = E.ownedArmor(game.save, L.armor)}
        <button class="slot" data-slot="armor" onclick={() => open('armor')}>
          <span class="sl">Armor</span>
          <span><span class="nm">{a.name}{#if a.lv}{' '}<span class="lv">+{a.lv}</span>{/if}</span><span class="sub2"><span>{a.hp} HP · block {a.guard} · {a.rerolls} rerolls</span><span>{@render armorNote(a)}</span></span></span>
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
          <span><span class="nm"><Icon id={L.item} />{it.name}</span><span class="sub2"><span>Carry {Math.min(have, it.max)} of {have}</span>{#if it.short && !full()}<span use:detail={it.desc}>{it.short}</span>{:else}<span>{it.desc}</span>{/if}</span></span>
          <span class="chg">Change</span>
        </button>
      {:else}
        <button class="slot empty" data-slot="item" onclick={() => open('item')}>
          <span class="sl">Item</span>
          <span><span class="nm">No item</span><span class="sub2">{#if full()}<span>Free action, once per turn. Carried charges are lost if the hunt fails.</span>{:else}<span use:detail={'Using it is a free action, once per turn. Charges you carry are lost if the hunt fails.'}>A free action, once a turn</span>{/if}</span></span>
          <span class="chg">Choose</span>
        </button>
      {/if}
      {/if}
    </div>
    <!-- the bounty is not gear: an optional contract pinned beside the loadout, drawn as a notice, not a slot -->
    {#if allB.length && !isl}
      <div class="bnotice-wrap">
        <div class="label bnlabel"><span>Bounty · optional</span><span>{doneN} of {allB.length} done</span></div>
        {#if !beaten}
          <div class="bnotice locked"><span class="pin" aria-hidden="true"></span><span class="nm">Locked</span><span class="sub">Beat the {M.short} once to open its {allB.length} bounties: extra coin, and rare materials on the hard one.</span></div>
        {:else}
          <button class="bnotice" class:open={!B && openBounties > 0} class:taken={!!B} data-slot="bounty" data-coach="bounties" onclick={() => open('bounty')}>
            <span class="pin" aria-hidden="true"></span>
            {#if B}
              {@const pay = E.bountyPay(game.save, B.id)}
              <span class="bnrow"><span class="nm">{B.name}{#if B.hard}{' '}<span class="tag hard">Hard</span>{/if}</span><span class="chg">Change</span></span>
              <span class="sub">Win, and: {B.goals.map(g => E.goalText(g, mon)).join(' · ')}</span>
              <span class="pay">Pays {pay.coin} coin{#if pay.mat}{' · '}<Icon id={pay.mat} size={16} />{E.matName(pay.mat)}{/if}</span>
              {#if breaks}<span class="bad">{breaks}: change a weapon or it won’t pay.</span>{/if}
            {:else}
              <span class="bnrow"><span class="nm">{openBounties ? `${openBounties} bounties open` : 'All done'}</span><span class="chg">Choose</span></span>
              <span class="sub">{openBounties ? 'Take one for extra coin. Each new one counts toward the bounty charms.' : 'Repeat any of them for half the coin.'}</span>
            {/if}
          </button>
        {/if}
      </div>
    {/if}
  {:else if picker.slot === 'bounty'}
    <div class="picker">
      <div class="pickhead"><h3>Choose a bounty</h3><button class="btn quiet" onclick={close}>Done</button></div>
      <p class="ital" style="margin:0">Optional. Win and meet its goals for extra coin; every new one counts toward the bounty charms.</p>
      <div class="plist one">
        <button class="prow" aria-current={!B} onclick={() => takeB(null)}><span><span class="nm">No bounty{#if !B}<span class="badge">Chosen</span>{/if}</span><span class="ty">Just the hunt.</span></span><span class="num"></span></button>
        {#each allB as b (b.id)}
          {@const done = !!game.save.bounties[b.id]}
          {@const pay = E.bountyPay(game.save, b.id)}
          <button class="prow" aria-current={L.bounty === b.id} onclick={() => takeB(b.id)}>
            <span><span class="nm">{b.name}{#if b.hard}{' '}<span class="tag hard">Hard</span>{/if}{#if L.bounty === b.id}<span class="badge">Chosen</span>{:else if done}<span class="badge">Done</span>{/if}</span>
            <span class="ty">Win, and: {b.goals.map(g => E.goalText(g, mon)).join(' · ')}</span>
            <span class="note"><span class="pay">{pay.coin} coin{#if pay.mat}{' · '}<Icon id={pay.mat} size={16} />{E.matName(pay.mat)}{/if}{pay.repeat ? ' (repeat: half the coin)' : ''}</span></span></span>
            <span class="num"></span>
          </button>
        {/each}
      </div>
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
                <span class="ty">{w.type} · <Elem e={markOf(w)} />{elemLabel(w)}{#each w.moves as m} · <span class="mvl">{#each [...m.need] as c}<CostDie {c} small />{/each} {m.dmg}</span>{/each}</span>
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
        <div class="plisthead"><span>{ids.length} armor</span><span>HP</span><span>Block</span></div>
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
                {#if it.effect === 'thaw'}<span class="note">{#if M.plated && M.plateHot}<span class="bad">Does nothing to burning scales</span>{:else if M.plated}<span class="good">{M.plateWord ? `Cracks the ${M.short}’s ${M.plateWord}` : `Melts the ${M.short}’s ice`}</span>{:else}<span class="bad">Only works on plated monsters</span>{/if}</span>{/if}
                {#if it.effect === 'cureInfect'}<span class="note">{#if M.inflicts === 'Infect'}<span class="good">Cures the {M.short}’s infection</span>{:else}<span class="bad">It doesn’t infect</span>{/if}</span>{/if}
                {#if it.effect === 'cureSpark'}<span class="note">{#if M.inflicts === 'Spark'}<span class="good">Clears the {M.short}’s spark</span>{:else}<span class="bad">It doesn’t spark</span>{/if}</span>{/if}
                {#if it.effect === 'trapRush' || it.effect === 'trapLand'}{@const mv = E.trapMoves(M.id)[it.effect]}<span class="note">{#if mv.length}<span class="good">Catches its {mv.join(', ')}</span>{:else}<span class="bad">The {M.short} has no move this catches</span>{/if}</span>{/if}
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

  <div class="campfoot">
    {#if !E.isUnlocked(game.save, mon)}
      <span class="ital">{E.unlockHint(M.id)} to unlock it.</span>
      <button class="btn primary" disabled>Locked</button>
    {:else}
      <span class="ital">{isl ? (need === 2 && nWeapons < 2 ? 'Take the maul too.' : '') : nWeapons === 2 ? (full() ? 'Swap weapons mid-hunt for 1 die.' : '') : 'Choose two weapons to bring.'}</span>
      <button class="btn primary" data-sound data-coach="begin" disabled={nWeapons !== need} onclick={() => game.begin(coach.scriptFirstHunt())}>Hunt the {M.short}</button>
    {/if}
  </div>
</section>

<style>
  /* the bounty notice: pinned paper, not a gear slot (Mekkman, Nov 2026: a bounty isn't loadout) */
  .bnotice-wrap { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; padding-top: 12px; border-top: 1px dashed var(--line-2); }
  .bnlabel { display: flex; justify-content: space-between; }
  .bnotice { all: unset; box-sizing: border-box; cursor: pointer; position: relative; display: flex; flex-direction: column; gap: 3px; padding: 16px 16px 12px;
    background: linear-gradient(180deg, rgba(236,223,200,.045), rgba(236,223,200,.015)), #241c14; border: 1px dashed #6b5a44; border-radius: 2px;
    box-shadow: 0 3px 0 rgba(0,0,0,.35); transition: border-color .15s; }
  .bnotice:hover, .bnotice:focus-visible { border-color: var(--gold); }
  .bnotice:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
  .bnotice.open { border-color: rgba(233,185,73,.7); }
  .bnotice.taken { border-style: solid; border-color: var(--gold); }
  .bnotice.locked { cursor: default; }
  .bnotice.locked .nm { color: var(--soft); }
  .bnotice .pin { position: absolute; top: -6px; left: 50%; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #f3cf7a, #a87a24 70%); box-shadow: 0 2px 2px rgba(0,0,0,.6); }
  .bnotice .bnrow { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .bnotice .nm { font-weight: 600; font-size: var(--fs-lg); }
  .bnotice.open .nm { color: var(--gold-hi); }
  .bnotice .sub { font-size: var(--fs-sm); color: var(--soft); }
  .bnotice .chg { font-size: var(--fs-sm); color: var(--gold-hi); }
  .bnotice .bad { color: var(--ember-soft); font-size: var(--fs-sm); }
  .pay { color: var(--gold-hi); font-size: var(--fs-sm); }
  .tag.hard { color: var(--ember-soft); border-color: var(--ember-soft); }
  .mvl { display: inline-flex; align-items: center; gap: 3px; }
</style>
