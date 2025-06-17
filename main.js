const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let apacheProcess = null;
let mysqlProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false // Security best practice
    }
  });

  mainWindow.loadFile('renderer/index.html');

  // Notify renderer when ready
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('App is ready in main.js');
    mainWindow.webContents.send('app-ready');
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // Stop all services before quitting
  stopAllServices();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Define paths
const apacheDir = path.join(__dirname, 'bin', 'apache');
const httpdExe = path.join(apacheDir, 'bin', 'httpd.exe');
const mysqlDir = path.join(__dirname, 'bin', 'mysql');
const mysqldExe = path.join(mysqlDir, 'bin', 'mysqld.exe');

// Configuration file path
const configPath = path.join(__dirname, 'config.json');

// Default configuration
const defaultConfig = {
  selectedPhpVersion: '',
  autoStartServices: false,
  lastWindowState: {
    width: 800,
    height: 500
  }
};

// Load configuration
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return { ...defaultConfig, ...JSON.parse(configData) };
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return defaultConfig;
}

// Save configuration
function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('Configuration saved');
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

// Global configuration
let appConfig = loadConfig();

// Helper function to send status updates to renderer
function sendStatus(service, status, message = '') {
  if (mainWindow) {
    mainWindow.webContents.send('service-status', { service, status, message });
  }
}

// Apache management
ipcMain.on('apache:start', () => {
  if (apacheProcess) {
    sendStatus('apache', 'error', 'Apache is already running');
    return;
  }

  const confPath = path.join(apacheDir, 'conf', 'httpd.conf');
  
  // Check if httpd.exe exists
  if (!fs.existsSync(httpdExe)) {
    sendStatus('apache', 'error', 'Apache executable not found');
    return;
  }

  const command = `"${httpdExe}" -f "${confPath}"`;
  
  apacheProcess = exec(command, { cwd: apacheDir }, (err, stdout, stderr) => {
    if (err) {
      console.error('Failed to start Apache:', err.message);
      sendStatus('apache', 'error', err.message);
      apacheProcess = null;
    } else {
      console.log('Apache started successfully');
      sendStatus('apache', 'running', 'Apache started successfully');
    }
  });

  apacheProcess.on('exit', (code) => {
    console.log(`Apache process exited with code ${code}`);
    apacheProcess = null;
    sendStatus('apache', 'stopped', `Apache stopped (exit code: ${code})`);
  });
});

ipcMain.on('apache:stop', () => {
  if (apacheProcess) {
    apacheProcess.kill();
    apacheProcess = null;
  }
  
  exec('taskkill /F /IM httpd.exe', (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Failed to stop Apache:', err.message);
      sendStatus('apache', 'error', 'Failed to stop Apache');
    } else {
      console.log('✅ Apache stopped successfully');
      sendStatus('apache', 'stopped', 'Apache stopped successfully');
    }
  });
});

// MySQL management
ipcMain.on('mysql:start', () => {
  if (mysqlProcess) {
    sendStatus('mysql', 'error', 'MySQL is already running');
    return;
  }

  if (!fs.existsSync(mysqldExe)) {
    sendStatus('mysql', 'error', 'MySQL executable not found');
    return;
  }

  const dataDir = path.join(mysqlDir, 'data');
  const args = [
    `--datadir=${dataDir}`,
    '--console'
  ];

  mysqlProcess = spawn(mysqldExe, args, { cwd: mysqlDir });

  mysqlProcess.stdout.on('data', (data) => {
    console.log(`MySQL: ${data}`);
    if (data.toString().includes('ready for connections')) {
      sendStatus('mysql', 'running', 'MySQL started successfully');
    }
  });

  mysqlProcess.stderr.on('data', (data) => {
    console.error(`MySQL Error: ${data}`);
  });

  mysqlProcess.on('exit', (code) => {
    console.log(`MySQL process exited with code ${code}`);
    mysqlProcess = null;
    sendStatus('mysql', 'stopped', `MySQL stopped (exit code: ${code})`);
  });

  mysqlProcess.on('error', (err) => {
    console.error('Failed to start MySQL:', err.message);
    sendStatus('mysql', 'error', err.message);
    mysqlProcess = null;
  });
});

