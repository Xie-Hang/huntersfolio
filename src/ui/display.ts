// Window settings: fullscreen and interface size.
// Desktop: the Electron shell owns the window (preload `window.hf.display`); interface size uses
// Electron's page zoom, so the layout reflows exactly as if the window were smaller.
// Browser (npm run dev): the Fullscreen API, and CSS zoom as a rough stand-in.

interface DesktopDisplay {
  isFullscreen(): boolean;
  setFullscreen(on: boolean): void;
  onFullscreen(cb: (on: boolean) => void): void;
  setZoom(f: number): void;
}
const desk = (): DesktopDisplay | undefined =>
  typeof window !== 'undefined' ? (window.hf as { display?: DesktopDisplay } | undefined)?.display : undefined;

export const UI_SIZES = [1, 1.15, 1.3] as const;
export const isDesktop = () => !!desk();

export function isFullscreen(): boolean {
  const d = desk();
  return d ? d.isFullscreen() : !!document.fullscreenElement;
}
export function setFullscreen(on: boolean) {
  const d = desk();
  if (d) return d.setFullscreen(on);
  try {
    if (on && !document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => {});
    else if (!on && document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
  } catch { /* not allowed here */ }
}
/** Calls back whenever fullscreen changes for any reason (F11, Esc, the setting). */
export function onFullscreenChange(cb: (on: boolean) => void) {
  const d = desk();
  if (d) d.onFullscreen(cb);
  else document.addEventListener('fullscreenchange', () => cb(!!document.fullscreenElement));
}
export function setUiSize(f: number) {
  const d = desk();
  if (d) d.setZoom(f);
  else document.documentElement.style.zoom = f === 1 ? '' : String(f);
}
