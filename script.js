// Background Canvas Engine
const canvas = document.getElementById('bg-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 1.2,
    vy: (Math.random() - 0.5) * 1.2,
    radius: Math.random() * 2 + 1
  }));

  function animate() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0, 243, 255, 0.5)';
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// Toast Notification
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderColor = type === 'error' ? 'var(--neon-red)' : 'var(--neon-green)';
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Copy Helper
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'info');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

// Clock Engine (IST)
function updateClock() {
  const clock = document.getElementById('ist-clock');
  if (!clock) return;
  const options = { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short', year: 'numeric' };
  clock.innerText = `🇮🇳 IST: ${new Intl.DateTimeFormat('en-IN', options).format(new Date())}`;
}
setInterval(updateClock, 1000);
updateClock();

// Tab Switcher
function showSection(id) {
  document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
  const target = document.getElementById(id);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
}

// --- API DATA LOADER ---

async function refreshAllData() {
  const isDashboard = document.getElementById('dashboard-section');
  if (!isDashboard) return;

  const authRes = await fetch('/api/check-auth');
  const auth = await authRes.json();
  if (!auth.authenticated) {
    window.location.href = '/';
    return;
  }

  await loadScripts();
  await loadLicenses();
}

// Load Scripts
async function loadScripts() {
  const res = await fetch('/api/scripts');
  if (!res.ok) return;
  const scripts = await res.json();

  const tbody = document.getElementById('script-table-body');
  const selectDropdown = document.getElementById('gen-target-script');
  
  if (tbody) {
    if (scripts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No scripts saved yet. Upload a script above.</td></tr>`;
    } else {
      tbody.innerHTML = scripts.map(s => `
        <tr>
          <td><code>${s.id}</code></td>
          <td style="color: var(--neon-blue); font-weight: bold;">${s.name}</td>
          <td>${s.size}</td>
          <td><span style="color: var(--neon-green); font-weight:bold;">● ${s.status}</span></td>
          <td>${s.uploadDate}</td>
          <td>
            <button class="btn-action btn-copy" onclick="copyToClipboard(\`${encodeURIComponent(s.content)}\`)">Copy Code</button>
            <button class="btn-action btn-delete" onclick="deleteScript('${s.id}')">Delete</button>
          </td>
        </tr>
      `).join('');
    }
  }

  if (selectDropdown) {
    selectDropdown.innerHTML = '<option value="">-- Select Saved Script --</option>' + 
      scripts.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
  }

  const scriptCount = document.getElementById('stat-scripts');
  if (scriptCount) scriptCount.innerText = scripts.length;
}

// Delete Script
async function deleteScript(id) {
  const res = await fetch(`/api/scripts/${id}`, { method: 'DELETE' });
  if (res.ok) {
    showToast('Script payload deleted', 'info');
    refreshAllData();
  }
}

// File Upload Listener
const fileInput = document.getElementById('script-file-input');
if (fileInput) {
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('script-title-input').value = file.name;
    const reader = new FileReader();
    reader.onload = (evt) => {
      document.getElementById('script-content-input').value = evt.target.result;
    };
    reader.readAsText(file);
  });
}

// Upload Script Submit
const uploadForm = document.getElementById('upload-script-form');
if (uploadForm) {
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('script-title-input').value;
    const content = document.getElementById('script-content-input').value;

    const res = await fetch('/api/scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content })
    });

    if (res.ok) {
      showToast('Script saved successfully!', 'info');
      uploadForm.reset();
      refreshAllData();
    } else {
      showToast('Error saving script', 'error');
    }
  });
}

// Load Licenses
async function loadLicenses() {
  const res = await fetch('/api/licenses');
  if (!res.ok) return;
  const licenses = await res.json();

  const tbody = document.getElementById('license-table-body');
  if (tbody) {
    if (licenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No active access keys generated.</td></tr>`;
    } else {
      tbody.innerHTML = licenses.map(l => `
        <tr>
          <td><code style="color: var(--neon-blue);">${l.key}</code></td>
          <td>${l.linkedScript}</td>
          <td>${l.boundHwid}</td>
          <td><span style="color: ${l.status === 'active' ? 'var(--neon-green)' : 'var(--neon-red)'}">● ${l.status.toUpperCase()}</span></td>
          <td>${l.expiry}</td>
          <td>
            <button class="btn-action btn-copy" onclick="copyToClipboard('${l.key}')">Copy</button>
            <button class="btn-action btn-delete" onclick="deleteLicense('${l.id}')">Delete</button>
          </td>
        </tr>
      `).join('');
    }
  }

  document.getElementById('stat-licenses').innerText = licenses.length;
  document.getElementById('stat-active').innerText = licenses.filter(l => l.status === 'active').length;
  document.getElementById('stat-expired').innerText = licenses.filter(l => l.status === 'expired').length;
}

// Generate License Submit
const licenseForm = document.getElementById('license-form');
if (licenseForm) {
  licenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetScript = document.getElementById('gen-target-script').value;
    const customKey = document.getElementById('gen-custom-key').value;
    const durationDays = document.getElementById('gen-duration').value;
    const maxHwid = document.getElementById('gen-max-hwid').value;

    const res = await fetch('/api/licenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetScript, customKey, durationDays, maxHwid })
    });

    if (res.ok) {
      showToast('VIP Key Generated!', 'info');
      licenseForm.reset();
      refreshAllData();
    }
  });
}

// Delete License
async function deleteLicense(id) {
  const res = await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
  if (res.ok) {
    showToast('Key deleted', 'info');
    refreshAllData();
  }
}

// Delete All Licenses
async function deleteAllLicenses() {
  if (!confirm('Are you sure you want to delete ALL active keys?')) return;
  const res = await fetch('/api/licenses-all', { method: 'DELETE' });
  if (res.ok) {
    showToast('All keys purged', 'info');
    refreshAllData();
  }
}

// Auth Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (data.success) {
      window.location.href = data.redirect;
    } else {
      showToast(data.message, 'error');
    }
  });
}

// Logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/';
  });
}

// Run Initialization
refreshAllData();
