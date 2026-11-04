import { mount } from 'svelte';
// Fonts ship with the game (SIL Open Font License) so the desktop build works offline.
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-400-italic.css';
import '@fontsource/barlow/latin-600.css';
import App from './ui/App.svelte';
import './ui/app.css';
import { installCrashHandlers } from './ui/crash';
import { logError } from './ui/playlog';
import { startPad } from './ui/pad.svelte';

installCrashHandlers();
let app: ReturnType<typeof mount> | undefined;
try {
  app = mount(App, { target: document.getElementById('app')! });
  startPad();
} catch (err) {
  // A failure while starting up still gets the crash screen rather than a blank window.
  logError('startup', err);
  setTimeout(() => { throw err; });
}

export default app;
