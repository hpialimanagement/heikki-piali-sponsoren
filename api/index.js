
// Minimal Express handler for Vercel
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
const MASTER_PASSWORD = 'Management';

// Auth check middleware
function requireAuth(req, res, next) {
  const isAuthenticated = req.cookies?.['manus-session'] === 'authenticated';
  if (!isAuthenticated) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentifizierung erforderlich' } });
  }
  next();
}

// tRPC-compatible JSON API endpoints
app.post('/api/trpc/auth.login', (req, res) => {
  const { password } = req.body?.['0']?.json || req.body;
  if (password === MASTER_PASSWORD) {
    res.setHeader('Set-Cookie', `manus-session=authenticated; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=315360000`);
    res.json([{ result: { data: { json: { success: true } } } }]);
  } else {
    res.status(401).json([{ error: { json: { message: 'Falsches Passwort', code: -32600 } } }]);
  }
});

app.post('/api/trpc/auth.logout', (req, res) => {
  res.setHeader('Set-Cookie', `manus-session=; Path=/; HttpOnly; Max-Age=0`);
  res.json([{ result: { data: { json: { success: true } } } }]);
});

app.get('/api/trpc/auth.me', (req, res) => {
  const isAuthenticated = req.cookies?.['manus-session'] === 'authenticated';
  res.json([{ result: { data: { json: { isAuthenticated } } } }]);
});

app.get('/api/trpc/sponsors.list', requireAuth, (req, res) => {
  res.json([{ result: { data: { json: inMemorySponsors } } }]);
});

app.post('/api/trpc/sponsors.create', requireAuth, (req, res) => {
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
  res.json([{ result: { data: { json: newSponsor } } }]);
});

app.post('/api/trpc/sponsors.update', requireAuth, (req, res) => {
  const data = req.body?.['0']?.json || req.body;
  const { id, ...updates } = data;
  const idx = inMemorySponsors.findIndex(s => s.id === id);
  if (idx < 0) return res.status(404).json([{ error: { json: { message: 'Sponsor not found' } } }]);
  inMemorySponsors[idx] = { ...inMemorySponsors[idx], ...updates, updatedAt: new Date().toISOString() };
  res.json([{ result: { data: { json: inMemorySponsors[idx] } } }]);
});

app.post('/api/trpc/sponsors.delete', requireAuth, (req, res) => {
  const data = req.body?.['0']?.json || req.body;
  inMemorySponsors = inMemorySponsors.filter(s => s.id !== data.id);
  res.json([{ result: { data: { json: true } } }]);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'in-memory' });
});

module.exports = app;
