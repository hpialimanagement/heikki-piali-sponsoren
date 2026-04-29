import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from dist/public
const publicPath = path.join(__dirname, 'dist', 'public');
app.use(express.static(publicPath));

// SPA fallback: serve index.html for all non-file routes
app.get('*', (req, res) => {
  // Check if it's a file request (has extension)
  if (path.extname(req.path)) {
    res.status(404).send('Not Found');
    return;
  }
  
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving from: ${publicPath}`);
  console.log(`🌐 Public URL: https://8080-i98yq2fg6sds49zmxni65-bdd3d98e.us2.manus.computer`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
