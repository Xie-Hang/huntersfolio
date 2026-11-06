<script lang="ts">
  // Your HP, with a ghost segment showing what the telegraphed attack will take off.
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { pct } from '../../fmt';
  import { shake } from '../../fx';

  const h = $derived(game.hunt!);
  // where your HP will be when your next turn starts: the attack and everything riding on the end of the turn
  const tp = $derived(E.turnPreview(h));
  const after = $derived(tp ? Math.max(0, Math.min(h.php, tp.hpAfter)) : h.php);
  const net = $derived(h.php - after);
</script>

<section class="panel" data-coach="you" aria-label="Your state" use:shake={game.shakes.player}>
  <div style="display:flex;flex-direction:column;gap:8px">
    <div class="youline">
      <h2 class="you">You</h2>
      <div class="hpbig" role="img" aria-label="{h.php} of {h.pmax} HP{net ? `, about to take ${net}` : ''}">
        <i style="width:{pct(after, h.pmax)}%;background:var(--life)"></i>
        {#if net}<i class="ghost" style="width:{pct(net, h.pmax)}%"></i>{/if}
      </div>
      <span class="mono">{h.php} / {h.pmax}{#if net}{' '}<span style="color:var(--ember-soft)">→ {after}</span>{/if}</span>
    </div>
    <div class="statrow">
      <div class="pstat">
      <span>{h.arm.name}{h.arm.lv ? ` +${h.arm.lv}` : ''}</span>
      {#if h.charm}<span title={E.CHARMS[h.charm].perk}>{E.CHARMS[h.charm].name}</span>{/if}
      <span>Guard this turn <b>{h.guard ? `−${h.guard}` : 'none'}</b>{#if h.arm.ward} · armor <b>−{h.arm.ward}</b> a hit{/if}</span>
      {#if h.chargeReady}<span class="gold">Charged: first hit ×2</span>{:else if h.chargePending}<span class="gold">Charging for next turn</span>{/if}
      {#if h.whet}<span class="gold">Sharpened: next hit +{Math.round(h.whet * 100)}%</span>{/if}
      {#if h.evade}<span class="gold">Hidden in smoke</span>{/if}
      {#if (h.mon.pInf ?? 0) > 0}<span class="bad inf" title="You lose this much at the end of each turn. It can’t knock you out on its own. A Purging Tonic cures it.">Infected −{h.mon.pInfDmg} · {h.mon.pInf} turn{h.mon.pInf! > 1 ? 's' : ''}</span>{/if}
      {#if (h.mon.pSpark ?? 0) > 0}<span class="bad spk" title="At {E.SPARK_CAP} the charge goes off through you, and guard can’t stop it. Any Blunt move grounds a pip; Grounding Salt clears them.">Spark {h.mon.pSpark} of {E.SPARK_CAP}</span>{/if}
    </div>
    </div>
  </div>
  <div class="fx">
    {#each game.floats.filter(f => f.at === 'player') as f (f.id)}<span class="float {f.cls}">{f.text}</span>{/each}
  </div>
</section>

<style>
  .pstat .bad { font-weight: 700; } .pstat .inf { color: #9fc062; } .pstat .spk { color: #f0dd6e; }
  .statrow { display: flex; flex-wrap: wrap; gap: 4px 18px; align-items: baseline; justify-content: space-between; }
  .youline { display: flex; align-items: center; gap: 14px; }
  .youline .hpbig { flex: 1; }
  .youline .mono { white-space: nowrap; }
  .you { font-size: var(--fs-lg); margin: 0; line-height: 1; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
