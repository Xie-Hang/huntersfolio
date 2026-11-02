import { mount } from 'svelte';
// Fonts ship with the game (SIL Open Font License) so the desktop build works offline.
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-400-italic.css';
import '@fontsource/barlow/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';
import App from './ui/App.svelte';
import './ui/app.css';

const app = mount(App, { target: document.getElementById('app')! });

export default app;
