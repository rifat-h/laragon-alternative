const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // App lifecycle
  onAppReady: (callback) => {
    ipcRenderer.on('app-ready', () => {
      console.log('App is ready in preload.js');
      callback();
    });
  },

  // Service status updates
  onServiceStatus: (callback) => {
    ipcRenderer.on('service-status', (event, data) => {
      callback(data);
    });
  },

  // Remove listeners (important for cleanup)
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Apache management
  startApache: () => ipcRenderer.send('apache:start'),
  stopApache: () => ipcRenderer.send('apache:stop'),

  // MySQL management
  startMySQL: () => ipcRenderer.send('mysql:start'),
  stopMySQL: () => ipcRenderer.send('mysql:stop'),

  // phpMyAdmin
  openPhpMyAdmin: () => ipcRenderer.send('phpmyadmin:open'),

  // PHP version management
  switchPhpVersion: (version) => ipcRenderer.send('php:switch', version),
  getPhpVersions: async () => {
    try {
      return await ipcRenderer.invoke('php:getVersions');
    } catch (error) {
      console.error('Error getting PHP versions:', error);
      return [];
    }
  },

  // Service management
  startAll: () => ipcRenderer.send('services:startAll'),
  stopAll: () => ipcRenderer.send('services:stopAll'),
  getServiceStatus: async () => {
    try {
      return await ipcRenderer.invoke('services:getStatus');
    } catch (error) {
      console.error('Error getting service status:', error);
      return { apache: 'unknown', mysql: 'unknown' };
    }
  },

  // Window controls (for frameless window)
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // App management
  exitApp: () => ipcRenderer.send('app:exit'),

  // Utility functions
  log: (message) => console.log(message),
  error: (message) => console.error(message)
});