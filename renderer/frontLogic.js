// Service state tracking
let serviceStates = {
  apache: 'stopped',
  mysql: 'stopped'
};

// UI Elements
let elements = {};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
  setupEventListeners();
  loadInitialData();
});

// Initialize UI elements
function initializeElements() {
  elements = {
    apacheToggle: document.getElementById('apache-toggle'),
    mysqlToggle: document.getElementById('mysql-toggle'),
    apacheStatus: document.getElementById('apache-status'),
    mysqlStatus: document.getElementById('mysql-status'),
    phpVersionSelect: document.getElementById('php-version-select'),
    startAllBtn: document.getElementById('start-all'),
    stopAllBtn: document.getElementById('stop-all'),
    openPhpMyAdminBtn: document.getElementById('open-phpmyadmin'),
    statusLog: document.getElementById('status-log'),
    minimizeBtn: document.getElementById('minimize-btn'),
    maximizeBtn: document.getElementById('maximize-btn'),
    closeBtn: document.getElementById('close-btn')
  };
}

// Setup event listeners
function setupEventListeners() {
  // Service toggles
  if (elements.apacheToggle) {
    elements.apacheToggle.addEventListener('click', toggleApache);
  }
  
  if (elements.mysqlToggle) {
    elements.mysqlToggle.addEventListener('click', toggleMySQL);
  }

  // Service management
  if (elements.startAllBtn) {
    elements.startAllBtn.addEventListener('click', startAllServices);
  }
  
  if (elements.stopAllBtn) {
    elements.stopAllBtn.addEventListener('click', stopAllServices);
  }

  // phpMyAdmin
  if (elements.openPhpMyAdminBtn) {
    elements.openPhpMyAdminBtn.addEventListener('click', openPhpMyAdmin);
  }

  // PHP version switching
  if (elements.phpVersionSelect) {
    elements.phpVersionSelect.addEventListener('change', switchPhpVersion);
  }

  // Window controls
  if (elements.minimizeBtn) {
    elements.minimizeBtn.addEventListener('click', () => window.api.minimizeWindow());
  }
  
  if (elements.maximizeBtn) {
    elements.maximizeBtn.addEventListener('click', () => window.api.maximizeWindow());
  }
  
  if (elements.closeBtn) {
    elements.closeBtn.addEventListener('click', () => window.api.closeWindow());
  }

  // Listen for service status updates
  window.api.onServiceStatus((statusData) => {
    handleServiceStatus(statusData);
  });

  // Listen for app ready
  window.api.onAppReady(() => {
    console.log('App opened – running startup method...');
    logStatus('Application started successfully', 'success');
  });
}

// Load initial data
async function loadInitialData() {
  try {
    // Load current service status
    const status = await window.api.getServiceStatus();
    updateServiceStates(status);

    // Load PHP versions
    const phpVersions = await window.api.getPhpVersions();
    populatePhpVersions(phpVersions);

    logStatus('Initial data loaded', 'info');
  } catch (error) {
    console.error('Error loading initial data:', error);
    logStatus('Error loading initial data', 'error');
  }
}

// Apache toggle function
function toggleApache() {
  const currentState = serviceStates.apache;
  
  if (currentState === 'running') {
    stopApache();
  } else if (currentState === 'stopped') {
    startApache();
  }
}

// MySQL toggle function
function toggleMySQL() {
  const currentState = serviceStates.mysql;
  
  if (currentState === 'running') {
    stopMySQL();
  } else if (currentState === 'stopped') {
    startMySQL();
  }
}

// Individual service functions
function startApache() {
  setServiceState('apache', 'starting');
  window.api.startApache();
  logStatus('Starting Apache...', 'info');
}

function stopApache() {
  setServiceState('apache', 'stopping');
  window.api.stopApache();
  logStatus('Stopping Apache...', 'info');
}

function startMySQL() {
  setServiceState('mysql', 'starting');
  window.api.startMySQL();
  logStatus('Starting MySQL...', 'info');
}

function stopMySQL() {
  setServiceState('mysql', 'stopping');
  window.api.stopMySQL();
  logStatus('Stopping MySQL...', 'info');
}

