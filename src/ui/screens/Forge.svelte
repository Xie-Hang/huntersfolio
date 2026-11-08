<script lang="ts">
  import Rich from '../parts/Rich.svelte';
  import CostDie from '../parts/CostDie.svelte';
  import Icon from '../parts/Icon.svelte';
  import WeaponArt from '../parts/WeaponArt.svelte';
  // List-detail: upgrade trees on the left, the selected recipe on the right.
  import Elem from '../parts/Elem.svelte';
  import * as E from '../../engine';
  import { game } from '../game.svelte';
  import { settings } from '../settings.svelte';
  import { glyphs, needLabel, elemLabel, markOf } from '../fmt';
  import Costs from '../parts/Costs.svelte';
  import { tick } from 'svelte';
  import { full, detail } from '../detail.svelte';

  type Tab = 'weapons' | 'armor' | 'charms';
  // the tab and the selected recipe live on `game` so the Foothills' prompts can point at the right thing
  const tab = $derived<Tab>(game.forgeTab);
  let ftype = $state<'All' | E.DamageType>('All');
  let readyOnly = $state(false);
  let chosen = $state<Record<Tab, string | null>>({ weapons: null, armor: null, charms: null });
  let toast = $state('');
  let detailEl: HTMLElement;

  const kind = $derived<E.RecipeKind>(tab === 'weapons' ? 'w' : tab === 'armor' ? 'a' : 'c');
  const s = $derived(game.save);

  // the Foothills (the tutorial island): the Forge holds one recipe, the Hunter's Blade, and nothing else yet
  const isl = $derived(!E.islandDone(game.save));
  /** charms show once they're taught (Mekkman, 8 Nov 2026): the Ridge's charm lesson fires when one can be made, so the
   *  tab appears then; with tips off, or once you own one, it's always there */
  const charmsOpen = $derived(!isl && (!settings.prefs.tips || Object.keys(s.charms).length > 0 || s.tips.includes('charmNew') || s.tips.includes('i-begin')
    || Object.keys(E.CHARMS).some(id => { const r = E.recipeOf(s, 'c', id); return r.action === 'craft' && !!r.cost && E.canPay(s, r.cost); })));
  /** the island's Forge grows tabs once it holds armor (step 8) */
  const isTabs = $derived(isl && E.islandForge(s).a.length > 0);
  const groups = $derived.by(() => {
    if (isl) { const ids = E.islandForge(s)[kind]; return ids.length ? [{ group: 'The Foothills', sig: null, rows: ids.map(id => ({ id, depth: 0 })), folded: 0 }] : []; }
    // (the Foothills' own gear isn't listed after the island: it's made there only, Nov 2026)
    const raw = tab === 'weapons'
      ? [...E.TREES.filter(t => ftype === 'All' || t.type === ftype).map(t => ({ group: t.type as string, sig: E.SIGNATURES[t.type], rows: t.nodes.map(([id, depth]) => ({ id, depth })) }))]
      // armor and charms: grouped by the region they come from, shown as a grid of tiles (Mekkman, Nov 2026)
      : byRegion(Object.values(tab === 'armor' ? E.ARMORS : E.CHARMS).filter(g => !g.foothills));
    return raw
      .map(g => ({ ...g, rows: g.rows.filter(r => !readyOnly || E.recipeState(s, kind, r.id).cls === 'ready') }))
      .map(g => fold(g))
      .filter(g => g.rows.length || g.folded);
  });
  /** Nov 2026 text audit: a line shows what you own and its next step; the rest of the line, and gear from monsters
   *  you haven't hunted, folds into "+N more" (a click opens it in place). Text detail: Full shows everything. */
  let opened = $state<Record<string, boolean>>({});
  function fold<G extends { group: string; rows: { id: string; depth: number }[] }>(g: G): G & { folded: number } {
    if (full() || readyOnly || opened[`${tab}:${g.group}`]) return { ...g, folded: 0 };
    const keep = g.rows.filter(r => {
      if (E.isOwned(s, kind, r.id) || s.tracked === `${kind}:${r.id}`) return true;
      if (!E.gearKnown(s, kind, r.id)) return false;
      const from = kind === 'w' ? E.WEAPONS[r.id].from : undefined;
      return !from || !!s.weapons[from]; // the next step: its parent is yours (or it starts a line)
    });
    return { ...g, rows: keep, folded: g.rows.length - keep.length };
  }
  function byRegion(defs: { id: string; tier?: number }[]) {
    const out: { group: string; sig: null; rows: { id: string; depth: number }[] }[] = [];
    for (const d of defs) {
      const g = (d as { bounties?: number }).bounties ? 'Bounty board' : (E.TIERS[d.tier ?? 1] ?? 'Other').replace(/^Tier \d · /, '');
      let grp = out.find(x => x.group === g); if (!grp) out.push(grp = { group: g, sig: null, rows: [] });
      grp.rows.push({ id: d.id, depth: 0 });
    }
    // the bounty-board charms last: they come from the board, not a region
    return out.sort((a, b) => +(a.group === 'Bounty board') - +(b.group === 'Bounty board'));
  }
  const visible = $derived(groups.flatMap(g => g.rows.map(r => r.id)));
  // (on the island the newest recipe is the one to look at)
  const sel = $derived(visible.includes(chosen[tab] ?? '') ? chosen[tab] : (isl ? visible[visible.length - 1] : visible[0]) ?? null);
  $effect(() => { game.forgeSel = sel; });

  const lvHere = (id: string) => (kind === 'w' ? E.lvOf(s.weapons, id) : kind === 'a' ? E.lvOf(s.armors, id) : 0);
  /** Level a weapon would have: its own if owned, else the level it inherits from its parent. */
  const wLevel = (id: string) => (s.weapons[id] ? E.lvOf(s.weapons, id) : E.WEAPONS[id].from ? E.lvOf(s.weapons, E.WEAPONS[id].from!) : 0);

  async function pick(id: string) {
    chosen[tab] = id; toast = '';
    if (window.innerWidth <= 900) { await tick(); detailEl?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }
  }
  function doIt() { if (sel) toast = game.town(sv => E.forgeDo(sv, kind, sel), 'forge') ?? ''; }
  function track() {
    if (!sel) return;
    const tk = `${kind}:${sel}`;
    s.tracked = s.tracked === tk ? null : tk;
    game.persist();
    toast = s.tracked ? 'Tracking. Its materials are flagged on the Hunt Board and in the Shop.' : 'Stopped tracking.';
  }
  function setTab(t: Tab) { game.forgeTab = t; toast = ''; }
