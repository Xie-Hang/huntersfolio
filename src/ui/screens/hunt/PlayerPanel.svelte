<script lang="ts">
  // Your HP, with a ghost segment showing what the telegraphed attack will take off.
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { pct } from '../../fmt';
  import { shake } from '../../fx';

  const h = $derived(game.hunt!);
  const inc = $derived(E.incoming(h));
  const net = $derived(inc ? Math.min(inc.net, h.php) : 0);
  const after = $derived(h.php - net);
  const B = $derived(h.bounty ? E.BOUNTIES[h.bounty] : null);
  const MARK = { met: '✓', failed: '✗', open: '·' } as const;
</script>

<section class="panel" aria-label="Your state" use:shake={game.shakes.player}>
  <div style="display:flex;flex-direction:column;gap:10px">
    <div class="ph">
      <h2>Your HP</h2>
      <span class="mono">{h.php} / {h.pmax}{#if net}{' '}<span style="color:var(--ember-soft)">→ {after}</span>{/if}</span>
    </div>
    <div class="hpbig" role="img" aria-label="{h.php} of {h.pmax} HP{net ? `, about to take ${net}` : ''}">
      <i style="width:{pct(after, h.pmax)}%;background:var(--life)"></i>
      {#if net}<i class="ghost" style="width:{pct(net, h.pmax)}%"></i>{/if}
    </div>
    <div class="pstat">
      <span>{h.arm.name}{h.arm.lv ? ` +${h.arm.lv}` : ''}</span>
      {#if h.charm}<span title={E.CHARMS[h.charm].perk}>{E.CHARMS[h.charm].name}</span>{/if}
      <span>Guard this turn <b>−{h.guard}</b></span>
      {#if h.chargeReady}<span class="gold">Charged: first hit ×2</span>{:else if h.chargePending}<span class="gold">Charging for next turn</span>{/if}
      {#if h.whet}<span class="gold">Sharpened: next hit +{Math.round(h.whet * 100)}%</span>{/if}
      {#if h.evade}<span class="gold">Hidden in smoke</span>{/if}
    </div>
    {#if B}
      <div class="bounty" aria-label="Bounty goals">
        <span class="bn">Bounty · {B.name}</span>
        {#each B.goals as g}{@const st = E.goalState(h, g)}<span class="g {st}"><b aria-hidden="true">{MARK[st]}</b>{E.goalText(g, h.mid)}<span class="sr">{st === 'met' ? ' (done)' : st === 'failed' ? ' (missed)' : ''}</span></span>{/each}
      </div>
    {/if}
  </div>
  <div class="fx">
    {#each game.floats.filter(f => f.at === 'player') as f (f.id)}<span class="float {f.cls}">{f.text}</span>{/each}
  </div>
</section>

<style>
  .bounty { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: var(--fs-sm); color: var(--soft); }
  .bounty .bn { color: var(--gold-hi); font-weight: 600; }
  .bounty .g b { margin-right: 5px; }
  .bounty .met { color: var(--fg); } .bounty .met b { color: var(--life); }
  .bounty .failed { text-decoration: line-through; opacity: .7; } .bounty .failed b { color: var(--ember-soft); }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
