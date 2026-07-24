const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use(session({
  secret: 'zenitsu-vip-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

let licenses = [];
let scripts = [];

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ success: false, message: 'Unauthorized' });
}

app.use(express.static(path.join(__dirname)));

// Admin License Generation Route (UPDATED FOR PRE-BINDING)
app.post('/api/licenses', requireAuth, (req, res) => {
  const { customKey, targetScript, preBindHwid, durationDays, maxHwid } = req.body;

  const exp = new Date();
  exp.setDate(exp.getDate() + parseInt(durationDays || 30));

  const newLicense = {
    id: Date.now().toString(),
    key: customKey && customKey.trim() !== '' ? customKey.trim() : 'ZEN-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    linkedScript: targetScript || 'UNLINKED',
    maxHwid: parseInt(maxHwid || 1),
    // PRE-BIND LOGIC: If admin entered an HWID, lock it instantly
    rawBoundHwid: preBindHwid && preBindHwid.trim() !== '' ? preBindHwid.trim() : null,
    boundHwid: preBindHwid && preBindHwid.trim() !== '' ? `1/${maxHwid || 1} HWID` : `0/${maxHwid || 1} HWID`,
    expiry: exp.toLocaleDateString('en-GB'),
    rawExpiry: exp.toISOString(),
    status: 'active'
  };

  licenses.push(newLicense);
  res.json({ success: true, license: newLicense });
});

// Lua Loader Verification Endpoint (UPDATED)
app.post('/api/activate', (req, res) => {
  const { key, hwid } = req.body;
  const record = licenses.find(l => l.key === key);

  if (!record) {
    return res.json({ valid: false, message: 'Invalid or non-existent License Key.' });
  }

  if (new Date() > new Date(record.rawExpiry)) {
    record.status = 'expired';
    return res.json({ valid: false, message: 'Your License Key has expired.' });
  }

  // HWID Verification Engine
  if (!record.rawBoundHwid) {
    // If NO HWID was pre-bound, Auto-bind to this first device
    if (hwid) {
        record.rawBoundHwid = hwid;
        record.boundHwid = `1/${record.maxHwid} HWID`;
    }
  } else if (record.rawBoundHwid !== hwid) {
    // If HWID is bound, and the incoming HWID doesn't match
    return res.json({ valid: false, message: `HWID Mismatch! Key is locked to another device.` });
  }

  // Fetch linked Lua script
  const scriptObj = scripts.find(s => s.name === record.linkedScript);
  if (!scriptObj) {
     return res.json({ valid: false, message: 'Linked script payload not found on server.' });
  }

  // Send successful response with payload. (Ensure it parses safely in Lua by escaping quotes/newlines)
  res.json({
    valid: true,
    message: 'Authorized',
    scriptPayload: scriptObj.content.replace(/\n/g, '\\n').replace(/"/g, '\\"')
  });
});

// Include standard CRUD API endpoints from previous setup here...
app.get('/api/licenses', requireAuth, (req, res) => res.json(licenses));
app.delete('/api/licenses/:id', requireAuth, (req, res) => { licenses = licenses.filter(l => l.id !== req.params.id); res.json({ success: true }); });
app.delete('/api/licenses-all', requireAuth, (req, res) => { licenses = []; res.json({ success: true }); });
app.get('/api/scripts', requireAuth, (req, res) => res.json(scripts));
app.post('/api/scripts', requireAuth, (req, res) => { 
    const { name, content } = req.body; 
    scripts.push({ id: Date.now().toString(), name, content, size: (Buffer.byteLength(content, 'utf8') / 1024).toFixed(2) + ' KB', uploadDate: new Date().toLocaleDateString('en-GB') });
    res.json({ success: true }); 
});
app.delete('/api/scripts/:id', requireAuth, (req, res) => { scripts = scripts.filter(s => s.id !== req.params.id); res.json({ success: true }); });

// Default Route
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`⚡ Panel running on port ${PORT}`));
