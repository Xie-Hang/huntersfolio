// Small visual effects shared by the hunt panels.

/** Svelte action: replays the .shake animation each time `count` changes. */
export function shake(node: HTMLElement, count: number) {
  let last = count;
  return {
    update(next: number) {
      if (next === last) return;
      last = next;
      node.classList.remove('shake');
      void node.offsetWidth; // restart the animation
      node.classList.add('shake');
    }
  };
}
