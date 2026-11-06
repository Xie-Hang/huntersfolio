<script lang="ts">
  import { shows } from '../../reveal';
  import { input } from '../../pad.svelte';
  import Elem from '../../parts/Elem.svelte';
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { pct } from '../../fmt';
  import { shake } from '../../fx';
  import Plate from '../../parts/Plate.svelte';
  import Telegraph from './Telegraph.svelte';

  const h = $derived(game.hunt!);
  const M = $derived(E.MONSTERS[h.mid]);
  const m = $derived(h.mon);
  const w = $derived(E.currentWeapon(h));
  const headName = $derived(M.parts.find(p => p.id === M.head)!.name.toLowerCase());
  const mud = $derived(m.wallow > 0 && !m.parts.hide?.broken);
  const meter = $derived(M.meter?.(h) ?? null);
  const uid = `st${Math.random().toString(36).slice(2, 7)}`;
  const isFlier = $derived(!!M.flier);
  const el = $derived(E.elemsNow(h.mid, h));
  /** The monster's condition, each with what it does and how to answer it (playtest: players saw "Enraged" or
   *  "Ice plating" with no idea what it meant). Hover, or move a controller's focus onto it, to read. */
  const statuses = $derived.by(() => {
    const out: { key: string; label: string; short: string; cls: string; desc: string }[] = [];
    if (m.enraged) out.push({ key: 'enr', label: 'Enraged', short: 'hits harder', cls: 'hot', desc: 'Below half HP it fights harder for the rest of the hunt: its attacks hit harder and some of its moves change. Read its next move every turn.' });
    if (mud) out.push({ key: 'mud', label: 'Mud-caked', short: `hide takes ½ · ${m.wallow} turn${m.wallow > 1 ? 's' : ''}`, cls: 'mud', desc: 'Mud halves damage to its hide until it dries. Aim at another part meanwhile, or use Pierce, which ignores the mud.' });
    if (h.intent === 'trapped') out.push({ key: 'trap', label: 'Trapped', short: `held · ${m.trapped ?? 1} turn${(m.trapped ?? 1) > 1 ? 's' : ''}`, cls: 'gold', desc: 'Caught in your trap: it loses its actions while it’s held. A snare set now can’t be torn free.' });
    if (m.air) out.push({ key: 'air', label: 'Airborne', short: 'only bows reach it', cls: 'gale', desc: `In the air, only Pierce (a bow) can hit it${isFlier ? '. Pinning Shot or a Weighted Net brings it down' : ''}. Otherwise block until it comes down: when it lands, every weapon reaches it. It can't be captured in the air.` });
    if (m.under) out.push({ key: 'under', label: 'Underground', short: 'only Blunt reaches it', cls: 'mud', desc: 'Only Blunt reaches it below ground. A heavy Blunt hit drives it up, dazed, and cancels what it was digging toward. Otherwise, block for what comes up.' });
    // every plated monster gets the badge but the Ashtail, whose burning scales have their own (Nov 2026 bug hunt: the Cragwing's slate had none)
    if (m.plating > 0 && !M.plateHot) { const pw = M.plateWord ?? 'ice'; out.push({ key: 'ice', label: `${pw[0].toUpperCase() + pw.slice(1)} ×${m.plating}`, short: `hits break ${pw}, not HP`, cls: 'ice', desc: `Each hit breaks a layer of ${pw} instead of dealing damage (a Cut hit breaks two), and uses up a charge or whetstone bonus. Clear the ${pw} first. A Firepot ${pw === 'ice' ? 'melts' : 'cracks'} it all.` }); }
    if (m.molten > 0) out.push({ key: 'molt', label: 'Molten', short: `melee burns you ${m.enraged ? 8 : 5} · ${m.molten} turn${m.molten > 1 ? 's' : ''}`, cls: 'hot', desc: `Its shell is molten: every Cut or Blunt hit burns you ${m.enraged ? 8 : 5}. Pierce is safe, or block and wait it out.` });
    if ((m.shell ?? 0) > 0) out.push({ key: 'shell', label: 'In its shell', short: 'your hits ½', cls: 'stone', desc: 'Your hits deal half until it comes out on its next action. A good turn to block, charge or reroll for something big.' });
    if ((m.slime ?? 0) > 0 && M.inflicts !== 'Drain') out.push({ key: 'slime', label: 'Slime', short: `burning you · ${m.slime} turn${m.slime! > 1 ? 's' : ''}`, cls: 'hot', desc: 'The slime burns you a little at the end of each turn. It can\'t knock you out on its own. Breaking its foot stops the slime for good.' });
    if ((m.mirage ?? 0) > 0 && M.id !== 'fenmother') out.push({ key: 'mir', label: 'Images', short: `only your 1st hit lands · ${m.mirage} turn${m.mirage! > 1 ? 's' : ''}`, cls: 'ice', desc: `Mirror images surround it: only your first hit each turn lands; later hits shatter an image. Make that first hit count (charge it). ${(m.hits ?? 0) > 0 ? 'You have already landed this turn\'s hit.' : ''}` });
    if ((m.infected ?? 0) > 0) out.push({ key: 'inf', label: 'Infected', short: `−${m.infectDmg} · ${m.infected} turn${m.infected! > 1 ? 's' : ''}`, cls: 'inf', desc: 'Your Infect weapon filled its meter: it takes this much at the end of each turn until the infection runs out.' });
    out.push(...(M.badges?.(h) ?? []));
    if (E.canCapture(h)) out.push({ key: 'cap', label: 'Capturable', short: h.snareSet ? 'snare set' : h.snares ? `set a Snare · ${h.snares} carried` : 'no Snare carried', cls: 'gold', desc: `At ${Math.round(E.CAPTURE_AT * 100)}% HP or less it can be captured: set a Snare (2 dice). It closes when you end your turn unless its move hits you for ${E.CHARGE_BREAK} or more. Double part materials.` });
    return out;
  });
  const TONE = { gold: 'var(--gold-hi)', ember: 'var(--ember-soft)', ice: '#b9d3f0', gale: '#8fc3c9', stone: '#c9b89c' } as const;
