// [KEEP PREVIOUS CANVAS ANIMATION, TOASTS, CLOCK, LOGIN AND SCRIPT LOGIC FROM PREVIOUS RESPONSE HERE]
// ... (Include canvas animation and helper functions from previous output) ...

// Canvas Animation
const canvas = document.getElementById('bg-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  window.addEventListener('resize', () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; });
  const particles = Array.from({ length: 40 }, () => ({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8, radius: Math.random() * 2 + 1, hue: Math.random() * 360 }));
  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.hue = (p.hue + 0.5) % 360;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, 0.5)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// Helpers
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

function updateISTClock() {
  const timeElem = document.getElementById('ist-time-str');
  const dateElem = document.getElementById('ist-date-str');
  if (!timeElem || !dateElem) return;
  const now = new Date();
  timeElem.innerText = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
  dateElem.innerText = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(now);
}
setInterval(updateISTClock, 1000); updateISTClock();

// Key Generation (UPDATED FOR PRE-BIND)
const genForm = document.getElementById('generate-key-form');
if (genForm) {
  genForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetScript = document.getElementById('target-script-select').value;
    const customKey = document.getElementById('custom-key-input').value;
    const preBindHwid = document.getElementById('prebind-hwid-input').value; // Get Pre-bind HWID
    const durationDays = document.getElementById('duration-select').value;
    const maxHwid = document.getElementById('max-hwid-input').value;

    const res = await fetch('/api/licenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetScript, customKey, preBindHwid, durationDays, maxHwid })
    });

    if (res.ok) {
      showToast('VIP Key Generated Successfully!');
      genForm.reset();
      refreshDashboard();
    } else {
      showToast('Key generation failed', true);
    }
  });
}

// Ensure loadLicenses shows actual HWID strings if pre-bound
async function loadLicenses() {
  const res = await fetch('/api/licenses');
  if (!res.ok) return;
  const licenses = await res.json();
  const tbody = document.getElementById('license-tbody');
  
  if (tbody) {
    if (licenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No active VIP keys.</td></tr>`;
    } else {
      tbody.innerHTML = licenses.map(l => {
        // Show raw HWID if bound, else show 0/1 HWID
        const hwidDisplay = l.rawBoundHwid ? `<span style="font-size: 10px;">${l.rawBoundHwid}</span>` : l.boundHwid;
        return `
        <tr>
          <td><code style="color: var(--cyan);">${l.key}</code></td>
          <td>${l.linkedScript}</td>
          <td>${hwidDisplay}</td>
          <td><span class="${l.status === 'active' ? 'badge-active' : 'badge-expired'}">${l.status.toUpperCase()}</span></td>
          <td>${l.expiry}</td>
          <td>
            <button class="btn-tb btn-tb-delete" onclick="deleteLicense('${l.id}')">Delete</button>
          </td>
        </tr>
      `}).join('');
    }
  }
  document.getElementById('stat-licenses').innerText = licenses.length;
  document.getElementById('stat-active').innerText = licenses.filter(l => l.status === 'active').length;
}

// Call standard dashboard refresh on load
if (document.getElementById('script-tbody')) {
    // Requires implementation of loadScripts(), deleteScript(), etc. from previous response.
    // Ensure all those standard functions are merged here.
    refreshDashboard();
}

async function refreshDashboard() {
  await loadScripts();
  await loadLicenses();
}
// (Re-add script upload and script load functions here as provided in previous code)