// Service management functions
function startAllServices() {
  window.api.startAll();
  logStatus('Starting all services...', 'info');
}

function stopAllServices() {
  window.api.stopAll();
  logStatus('Stopping all services...', 'info');
}

// phpMyAdmin
function openPhpMyAdmin() {
  if (serviceStates.apache !== 'running') {
    logStatus('Apache must be running to open phpMyAdmin', 'warning');
    return;
  }
  
  window.api.openPhpMyAdmin();
  logStatus('Opening phpMyAdmin...', 'info');
}

// PHP version switching
function switchPhpVersion() {
  const version = elements.phpVersionSelect.value;
  if (version) {
    window.api.switchPhpVersion(version);
    logStatus(`Switching to PHP ${version}...`, 'info');
  }
}

// Handle service status updates from main process
function handleServiceStatus(statusData) {
  const { service, status, message } = statusData;
  
  setServiceState(service, status);
  
  if (message) {
    const logType = status === 'error' ? 'error' : 
                   status === 'running' ? 'success' : 'info';
    logStatus(message, logType);
  }
}

// Update service states
function updateServiceStates(states) {
  Object.keys(states).forEach(service => {
    setServiceState(service, states[service]);
  });
}

// Set individual service state and update UI
function setServiceState(service, state) {
  serviceStates[service] = state;
  updateServiceUI(service, state);
}

// Update service UI based on state
function updateServiceUI(service, state) {
  const toggleBtn = elements[`${service}Toggle`];
  const statusElement = elements[`${service}Status`];
  
  if (!toggleBtn) return;

  // Update button text and state
  switch (state) {
    case 'running':
      toggleBtn.textContent = '⛔ Stop';
      toggleBtn.className = 'btn btn-stop';
      toggleBtn.disabled = false;
      break;
    case 'stopped':
      toggleBtn.textContent = '▶ Start';
      toggleBtn.className = 'btn btn-start';
      toggleBtn.disabled = false;
      break;
    case 'starting':
    case 'stopping':
      toggleBtn.textContent = '⏳ ' + (state === 'starting' ? 'Starting...' : 'Stopping...');
      toggleBtn.className = 'btn btn-loading';
      toggleBtn.disabled = true;
      break;
    case 'error':
      toggleBtn.textContent = '❌ Error';
      toggleBtn.className = 'btn btn-error';
      toggleBtn.disabled = false;
      break;
    default:
      toggleBtn.textContent = '❓ Unknown';
      toggleBtn.className = 'btn btn-unknown';
      toggleBtn.disabled = false;
  }
  
  // Update status indicator
  if (statusElement) {
    statusElement.textContent = state.charAt(0).toUpperCase() + state.slice(1);
    statusElement.className = `status status-${state}`;
  }
}

// Populate PHP versions dropdown
function populatePhpVersions(versions) {
  if (!elements.phpVersionSelect || !versions.length) return;
  
  // Clear existing options
  elements.phpVersionSelect.innerHTML = '<option value="">Select PHP Version</option>';
  
  // Add version options
  versions.forEach(version => {
    const option = document.createElement('option');
    option.value = version;
    option.textContent = `PHP ${version}`;
    elements.phpVersionSelect.appendChild(option);
  });
  
  logStatus(`Found ${versions.length} PHP versions`, 'info');
}

// Logging function
function logStatus(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  if (elements.statusLog) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.innerHTML = `<span class="timestamp">${timestamp}</span> ${message}`;
    
    elements.statusLog.appendChild(logEntry);
    elements.statusLog.scrollTop = elements.statusLog.scrollHeight;
    
    // Keep only last 100 log entries
    while (elements.statusLog.children.length > 100) {
      elements.statusLog.removeChild(elements.statusLog.firstChild);
    }
  }
}

// Utility functions
function showNotification(message, type = 'info') {
  // You can implement toast notifications here
  logStatus(message, type);
}

// Cleanup function (call when app is closing)
function cleanup() {
  window.api.removeAllListeners('service-status');
  window.api.removeAllListeners('app-ready');
}

// Handle page unload
window.addEventListener('beforeunload', cleanup);