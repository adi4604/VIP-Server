// Form Submission Handler with Redirect
const loginForm = document.getElementById('login-form');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('submit-btn');

    // Visual feedback
    submitBtn.innerText = "⏳ VERIFYING...";
    submitBtn.disabled = true;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        showToast("⚡ ACCESS GRANTED! REDIRECTING...");
        
        // Redirect to dashboard page
        setTimeout(() => {
          window.location.href = data.redirect || '/dashboard.html';
        }, 600);
      } else {
        showToast(data.message || 'Invalid Credentials', true);
        submitBtn.innerText = "⚡ AUTHORIZE ACCESS ⚡";
        submitBtn.disabled = false;
      }
    } catch (err) {
      showToast("Server connection failed!", true);
      submitBtn.innerText = "⚡ AUTHORIZE ACCESS ⚡";
      submitBtn.disabled = false;
    }
  });
}
