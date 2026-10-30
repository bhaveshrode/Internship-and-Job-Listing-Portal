// Netlify function entry: /api/* → the shared Express app.
// Official Netlify Express recipe = serverless-http + the force rewrite in
// netlify.toml (see https://docs.netlify.com/build/frameworks/framework-setup-guides/express/).
// The MongoDB connection is cached per function instance (server/src/config/db.js).
import serverless from 'serverless-http';
import { app } from '../../server/src/app.js';
import { connectOnce } from '../../server/src/config/db.js';

const expressHandler = serverless(app);

// The rewrite may deliver event.path as the original request path
// (/api/opportunities) or as the rewrite destination
// (/.netlify/functions/api/opportunities) — Netlify's docs don't settle
// which, so normalize to the original form Express expects.
function normalizePath(p = '/') {
  if (p === '/api' || p.startsWith('/api/')) return p;
  const m = p.match(/^\/\.netlify\/functions\/api(\/.*)?$/);
  if (m) return `/api${m[1] || ''}`;
  return p;
}

export async function handler(event, context) {
  const normalized = { ...event, path: normalizePath(event.path) };
  try {
    await connectOnce();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Database unavailable' }),
    };
  }
  return expressHandler(normalized, context);
}
