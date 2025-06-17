let apacheRunning = false;
let mysqlRunning = false;

function toggleApache() {
  apacheRunning = !apacheRunning;
  const btn = document.getElementById('apache-toggle');
  if (apacheRunning) {
    window.api.startApache();
    btn.textContent = '⛔ Stop';
  } else {
    window.api.stopApache();
    btn.textContent = '▶ Start';
  }
}

function toggleMySQL() {
  mysqlRunning = !mysqlRunning;
  const btn = document.getElementById('mysql-toggle');
  if (mysqlRunning) {
    window.api.startMySQL();
    btn.textContent = '⛔ Stop';
  } else {
    window.api.stopMySQL();
    btn.textContent = '▶ Start';
  }
}

// Dynamically populate PHP versions in the dropdown
window.addEventListener('DOMContentLoaded', async () => {
  const select = document.getElementById('php-version');
  if (select) {
    select.innerHTML = '';
    const phpVersions = await window.api.getPhpVersions();
    console.log('Available PHP versions:', phpVersions);
    phpVersions.forEach(v => {
      // Extract version for display
      const match = v.match(/php-(\d+\.\d+\.\d+)/);
      const label = match ? `PHP ${match[1]}` : v;
      const option = document.createElement('option');
      option.value = v;
      option.textContent = label;
      select.appendChild(option);
    });
  }
});
