<script lang="ts">
  // Modal dialog with a tinted backdrop. Closes on the X, Escape, or a click on the backdrop.
  import type { Snippet } from 'svelte';
  let { open = $bindable(false), title, wide = false, children }: { open?: boolean; title: string; wide?: boolean; children: Snippet } = $props();
  let dlg: HTMLDialogElement;
  const id = `dlg-${Math.random().toString(36).slice(2, 8)}`;
  $effect(() => {
    if (open && !dlg.open) dlg.showModal?.();
    if (!open && dlg.open) dlg.close();
  });
</script>

<dialog
  bind:this={dlg}
  class="settings"
  class:help={wide}
  aria-labelledby={id}
  onclose={() => (open = false)}
  onclick={e => { if (e.target === dlg) open = false; }}
>
  <div class="dlg">
    <div class="ph">
      <h2 {id}>{title}</h2>
      <button class="iconbtn" aria-label="Close {title.toLowerCase()}" onclick={() => (open = false)}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
    {@render children()}
  </div>
</dialog>
