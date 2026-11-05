<script lang="ts">
  import Icon from '../../parts/Icon.svelte';
  // What the monster does when you end your turn; becomes the result card when the hunt ends.
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import Tagged from '../../parts/Tagged.svelte';
  import Elem from '../../parts/Elem.svelte';

  const h = $derived(game.hunt!);
  const M = $derived(E.MONSTERS[h.mid]);
  const info = $derived(E.intentInfo(h));
  const tip = $derived(E.tip(h));
  const inc = $derived(E.incoming(h));
  /** the hint names one of your moves: that move answers what the monster is doing */
  const isCounter = $derived(!!tip && [...E.currentWeapon(h).moves, ...E.otherWeapon(h).moves].some(m => tip!.includes(m.name)));
  /** you're charging and this hit is big enough to break it */
  const breaksCharge = $derived(!!h.chargePending && !!inc && inc.net >= E.CHARGE_BREAK);
  const breaksSnare = $derived(!!h.snareSet && !!inc && inc.net >= E.CHARGE_BREAK);
  const multi = $derived(info.name.includes(' + '));
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
    <button class="btn" data-coach="to-shop" onclick={() => game.go('shop', E.surplusValue(game.save) > 0 ? 'sell' : undefined)}>{E.surplusValue(game.save) > 0 ? 'Sell at the Shop' : 'Shop'}</button>
    <!-- straight back to this monster's page, loadout ready (one click from hunting it again) -->
    <button class="btn" onclick={() => game.openMonster(h.mid)}>Hunt the {M.short} again</button>
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
      {#if E.surplusValue(game.save) > 0}<p class="ital p0">Materials no recipe needs can be sold: yours are worth <b style="color:var(--gold-hi);font-style:normal">{E.surplusValue(game.save)} coin</b> at the Shop.</p>{/if}
      {#if h.mon.parts[M.rarePart].broken && !r.rare}
        <p class="ital p0">No {E.matName(M.rare)} this time. Pity counter: {game.save.pity[M.rare] ?? 0} / {E.RARE.pityGuarantee}.</p>
      {/if}
      {#if r.unlocked?.length}<p class="unlock p0">New hunts unlocked: {r.unlocked.map(id => E.MONSTERS[id].short).join(', ')}.</p>{/if}
      {#if r.bounty}{@const B = E.BOUNTIES[r.bounty.id]}
        {#if r.bounty.met}<p class="unlock p0">Bounty {r.bounty.repeat ? 'repeated' : 'complete'}: {B.name}. +{r.bounty.coin} coin{r.bounty.mat ? `, ${E.matName(r.bounty.mat)}` : ''}.{#if !r.bounty.repeat}{' '}{E.bountiesDone(game.save)} done{/if}{#if r.bounty.unlocked?.length}{' '}Unlocked at the Forge: {r.bounty.unlocked.join(', ')}.{:else if !r.bounty.repeat && E.nextBountyCharm(game.save)}{@const nx = E.nextBountyCharm(game.save)!}{' '}({nx.name} at {nx.need}).{/if}</p>
        {:else}<p class="ital p0">Bounty not met ({B.name}): {(r.bounty.missed ?? "").toLowerCase()}. It stays on your board.</p>{/if}
      {/if}
      {#if r.returned && h.item}<p class="ital p0">{r.returned} unused {E.ITEMS[h.item].name} returned to your stash.</p>{/if}
    {:else}
      <span class="kicker">Hunt failed</span>
      <h2 style="margin:0;font-weight:600">{M.name} wins this one</h2>
      {#if Object.keys(r.mats).length}<div><span class="label">You kept what you broke off</span><ul style="margin-top:6px">{#each Object.entries(r.mats) as [k, v] (k)}<li><Icon id={k} size={18} />{E.matName(k)} ×{v}</li>{/each}</ul></div>{/if}
      <p class="ital p0">It had {h.mon.hp} HP left. No coin.{Object.keys(r.mats).length ? '' : ' No materials: break a part and you keep its material even when a hunt fails.'}{h.item ? ` You lost ${r.lost} ${E.ITEMS[h.item].name} you carried.` : ''}{r.bounty ? ` The ${E.BOUNTIES[r.bounty.id].name} bounty stays on your board.` : ''}</p>
    {/if}
    {@render stats()}
  {:else}
    <div class="ph">
      <span class="kicker">When you end your turn, it will</span>
      <span class="pips" aria-label="Threat {info.threat} of 4"><span class="label" style="margin-right:6px">Threat</span>{#each [1, 2, 3, 4] as n}<i class:f={n <= info.threat}></i>{/each}</span>
    </div>
    <div class="nextline">
      {#if multi}<h3 class="mvname multi">{#each info.name.split(' + ') as n, i}{#if i}<span class="sep" aria-hidden="true">&nbsp;·&nbsp;</span>{/if}<span>{n}</span>{/each}</h3>
      {:else}<h3 class="mvname">{info.name}</h3>{/if}
      {#if inc}
        {#if inc.net}<span class="big" aria-label="{inc.net} damage to you">−{inc.net}</span>{:else}<span class="big safe">{inc.evade ? 'Dodged' : 'Blocked'}</span>{/if}
      {/if}
    </div>
    {#if !multi && !tip}<p class="say">{info.text}</p>{/if}
    {#if inc}
      <div class="calc">
        {#if inc.elem === 0}<b>{inc.raw}</b> physical{#if inc.wearsResist} · <span class="nores">your armor's {E.monElem(h)} resist doesn't apply</span>{/if}
        {:else if inc.phys === 0}<Elem e={E.monElem(h)} /><b>{inc.raw}</b> {E.monElem(h)}{#if inc.res} · resisted by your armor → <b>{inc.after}</b>{/if}
        {:else}<b>{inc.phys}</b> physical + <Elem e={E.monElem(h)} /><b>{inc.elem}</b> {E.monElem(h)}{#if inc.res} · {E.monElem(h)} part resisted → <b>{inc.after}</b>{/if}{/if}{#if inc.evade} · smoke: <b>misses</b>{:else if h.guard} · − <b>{inc.g}</b> guard{inc.half ? ' (halved)' : ''}{/if}{#if !inc.evade && inc.net && inc.noGuard} · <span class="nores">guard can’t stop it</span>{:else if !inc.evade && inc.net} · <span style="color:var(--muted)">guard dice to reduce{inc.half ? ' (half as well)' : ''}</span>{/if}
      </div>
    {/if}
    {#if info.note || info.steady || breaksCharge || breaksSnare}<div class="note">{[info.note, info.steady && E.carries(h, 'Blunt') ? 'Daze can\'t cancel it' : null, breaksCharge ? `This hit breaks your charge (${E.CHARGE_BREAK}+)` : null, breaksSnare ? `This hit tears it free of your snare: guard it under ${E.CHARGE_BREAK}` : null].filter(Boolean).join(' · ')}</div>{/if}
    {#if tip}<div class="answer" class:counter={isCounter}><b>{isCounter ? 'Counter:' : 'Tip:'}</b> <Tagged text={tip} /></div>{/if}
  {/if}
</section>

<style>
  .nextline { display: flex; justify-content: space-between; align-items: baseline; gap: 6px 14px; flex-wrap: wrap; }
  .mvname.multi { font-size: var(--fs-lg); }
  .mvname .sep { color: var(--muted); }
  .mvname { margin: 0; font-family: var(--f-body); font-weight: 600; font-size: var(--fs-xl); line-height: 1.1; color: var(--fg); text-wrap: balance; }
  .big { font-family: var(--f-body); font-variant-numeric: tabular-nums; font-size: var(--fs-xl); line-height: 1; font-weight: 600; color: var(--ember-soft); }
  .big.safe { color: var(--gold-hi); }
  .calc { font-family: var(--f-body); font-size: var(--fs-sm); color: var(--soft); }
  .calc b { color: var(--fg); font-weight: 600; }
  .calc .nores { color: var(--ember-soft); }
  .answer { padding: 6px 10px; border: 1px solid var(--line-2); border-radius: 3px; background: var(--raise); font-size: var(--fs-sm); line-height: 1.35; color: var(--fg); }
  .answer.counter { border-color: var(--gold); }
  .answer b { color: var(--gold-hi); font-weight: 600; }
  .note { font-family: var(--f-body); font-size: var(--fs-sm); line-height: 1.35; color: var(--gold-hi); }
</style>
