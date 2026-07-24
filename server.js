const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Setup
app.use(session({
  secret: 'zenitsu-super-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 Hours
}));

// Authentication Middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/');
}

// 1. API Login Route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Verify credentials
  if (username === 'Zenitsu' && password === 'Mands@46') {
    req.session.user = { username };
    return res.json({ 
      success: true, 
      redirect: '/dashboard.html' 
    });
  }

  return res.status(401).json({ 
    success: false, 
    message: 'Invalid Username or Security Key!' 
  });
});

// 2. API Logout Route
app.get('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// 3. Protected Dashboard Route
app.get('/dashboard.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Serve static assets (CSS, JS, index.html)
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