ipcMain.on('mysql:stop', () => {
  if (mysqlProcess) {
    mysqlProcess.kill();
    mysqlProcess = null;
  }
  
  exec('taskkill /F /IM mysqld.exe', (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Failed to stop MySQL:', err.message);
      sendStatus('mysql', 'error', 'Failed to stop MySQL');
    } else {
      console.log('✅ MySQL stopped successfully');
      sendStatus('mysql', 'stopped', 'MySQL stopped successfully');
    }
  });
});

// phpMyAdmin management
ipcMain.on('phpmyadmin:open', () => {
  const url = 'http://localhost/phpmyadmin';
  shell.openExternal(url).then(() => {
    console.log('phpMyAdmin opened in browser');
    sendStatus('phpmyadmin', 'opened', 'phpMyAdmin opened in browser');
  }).catch((err) => {
    console.error('Failed to open phpMyAdmin:', err);
    sendStatus('phpmyadmin', 'error', 'Failed to open phpMyAdmin');
  });
});

// PHP version switching
ipcMain.on('php:switch', (event, version) => {
  const phpVersionDir = path.join(__dirname, 'bin', 'php', version);
  const phpIni = path.join(phpVersionDir, 'php.ini');
  
  if (!fs.existsSync(phpVersionDir)) {1
    sendStatus('php', 'error', `PHP version ${version} not found`);
    return;
  }

  // Here you would implement the logic to switch PHP versions
  // This might involve updating Apache configuration, PATH environment, etc.
  
  console.log(`Switching to PHP version: ${version}`);
  sendStatus('php', 'switched', `Switched to PHP ${version}`);
});

// Service management
function stopAllServices() {
  if (apacheProcess) {
    apacheProcess.kill();
    apacheProcess = null;
  }
  if (mysqlProcess) {
    mysqlProcess.kill();
    mysqlProcess = null;
  }
  
  // Force kill any remaining processes
  exec('taskkill /F /IM httpd.exe', () => {});
  exec('taskkill /F /IM mysqld.exe', () => {});
}

ipcMain.on('services:startAll', () => {
  console.log('Starting all services...');
  
  // Start Apache first
  mainWindow.webContents.send('apache:start');
  
  // Start MySQL after a short delay
  setTimeout(() => {
    mainWindow.webContents.send('mysql:start');
  }, 2000);
  
  sendStatus('services', 'starting', 'Starting all services...');
});

ipcMain.on('services:stopAll', () => {
  console.log('Stopping all services...');
  stopAllServices();
  sendStatus('services', 'stopped', 'All services stopped');
});

ipcMain.on('app:exit', () => {
  stopAllServices();
  app.quit();
});

// Get available PHP versions
ipcMain.handle('php:getVersions', async () => {
  const phpDir = path.join(__dirname, 'bin', 'php');
  console.log('PHP directory:', phpDir);
  
  try {
    if (!fs.existsSync(phpDir)) {
      console.log('PHP directory does not exist');
      return [];
    }
    
    const versions = fs.readdirSync(phpDir)
      .filter(f => {
        const fullPath = path.join(phpDir, f);
        return fs.statSync(fullPath).isDirectory() && f.startsWith('php-');
      })
      .map(f => f.replace('php-', ''));
    
    console.log('Found PHP versions:', versions);
    return versions;
  } catch (e) {
    console.error('Error reading PHP versions:', e);
    return [];
  }
});

// Get service status
ipcMain.handle('services:getStatus', async () => {
  return {
    apache: apacheProcess ? 'running' : 'stopped',
    mysql: mysqlProcess ? 'running' : 'stopped'
  };
});

// Window controls for frameless window
ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});