# Deployment Guide

How to take the Internship & Job Listing Portal to production, what is already
configured, and what remains manual.

## Repository layout (what runs where)

```
client/            React (Vite) SPA → built to client/dist (static files)
server/            Express + Mongoose API (src/app.js = app, src/index.js = listener)
api/index.js       Vercel serverless entry (wraps the same Express app)
vercel.json        Vercel routing: /api/* → function, everything else → SPA
scripts/verify-deploy.mjs   Local pre-deploy test suite (16 checks)
```

The same Express app supports **two deployment modes** — pick one:

| Mode | What runs | Best for |
|---|---|---|
| **A — Vercel (recommended)** | Static SPA on Vercel CDN + API as a serverless function, one domain | Easiest free hosting for this assignment |
| **B — Persistent Node host** | One Node process (`npm start`) serves API **and** the built frontend | Render / Railway / any Node host, no serverless quirks |

Both modes are **same-origin** by default (`VITE_API_URL=/api`), so CORS is
usually not needed. A split-frontend/backend deploy is possible too (below).

---

## Prerequisites (both modes)

1. **MongoDB Atlas connection string** (`MONGO_URI`) for a cluster.
   - Atlas → Network Access → IP Access List must allow your hosting
     platform. For a class project `0.0.0.0/0` (Allow Access From Anywhere)
     is the simple choice; understand that it allows connections from any IP
     (mitigated by using a strong DB user password).
2. **A strong `JWT_SECRET`** — generate one:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   The server **refuses to start** if `JWT_SECRET` is missing, and refuses
   `production` starts while it is still the example placeholder.
3. **Admin account seeded into the production database.** Set
   `ADMIN_USERNAME` / `ADMIN_PASSWORD`, then run the seed against the prod URI:
   ```bash
   cd server && MONGO_URI="mongodb+srv://...prod..." npm run seed
   ```
   ⚠️ **Do not go live with the default `admin` / `admin123`.**
4. **Secrets stay out of git.** `.env` files are gitignored and only
   `.env.example` templates are committed. On the platform, paste values into
   the dashboard's environment-variable fields — never into the repo.

---

## Mode A — Vercel (frontend + API in one project)

The repo already contains everything Vercel needs (`vercel.json`,
`api/index.js`, root `package.json` with the API dependencies).

1. Push the repository to GitHub (already done for
   `bhaveshrode/Internship-and-Job-Listing-Portal`).
