// Local pre-deploy verification (run from project root):
//  A) Standalone production server: static build + SPA fallback + API + CORS
//  B) Vercel function entry: original and prefix-stripped req.url forms
import { spawn } from 'node:child_process';
import http from 'node:http';
import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });
process.env.NODE_ENV = 'production';

const results = [];
const check = (name, cond, extra = '') =>
  results.push([cond ? 'PASS' : 'FAIL', name, extra]);

function get(port, path, headers = {}) {
  return new Promise((resolve) => {
    const req = http.request(
      { host: '127.0.0.1', port, path, headers, timeout: 15000 },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () =>
          resolve({ status: res.statusCode, headers: res.headers, body })
        );
      }
    );
    req.on('error', (e) => resolve({ status: 0, headers: {}, body: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, headers: {}, body: 'timeout' }); });
    req.end();
  });
}

// ---------- A) standalone production server (Render/Railway style) ----------
const PORT = 5099;
const srv = spawn(process.execPath, ['server/src/index.js'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let srvLog = '';
srv.stdout.on('data', (d) => (srvLog += d));
srv.stderr.on('data', (d) => (srvLog += d));

async function waitFor(port) {
  for (let i = 0; i < 40; i++) {
    const r = await get(port, '/api/health');
    if (r.status === 200) return r;
    await new Promise((r2) => setTimeout(r2, 500));
  }
  return null;
}

try {
  const health = await waitFor(PORT);
  check('A1 standalone: GET /api/health 200', health?.status === 200, `got ${health?.status}`);

  const root = await get(PORT, '/');
  check('A2 standalone: / serves built index.html', root.status === 200 && root.body.includes('<div id="root"'), `got ${root.status}`);
  check('A3 standalone: HTML content-type', (root.headers['content-type'] || '').includes('text/html'), root.headers['content-type']);

  const spa = await get(PORT, '/admin');
  check('A4 standalone: /admin deep link falls back to SPA', spa.status === 200 && spa.body.includes('<div id="root"'), `got ${spa.status}`);

  const opp = await get(PORT, '/api/opportunities?page=1&limit=3');
  let oppData = {};
  try { oppData = JSON.parse(opp.body); } catch {}
  check('A5 standalone: GET /api/opportunities 200 with items', opp.status === 200 && Array.isArray(oppData.items) && oppData.items.length > 0, `status ${opp.status}, items ${oppData.items?.length ?? 'n/a'}`);

  const dom = await get(PORT, '/api/domains');
  check('A6 standalone: GET /api/domains 200', dom.status === 200, `got ${dom.status}`);

  const bad = await get(PORT, '/api/opportunities/not-an-id');
  check('A7 standalone: bad id -> 400 Invalid id format', bad.status === 400 && /invalid id/i.test(bad.body), `got ${bad.status} ${bad.body.slice(0, 60)}`);

  const nf = await get(PORT, '/api/nope');
  check('A8 standalone: unknown API route -> 404 JSON', nf.status === 404 && (nf.headers['content-type'] || '').includes('json'), `got ${nf.status}`);

  const assetPath = (root.body.match(/\/assets\/index-[\w-]+\.js/) || [])[0];
  const asset = assetPath ? await get(PORT, assetPath) : { status: 0, headers: {} };
  check('A9 standalone: built JS asset served', asset.status === 200 && (asset.headers['content-type'] || '').includes('javascript'), `${assetPath} -> ${asset.status}`);

  const cors1 = await get(PORT, '/api/health', { Origin: 'https://third-party.example.com' });
  check('A10 standalone (CORS open): ACAO header present', Boolean(cors1.headers['access-control-allow-origin']), String(cors1.headers['access-control-allow-origin']));
} finally {
  srv.kill('SIGTERM');
}

// ---------- B) Vercel function entry (both req.url forms) ----------
const { default: handler } = await import('../api/index.js');

function makeServer(stripPrefix) {
  return http.createServer((req, res) => {
    if (stripPrefix && req.url.startsWith('/api')) {
      req.url = req.url.slice(4) || '/';
    }
    handler(req, res);
  });
}
const s1 = makeServer(false);
const s2 = makeServer(true);
await new Promise((r) => s1.listen(0, '127.0.0.1', r));
await new Promise((r) => s2.listen(0, '127.0.0.1', r));
const p1 = s1.address().port;
const p2 = s2.address().port;

try {
  // warm-up (cold start: DB connect)
  const warm = await get(p1, '/api/health');
  check('B1 vercel entry: /api/health 200 (original form)', warm.status === 200, `got ${warm.status}`);

  const opp1 = await get(p1, '/api/opportunities?page=1&limit=2');
  let d1 = {};
  try { d1 = JSON.parse(opp1.body); } catch {}
  check('B2 vercel entry: /api/opportunities 200 (original form)', opp1.status === 200 && Array.isArray(d1.items), `got ${opp1.status}`);

  const opp2 = await get(p2, '/api/opportunities?page=1&limit=2');
  let d2 = {};
  try { d2 = JSON.parse(opp2.body); } catch {}
  check('B3 vercel entry: /api/opportunities 200 (prefix-stripped form)', opp2.status === 200 && Array.isArray(d2.items), `got ${opp2.status} ${opp2.body.slice(0, 80)}`);

  const login = await new Promise((resolve) => {
    const data = JSON.stringify({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD });
    const req = http.request(
      { host: '127.0.0.1', port: p2, path: '/api/admin/login', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => { let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => resolve({ status: res.statusCode, body: b })); }
    );
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    req.end(data);
  });
  let loginData = {};
  try { loginData = JSON.parse(login.body); } catch {}
  check('B4 vercel entry: admin login returns JWT (stripped form)', login.status === 200 && Boolean(loginData.token), `got ${login.status}`);

  const bad2 = await get(p2, '/api/opportunities/not-an-id');
  check('B5 vercel entry: bad id -> 400 (stripped form)', bad2.status === 400, `got ${bad2.status}`);

  const nf2 = await get(p2, '/api/nope');
  check('B6 vercel entry: unknown route -> 404 JSON (stripped form)', nf2.status === 404, `got ${nf2.status}`);
} finally {
  s1.close();
  s2.close();
}

// ---------- report ----------
let fails = 0;
for (const [st, name, extra] of results) {
  if (st === 'FAIL') fails++;
  console.log(`${st}  ${name}${st === 'FAIL' ? `  [${extra}]` : ''}`);
}
console.log(`\n${results.length - fails}/${results.length} passed`);
if (srvLog.trim()) console.log('--- server log:\n' + srvLog.trim());
process.exit(fails ? 1 : 0);
