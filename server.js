const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use(session({
  secret: 'zenitsu-vip-single-dashboard-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

let licenses = [];
let scripts = [];

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized' });
}

app.use(express.static(path.join(__dirname)));

// Login Route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  try {
    const rawData = fs.readFileSync(path.join(__dirname, 'users.json'));
    const users = JSON.parse(rawData);
    const validUser = users.find(u => u.username === username && u.password === password);

    if (validUser) {
      req.session.user = { username: validUser.username, role: validUser.role };
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
  res.json({ authenticated: !!(req.session && req.session.user) });
});

// Script Routes
app.get('/api/scripts', requireAuth, (req, res) => {
  res.json(scripts);
});

app.post('/api/scripts', requireAuth, (req, res) => {
  const { name, content } = req.body;
  if (!name || !content) {
    return res.status(400).json({ success: false, message: 'Script name and content required' });
  }

  const scriptName = name.endsWith('.lua') || name.endsWith('.txt') ? name : `${name}.lua`;
  const sizeKb = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(2);

  const newScript = {
    id: '#' + Math.floor(1000000000 + Math.random() * 9000000000),
    name: scriptName,
    content: content,
    size: `${sizeKb} KB`,
    status: 'ACTIVE',
    uploadDate: new Date().toLocaleDateString('en-GB')
  };

  scripts.push(newScript);
  res.json({ success: true, script: newScript });
});

app.delete('/api/scripts/:id', requireAuth, (req, res) => {
  const scriptId = req.params.id;
  scripts = scripts.filter(s => s.id !== scriptId);
  res.json({ success: true });
});

// License Routes
app.get('/api/licenses', requireAuth, (req, res) => {
  res.json(licenses);
});

app.post('/api/licenses', requireAuth, (req, res) => {
  const { customKey, targetScript, durationDays, maxHwid } = req.body;

  const exp = new Date();
  exp.setDate(exp.getDate() + parseInt(durationDays || 30));

  const newLicense = {
    id: Date.now().toString(),
    key: customKey && customKey.trim() !== '' ? customKey.trim() : 'ZEN-EVIL-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    linkedScript: targetScript || 'UNLINKED',
    boundHwid: `0/${maxHwid || 1} HWID`,
    rawBoundHwid: null,
    maxHwid: parseInt(maxHwid || 1),
    expiry: exp.toLocaleDateString('en-GB'),
    rawExpiry: exp.toISOString(),
    status: 'active'
  };

  licenses.push(newLicense);
  res.json({ success: true, license: newLicense });
});

app.delete('/api/licenses/:id', requireAuth, (req, res) => {
  const licenseId = req.params.id;
  licenses = licenses.filter(l => l.id !== licenseId);
  res.json({ success: true });
});

app.delete('/api/licenses-all', requireAuth, (req, res) => {
  licenses = [];
  res.json({ success: true });
});

// Loader Activation Endpoint
app.post('/api/activate', (req, res) => {
  const { key, hwid } = req.body;
  const record = licenses.find(l => l.key === key);

  if (!record) {
    return res.status(404).json({ valid: false, message: 'Invalid License Key' });
  }

  if (new Date() > new Date(record.rawExpiry)) {
    record.status = 'expired';
    return res.status(403).json({ valid: false, message: 'License Expired' });
  }

  if (!record.rawBoundHwid && hwid) {
    record.rawBoundHwid = hwid;
    record.boundHwid = `1/${record.maxHwid} HWID`;
  } else if (record.rawBoundHwid && record.rawBoundHwid !== hwid) {
    return res.status(403).json({ valid: false, message: 'HWID Mismatch' });
  }

  const scriptObj = scripts.find(s => s.name === record.linkedScript);

  res.json({
    valid: true,
    message: 'Authorized',
    scriptPayload: scriptObj ? scriptObj.content : null
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`⚡ Zenitsu & Evil Panel running on port ${PORT}`);
});
