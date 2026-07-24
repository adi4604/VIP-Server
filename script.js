// Background Particle Canvas
const canvas = document.getElementById('bg-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = Array.from({ length: 30 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    radius: Math.random() * 2 + 1,
    hue: Math.random() * 360
  }));

  function render() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.hue = (p.hue + 0.3) % 360;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, 0.3)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(render);
  }
  render();
}

// Toast Helper
function showToast(message, isError = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderLeftColor = isError ? '#ff007f' : '#00f3ff';
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Instant Login & Redirect Handler
const loginForm = document.getElementById('login-form');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submit-btn');

    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';

    if (!username || !password) {
      showToast('Please enter both ID and Password!', true);
      return;
    }

    // Lock Button State
    submitBtn.innerText = '⏳ VERIFYING...';
    submitBtn.disabled = true;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('⚡ ACCESS GRANTED! REDIRECTING...');
        
        // INSTANT REDIRECT TO DASHBOARD
        window.location.replace(data.redirect || '/dashboard');
      } else {
        showToast(data.message || 'Invalid Credentials!', true);
        resetButton();
      }
    } catch (err) {
      console.error('Login Fetch Error:', err);
      showToast('Server connection failed!', true);
      resetButton();
    }

    function resetButton() {
      submitBtn.innerText = '⚡ AUTHORIZE ACCESS ⚡';
      submitBtn.disabled = false;
    }
  });
}