2. [vercel.com/new](https://vercel.com/new) → import the repository.
   The build command and output directory are read from `vercel.json`
   (`cd client && npm install && npm run build` → `client/dist`), so no
   framework configuration is needed.
3. Project → Settings → Environment Variables, add for Production:

   | Name | Value |
   |---|---|
   | `MONGO_URI` | Atlas connection string |
   | `JWT_SECRET` | the strong random value from Prerequisite 2 |
   | `ADMIN_USERNAME` / `ADMIN_PASSWORD` | only needed if you seed from the dashboard/CLI |

   `CORS_ORIGIN` is **not needed** in this mode (API and site share one
   origin). `PORT` is ignored by Vercel.
4. Deploy. Then verify against the checklist at the bottom.

Notes:

- **Vercel Hobby (free) is for non-commercial/personal use** — fine for a
  student assignment; commercial use requires Pro.
- Cold start connects to Atlas on the first request (~1 s); the connection is
  then cached per function instance (`server/src/config/db.js`).
- Static assets are served by Vercel's CDN; Express skips its own static
  serving when `process.env.VERCEL` is set.
- The function entry normalizes `req.url` so Express routes work whether
  Vercel passes the original path (`/api/...`) or a prefix-stripped one —
  both forms are covered by the local test suite.

## Mode B — Persistent Node host (Render or similar)

One process serves the API **and** the built React app (single origin, no CORS).

1. Build command: `npm run build` (installs client deps and produces
   `client/dist`; root `npm install` already provides the API dependencies).
2. Start command: `npm start` (runs `node server/src/index.js`).
3. Environment variables:
   - `NODE_ENV=production` — enables fail-fast checks and static/SPA serving
   - `MONGO_URI`, `JWT_SECRET` (and `ADMIN_*` if seeding)
   - `PORT` — most hosts inject this; the server uses `process.env.PORT`
4. Deploy, then run the checklist.

> Keep the **repository root** as the service root — the Express app resolves
> the frontend build at `client/dist` relative to the repo layout.

## Optional — Split deploy (static frontend + separate API)

1. **API** on any Node host (Mode B without the frontend, or a container).
   Set `CORS_ORIGIN=https://your-frontend.example.com` (comma-separated list
   allowed).
2. **Frontend** on a static host (Vercel/Netlify/Cloudflare Pages) with the
   API URL baked in **at build time**:
   ```bash
   cd client && VITE_API_URL=https://api.example.com/api npm run build
   ```
3. CORS behavior (verified by the local test suite):
   - `CORS_ORIGIN` unset → all origins allowed (development default)
   - `CORS_ORIGIN` set → only listed origins get the
     `Access-Control-Allow-Origin` header; others get none.

---

## Environment variables reference

### Server (`server/.env` locally / platform dashboard in production)

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | ✅ | Atlas/local MongoDB connection string |
| `JWT_SECRET` | ✅ | Signs admin JWTs; server exits if missing/placeholder |
| `NODE_ENV` | production | Enables production checks + static serving |
| `PORT` | optional | Defaults to 5000; hosts usually inject it |
| `CORS_ORIGIN` | split-deploy only | Comma-separated allowed frontend origins |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | seeding only | Credentials created by `npm run seed` |

### Client (`client/.env` locally / build env in production)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API base URL **baked at build time**. Default `/api` (same-origin). Set a full URL only for split deploys. |

---

## Pre-deploy verification (run locally first)

```bash
npm run verify:deploy     # 16 checks against both server entries + Atlas
```

Covers: standalone production server (static files, SPA deep links, API,
error handling, CORS headers) and the Vercel function entry (both `req.url`
forms, admin login, 404/400 behavior), all against the real Atlas cluster.

**Already verified in this workspace:** production build (no `localhost`
leak), Atlas connectivity (MongoDB 8.0.34, 5 opportunities / 1 admin),
`npm run verify:deploy` → 16/16, restricted-CORS header behavior.

**Not verifiable from this workspace — check after your first deploy:**

- An actual Vercel deployment (needs your account/browser): `/api/health`
  returns `{"status":"ok"}`, the listing renders, admin login issues a JWT.
- Browser-level sign-in/apply flow on the live URL.

## Production checklist

- [ ] `JWT_SECRET` is a strong random value (not the example placeholder)
- [ ] Admin password changed from `admin123` and seeded into the prod DB
- [ ] Atlas Network Access list reviewed for the hosting platform
- [ ] `npm run verify:deploy` passes locally (16/16)
- [ ] `GET /api/health` → `{"status":"ok"}` on the live URL
- [ ] Listing loads; search, domain filter, and pagination work
- [ ] Applying stores an application in Atlas (check the collection)
- [ ] Admin login works; add/edit/delete opportunity works; applications list loads
- [ ] Deep link refresh works (e.g. `/admin` or an opportunity detail URL)
- [ ] Unknown API route returns JSON 404, bad id returns 400
- [ ] No secrets committed (`git grep -E "mongodb\+srv://|mongodb://" ` finds
      only docs/examples)

## Known caveats

- The Vercel path-normalization was validated against both documented
  behaviors locally, but not against a live Vercel deployment — run the
  checklist's `/api/health` and login checks after the first deploy.
- The current `MONGO_URI` targets database `ai_study_assistant` (leftover
  name from the original cluster). It works as-is; to use a clearly named
  database on a fresh cluster, change the last path segment, e.g.
  `...cluster0.../job-portal?retryWrites=true&w=majority`, and re-seed.
- The "Blocked request" page seen in the local preview is a Vite dev-server
  host allowlist issue and is **dev-only** — it does not exist in production.
