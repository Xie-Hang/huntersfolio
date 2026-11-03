<script lang="ts">
  // Engraved monster plates. Parts light up when aimed at and dim when broken.
  // Each new monster needs a plate here (until art assets replace these).
  import type { Hunt } from '../../engine';
  let { mon, hunt = null }: { mon: string; hunt?: Hunt | null } = $props();
  const cls = (id: string) => {
    if (!hunt) return '';
    return (hunt.mon.parts[id]?.broken ? 'broke' : '') + (hunt.target === id ? ' on' : '');
  };
  const air = $derived(!!hunt?.mon.air);
  const under = $derived(!!hunt?.mon.under);
  const molten = $derived((hunt?.mon.molten ?? 0) > 0);
</script>

{#if mon === 'gorehorn'}
  <svg viewBox="0 0 320 175" role="img" aria-label="Engraving of the Gorehorn, a great ridge boar">
    <path class={cls('hide')} d="M70 100 C70 60 120 45 170 48 C215 50 245 62 250 88 C255 112 238 128 205 130 L110 130 C85 130 70 120 70 100Z" />
    <path class={cls('hide')} d="M118 52 l6 -11 l6 10 l6 -12 l6 11 l6 -13 l6 12 l6 -12 l6 11 l6 -11 l6 10 l6 -9" />
    <path class="hatch" d="M118 122 l10 -10 M132 124 l10 -10 M146 125 l10 -10 M160 125 l10 -10 M174 125 l10 -10 M188 124 l10 -10" />
    <path d="M250 82 C264 78 284 86 291 99 C295 108 290 117 278 117 L252 116" />
    <path d="M289 102 l9 2 l-2 10 l-8 -2" />
    <path d="M246 72 l8 -17 l7 19" />
    <circle class="eye" cx="269" cy="92" r="2.6" />
    <path d="M72 92 c-10 -4 -15 6 -8 11" />
    <path class={cls('tusks')} d="M276 112 C284 124 300 122 305 106" />
    <path class={cls('tusks')} d="M266 115 C270 129 286 133 296 122" />
    <path class={cls('legs')} d="M98 126 l-6 34 l8 0 M122 130 l0 31 l8 0" />
    <path d="M204 129 l-2 32 l8 0 M228 124 l6 36 l8 0" />
  </svg>
{:else if mon === 'galeshrike'}
  <svg viewBox="0 0 320 175" role="img" aria-label="Engraving of the Galeshrike, a storm raptor{air ? ', in flight' : ''}">
    <g transform={air ? 'translate(0,-14)' : ''}>
      <path class={cls('wings')} d="M150 84 C132 52 98 36 52 30 C72 44 86 58 98 72 C80 70 64 72 48 80 C84 84 114 88 140 94" />
      <path class={cls('wings')} d="M186 82 C200 52 230 34 272 26 C256 42 242 58 230 70 C246 68 262 72 276 80 C246 84 216 88 200 94" />
      <path class="hatch" d="M80 46 l14 18 M100 42 l12 20 M232 40 l-10 20 M252 36 l-12 22" />
      <path d="M122 106 C122 86 150 76 180 80 C205 84 220 95 222 108 C224 122 205 130 180 128 L142 126 C130 124 122 116 122 106Z" />
      <path d="M122 108 L82 100 L86 112 L74 118 L120 116" />
      <path d="M222 100 C230 88 250 86 262 94 C268 98 266 106 258 108 L226 112" />
      <path d="M262 96 L282 102 L262 107" />
      <circle class="eye" cx="248" cy="97" r="2.4" />
      <path class={cls('crest')} d="M232 90 l-6 -16 l10 12 l0 -18 l8 18 l6 -14 l0 16" />
      <path class="hatch" d="M150 120 l10 -10 M164 122 l10 -10 M178 122 l10 -10 M192 120 l10 -10" />
      <path class={cls('talons')} d="M164 128 l-4 22 l-8 6 M160 150 l2 8 M160 150 l8 4 M190 128 l2 22 l-6 6 M192 150 l4 8 M192 150 l9 2" />
    </g>
  </svg>
{:else if mon === 'cinderack'}
  <svg viewBox="0 0 320 175" role="img" aria-label="Engraving of the Cinderack, a magma burrower{under ? ', underground' : ''}">
    <defs><clipPath id="cr-above"><rect x="0" y="0" width="320" height="150" /></clipPath></defs>
    <path class="hatch" d="M10 150 H310" style="stroke:#8c7a62;stroke-width:2" />
    {#if under}
      <path d="M120 150 C135 128 185 128 200 150" />
      <path class="hatch" d="M140 146 l6 -8 M156 144 l6 -10 M172 144 l6 -10 M188 146 l5 -7" />
      <path class={cls('vents')} d="M150 132 l4 -10 M164 129 l3 -12 M178 132 l-2 -10" />
    {:else}
      <g clip-path="url(#cr-above)" class:molten>
        <path d="M78 118 C74 86 112 66 160 64 C206 62 238 80 242 108 C246 128 232 140 206 142 L104 142 C88 142 80 132 78 118Z" />
        <path class="hatch" d="M108 136 l10 -12 M124 138 l10 -12 M140 139 l10 -12 M156 139 l10 -12 M172 139 l10 -12 M188 138 l10 -12" />
        <path class={cls('vents')} d="M120 70 l-4 -14 l10 9 M146 64 l0 -16 l8 14 M172 63 l4 -15 l5 15 M198 68 l8 -13 l1 15" />
        <path class={cls('plate')} d="M240 92 C258 82 284 86 296 104 C300 112 296 122 286 124 L246 128 C252 116 250 102 240 92Z" />
        <path class="hatch" d="M258 96 l8 22 M272 96 l6 22" />
        <circle class="eye" cx="254" cy="106" r="2.4" />
        <path class={cls('claws')} d="M206 140 l6 8 l-8 -2 M216 140 l8 8 l-9 -1 M226 138 l8 9 l-9 -2" />
        <path d="M104 140 l-6 10 M118 142 l-2 8" />
        <path d="M80 112 C64 112 54 120 46 132" />
      </g>
    {/if}
  </svg>
{/if}
