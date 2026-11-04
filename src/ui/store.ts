// The full game's Steam store page (the demo's Wishlist button). Only the desktop shell can open it,
// and only once a store App ID is set in electron/steam.cjs; otherwise the button isn't shown.
type StoreBridge = { available: boolean; open(): void };
const bridge = (): StoreBridge | undefined =>
  typeof window !== 'undefined' ? (window.hf as { store?: StoreBridge } | undefined)?.store : undefined;

export const storeAvailable = () => !!bridge()?.available;
export const openStore = () => bridge()?.open();
