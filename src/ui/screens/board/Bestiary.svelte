<script lang="ts">
  import Elem from '../../parts/Elem.svelte';
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { DAMAGE_TYPES, effName, record } from '../../fmt';
  import Plate from '../../parts/Plate.svelte';

  let { mon }: { mon: string } = $props();
  const M = $derived(E.MONSTERS[mon]);
  const r = $derived(record(game.save, mon));
  const breaks = $derived(Object.values(r.breaks).reduce((a, b) => a + b, 0));
  const mats = $derived([M.common, ...M.parts.map(p => p.mat), M.rare]);
</script>

<div style="display:flex;flex-direction:column;gap:14px">
  <div class="ph"><h2>{M.name}</h2><span class="label">{M.kind} · {E.TIERS[M.tier]}</span></div>
  <div class="plate"><Plate {mon} /></div>
  <div class="record" aria-label="Your record">
    <div><b>{r.hunts}</b><span>Hunts</span></div>
    <div><b>{r.wins}</b><span>Wins</span></div>
    <div><b>{r.captures}</b><span>Captures</span></div>
    <div><b>{breaks}</b><span>Parts broken</span></div>
  </div>
  <div class="trio">
    <div><span>Element</span><b><Elem e={M.elem} />{M.elem}</b></div>
    <div><span>Weakness</span><b class="good"><Elem e={M.weak} />{M.weak} ×1.5</b></div>
    <div><span>Resists</span><b class="bad"><Elem e={M.resist} />{M.resist} ×0.75</b></div>
  </div>
  <dl class="facts">
    <dt>Habits</dt><dd>{M.habits}</dd>
    <dt>Reward</dt><dd><b>{E.REWARD.base} coin</b>, +{E.REWARD.perPart} per part broken, +{E.REWARD.capture} for a capture.</dd>
  </dl>
  <div class="label rule">Breaking parts · damage that counts toward a break</div>
  <div class="etable-wrap">
    <table class="etable">
      <thead><tr><th>Part</th>{#each DAMAGE_TYPES as t}<th>{t}</th>{/each}<th>Drops</th></tr></thead>
      <tbody>
        {#each M.parts as p (p.id)}
          <tr>
            <td style="color:var(--fg)">{p.name}</td>
            {#each DAMAGE_TYPES as t}
              {@const e = p.eff[t]}
              <td class={e >= 1 ? 'b' : e > 0 ? 'h' : 'n'}>{effName(e)}</td>
            {/each}
            <td style="color:var(--soft)">{E.matName(p.mat)}{p.id === M.rarePart ? `, ${E.matName(M.rare)}` : ''}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="label rule">Its materials in your stash</div>
  <div class="stash">
    {#each mats as k (k)}
      {@const tn = E.trackedNeed(game.save, k)}
      <div class="row" class:zero={!game.save.mats[k]}>
        <span>{E.matName(k)}{#if tn}{' '}<span class="need">· {tn}</span>{/if}</span><span class="mono">{game.save.mats[k] ?? 0}</span>
      </div>
    {/each}
  </div>
</div>
