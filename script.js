// Interactive 3D Parallax Tilt Engine
const tiltWrapper = document.getElementById('tilt-wrapper');
const tiltCard = document.getElementById('tilt-card');

if (tiltWrapper && tiltCard) {
  tiltWrapper.addEventListener('mousemove', (e) => {
    const rect = tiltWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left; // Mouse X position within element
    const y = e.clientY - rect.top;  // Mouse Y position within element

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation angles (-15 to +15 degrees max tilt)
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    tiltCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  // Reset orientation when mouse leaves the card
  tiltWrapper.addEventListener('mouseleave', () => {
    tiltCard.style.transform = `rotateX(0deg) rotateY(0deg)`;
    tiltCard.style.transition = 'transform 0.5s ease';
  });

  tiltWrapper.addEventListener('mouseenter', () => {
    tiltCard.style.transition = 'transform 0.1s ease-out';
  });
}

// Interactive RGB Particle Canvas Background
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
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    radius: Math.random() * 2 + 1,
    hue: Math.random() * 360
  }));

  function animateCanvas() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.hue = (p.hue + 0.4) % 360;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, 0.4)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(animateCanvas);
  }
  animateCanvas();
}

// Toast System
function showToast(msg, isError = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderLeftColor = isError ? 'var(--magenta-neon)' : 'var(--cyan-neon)';
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// Login Submit Handler
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
        showToast('⚡ Authorization Granted!');
        setTimeout(() => {
          window.location.href = data.redirect;
        }, 600);
      } else {
        showToast(data.message || 'Invalid Credentials', true);
      }
    } catch (err) {
      showToast('Server connection failed', true);
    }
  });
}
