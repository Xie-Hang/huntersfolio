// The crash screen. Plain DOM on purpose: it has to work when the Svelte app itself is what broke.
// Any uncaught error is written to the hunt log; the first one also puts up a calm screen with a way out:
// export a report for the developer, or reload (progress is saved after every action).
import { logError } from './playlog';
import { feedbackInfo, feedbackButton, openFeedback } from './store';

let shown = false;
type Report = () => Promise<boolean>;
let exportReport: Report | null = null;
/** App.svelte hands over its export function once it's running. */
export function setReportExporter(fn: Report) { exportReport = fn; }

function show(message: string) {
  if (shown) return; shown = true;
  const el = document.createElement('div');
  el.className = 'crash';
  el.setAttribute('role', 'alertdialog');
  el.setAttribute('aria-labelledby', 'crash-h');
  el.innerHTML = `
    <div class="crash-box">
      <h2 id="crash-h">Something went wrong</h2>
      <p>The game hit an error it didn't expect. Your progress is saved after every action, so reloading is safe.</p>
      <p class="md">If you can, export a report and send it to the developer. It holds your hunt log and this error, nothing personal.</p>
      <pre></pre>
      <div class="crash-acts"><button class="btn primary" data-act="reload">Reload the game</button><button class="btn" data-act="export">Export report</button>${feedbackInfo() ? `<button class="btn" data-act="send"></button>` : ''}</div>
      <p class="crash-note" aria-live="polite"></p>
    </div>`;
  el.querySelector('pre')!.textContent = message.slice(0, 400);
  const send = el.querySelector('[data-act="send"]'); if (send) send.textContent = feedbackButton();
  el.addEventListener('click', async e => {
    const act = (e.target as HTMLElement).closest('button')?.dataset.act;
    if (act === 'reload') location.reload();
    if (act === 'send') openFeedback();
    if (act === 'export') {
      const ok = exportReport ? await exportReport().catch(() => false) : false;
      el.querySelector('.crash-note')!.textContent = ok ? 'Report saved.' : 'Couldn’t save the report. Reloading is still safe.';
    }
  });
  document.body.append(el);
  (el.querySelector('[data-act="reload"]') as HTMLElement).focus();
}

/** Browser noise that isn't a game failure: logged, but no crash screen. */
const BENIGN = [/ResizeObserver loop/i];

export function installCrashHandlers() {
  window.addEventListener('error', e => {
    const msg = String(e.error?.message ?? e.message);
    logError('window', e.error ?? e.message);
    if (!BENIGN.some(r => r.test(msg))) show(msg);
  });
  window.addEventListener('unhandledrejection', e => { logError('promise', e.reason); show(String(e.reason?.message ?? e.reason)); });
}
