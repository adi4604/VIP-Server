const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Session Configuration
app.use(session({
  secret: 'zenitsu-secret-key-12345',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS/Production domain
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

// 3. Auth Guard Middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/');
}

// 4. API Login Endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Check Admin Credentials
  if (username === 'Zenitsu' && password === 'Mands@46') {
    req.session.user = { username };
    
    // Explicitly save the session before responding
    return req.session.save((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Session save failed' });
      }
      return res.json({ success: true, redirect: '/dashboard' });
    });
  }

  return res.status(401).json({ 
    success: false, 
    message: 'Invalid Admin Identifier or Access Key!' 
  });
});

// 5. Protected Dashboard Route
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// 6. Logout Route
app.get('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// 7. Static File Serving (Must be placed below custom routes)
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`⚡ Zenitsu Panel running on http://localhost:${PORT}`);
});
