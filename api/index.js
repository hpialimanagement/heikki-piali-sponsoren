
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// ============================================================
// Dateibasierte Speicherung (GitHub)
// ============================================================
const DATA_DIR = path.join(process.cwd(), 'data');
const SPONSORS_FILE = path.join(DATA_DIR, 'sponsors.json');
const COOKIE_NAME = 'app_session_id';

// Stelle sicher, dass das Verzeichnis existiert
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialisiere die Datei, falls sie nicht existiert
if (!fs.existsSync(SPONSORS_FILE)) {
  fs.writeFileSync(SPONSORS_FILE, JSON.stringify([], null, 2));
}

// Lade Sponsoren aus der Datei
function loadSponsors() {
  try {
    const data = fs.readFileSync(SPONSORS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[File] Error reading sponsors:', error);
    return [];
  }
}

// Speichere Sponsoren in der Datei und committe zu Git
function saveSponsors(sponsors, message = 'Update sponsors data') {
  try {
    fs.writeFileSync(SPONSORS_FILE, JSON.stringify(sponsors, null, 2));
    
    // Versuche, zu Git zu committen (funktioniert nur wenn Git konfiguriert ist)
    try {
      execSync('cd ' + process.cwd() + ' && git add data/sponsors.json && git commit -m "' + message + '" 2>/dev/null || true', {
        stdio: 'pipe'
      });
    } catch (gitError) {
      // Git-Fehler ignorieren (z.B. wenn nicht konfiguriert)
    }
    
    return true;
  } catch (error) {
    console.error('[File] Error writing sponsors:', error);
    return false;
  }
}

// Helper to wrap response in tRPC/SuperJSON format
function trpcResponse(data) {
  return [{
    result: {
      data: {
        json: data
      }
    }
  }];
}

// tRPC-compatible JSON API endpoints
app.post('/api/trpc/auth.login', (req, res) => {
  // Immer erfolgreich (kein Passwort erforderlich)
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=authenticated; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=315360000`);
  res.json(trpcResponse({ success: true }));
});

app.post('/api/trpc/auth.logout', (req, res) => {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`);
  res.json(trpcResponse({ success: true }));
});

app.get('/api/trpc/auth.me', (req, res) => {
  // Immer authentifiziert
  res.json(trpcResponse({ isAuthenticated: true }));
});

// Sponsoren-Liste: ÖFFENTLICH
app.get('/api/trpc/sponsors.list', (req, res) => {
  const sponsors = loadSponsors();
  res.json(trpcResponse(sponsors));
});

app.post('/api/trpc/sponsors.create', (req, res) => {
  const data = req.body?.['0']?.json || req.body;
  const sponsors = loadSponsors();
  
  const nextId = sponsors.length > 0 ? Math.max(...sponsors.map(s => s.id)) + 1 : 1;
  const newSponsor = {
    id: nextId,
    companyName: data.companyName,
    contactPerson: data.contactPerson,
    email: data.email,
    notes: data.notes || '',
    status: data.status || 'Noch nicht kontaktiert',
    emailSentDate: null,
    responseDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  sponsors.push(newSponsor);
  saveSponsors(sponsors, `Add sponsor: ${newSponsor.companyName}`);
  res.json(trpcResponse(newSponsor));
});

app.post('/api/trpc/sponsors.update', (req, res) => {
  const data = req.body?.['0']?.json || req.body;
  const { id, ...updates } = data;
  const sponsors = loadSponsors();
  
  const idx = sponsors.findIndex(s => s.id === id);
  if (idx < 0) return res.status(404).json([{ error: { json: { message: 'Sponsor not found' } } }]);
  
  sponsors[idx] = { ...sponsors[idx], ...updates, updatedAt: new Date().toISOString() };
  saveSponsors(sponsors, `Update sponsor: ${sponsors[idx].companyName}`);
  res.json(trpcResponse(sponsors[idx]));
});

app.post('/api/trpc/sponsors.delete', (req, res) => {
  const data = req.body?.['0']?.json || req.body;
  const sponsors = loadSponsors();
  
  const deletedSponsor = sponsors.find(s => s.id === data.id);
  const filtered = sponsors.filter(s => s.id !== data.id);
  saveSponsors(filtered, `Delete sponsor: ${deletedSponsor?.companyName || 'Unknown'}`);
  res.json(trpcResponse(true));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'file-based' });
});

module.exports = app;
