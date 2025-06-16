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
