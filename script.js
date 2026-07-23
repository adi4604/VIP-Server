// Animated Background Canvas Engine
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
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
    radius: Math.random() * 2 + 1,
    hue: Math.random() * 360
  }));

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.hue = (p.hue + 0.5) % 360;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      
      ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, 0.5)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// Toast System
function showToast(msg, isError = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderLeftColor = isError ? 'var(--red)' : 'var(--cyan)';
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Login Handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Authorization Granted!');
        setTimeout(() => {
          window.location.href = data.redirect;
        }, 500);
      } else {
        showToast(data.message || 'Invalid Credentials', true);
      }
    } catch (err) {
      showToast('Server connection failed', true);
    }
  });
}

// Reliable Copy Function (Clipboard API with execCommand Fallback)
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!');
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('Copied to clipboard!');
  } catch (err) {
    showToast('Copy failed', true);
  }
  document.body.removeChild(textArea);
}

// IST Clock Engine
function updateISTClock() {
  const timeElem = document.getElementById('ist-time-str');
  const dateElem = document.getElementById('ist-date-str');
  if (!timeElem || !dateElem) return;

  const now = new Date();
  const timeOpts = { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const dateOpts = { timeZone: 'Asia/Kolkata', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };

  timeElem.innerText = new Intl.DateTimeFormat('en-IN', timeOpts).format(now);
  dateElem.innerText = new Intl.DateTimeFormat('en-IN', dateOpts).format(now);
}
setInterval(updateISTClock, 1000);
updateISTClock();

// Dashboard Handlers
async function refreshDashboard() {
  const tbody = document.getElementById('script-tbody');
  if (!tbody) return; // Only execute if on dashboard page

  const authRes = await fetch('/api/check-auth');
  const auth = await authRes.json();
  if (!auth.authenticated) {
    window.location.href = '/';
    return;
  }

  await loadScripts();
  await loadLicenses();
}

async function loadScripts() {
  const res = await fetch('/api/scripts');
  if (!res.ok) return;
  const scripts = await res.json();

  const tbody = document.getElementById('script-tbody');
  const select = document.getElementById('target-script-select');
  let totalBytes = 0;

  if (tbody) {
    if (scripts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No scripts saved yet. Upload a script payload below.</td></tr>`;
    } else {
      tbody.innerHTML = scripts.map(s => `
        <tr>
          <td><code>${s.id}</code></td>
          <td style="color: var(--cyan); font-weight: bold;">${s.name}</td>
          <td>${s.size}</td>
          <td><span class="badge-active">ACTIVE</span></td>
          <td>${s.uploadDate}</td>
          <td>
            <button class="btn-tb btn-tb-target">Active Target</button>
            <button class="btn-tb btn-tb-delete" onclick="deleteScript('${s.id}')">Delete</button>
          </td>
        </tr>
      `).join('');
    }
  }

  if (select) {
    select.innerHTML = '<option value="">-- Select Saved Script --</option>' +
      scripts.map(s => `<option value="${s.name}">${s.name} (Active Target)</option>`).join('');
  }

  document.getElementById('stat-scripts').innerText = scripts.length;

  scripts.forEach(s => {
    const kb = parseFloat(s.size);
    if (!isNaN(kb)) totalBytes += kb;
  });
  document.getElementById('stat-storage-load').innerText = `${totalBytes.toFixed(2)} KB`;
}

async function deleteScript(id) {
  const res = await fetch(`/api/scripts/${id}`, { method: 'DELETE' });
  if (res.ok) {
    showToast('Script payload removed');
    refreshDashboard();
  } else {
    showToast('Failed to delete script', true);
  }
}

// File Upload Handler
const fileInput = document.getElementById('file-uploader');
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

// Upload Script Form Submit
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
      showToast('Script payload saved!');
      uploadForm.reset();
      refreshDashboard();
    } else {
      showToast('Failed to save script', true);
    }
  });
}

async function loadLicenses() {
  const res = await fetch('/api/licenses');
  if (!res.ok) return;
  const licenses = await res.json();

  const tbody = document.getElementById('license-tbody');
  if (tbody) {
    if (licenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No active VIP license keys generated.</td></tr>`;
    } else {
      tbody.innerHTML = licenses.map(l => `
        <tr>
          <td><code style="color: var(--cyan);">${l.key}</code></td>
          <td>${l.linkedScript}</td>
          <td>${l.boundHwid}</td>
          <td><span class="${l.status === 'active' ? 'badge-active' : 'badge-expired'}">${l.status.toUpperCase()}</span></td>
          <td>${l.expiry}</td>
          <td>
            <button class="btn-tb btn-tb-copy" onclick="copyText('${l.key}')">Copy</button>
            <button class="btn-tb btn-tb-delete" onclick="deleteLicense('${l.id}')">Delete</button>
          </td>
        </tr>
      `).join('');
    }
  }

  document.getElementById('stat-licenses').innerText = licenses.length;
  document.getElementById('stat-active').innerText = licenses.filter(l => l.status === 'active').length;
}

// Generate License Form Submit
const genForm = document.getElementById('generate-key-form');
if (genForm) {
  genForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetScript = document.getElementById('target-script-select').value;
    const customKey = document.getElementById('custom-key-input').value;
    const durationDays = document.getElementById('duration-select').value;
    const maxHwid = document.getElementById('max-hwid-input').value;

    const res = await fetch('/api/licenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetScript, customKey, durationDays, maxHwid })
    });

    if (res.ok) {
      showToast('VIP Key Generated!');
      genForm.reset();
      refreshDashboard();
    } else {
      showToast('Key generation failed', true);
    }
  });
}

async function deleteLicense(id) {
  const res = await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
  if (res.ok) {
    showToast('License Key Deleted');
    refreshDashboard();
  } else {
    showToast('Failed to delete license key', true);
  }
}

const deleteAllBtn = document.getElementById('delete-all-keys-btn');
if (deleteAllBtn) {
  deleteAllBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete ALL active keys?')) return;
    const res = await fetch('/api/licenses-all', { method: 'DELETE' });
    if (res.ok) {
      showToast('All keys deleted');
      refreshDashboard();
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

refreshDashboard();
