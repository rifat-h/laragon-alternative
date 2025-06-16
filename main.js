const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 500,
    frame: false, // Remove ElectronJS toolbar (title bar and window controls)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('renderer/index.html');
}

app.whenReady().then(createWindow);

ipcMain.on('apache:start', () => {
  console.log('Apache start requested');
});
ipcMain.on('apache:stop', () => {
  console.log('Apache stop requested');
});

ipcMain.on('mysql:start', () => {
  console.log('MySQL start requested');
});
ipcMain.on('mysql:stop', () => {
  console.log('MySQL stop requested');
});

ipcMain.on('phpmyadmin:open', () => {
  console.log('phpMyAdmin open requested');
});

ipcMain.on('php:switch', (event, version) => {
  console.log(`PHP switch requested to version: ${version}`);
});

ipcMain.on('services:startAll', () => {
  console.log('Start all services requested');
});

ipcMain.on('services:stopAll', () => {
  console.log('Stop all services requested');
});

ipcMain.on('app:exit', () => {
  app.quit();
});
