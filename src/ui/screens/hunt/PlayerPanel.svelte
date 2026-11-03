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
  </div>
  <div class="fx">
    {#each game.floats.filter(f => f.at === 'player') as f (f.id)}<span class="float {f.cls}">{f.text}</span>{/each}
  </div>
</section>
