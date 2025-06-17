const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('api', {
  startApache: () => ipcRenderer.send('apache:start'),
  stopApache: () => ipcRenderer.send('apache:stop'),
  startMySQL: () => ipcRenderer.send('mysql:start'),
  stopMySQL: () => ipcRenderer.send('mysql:stop'),
  openPhpMyAdmin: () => ipcRenderer.send('phpmyadmin:open'),
  switchPhpVersion: (v) => ipcRenderer.send('php:switch', v),
  startAll: () => ipcRenderer.send('services:startAll'),
  stopAll: () => ipcRenderer.send('services:stopAll'),
  exitApp: () => ipcRenderer.send('app:exit'),
  getPhpVersions: async () => {
    return await ipcRenderer.invoke('php:getVersions');
  }
});
