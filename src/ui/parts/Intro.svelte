<script lang="ts">
  // The opening card (Nov 2026 playtest: a new player was lost at the start, and in the browser heard nothing for the
  // first ten seconds, because browsers allow sound only after the first click). A new player sees what the game is
  // and what the guided first hunt will do; in the browser every launch opens on it, so the Begin click turns the
  // sound on. The desktop build plays sound at launch and shows this to new players only.
  import { music } from '../audio';
  let { fresh, onbegin, onskip }: { fresh: boolean; onbegin: () => void; onskip: () => void } = $props();
  let btn = $state<HTMLButtonElement>();
  $effect(() => { btn?.focus(); });
  const begin = () => { music.unlock(); onbegin(); };
</script>

<div class="intro" role="dialog" aria-modal="true" aria-labelledby="intro-title">
  <div class="intro-card mat-plate">
    <h1 id="intro-title" class="intro-logo" aria-label="Hunter's Folio"><span class="hn">Hunter’s</span> <span>Folio</span></h1>
    {#if fresh}
      <p class="lead">Hunt monsters with four dice.</p>
      <p>Every monster shows you what it will do next and how hard it will hit. Read it, then spend your dice to attack, block or reroll. Break its parts, carry home the pieces, and forge the gear the next hunt needs.</p>
      <p>Your first hunt is a guided one, against the Gorehorn. Each step lights up the thing to use; the rest of the screen dims until you've done it. It takes a few minutes.</p>
      <div class="intro-acts">
        <button class="btn primary" bind:this={btn} onclick={begin}>Begin the first hunt</button>
        <button class="coach-skip" onclick={() => { music.unlock(); onskip(); }}>I've played before: skip the tutorial</button>
      </div>
    {:else}
      <p class="lead">Welcome back, hunter.</p>
      <div class="intro-acts"><button class="btn primary" bind:this={btn} onclick={begin}>Begin</button></div>
    {/if}
  </div>
</div>

<style>
  .intro{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;padding:24px max(16px, env(safe-area-inset-left, 0px));
    background:var(--mat-doodle-hunt) 0 0/220px 220px,rgba(14,11,9,.95)}
  .intro-card{box-sizing:border-box;width:min(560px,100%);border:1px solid var(--mat-plate-rule);border-radius:4px;padding:36px 40px 30px;display:flex;flex-direction:column;gap:12px}
  .intro-logo{margin:0 0 8px;font-family:'IM Fell English',Georgia,serif;font-weight:400;font-size:calc(var(--fs-logo) * 1.3);line-height:1;color:var(--ember);text-align:center}
  .intro-logo .hn{font-family:'IM Fell English SC',Georgia,serif;font-size:.62em;letter-spacing:.06em;color:var(--fg)}
  p{margin:0;color:var(--soft);line-height:1.5;max-width:60ch}
  .lead{font-size:var(--fs-lg);font-weight:600;color:var(--fg);text-align:center}
  .intro-acts{display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:14px}
  .intro-acts .btn{min-width:240px;justify-content:center}
  .intro .coach-skip{color:var(--muted)}
  .intro .coach-skip:hover{color:var(--soft)}
</style>
