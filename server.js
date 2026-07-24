const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.enable('trust proxy');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets (CSS, JS) BEFORE routes
app.use(express.static(path.join(__dirname)));

app.use(session({
  secret: 'zenitsu-super-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/');
}

// LOGIN ROUTE
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === 'Zenitsu' && password === 'Mands@46') {
    req.session.user = { username };
    return req.session.save((err) => {
      if (err) return res.status(500).json({ success: false, message: 'Session error' });
      return res.json({ success: true, redirect: '/dashboard' });
    });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// DASHBOARD ROUTE
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// LOGOUT ROUTE
app.get('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

app.listen(PORT, () => console.log(`⚡ Panel running on port ${PORT}`));
