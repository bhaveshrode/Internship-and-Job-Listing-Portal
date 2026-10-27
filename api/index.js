// Vercel serverless entry: the full Express app under /api/*, with the
// MongoDB connection cached per function instance (see server/src/config/db.js).
//
// Routing: vercel.json rewrites "/api/:path*" -> "/api" onto this function.
// Depending on how Vercel invokes the function, req.url may be the original
// path (/api/opportunities) or have the /api prefix stripped (/opportunities).
// Normalize to the original form so Express (which mounts everything under
// /api) always matches its routes.
import { app } from '../server/src/app.js';
import { connectOnce } from '../server/src/config/db.js';

function ensureApiPrefix(req) {
  const url = req.url || '/';
  if (url === '/api' || url.startsWith('/api/')) return; // already original form
  const q = url.indexOf('?');
  req.url = q === -1 ? `/api${url}` : `/api${url.slice(0, q)}${url.slice(q)}`;
}

export default async function handler(req, res) {
  ensureApiPrefix(req);
  try {
    await connectOnce();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ message: 'Database unavailable' }));
  }
  return app(req, res);
}