</script>

<section class="panel stage" class:over={h.over === 'win'} aria-label="The monster" use:shake={game.shakes.mon}>
  <div style="display:flex;flex-direction:column;gap:12px">
    <!-- name, HP and elements are in the health bar across the top (VersusBar) -->
    <!-- the first Foothills hunt doesn't show its next move yet: the picture takes the whole panel -->
    <div class="stagebody" class:solo={!shows(h, 'intent') && !h.over}>
      <!-- the picture, then the monster's meters and condition under it: the telegraph beside sets the height, and this
           used to be a full-width row below both (Nov 2026: the hunt screen didn't fit a Steam Deck) -->
      <div class="platecol">
        <div class="plate" style="position:relative"><Plate mon={h.mid} hunt={h.intent === 'trapped' ? { ...h, intent: 'dazed' } : h} scene />{#if h.over}<span class="stamp {h.over === 'win' ? (h.captured ? 'captured' : 'slain') : 'failed'}" aria-hidden="true">{h.over === 'win' ? (h.captured ? 'Captured' : 'Slain') : 'Escaped'}</span>{/if}</div>
        <!-- meters and condition badges only matter mid-fight: gone on the result card (Mekkman, Nov 2026) -->
        {#if !h.over}
        <div class="metarow">
          <div class="meters">
        {#if meter}
          <div class="hpline" aria-label="{meter.label}: {meter.value} of {meter.max}">
            <div class="ph"><span class="label" style="color:{TONE[meter.tone ?? 'gold']}">{meter.label}</span><span class="mono">{meter.note ?? `${meter.value} / ${meter.max}`}</span></div>
            {#if meter.pips}
              <div class="pipbar">{#each Array(meter.max) as _, i}<i class:f={i < meter.value} style="--c:{TONE[meter.tone ?? 'gold']}"></i>{/each}</div>
            {:else}
              <div class="bar"><i style="width:{pct(meter.value, meter.max)}%;background:{TONE[meter.tone ?? 'gold']}"></i></div>
            {/if}
          </div>
        {/if}
        {#if !shows(h, 'all')}
        {:else if E.carries(h, 'Blunt') && M.heads}
          <div class="hpline">
            <div class="heads">
              <span class="label" style="color:var(--daze)">Daze</span>
              {#each M.heads.filter(x => !m.parts[x].broken) as hd (hd)}
                {@const reel = (m.reel?.[hd] ?? 0) > 0}
                {@const v = m.headDaze?.[hd] ?? 0}
                <div class="hd" aria-label="{M.parts.find(p => p.id === hd)!.name} daze: {reel ? 'reeling' : `${v} of ${E.HEAD_DAZE_MAX}`}">
                  <span class="label">{M.parts.find(p => p.id === hd)!.name.replace(' Head', '')}{reel ? ' · Reeling' : ''}</span>
                  <div class="bar" class:locked={reel}><i style="width:{pct(v, E.HEAD_DAZE_MAX)}%;background:var(--daze)"></i></div>
                </div>
              {/each}
            </div>
          </div>
        {:else if E.carries(h, 'Blunt')}
          <div class="hpline">
            <div class="ph"><span class="label" style="color:var(--daze)">Daze · Blunt hits to the {headName}</span><span class="mono">{m.dazeLock ? 'Recovering' : `${m.daze} / ${m.dazeMax}`}</span></div>
            <div class="bar" class:locked={m.dazeLock > 0}><i style="width:{pct(m.daze, m.dazeMax)}%;background:var(--daze)"></i></div>
          </div>
        {/if}
          </div>
          {#if statuses.length}
            <div class="conds" aria-label="Its condition">
              {#each statuses as st (st.key)}
                <button type="button" class="cond {st.cls}" aria-describedby="{uid}-{st.key}"><b>{st.label}</b><span class="sh">{st.short}</span><span class="i" aria-hidden="true">?</span>
                <span class="stip" id="{uid}-{st.key}" role="tooltip">{st.desc}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
        {/if}
      </div>
      {#if shows(h, 'intent') || h.over}<Telegraph />{/if}
    </div>
  </div>
  <div class="fx">
    {#each game.floats.filter(f => f.at === 'mon') as f (f.id)}<span class="float {f.cls}">{f.text}</span>{/each}
  </div>
</section>

<style>
  /* condition badges under the picture (not over it: the art stays clear): solid, named, the effect always visible */
  .conds { flex: 0 1 auto; display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; align-items: center; margin-left: auto; }
  .cond { all: unset; pointer-events: auto; position: relative; box-sizing: border-box; cursor: help; display: inline-flex; align-items: baseline; gap: 6px; padding: 4px 8px; border-radius: 3px; background: var(--c, var(--bone)); color: var(--ink); font-family: var(--f-body); font-size: var(--fs-sm); line-height: 1.2; box-shadow: 0 2px 0 rgba(0, 0, 0, .45), 0 0 0 1px rgba(0, 0, 0, .35); }
  .cond b { font-weight: 700; text-transform: uppercase; letter-spacing: .04em; font-size: 12px; }
  .cond .sh { font-weight: 500; }
  .cond .i { display: inline-grid; place-items: center; align-self: center; width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid currentColor; font-size: 10px; font-weight: 700; opacity: .75; }
  .cond:focus-visible { outline: 2px solid var(--gold-hi); outline-offset: 2px; }
  .cond.inf { --c: #9fc062; } .cond.hot { --c: #e8773a; } .cond.ice { --c: #b9d3f0; } .cond.gale { --c: #8fc3c9; } .cond.mud { --c: #b49a74; } .cond.stone { --c: #c9b89c; } .cond.gold { --c: #e9b949; }
  .cond.hot b { color: #2a1206; }
  .stip { position: absolute; right: 0; top: calc(100% + 8px); z-index: 40; width: 280px; padding: 10px 12px; border: 1px solid var(--gold); border-radius: 4px; background: var(--raise); color: var(--fg); font-size: var(--fs-sm); font-weight: 400; line-height: 1.45; text-align: left; text-transform: none; letter-spacing: 0; white-space: normal; box-shadow: 0 8px 24px rgba(0, 0, 0, .5); opacity: 0; visibility: hidden; transform: translateY(-4px); transition: opacity .12s, transform .12s, visibility .12s; pointer-events: none; }
  .cond:hover .stip, .cond:focus-visible .stip, .cond:focus .stip { opacity: 1; visibility: visible; transform: none; }
  @media (prefers-reduced-motion: reduce) { .stip { transition: none; } }
  .metarow { display: flex; gap: 10px 18px; align-items: flex-end; flex-wrap: wrap; }
  .metarow .meters { flex: 1 1 260px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px 16px; min-width: 0; }
  .metarow .ph { flex-wrap: nowrap; }
  .metarow .ph .label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .metarow .ph .mono { white-space: nowrap; flex: none; }
  .metarow .meters:empty { display: none; }
  .platecol { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
  .platecol .metarow { flex-direction: column; align-items: stretch; }
  .platecol .metarow .meters { flex: none; grid-template-columns: minmax(0, 1fr); }
  .platecol .conds { justify-content: flex-start; margin-left: 0; }
  .stagebody.solo { grid-template-columns: minmax(0, 1fr); justify-items: center; }
  .stagebody.solo .platecol { width: min(100%, 460px); }
  .stagebody { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 14px; align-items: start; }
  @media (max-width: 720px) { .stagebody { grid-template-columns: minmax(0, 1fr); } }
  .heads { display: flex; align-items: center; gap: 12px; }
  .heads .hd { flex: 1; display: flex; align-items: center; gap: 6px; min-width: 0; }
  .heads .hd .bar { flex: 1; }
  .heads .label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .pipbar { display: flex; gap: 6px; }
  .pipbar i { flex: 1; height: 10px; border-radius: 2px; border: 1px solid var(--line-2); background: transparent; }
  .pipbar i.f { background: var(--c); border-color: var(--c); }
</style>
