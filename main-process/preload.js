const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    resizeWindow: (width, height) => ipcRenderer.send('resize-window', width, height),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
});
