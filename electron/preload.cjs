// The only bridge between the game page and the desktop shell.
// Kept deliberately tiny: read/write save files, and ask who's playing on Steam.
const { contextBridge, ipcRenderer, webFrame } = require('electron');

contextBridge.exposeInMainWorld('hf', {
  storage: {
    get: key => ipcRenderer.sendSync('storage:get', key),
    set: (key, value) => ipcRenderer.sendSync('storage:set', key, value),
    remove: key => ipcRenderer.sendSync('storage:remove', key)
  },
  steam: ipcRenderer.sendSync('steam:info'),
  files: {
    save: (name, text) => ipcRenderer.invoke('file:save', name, text)
  },
  store: {
    available: ipcRenderer.sendSync('store:available'),
    open: () => ipcRenderer.send('store:open')
  },
  display: {
    isFullscreen: () => ipcRenderer.sendSync('window:isFullscreen'),
    setFullscreen: on => ipcRenderer.send('window:setFullscreen', !!on),
    // F11 can change it from outside the game's own settings; tell the page.
    onFullscreen: cb => ipcRenderer.on('window:fullscreen', (_e, on) => cb(!!on)),
    setZoom: f => webFrame.setZoomFactor(Math.min(1.5, Math.max(1, Number(f) || 1)))
  }
});
