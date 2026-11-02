// The only bridge between the game page and the desktop shell.
// Kept deliberately tiny: read/write save files, and ask who's playing on Steam.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hf', {
  storage: {
    get: key => ipcRenderer.sendSync('storage:get', key),
    set: (key, value) => ipcRenderer.sendSync('storage:set', key, value),
    remove: key => ipcRenderer.sendSync('storage:remove', key)
  },
  steam: ipcRenderer.sendSync('steam:info')
});
