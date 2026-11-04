// The full game's Steam store page (the demo's Wishlist button). Only the desktop shell can open it,
// and only once a store App ID is set in electron/steam.cjs; otherwise the button isn't shown.
type StoreBridge = { available: boolean; open(): void };
const bridge = (): StoreBridge | undefined =>
  typeof window !== 'undefined' ? (window.hf as { store?: StoreBridge } | undefined)?.store : undefined;

export const storeAvailable = () => !!bridge()?.available;
export const openStore = () => bridge()?.open();

// Where players send feedback (set in electron/links.cjs). null = not set yet: the buttons stay hidden.
type FeedbackBridge = { info: { label: string | null } | null; open(): void };
const fb = (): FeedbackBridge | undefined =>
  typeof window !== 'undefined' ? (window.hf as { feedback?: FeedbackBridge } | undefined)?.feedback : undefined;
export const feedbackInfo = () => fb()?.info ?? null;
export const openFeedback = () => fb()?.open();
/** "Send feedback" or "Send feedback on Discord" */
export const feedbackButton = () => { const i = feedbackInfo(); return i ? `Send feedback${i.label ? ` on ${i.label}` : ''}` : ''; };
