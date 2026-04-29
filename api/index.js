
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// ============================================================
// In-Memory Datenbank (Vercel ist serverless)
// ============================================================
let inMemorySponsors = [];
let nextId = 1;
const COOKIE_NAME = 'app_session_id';

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
  res.json(trpcResponse(inMemorySponsors));
});

app.post('/api/trpc/sponsors.create', (req, res) => {
  const data = req.body?.['0']?.json || req.body;
  const newSponsor = {
    id: nextId++,
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
  inMemorySponsors.push(newSponsor);
  res.json(trpcResponse(newSponsor));
});

app.post('/api/trpc/sponsors.update', (req, res) => {
  const data = req.body?.['0']?.json || req.body;
  const { id, ...updates } = data;
  const idx = inMemorySponsors.findIndex(s => s.id === id);
  if (idx < 0) return res.status(404).json([{ error: { json: { message: 'Sponsor not found' } } }]);
  inMemorySponsors[idx] = { ...inMemorySponsors[idx], ...updates, updatedAt: new Date().toISOString() };
  res.json(trpcResponse(inMemorySponsors[idx]));
});

app.post('/api/trpc/sponsors.delete', (req, res) => {
  const data = req.body?.['0']?.json || req.body;
  inMemorySponsors = inMemorySponsors.filter(s => s.id !== data.id);
  res.json(trpcResponse(true));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'in-memory' });
});

module.exports = app;
