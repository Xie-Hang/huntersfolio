<script lang="ts">
  import Icon from '../../parts/Icon.svelte';
  // What the monster does when you end your turn; becomes the result card when the hunt ends.
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import Tagged from '../../parts/Tagged.svelte';

  const h = $derived(game.hunt!);
  const M = $derived(E.MONSTERS[h.mid]);
  const info = $derived(E.intentInfo(h));
  const tip = $derived(E.tip(h));
  const inc = $derived(E.incoming(h));
  const cls = $derived(h.over ? 'end' : info.threat >= 3 ? 'danger' : info.threat === 0 ? 'calm' : '');
</script>

{#snippet stats()}
  <div class="stats">
    <span>Turns <b>{h.turn}</b></span><span>Damage dealt <b>{h.stats.dealt}</b></span>
    <span>Damage taken <b>{h.stats.taken}</b></span><span>Damage blocked <b>{h.stats.guarded}</b></span>
    <span>Parts broken <b>{h.stats.broken} / {M.parts.length}</b></span><span>Rerolls used <b>{h.stats.rerollsUsed}</b></span>
  </div>
  <div style="display:flex;gap:10px;flex-wrap:wrap">
    <button class="btn primary" data-coach="to-forge" onclick={() => game.go('forge')}>Go to the Forge</button>
    <button class="btn" onclick={() => game.go('shop')}>Shop</button>
    <button class="btn" onclick={() => game.go('board')}>Hunt Board</button>
  </div>
{/snippet}

<section class="panel tele {cls}" data-coach="tele" aria-live="polite">
  {#if h.over && h.reward}
    {@const r = h.reward}
    {#if h.over === 'win'}
      <span class="kicker" style="color:var(--gold-hi)">{h.captured ? 'Captured' : 'Slain'}</span>
      <h2 style="margin:0;font-weight:600">{M.name} is {h.captured ? 'captured' : 'down'}</h2>
      <span class="coin">+{r.coin} coin</span>
      <div>
        <span class="label">Materials</span>
        <ul style="margin-top:6px">
          {#each Object.entries(r.mats) as [k, v] (k)}<li class:rare={k === M.rare}><Icon id={k} size={18} />{E.matName(k)} ×{v}</li>{/each}
        </ul>
      </div>
      {#if h.mon.parts[M.rarePart].broken && !r.rare}
        <p class="ital p0">No {E.matName(M.rare)} this time. Pity counter: {game.save.pity[M.rare] ?? 0} / {E.RARE.pityGuarantee}.</p>
      {/if}
      {#if r.unlocked?.length}<p class="unlock p0">New hunts unlocked: {r.unlocked.map(id => E.MONSTERS[id].short).join(', ')}.</p>{/if}
      {#if r.bounty}{@const B = E.BOUNTIES[r.bounty.id]}
        {#if r.bounty.met}<p class="unlock p0">Bounty complete: {B.name}. +{r.bounty.coin} coin, +{r.bounty.seals} Hunter’s Seal{r.bounty.seals > 1 ? 's' : ''}{r.bounty.mat ? `, ${E.matName(r.bounty.mat)}` : ''}.</p>
        {:else}<p class="ital p0">Bounty not met ({B.name}): {(r.bounty.missed ?? "").toLowerCase()}. It stays on your board.</p>{/if}
      {/if}
      {#if r.returned && h.item}<p class="ital p0">{r.returned} unused {E.ITEMS[h.item].name} returned to your stash.</p>{/if}
    {:else}
      <span class="kicker">Hunt failed</span>
      <h2 style="margin:0;font-weight:600">{M.name} wins this one</h2>
      <p class="ital p0">It had {h.mon.hp} HP left. No coin or materials.{h.item ? ` You lost ${r.lost} ${E.ITEMS[h.item].name} you carried.` : ''}{r.bounty ? ` The ${E.BOUNTIES[r.bounty.id].name} bounty stays on your board.` : ''}</p>
    {/if}
    {@render stats()}
  {:else}
    <div class="ph">
      <span class="kicker">When you end your turn</span>
      <span class="pips" aria-label="Threat {info.threat} of 4"><span class="label" style="margin-right:6px">Threat</span>{#each [1, 2, 3, 4] as n}<i class:f={n <= info.threat}></i>{/each}</span>
    </div>
    <p class="say">{info.text}</p>
    {#if inc}
      <div class="incoming">
        <div style="display:flex;flex-direction:column;gap:4px">
          <span class="label">Incoming damage</span>
          {#if inc.net}<span class="big">−{inc.net}</span>{:else}<span class="big safe">{inc.evade ? 'Dodged' : 'Fully blocked'}</span>{/if}
        </div>
        <div class="calc">
          <b>{inc.raw}</b> {M.elem}
          {#if inc.res}<br />Resisted → <b>{inc.after}</b>{/if}
          {#if inc.evade}<br />Smoke: <b>misses</b>{:else if h.guard}<br />− <b>{inc.g}</b> guard{inc.half ? ' (halved)' : ''}{/if}
          {#if !inc.evade && inc.net}<br /><span style="color:var(--muted)">Guard dice to reduce{inc.half ? ' (half as well)' : ''}</span>{/if}
        </div>
      </div>
    {/if}
    {#if tip}<div class="tip"><Tagged text={tip} /></div>{/if}
    {#if E.canCapture(h)}<div class="tip capture">It's weak enough to capture. Select 2 dice and use Capture for double part materials.</div>{/if}
    <div class="meta"><span style="color:var(--fg)">{info.name}</span>{#if info.note}<span>{info.note}</span>{/if}</div>
  {/if}
</section>
