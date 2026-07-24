const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable reverse proxy trust (Crucial for hosting platforms like Render / Glitch / Heroku)
app.enable('trust proxy');

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Storage Configuration
app.use(session({
  secret: 'zenitsu-super-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Keep false unless running on full HTTPS with SSL certificate
    maxAge: 24 * 60 * 60 * 1000 // 24 Hours
  }
}));

// Auth Guard Middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/');
}

// ------------------- ROUTES -------------------

// 1. LOGIN API ENDPOINT
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  // Check Credentials
  if (username === 'Zenitsu' && password === 'Mands@46') {
    req.session.user = { username };

    // Force save session to disk/memory BEFORE sending success response
    return req.session.save((err) => {
      if (err) {
        console.error('Session Save Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to create session.' });
      }
      return res.status(200).json({ success: true, redirect: '/dashboard' });
    });
  }

  return res.status(401).json({ 
    success: false, 
    message: 'Invalid Admin Identifier or Access Key!' 
  });
});

// 2. PROTECTED DASHBOARD ROUTE
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// 3. LOGOUT ROUTE
app.get('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// 4. SERVE STATIC FILES (Placed BELOW API routes to prevent route hijacking)
app.use(express.static(path.join(__dirname)));

// 5. CATCH-ALL ROUTE (Prevents infinite pending requests)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`⚡ Panel active on port ${PORT}`);
});
