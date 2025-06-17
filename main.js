const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

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

// Define the path to your local Apache httpd.exe
const apacheDir = path.join(__dirname, 'bin', 'apache');
const httpdExe = path.join(apacheDir, 'bin', 'httpd.exe');

ipcMain.on('apache:start', () => {
  const confPath = path.join(apacheDir, 'conf', 'httpd.conf');
  const command = `"${httpdExe}" -f "${confPath}"`;

  exec(command, { cwd: apacheDir }, (err, stdout, stderr) => {
    if (err) {
      console.error('Failed to start Apache:', err.message);
      console.error(stderr);
    } else {
      console.log('Apache started successfully');
      console.log(stdout);
    }
  });
});

ipcMain.on('apache:stop', () => {
  exec('taskkill /F /IM httpd.exe', (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Failed to stop Apache:', err.message);
    } else {
      console.log('✅ Apache stopped successfully');
    }
  });
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

ipcMain.handle('php:getVersions', async () => {
  const phpDir = path.join(__dirname, 'bin', 'php');
  console.log(phpDir);
  
  try {
    return fs.readdirSync(phpDir).filter(f => f.startsWith('php-'));
  } catch (e) {
    return [];
  }
});
