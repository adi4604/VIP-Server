const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'zenitsu-vip-secret-key-99',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// In-Memory Data Storage (Initialized with defaults)
let licenses = [
  { id: '1', key: 'ZEN-9821-X9A0-2026', deviceId: 'DEV-88219A', expiry: '2026-12-31', status: 'Active', maxDevices: 1 },
  { id: '2', key: 'ZEN-1102-K2L8-2026', deviceId: 'DEV-33102B', expiry: '2026-05-15', status: 'Active', maxDevices: 2 },
  { id: '3', key: 'ZEN-4091-M0P1-2025', deviceId: 'DEV-10928C', expiry: '2025-01-01', status: 'Expired', maxDevices: 1 }
];

let scripts = [
  { id: '1', name: 'AimAssist Core', version: '2.4.1', status: 'Active', updated: '2026-07-20' },
  { id: '2', name: 'Bypass Module v3', version: '3.0.0', status: 'Active', updated: '2026-07-22' }
];

// Authentication Middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized' });
}

// Serve Static Files
app.use(express.static(path.join(__dirname)));

// API: Authentication
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  try {
    const rawData = fs.readFileSync(path.join(__dirname, 'users.json'));
    const users = JSON.parse(rawData);
    const validUser = users.find(u => u.username === username && u.password === password);

    if (validUser) {
      req.session.user = { username: validUser.username, role: validUser.role, email: validUser.email };
      return res.json({ success: true, redirect: '/dashboard.html' });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid Username or Password' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

// API: License Management (Protected)
app.get('/api/licenses', requireAuth, (req, res) => {
  res.json(licenses);
});

app.post('/api/licenses', requireAuth, (req, res) => {
  const { key, deviceId, expiry, maxDevices } = req.body;
  const newLicense = {
    id: Date.now().toString(),
    key: key || 'ZEN-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    deviceId: deviceId || 'UNBOUND',
    expiry: expiry || '2026-12-31',
    status: 'Active',
    maxDevices: maxDevices || 1
  };
  licenses.push(newLicense);
  res.json({ success: true, license: newLicense });
});

app.delete('/api/licenses/:id', requireAuth, (req, res) => {
  licenses = licenses.filter(l => l.id !== req.params.id);
  res.json({ success: true });
});

// API: Script Management (Protected)
app.get('/api/scripts', requireAuth, (req, res) => {
  res.json(scripts);
});

app.post('/api/scripts', requireAuth, (req, res) => {
  const { name, version, status } = req.body;
  const newScript = {
    id: Date.now().toString(),
    name,
    version,
    status: status || 'Active',
    updated: new Date().toISOString().split('T')[0]
  };
  scripts.push(newScript);
  res.json({ success: true, script: newScript });
});

app.delete('/api/scripts/:id', requireAuth, (req, res) => {
  scripts = scripts.filter(s => s.id !== req.params.id);
  res.json({ success: true });
});

// API: External Validation Endpoint for Loader/Script System
app.post('/api/validate-key', (req, res) => {
  const { key, deviceId } = req.body;

  if (!key) {
    return res.status(400).json({ valid: false, message: 'License key is required' });
  }

  const record = licenses.find(l => l.key === key);

  if (!record) {
    return res.status(404).json({ valid: false, message: 'Invalid License Key' });
  }

  // Check Expiry
  const currentDate = new Date();
  const expiryDate = new Date(record.expiry);
  if (currentDate > expiryDate) {
    record.status = 'Expired';
    return res.status(403).json({ valid: false, message: 'License Key Expired' });
  }

  // Device Binding Logic
  if (record.deviceId === 'UNBOUND') {
    record.deviceId = deviceId || 'DEV-AUTO-BOUND';
  } else if (deviceId && record.deviceId !== deviceId) {
    return res.status(403).json({ valid: false, message: 'Hardware ID Mismatch / Device Limit Exceeded' });
  }

  res.json({
    valid: true,
    message: 'Access Granted',
    key: record.key,
    expiry: record.expiry,
    status: record.status,
    boundDevice: record.deviceId
  });
});

// Root Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`⚡ ZENITSU VIP SERVER running on port ${PORT}`);
});
    
