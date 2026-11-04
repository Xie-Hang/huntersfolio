// Electron main process: one window, file-based saves, and the Steam hookup.
// The game itself (dist/) knows nothing about Electron; it talks to this file
// only through the small bridge in preload.cjs.
const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const steam = require('./steam.cjs');

// Must happen before the app is ready (Steam needs to hook the process early).
const steamClient = steam.init();

// Demo and full game share one save folder, so demo progress carries over to the full game on the same PC.
// Fixed here (not taken from the build's product name) so a "Hunter's Folio Demo" build still writes to it.
// Steam Cloud can't carry it: each Steam app (demo, full game) has its own cloud storage.
app.setPath('userData', path.join(app.getPath('appData'), "Hunter's Folio"));

// One copy at a time: two windows writing the same save would corrupt progress.
if (!app.requestSingleInstanceLock()) app.quit();

/* ---------- saves ----------
   One JSON file per key in <userData>/saves (on Windows: %APPDATA%\Hunter's Folio\saves).
   Writes go to a temp file and are renamed into place, so a crash mid-write can't
   leave a half-written save. The previous good save is kept as <key>.bak.json. */
const saveDir = () => path.join(app.getPath('userData'), 'saves');
const KEY = /^[a-z0-9-]{1,40}$/;
const fileFor = (key, ext = '.json') => {
  if (!KEY.test(key)) throw new Error(`bad save key: ${key}`);
  return path.join(saveDir(), key + ext);
};
const readValid = file => {
  try {
    const text = fs.readFileSync(file, 'utf8');
    JSON.parse(text);
    return text;
  } catch {
    return null;
  }
};

ipcMain.on('storage:get', (e, key) => {
  try {
    e.returnValue = readValid(fileFor(key)) ?? readValid(fileFor(key, '.bak.json'));
  } catch {
    e.returnValue = null;
  }
});
ipcMain.on('storage:set', (e, key, value) => {
  try {
    JSON.parse(value); // never write something we couldn't read back
    fs.mkdirSync(saveDir(), { recursive: true });
    const file = fileFor(key), tmp = fileFor(key, '.tmp');
    if (readValid(file)) fs.copyFileSync(file, fileFor(key, '.bak.json'));
    fs.writeFileSync(tmp, value, 'utf8');
    fs.renameSync(tmp, file);
    e.returnValue = true;
  } catch (err) {
    console.error('save failed', err);
    e.returnValue = false;
  }
});
ipcMain.on('storage:remove', (e, key) => {
  try {
    fs.rmSync(fileFor(key), { force: true });
    e.returnValue = true;
  } catch {
    e.returnValue = false;
  }
});
ipcMain.on('window:isFullscreen', e => {
  const w = BrowserWindow.fromWebContents(e.sender);
  e.returnValue = !!w?.isFullScreen();
});
ipcMain.on('window:setFullscreen', (e, on) => {
  BrowserWindow.fromWebContents(e.sender)?.setFullScreen(!!on);
});
/** The player's settings file, read once at startup so the window opens the way they left it. */
const startPrefs = () => { try { return JSON.parse(readValid(fileFor('settings')) ?? '{}'); } catch { return {}; } };

// Saving a file the player asked for (the feedback report): a normal Save dialog, defaulting to Documents.
ipcMain.handle('file:save', async (e, name, text) => {
  try {
    const win = BrowserWindow.fromWebContents(e.sender);
    const safe = String(name).replace(/[^\w.-]+/g, '-').slice(0, 80) || 'report.json';
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      defaultPath: path.join(app.getPath('documents'), safe),
      filters: [{ name: 'Report', extensions: ['json'] }]
    });
    if (canceled || !filePath) return false;
    fs.writeFileSync(filePath, String(text), 'utf8');
    return true;
  } catch (err) {
    console.error('file save failed', err);
    return false;
  }
});

/* ---------- crashes the page can't report itself ----------
   Written to <userData>/saves/crash.log (next to the saves, so a player can find and send it). */
function crashLog(what) {
  try {
    fs.mkdirSync(saveDir(), { recursive: true });
    fs.appendFileSync(path.join(saveDir(), 'crash.log'), `${new Date().toISOString()} v${app.getVersion()} ${what}\n`);
  } catch { /* nowhere to write: nothing more to do */ }
}
process.on('uncaughtException', err => crashLog(`main: ${err && err.stack || err}`));

// The one link the game may open: the full game's Steam store page (the demo's Wishlist button).
// Through the Steam client when it's running (already signed in, so Wishlist is one click), else the browser.
ipcMain.on('store:available', e => { e.returnValue = steam.STORE_APP_ID > 0; });
ipcMain.on('store:open', () => {
  const id = steam.STORE_APP_ID;
  if (!id) return;
  shell.openExternal(steamClient ? `steam://store/${id}` : `https://store.steampowered.com/app/${id}/`).catch(() => {});
});

ipcMain.on('steam:info', e => {
  e.returnValue = steam.info(steamClient);
});

/* ---------- window ---------- */
function createWindow() {
  const prefs = startPrefs();
  const win = new BrowserWindow({
    fullscreen: prefs.fullscreen === true,
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: "Hunter's Folio",
    backgroundColor: '#14100d', // matches --bg, so there's no white flash
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  });
  win.once('ready-to-show', () => win.show());
  // If the page process dies (out of memory, GPU fault), note it and bring the game back; the save is on disk.
  win.webContents.on('render-process-gone', (_e, d) => {
    crashLog(`renderer gone: ${d.reason} (exit ${d.exitCode})`);
    if (d.reason !== 'clean-exit' && !win.isDestroyed()) win.reload();
  });
  const tell = () => win.webContents.send('window:fullscreen', win.isFullScreen());
  win.on('enter-full-screen', tell);
  win.on('leave-full-screen', tell);

  // The game never navigates or opens windows. Refuse anything that tries.
  win.webContents.on('will-navigate', (e, url) => { if (url !== win.webContents.getURL()) e.preventDefault(); }); // reloading itself is allowed (the crash screen's Reload)
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // F11 toggles fullscreen. F12 opens dev tools, only in development.
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.key === 'F12' && !app.isPackaged) { win.webContents.toggleDevTools(); e.preventDefault(); }
  });

  // HF_DEV_URL=http://localhost:5173 runs the desktop shell against `npm run dev` with hot reload.
  if (process.env.HF_DEV_URL && !app.isPackaged) win.loadURL(process.env.HF_DEV_URL);
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  return win;
}

app.on('second-instance', () => {
  const [win] = BrowserWindow.getAllWindows();
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
});
app.on('window-all-closed', () => app.quit());
