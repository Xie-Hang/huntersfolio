<script lang="ts">
  import Icon from '../../parts/Icon.svelte';
  // What the monster does when you end your turn; becomes the result card when the hunt ends.
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import Tagged from '../../parts/Tagged.svelte';
  import Rich from '../../parts/Rich.svelte';
  import { stop } from '../../fmt';
  import Elem from '../../parts/Elem.svelte';
  import RankMedal from '../../parts/RankMedal.svelte';
  import Modal from '../../parts/Modal.svelte';
  import { shows } from '../../reveal';
  let logOpen = $state(false);

  const h = $derived(game.hunt!);
  const M = $derived(E.MONSTERS[h.mid]);
  const info = $derived(E.intentInfo(h));
  const tip = $derived(E.tip(h));
  const inc = $derived(E.incoming(h));
  // the whole end of the turn, played out on a copy: the attack plus what rides on it (Spark, slime, infection, charged dice)
  const tp = $derived(E.turnPreview(h));
  const total = $derived((inc?.net ?? 0) + (tp?.extra ?? 0));
  /** the hint names one of your moves: that move answers what the monster is doing */
  const isCounter = $derived(!!tip && [...E.currentWeapon(h).moves, ...E.otherWeapon(h).moves].some(m => tip!.includes(m.name)));
  /** you're charging and this hit is big enough to break it */
  const breaksCharge = $derived(!!h.chargePending && !!inc && inc.net > 0);
  const breaksSnare = $derived(!!h.snareSet && !!inc && inc.net >= E.CHARGE_BREAK);
  const multi = $derived(info.name.includes(' + '));
  const cls = $derived(h.over ? 'end' : info.threat >= 3 ? 'danger' : info.threat === 0 ? 'calm' : '');
  const full = $derived(shows(h, 'all'));
  /** the Forge is the next step only from the second hunt on, and only when something there can be made */
  const town = $derived(E.islandTown(game.save));
  const forgeNext = $derived(town === 'forge' || (!town && E.islandDone(game.save) && game.save.hunts > 1 && E.forgeOpen(game.save) && E.forgeReady(game.save)));
  /** the breakdown line only says something the big number doesn't (Nov 2026 playtest: "wordy"): armor resist, guard,
   *  halving, a split element. A plain physical hit with nothing on it gets no line at all. */
  const calcWorth = $derived(!!inc && (inc.wearsResist || inc.res || inc.phys > 0 && inc.elem > 0 || inc.elem > 0 || !!h.guard || !!inc.ward || inc.half || inc.noGuard || (inc.evade && !E.trapCatches(h.trapSet, h.intent))));
  /** last turn, in one line: what you dealt, then what it did (the rest is in the full log) */
  const recap = $derived(!h.over && h.recap && h.recap.turn === h.turn - 1 ? h.recap : null);
</script>

