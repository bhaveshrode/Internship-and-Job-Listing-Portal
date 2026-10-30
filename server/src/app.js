import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opportunitiesRouter from './routes/opportunities.js';
import applicationsRouter from './routes/applications.js';
import domainsRouter from './routes/domains.js';
import authRouter from './routes/auth.js';

// Load server/.env relative to this file so startup works regardless of the
// process working directory (platform deploys, serverless entries, scripts).
// Netlify bundles functions as CommonJS where `import.meta` is empty, so the
// resolution must be guarded — on serverless hosts env vars come from the
// platform's encrypted store anyway (and server/.env isn't in the bundle).
function resolveLocal(relPath) {
  try {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), relPath);
  } catch {
    return null;
  }
}
const serverEnv = resolveLocal('../.env');
if (serverEnv) dotenv.config({ path: serverEnv });

const app = express();

// Fail fast on missing/placeholder JWT secret — otherwise login would 500
// at token-signing time with an unclear error.
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Add it to server/.env');
  process.exit(1);
}
if (
  process.env.NODE_ENV === 'production' &&
  process.env.JWT_SECRET === 'change-me-to-a-long-random-string'
) {
  console.error('JWT_SECRET is still the example placeholder. Set a strong random secret before deploying.');
  process.exit(1);
}

// CORS: when CORS_ORIGIN is set (comma-separated list of allowed origins),
// only those origins may call the API — required in production when the
// frontend is hosted on a different domain. Unset (development) allows all.
export const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors(corsOrigins.length ? { origin: corsOrigins } : {}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/domains', domainsRouter);
app.use('/api/admin', authRouter);

// In production, serve the built React app from this server when available
// (single-origin deployment: API + frontend on one host, no CORS needed).
// On Vercel/Netlify the platform's CDN serves client/dist itself, so skip it
// there — static requests never reach the API function anyway.
const onServerlessHost = Boolean(process.env.VERCEL || process.env.NETLIFY);
const distDir = resolveLocal('../../client/dist');
if (
  process.env.NODE_ENV === 'production' &&
  !onServerlessHost &&
  distDir &&
  fs.existsSync(path.join(distDir, 'index.html'))
) {
  app.use(express.static(distDir));
  // SPA fallback: hand non-API GETs to index.html so React Router routes
  // (/admin, /opportunities/:id, …) work on refresh/deep links.
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
} else if (process.env.NODE_ENV === 'production' && !onServerlessHost) {
  console.warn('client/dist not found — run `npm run build` in client/ to serve the frontend from this server.');
}

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Central error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id format' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Internal server error' });
});

export { app };