</script>

<div class="forgegrid" class:wide={tab !== 'weapons'}>
  <section class="panel forgepanel" aria-label="Forge">
    <div class="ph"><h2>The Forge</h2><span class="label">{E.trackedLine(s)}</span></div>
    {#if !isl || isTabs}
    <div class="tabs" role="tablist">
      <button role="tab" data-coach="tab-weapons" aria-selected={tab === 'weapons'} onclick={() => setTab('weapons')}>Weapons</button>
      <button role="tab" data-coach="tab-armor" aria-selected={tab === 'armor'} onclick={() => setTab('armor')}>Armour</button>
      {#if charmsOpen}<button role="tab" data-coach="tab-charms" aria-selected={tab === 'charms'} onclick={() => setTab('charms')}>Charms</button>{/if}
    </div>
    {/if}
    {#if !isl}
    <div class="pickbar">
      <div class="filters">
        {#if tab === 'weapons'}
          {#each ['All', 'Cut', 'Blunt', 'Pierce'] as const as t}
            <button aria-pressed={ftype === t} onclick={() => (ftype = t)}>{t}</button>
          {/each}
        {/if}
      </div>
      <label class="label readyto"><input type="checkbox" bind:checked={readyOnly} /> Ready to make</label>
    </div>
    {/if}
    <div class="flist">
      {#each groups as g (g.group)}
        <div class="fgroup"><span>{g.group}</span>{#if g.sig}<span class="tag {g.sig.tag}" style="margin:0">{g.sig.name}</span>{/if}</div>
        {#if kind !== 'w'}
          <div class="ftiles">
            {#each g.rows as r (r.id)}
              {@const d = E.gearDef(kind, r.id)}
              {@const st = E.recipeState(s, kind, r.id)}
              {@const lv = lvHere(r.id)}
              <button class="ftile" data-coach="row-{r.id}" aria-current={sel === r.id} onclick={() => pick(r.id)}>
                <span class="ft-nm">{#if kind === 'c'}<Icon id={r.id} size={20} />{/if}<span class="nm">{d.name}</span>{#if lv}<span class="lv">+{lv}</span>{/if}</span>
                {#if kind === 'a'}
                  {@const a = s.armors[r.id] ? E.ownedArmor(s, r.id) : E.ARMORS[r.id]}
                  <span class="ft-stats"><span>{a.hp} HP</span><span>Block {a.guard}</span>{#if E.ARMORS[r.id].resist}<span class="res"><Elem e={E.ARMORS[r.id].resist} />{E.ARMORS[r.id].resist}</span>{/if}</span>
                {:else}
                  <span class="ft-stats"><span>{E.CHARMS[r.id].bounties ? `${E.CHARMS[r.id].bounties} bounties` : E.CHARMS[r.id].src}</span></span>
                {/if}
                {#if st.text}<span class="st {st.cls}"><i></i>{st.text}</span>{/if}
                {#if s.tracked === `${kind}:${r.id}`}<span class="tracked-pin">● Tracked</span>{/if}
              </button>
            {/each}
          </div>
        {:else}
        {#each g.rows as r (r.id)}
          {@const d = E.gearDef(kind, r.id)}
          {@const st = E.recipeState(s, kind, r.id)}
          {@const lv = lvHere(r.id)}
          <button class="fnode d{r.depth}" data-coach="row-{r.id}" aria-current={sel === r.id} onclick={() => pick(r.id)}>
            <span class="nmwrap">
              {#if r.depth}<span class="ind">└</span>{/if}<span class="nm"><WeaponArt id={r.id} size={26} />{d.name}{#if lv}{' '}<span class="lv">+{lv}</span>{/if}</span>
              {#if s.tracked === `${kind}:${r.id}`}<span class="tracked-pin">● Tracked</span>{/if}
              {#if st.text}<span class="st {st.cls}"><i></i>{st.text}</span>{/if}
            </span>
            <span class="avg">{E.avgDmg(E.movesAt(r.id, wLevel(r.id)))}</span>
          </button>
        {/each}
        {/if}
        {#if g.folded}<button class="ffold" onclick={() => (opened[`${tab}:${g.group}`] = true)}>+{g.folded} more {kind === 'w' ? 'in these lines' : 'not hunted yet'}</button>{/if}
      {:else}
        <p class="ital" style="padding:12px;margin:0">Nothing is ready to make yet. Untick "Ready to make" to see everything.</p>
      {/each}
    </div>
  </section>

  <section class="panel forgedetail" aria-label="Selected recipe" aria-live="polite" bind:this={detailEl}>
    {#if !sel}
      <p class="ital p0">Pick something from the list.</p>
    {:else}
      {@const r = E.recipeOf(s, kind, sel)}
      {@const st = E.recipeState(s, kind, sel)}
      {@const owned = E.isOwned(s, kind, sel)}
      {@const lv = lvHere(sel)}
      {@const name = E.gearDef(kind, sel).name}
      {@const tk = `${kind}:${sel}`}
      <div class="fdetail">
        <!-- 1. What is it, and what state is it in -->
        <div class="fd-head"><h2>{#if kind === 'w'}<WeaponArt id={sel} size={56} />{/if}{name}{#if lv}{' '}<span class="lv">+{lv}</span>{/if}</h2>{#if st.text}<span class="st {st.cls}"><i></i>{st.text}</span>{/if}</div>

        {#if kind === 'w'}
          {@const d = E.WEAPONS[sel]}
          {@const pLv = d.from ? E.lvOf(s.weapons, d.from) : 0}
          {@const mv = E.movesAt(sel, owned ? lv : pLv)}
          {@const sg = E.SIGNATURES[d.type]}
          {@const now = E.avgDmg(mv)}
          {@const base = !owned && d.from && s.weapons[d.from] ? E.avgDmg(E.movesAt(d.from, pLv)) : null}
          {@const next = owned && lv < E.MAX_REINFORCE ? E.avgDmg(E.movesAt(sel, lv + 1)) : null}
          <!-- 2. Is it better? The number that matters, with the change -->
          <div class="fd-stat">
            <span class="big">{now}</span>
            <span class="unit">Avg damage per turn</span>
            {#if base != null}<span class="delta {now >= base ? 'up' : 'down'}">{now >= base ? '↑ +' : '↓ '}{now - base} vs your {E.WEAPONS[d.from!].name}</span>
            {:else if next != null}<span class="delta up">↑ {next} at +{lv + 1}</span>{/if}
          </div>
          <!-- 3. What kind of weapon -->
          <div class="fd-type">
            {#if !isl || E.islandStep(s) >= 4}<span class="tag {sg.tag}" style="margin:0" use:detail={sg.about}>{sg.name}</span>{/if}
            <span>{d.type}</span>{#if !isl}<span class="sep">·</span>
            <span>{#if d.elem || d.status}<Elem e={markOf(d)} />{elemLabel(d)}{:else}No element{/if}</span>{/if}
          </div>
          
        {:else if kind === 'c'}
          {@const c = E.CHARMS[sel]}
          <p class="fd-perk"><Rich text={c.perk} /></p>
          <span class="fd-sig">{c.bounties ? `Unlocked by ${c.bounties} different bounties, then crafted for coin.` : `Made from ${c.src} materials.`}{full() ? ' Goes in the charm slot; one charm at a time.' : ''}</span>
        {:else}
          {@const a = E.ownedArmor(s, sel)}
          {@const base = E.ARMORS[sel]}
          <div class="fd-stat">
            <span class="big">{owned ? a.hp : base.hp}</span><span class="unit">HP</span>
            {#if owned && lv < E.MAX_REINFORCE}<span class="delta up">↑ {a.hp + 10} HP, block {a.guard + 1} at +{lv + 1}</span>{/if}
          </div>
          <div class="fd-type">
            <span>Block {owned ? a.guard : base.guard} per die</span><span class="sep">·</span><span>{base.rerolls} rerolls</span><span class="sep">·</span>
            <span>{#if base.resist}<Elem e={base.resist} />Resists {base.resist}{:else}No resistance{/if}</span>
          </div>
          <p class="fd-sig"><Rich text={base.perk} /></p>
        {/if}

        <!-- 4. Can I make it? Cost and action, close to the top -->
        {#if r.cost}
          <div>
            <div class="label rule">{r.action === 'reinforce' ? `To reinforce to +${lv + 1}` : r.action === 'upgrade' ? `To craft (from your ${E.WEAPONS[E.WEAPONS[sel].from!].name})` : r.locked ? (kind === 'c' ? `To craft (once you've completed ${E.CHARMS[sel].bounties} different bounties: ${E.bountiesDone(s)} so far)` : E.WEAPONS[sel].bounties && E.bountiesDone(s) < E.WEAPONS[sel].bounties! ? `To craft (once you've completed ${E.WEAPONS[sel].bounties} different bounties: ${E.bountiesDone(s)} so far)` : `To craft (once you own the ${E.WEAPONS[E.WEAPONS[sel].from!]?.name})`) : 'To craft'}</div>
            <Costs cost={r.cost} />
            {#if (r.action || r.locked) && (r.cost.coin ?? 0) > s.coin && E.surplusValue(s) > 0}
              <p class="sellhint">Spare materials sell for <b>{E.surplusValue(s)} coin</b>. <button class="linkbtn" onclick={() => game.go('shop', 'sell')}>Sell at the Shop</button></p>
            {/if}
          </div>
        {/if}
        <div class="fd-acts">
          {#if r.action && r.cost}
            <button class="btn primary" data-sound data-coach="forge-act" disabled={!E.canPay(s, r.cost)} onclick={doIt}>
              {r.action === 'craft' || r.action === 'upgrade' ? 'Craft' : `Reinforce to +${lv + 1}`}
            </button>
          {:else if owned}
            <span class="pl">{kind === 'c' ? 'Owned. Equip it at the Hunt Board.' : 'Fully reinforced.'}</span>
          {/if}
          {#if r.cost && (r.action || r.locked) && !(kind === 'c' && E.CHARMS[sel].bounties) && !(kind === 'w' && E.WEAPONS[sel].bounties && !r.action) && !isl}
            <button class="btn quiet" data-coach="track" aria-pressed={s.tracked === tk} onclick={track}>{s.tracked === tk ? 'Untrack' : 'Track'}</button>
          {/if}
          {#if r.action === 'upgrade'}
            {@const from = E.WEAPONS[sel].from!}
            {@const flv = E.lvOf(s.weapons, from)}
            <span class="pl">You keep your {E.WEAPONS[from].name}{flv ? ` (+${flv})` : ''}.</span>
          {/if}
        </div>
        <div class="toast" aria-live="polite">{toast}</div>

        <!-- 5. Moves and details: secondary, always shown, below the decision -->
        {#if kind === 'w'}
          {@const d = E.WEAPONS[sel]}
          <div class="fd-more">
            <div class="label rule">Moves and details</div>
            <ul class="fd-moves">
              {#each E.movesAt(sel, wLevel(sel)).filter((_, i) => !isl || i < 2 || E.islandStep(s) >= 4) as m}
                <li><span class="need" aria-label="Needs {needLabel(m.need)}">{#each [...m.need] as c}<CostDie {c} small />{/each}</span><span>{m.name}{#if (m.flow || m.daze || m.expose) && full()}{@const sg = E.SIGNATURES[d.type]} <span class="tag {sg.tag}" style="margin:0 0 0 6px" use:detail={sg.text}>{sg.name}</span>{/if}</span><span class="n">{m.dmg}</span></li>
              {/each}
            </ul>
            <p class="fd-note">{d.kind}. {d.note}</p>
          </div>
        {/if}
      </div>
    {/if}
  </section>
</div>

<style>
  .ffold { all: unset; cursor: pointer; display: block; padding: 6px 12px 10px; font-size: var(--fs-sm); color: var(--muted); }
  .ffold:hover, .ffold:focus-visible { color: var(--fg); text-decoration: underline; }
  .ffold:focus-visible { outline: 2px solid var(--gold-hi); outline-offset: -2px; }
  /* armor and charms are compared side by side, so the tile grid gets the wider share (three columns); the
     weapon trees keep the even split */
  @media (min-width: 1100px) { .forgegrid.wide { grid-template-columns: minmax(0, 1.75fr) minmax(340px, 1fr); } }
  .ftiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; padding-top: 8px; }
  .ftile { all: unset; box-sizing: border-box; cursor: pointer; display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 3px; min-width: 0; }
  .ftile:hover { border-color: var(--line-2); background: var(--raise); }
  .ftile:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
  .ftile[aria-current="true"] { border-color: var(--gold); background: var(--raise); }
  .ft-nm { display: flex; align-items: center; gap: 6px; min-width: 0; }
  .ft-nm .nm { font-family: var(--f-body); font-weight: 600; font-size: var(--fs-md); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .ftile[aria-current="true"] .nm { color: var(--gold-hi); }
  .ft-nm .lv { flex: none; }
  .ft-stats { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: var(--fs-sm); color: var(--soft); font-variant-numeric: tabular-nums; }
  .ft-stats .res { display: inline-flex; align-items: center; gap: 4px; }
  .ftile .st { white-space: normal; }
  .ftile .tracked-pin { margin-left: 0; }
  .sellhint { margin: 8px 0 0; font-size: var(--fs-sm); color: var(--soft); }
  .sellhint b { color: var(--gold-hi); }
  .linkbtn { all: unset; cursor: pointer; color: var(--gold-hi); text-decoration: underline; text-underline-offset: 3px; }
  .linkbtn:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
</style>
