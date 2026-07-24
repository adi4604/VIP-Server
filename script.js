// Login Form Handler
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
      showToast('Please fill in all fields!', true);
      return;
    }

    submitBtn.innerText = '⏳ VERIFYING...';
    submitBtn.disabled = true;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('⚡ ACCESS GRANTED! REDIRECTING...');
        
        // Immediate redirect to /dashboard
        setTimeout(() => {
          window.location.href = data.redirect || '/dashboard';
        }, 400);
      } else {
        showToast(data.message || 'Invalid Credentials!', true);
        submitBtn.innerText = '⚡ AUTHORIZE ACCESS ⚡';
        submitBtn.disabled = false;
      }
    } catch (err) {
      console.error(err);
      showToast('Server error or connection failed!', true);
      submitBtn.innerText = '⚡ AUTHORIZE ACCESS ⚡';
      submitBtn.disabled = false;
    }
  });
}