{#snippet stats()}
  {#if full}<details class="hstats"><summary>Hunt stats</summary><div class="stats">
    <span>Turns <b>{h.turn}</b></span><span>Damage dealt <b>{h.stats.dealt}</b></span>
    <span>Damage taken <b>{h.stats.taken}</b></span><span>Damage blocked <b>{h.stats.guarded}</b></span>
    <span>Parts broken <b>{h.stats.broken} / {M.parts.length}</b></span><span>Rerolls used <b>{h.stats.rerollsUsed}</b></span>
  </div></details>{/if}
  <div style="display:flex;gap:10px;flex-wrap:wrap">
    <!-- one clear next step (Nov 2026 playtest: the first win led straight into "more info"): the Forge is the gold
         button only when something there can be made; otherwise it's the Hunt Board, where new hunts are waiting -->
    {#if forgeNext}<button class="btn primary" data-coach="to-forge" onclick={() => game.go('forge')}>Go to the Forge</button>
    {:else if town === 'shop'}<button class="btn primary" data-coach="to-shop" onclick={() => game.go('shop')}>Go to the Shop</button>
    {:else if !E.islandDone(game.save) && game.save.loadout.target !== h.mid}<button class="btn primary" data-coach="to-next" onclick={() => game.openMonster(game.save.loadout.target)}>Next: the {E.MONSTERS[game.save.loadout.target].short}</button>
    {:else}<button class="btn primary" onclick={() => game.go('board')}>Hunt Board</button>{/if}
    {#if game.save.hunts > 1 && E.shopOpen(game.save) && town !== 'shop' && E.islandDone(game.save)}<button class="btn" data-coach="to-shop" onclick={() => game.go('shop', E.surplusValue(game.save) > 0 ? 'sell' : undefined)}>{E.surplusValue(game.save) > 0 ? 'Sell at the Shop' : 'Shop'}</button>{/if}
    <!-- straight back to this monster's page, loadout ready (one click from hunting it again) -->
    <button class="btn" onclick={() => game.openMonster(h.mid)}>Hunt the {M.short} again</button>
    {#if forgeNext}<button class="btn" onclick={() => game.go('board')}>Hunt Board</button>
    {:else if E.islandDone(game.save) && E.forgeOpen(game.save) && E.forgeReady(game.save)}<button class="btn" data-coach="to-forge" onclick={() => game.go('forge')}>Forge</button>{/if}
  </div>
{/snippet}

<section class="panel tele {cls}" data-coach="tele" aria-live="polite">
  {#if h.over && h.reward}
    {@const r = h.reward}
    {#if h.over === 'win'}
      <span class="kicker" style="color:var(--gold-hi)">{h.captured ? 'Captured' : 'Slain'}</span>
      <h2 style="margin:0;font-weight:600">{M.name} is {h.captured ? 'captured' : 'down'}</h2>
      {#if r.rankUp}
        <!-- the rank-up moment: only when the hunt actually changed your rank, and new hunts are promised only if some opened -->
        <div class="promoted" role="status"><RankMedal rank={r.rankUp} size={52} /><span><b>Promoted!</b> You're now a rank {r.rankUp} hunter.{r.unlocked?.length ? ' New hunts are open on the Hunt Board.' : r.rankUp === 'C' ? ' Low Rank is yours.' : ''}</span></div>
      {/if}
      <span class="coin">+{r.coin} coin</span>
      <div>
        <span class="label">Materials</span>
        <ul class="mats" style="margin-top:6px">
          {#each Object.entries(r.mats) as [k, v], i (k)}<li class:rare={k === M.rare} style="--i:{i}"><Icon id={k} size={18} />{E.matName(k)} ×{v}</li>{/each}
        </ul>
      </div>
      {#if full && E.surplusValue(game.save) > 0}<p class="ital p0">Materials no recipe needs sell at the Shop. Yours are worth <b style="color:var(--gold-hi);font-style:normal">{E.surplusValue(game.save)} coin</b>.</p>{/if}
      {#if full && h.mon.parts[M.rarePart].broken && !r.rare}
        <p class="ital p0">No {E.matName(M.rare)} this time. {game.save.pity[M.rare] ?? 0} of {E.RARE.pityGuarantee} breaks toward a sure drop.</p>
      {/if}
      {#if r.unlocked?.length}<p class="unlock p0">New hunts unlocked: {r.unlocked.map(id => E.MONSTERS[id].short).join(', ')}.</p>{/if}
      {#if r.bounty}{@const B = E.BOUNTIES[r.bounty.id]}
        {#if r.bounty.met}<p class="unlock p0">Bounty {r.bounty.repeat ? 'repeated' : 'complete'}: {B.name}. +{r.bounty.coin} coin{r.bounty.mat ? `, ${E.matName(r.bounty.mat)}` : ''}.{#if !r.bounty.repeat}{' '}{E.bountiesDone(game.save)} done{/if}{#if r.bounty.unlocked?.length}{' '}Unlocked at the Forge: {r.bounty.unlocked.join(', ')}.{:else if !r.bounty.repeat && E.nextBountyCharm(game.save)}{@const nx = E.nextBountyCharm(game.save)!}{' '}({nx.name} at {nx.need}).{/if}</p>
        {:else}<p class="ital p0">Bounty not met, {B.name}. <Rich text={r.bounty.missed ?? ""} />. It stays on your board.</p>{/if}
      {/if}
      {#if r.returned && h.item && shows(h, 'item')}<p class="ital p0">{r.returned} unused {E.ITEMS[h.item].name} returned to your stash.</p>{/if}
    {:else}
      <span class="kicker">Hunt failed</span>
      <h2 style="margin:0;font-weight:600">{M.name} wins this one</h2>
      {#if Object.keys(r.mats).length}<div><span class="label">You kept what you broke off</span><ul style="margin-top:6px">{#each Object.entries(r.mats) as [k, v] (k)}<li><Icon id={k} size={18} />{E.matName(k)} ×{v}</li>{/each}</ul></div>{/if}
      {#if E.lossFacts(h, game.save).length}
        <!-- facts about this monster against the gear you brought (no-handholding: never what to bring) -->
        <div class="facts-after"><span class="label">What you learned</span><ul>{#each E.lossFacts(h, game.save) as f}<li><Rich text={f} /></li>{/each}</ul></div>
      {/if}
      <p class="ital p0">It had {h.mon.hp} HP left. No coin.{Object.keys(r.mats).length ? '' : ' No materials: break a part and you keep its material even when a hunt fails.'}{h.item ? ` You lost ${r.lost} ${E.ITEMS[h.item].name} you carried.` : ''}{r.bounty ? ` The ${E.BOUNTIES[r.bounty.id].name} bounty stays on your board.` : ''}</p>
    {/if}
    {@render stats()}
  {:else}
    <div class="ph">
      <span class="kicker">{M.short}’s next move</span>
      
    </div>
    <div class="nextline">
      {#if multi}<h3 class="mvname multi">{#each info.name.split(' + ') as n, i}{#if i}<span class="sep" aria-hidden="true">&nbsp;·&nbsp;</span>{/if}<span>{n}</span>{/each}</h3>
      {:else}<h3 class="mvname">{info.name}{#if info.isNew}<span class="newmove">New move</span>{/if}</h3>{/if}
      {#if inc || tp?.extra}
        {#if total}<span class="big" aria-label="{total} damage to you this turn">−{total}</span>{:else}<span class="big safe">{E.trapCatches(h.trapSet, h.intent) ? 'Trapped' : inc?.evade ? 'Missed' : 'Blocked'}</span>{/if}
      {/if}
    </div>
    {#if !multi && !tip}<p class="say">{info.text}</p>{/if}
    {#if inc && !full}
      {#if inc.net && !inc.noGuard}{#if shows(h, 'block')}<div class="calc"><b>Block</b> takes some off.</div>{/if}{:else if inc.noGuard && inc.net}<div class="calc"><span class="nores">Goes through <b>Block</b>.</span></div>{/if}
    {:else if inc && calcWorth}
      <div class="calc">
        {#if inc.elem === 0}<b>{inc.raw}</b> physical{#if inc.wearsResist} <span class="nores">(resist is only for <b>{E.monElem(h)}</b>)</span>{/if}
        {:else if inc.phys === 0}<Elem e={E.monElem(h)} />{E.monElem(h)} <b>{inc.raw}</b>{#if inc.res} − your resist → <b>{inc.after}</b>{/if}
        {:else}<b>{inc.phys}</b> physical + <Elem e={E.monElem(h)} />{E.monElem(h)} <b>{inc.elem}</b>{#if inc.res} − your resist → <b>{inc.after}</b>{/if}{/if}{#if inc.evade && !E.trapCatches(h.trapSet, h.intent)} · <b>Smoke</b>, it misses{:else if h.guard} · − <b>{inc.g}</b> block{inc.half ? ' (½)' : ''}{/if}{#if !inc.evade && inc.ward} · − <b>{inc.ward}</b> armour{/if}{#if !inc.evade && inc.net && inc.noGuard}. <span class="nores">Goes through <b>Block</b>.</span>{:else if !inc.evade && inc.net && inc.half} · <span style="color:var(--muted)"><b>Block</b> is ½</span>{/if}
      </div>
    {/if}
    {#if tp?.extra}<div class="calc rider">+<b>{tp.extra}</b> at turn end from <Rich text={tp.why.join(' and ')} />. <span class="nores">Goes through <b>Block</b>.</span></div>{/if}
    {#if E.trapCatches(h.trapSet, h.intent)}<div class="calc rider" style="color:var(--gold-hi)">Your {(E.ITEMS[h.item ?? '']?.name ?? 'trap')} catches it. No hit, and it loses {E.TRAP_HOLD[h.trapSet!]} turns{E.canCapture(h) ? '. It’s weak enough, so it’s captured' : ''}.</div>{:else if h.trapSet}<div class="calc rider"><span class="nores">Your {(E.ITEMS[h.item ?? '']?.name ?? 'trap')} is wasted on this move.</span></div>{/if}
    {#if info.note || info.steady || breaksCharge || breaksSnare}<div class="note"><Rich text={[info.note, info.steady && E.carries(h, 'Blunt') ? 'Goes through **Daze**' : null, breaksCharge ? 'This hit breaks your **Charge**' : null, breaksSnare ? 'This hit tears it free of your **Snare**' : null].filter(Boolean).map(t => stop(t!)).join(' ')} /></div>{/if}
    {#if tip}<div class="answer" class:counter={isCounter}><b>{isCounter ? 'Counter:' : 'Tip:'}</b> <Tagged text={stop(tip)} /></div>{/if}
    {#if recap}
      <div class="recap">
        <span class="label">Last turn</span>
        <span class="rt">{#if recap.dealt}You dealt <b>{recap.dealt}</b>.{' '}{/if}{#each recap.lines.slice(0, 2) as l}<span class="rl {l.tone}"><Tagged text={l.t} /></span>{' '}{/each}</span>
        <button class="linkbtn" onclick={() => (logOpen = true)}>Full log</button>
      </div>
    {/if}
  {/if}
</section>

<Modal bind:open={logOpen} title="Hunt log">
  <ul class="log full">{#each h.log as l}<li class={l.tone}><Tagged text={l.t} /></li>{/each}</ul>
</Modal>

<style>
  /* an enraged monster's new move, the first time it comes */
  .newmove { display: inline-block; margin-left: 10px; padding: 2px 8px; vertical-align: middle; font-size: 12px; font-weight: 600; letter-spacing: .04em; color: var(--ember); border: 1.5px solid var(--ember); border-radius: 3px; }
  .recap { display: flex; gap: 6px 12px; align-items: baseline; flex-wrap: wrap; padding-top: 8px; border-top: 1px solid var(--line); font-size: var(--fs-sm); color: var(--soft); }
  .recap .rt { flex: 1 1 200px; min-width: 0; }
  .recap b { color: var(--fg); font-weight: 600; }
  .recap .rl.ember { color: var(--ember-soft); } .recap .rl.gold { color: var(--gold-hi); }
  .recap .linkbtn { font-size: var(--fs-sm); }
  .log.full { max-height: 60vh; }
  .hstats summary { cursor: pointer; color: var(--soft); font-size: var(--fs-sm); width: max-content; }
  .hstats[open] summary { margin-bottom: 6px; }
  .facts-after ul { margin: 6px 0 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; color: var(--fg); }
  .facts-after li::marker { color: var(--gold); }
  .promoted { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--gold); border-radius: 3px; background: rgba(233,185,73,.08); color: var(--fg); }
  .promoted b { color: var(--gold-hi); }
  .nextline { display: flex; justify-content: space-between; align-items: baseline; gap: 6px 14px; flex-wrap: wrap; }
  .mvname.multi { font-size: var(--fs-lg); }
  .mvname .sep { color: var(--muted); }
  .mvname { margin: 0; font-family: var(--f-body); font-weight: 600; font-size: var(--fs-xl); line-height: 1.1; color: var(--fg); text-wrap: balance; }
  .big { font-family: var(--f-body); font-variant-numeric: tabular-nums; font-size: var(--fs-xl); line-height: 1; font-weight: 600; color: var(--ember-soft); }
  .big.safe { color: var(--gold-hi); }
  .calc { font-family: var(--f-body); font-size: var(--fs-sm); color: var(--soft); }
  .calc b { color: var(--fg); font-weight: 600; }
  .calc .nores { color: var(--ember-soft); }
  .calc .nores b { color: inherit; font-weight: 700; }
  .answer { padding: 6px 10px; border: 1px solid var(--line-2); border-radius: 3px; background: var(--raise); font-size: var(--fs-sm); line-height: 1.35; color: var(--fg); }
  .answer.counter { border-color: var(--gold); }
  .answer b { color: var(--gold-hi); font-weight: 600; }
  .note { font-family: var(--f-body); font-size: var(--fs-sm); line-height: 1.35; color: var(--gold-hi); }
</style>
