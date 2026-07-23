// Interactive Particle & Matrix Grid Background Engine
const canvas = document.getElementById('bg-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = Array.from({ length: 45 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
    radius: Math.random() * 2 + 1
  }));

  function animateBg() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0, 243, 255, 0.6)';
    
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(animateBg);
  }
  animateBg();
}

// Toast System
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderColor = type === 'error' ? 'var(--neon-red)' : 'var(--neon-blue)';
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Indian Standard Time (IST) Digital Clock Engine
function updateClock() {
  const clockElement = document.getElementById('ist-clock');
  if (!clockElement) return;

  const options = {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };

  const formatter = new Intl.DateTimeFormat('en-IN', options);
  clockElement.innerText = `IST: ${formatter.format(new Date())}`;
}
setInterval(updateClock, 1000);
updateClock();

// UI Navigation Controller
function showSection(sectionId) {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(sec => sec.style.display = 'none');
  const target = document.getElementById(sectionId);
  if (target) target.style.display = 'block';

  const menuItems = document.querySelectorAll('.sidebar-menu li');
  menuItems.forEach(item => item.classList.remove('active'));
}

// Auth Handlers
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
        showToast('Login Successful! Redirecting...', 'info');
        setTimeout(() => { window.location.href = data.redirect; }, 1000);
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Authentication failed', 'error');
    }
  });
}

// Dashboard Initializer & API Integrations
async function initDashboard() {
  const isDashboard = document.getElementById('dashboard-section');
  if (!isDashboard) return;

  // Check Session
  const authRes = await fetch('/api/check-auth');
  const authData = await authRes.json();
  if (!authData.authenticated) {
    window.location.href = '/';
    return;
  }

  loadLicenses();
  loadScripts();
}

async function loadLicenses() {
  const res = await fetch('/api/licenses');
  if (!res.ok) return;
  const data = await res.json();

  const tbody = document.getElementById('license-table-body');
  if (!tbody) return;

  tbody.innerHTML = data.map(lic => `
    <tr>
      <td style="color: var(--neon-blue); font-weight: bold;">${lic.key}</td>
      <td>${lic.deviceId}</td>
      <td>${lic.expiry}</td>
      <td><span style="color: ${lic.status === 'Active' ? 'var(--neon-green)' : 'var(--neon-red)'}">${lic.status}</span></td>
      <td><button onclick="deleteLicense('${lic.id}')" style="background:transparent; border:1px solid var(--neon-red); color:#fff; padding:4px 8px; border-radius:4px; cursor:pointer;">Delete</button></td>
    </tr>
  `).join('');

  document.getElementById('stat-licenses').innerText = data.length;
  document.getElementById('stat-active').innerText = data.filter(l => l.status === 'Active').length;
  document.getElementById('stat-expired').innerText = data.filter(l => l.status === 'Expired').length;
}

async function generateLicense() {
  const res = await fetch('/api/licenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  if (res.ok) {
    showToast('New Key Generated Successfully');
    loadLicenses();
  }
}

async function deleteLicense(id) {
  const res = await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
  if (res.ok) {
    showToast('Key Revoked');
    loadLicenses();
  }
}

async function loadScripts() {
  const res = await fetch('/api/scripts');
  if (!res.ok) return;
  const data = await res.json();

  const tbody = document.getElementById('script-table-body');
  if (!tbody) return;

  tbody.innerHTML = data.map(s => `
    <tr>
      <td>${s.name}</td>
      <td>${s.version}</td>
      <td>${s.updated}</td>
      <td><span style="color: var(--neon-green)">${s.status}</span></td>
    </tr>
  `).join('');

  document.getElementById('stat-scripts').innerText = data.length;
}

// Logout Handler
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/';
  });
}

// Run Dashboard Logic
initDashboard();
    
