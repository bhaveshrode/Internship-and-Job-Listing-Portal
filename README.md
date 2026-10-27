# Internship & Job Listing Portal

A full-stack platform where users browse, search, filter, and apply to internship/job opportunities, and admins manage listings and review applications.

## Tech Stack

- **Frontend:** React.js (Vite), React Router, plain CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose

## Project Structure

```
job-portal/
├── client/        # React (Vite) frontend
├── server/        # Express + MongoDB backend
├── README.md
└── screenshots/
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB — a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or a local MongoDB instance

### Backend setup

```bash
cd server
cp .env.example .env   # then edit MONGO_URI, JWT_SECRET
npm install
npm run seed           # seeds admin user + sample opportunities
npm run dev            # starts http://localhost:5000
```

Default seeded admin login: `admin` / `admin123` (override with `ADMIN_USERNAME` / `ADMIN_PASSWORD` before seeding).

### Frontend setup

```bash
cd client
cp .env.example .env   # VITE_API_URL defaults to http://localhost:5000/api
npm install
npm run dev            # starts http://localhost:5173
```

## Environment Variables

### server/.env

| Variable | Description |
|---|---|
| `PORT` | Express server port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing admin JWTs |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin credentials used by the seed script |

### client/.env

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (baked in at build time; default `/api` = same-origin) |

## Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full production guide: Vercel
(single project, recommended), a persistent Node host (Render-style), the
split-frontend/API option, the environment-variable reference, and the
production checklist.

Before deploying, run the local pre-deploy test suite:

```bash
npm run verify:deploy   # 16 checks: static build, SPA fallback, API, CORS,
                        # admin JWT login, error handling — against Atlas
```

## REST API

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/opportunities?search=&domain=&page=&limit=` | Public | List opportunities |
| GET | `/api/opportunities/:id` | Public | Opportunity details |
| POST | `/api/opportunities` | Admin | Create opportunity |
| PUT | `/api/opportunities/:id` | Admin | Update opportunity |
| DELETE | `/api/opportunities/:id` | Admin | Delete opportunity |
| GET | `/api/domains` | Public | Distinct domains for filter |
| POST | `/api/applications` | Public | Submit application |
| GET | `/api/applications?opportunityId=` | Admin | View applications |
| POST | `/api/admin/login` | Public | Admin login (returns JWT) |

Admin routes require an `Authorization: Bearer <token>` header.

## Database Structure

```
Opportunity: { title, company, domain, location, experience,
               description, applicationLink, createdAt, updatedAt }
Application: { opportunity: ObjectId→Opportunity, name, email, phone,
               coverNote, submittedAt }
Admin:       { username, passwordHash }
```
