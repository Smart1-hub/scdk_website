# SCDK — Full Platform v3.0

> **"Innovating Urban Futures"**  
> Public website + Enterprise Smart City Platform — unified in one codebase.

---

## What's Included

This is the **complete, merged** SCDK product — one React app, one Express backend, one database, serving everything from the public marketing website to the full enterprise dashboard.

| URL | What it is |
|-----|-----------|
| `https://scdk.io/` | Public marketing website |
| `https://scdk.io/app/login` | Platform sign-in |
| `https://scdk.io/app` | Smart city dashboard (authenticated) |

---

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │        Nginx (port 80/443)           │
                    │  Rate limiting · SSL · WS proxy      │
                    └──────────────┬──────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
         /api/*               /ws (IoT)              / and /app/*
              │                    │                     │
     ┌────────▼────────┐  ┌───────▼──────┐   ┌─────────▼────────┐
     │  Express API    │  │  WebSocket   │   │  React SPA        │
     │  port 5000      │  │  IoT feed    │   │  Website + App    │
     └────────┬────────┘  └──────────────┘   └──────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼────────┐   ┌───────▼────────┐
│ PostgreSQL │   │ Anthropic API  │
│ + PostGIS  │   │ Claude Sonnet  │
└────────────┘   └────────────────┘
         │
   ┌─────▼──────┐
   │ MQTT Broker│  ← IoT device sensors
   └────────────┘
```

---

## Project Structure

```
scdk-full/
├── package.json                   ← Root scripts (dev, build, docker)
├── README.md
├── .gitignore
│
├── frontend/                      ← Single React app
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── App.js                 ← Router: / → website, /app/* → platform
│       ├── index.js / index.css   ← Entry + shared global styles
│       ├── context/
│       │   └── AuthContext.js     ← JWT auth state + authFetch helper
│       ├── hooks/index.js         ← useInView, useCounter, useScrolled
│       ├── data/siteData.js       ← All website copy and content
│       ├── components/
│       │   ├── website/
│       │   │   ├── WebsiteNavbar.jsx   ← Public nav with "Platform Login" CTA
│       │   │   ├── WebsiteFooter.jsx
│       │   │   └── AnimSection.jsx     ← Scroll-reveal wrapper
│       │   └── platform/
│       │       └── dashboard/
│       │           └── DashboardLayout.js  ← Sidebar + nav
│       └── pages/
│           ├── WebsitePage.jsx    ← Full public site (all sections)
│           ├── LoginPage.js       ← Platform sign-in (+ back to website)
│           ├── OverviewPage.js    ← Dashboard home
│           ├── ProjectsPage.js    ← List + Kanban board
│           ├── GISPage.js         ← Leaflet map
│           ├── IoTPage.js         ← Live sensor feed
│           ├── DigitalTwinPage.js ← Three.js 3D city
│           ├── AIPage.js          ← Claude AI chat
│           └── AdminPage.js       ← User management
│
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js              ← Express + WebSocket entry
│       ├── config/db.js           ← PostgreSQL pool
│       ├── middleware/auth.js     ← JWT + RBAC
│       ├── routes/
│       │   ├── index.js           ← All routes wired together
│       │   └── contact.js         ← Public contact form (website)
│       └── controllers/
│           ├── authController.js
│           ├── projectsController.js
│           ├── tasksController.js
│           ├── iotController.js
│           ├── aiController.js
│           └── adminController.js
│
├── mobile/                        ← React Native (Expo)
│   ├── App.js
│   ├── package.json
│   └── src/
│       ├── services/api.js        ← Axios + SecureStore
│       └── screens/
│           ├── LoginScreen.js
│           ├── DashboardScreen.js
│           ├── ProjectsScreen.js
│           ├── SensorsScreen.js
│           └── AIScreen.js
│
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.sql ← PostGIS schema
│   └── seeds/
│       └── 001_seed_data.sql      ← Sample data
│
└── infrastructure/
    ├── docker/
    │   ├── docker-compose.yml
    │   ├── Dockerfile.backend
    │   ├── Dockerfile.frontend
    │   ├── mosquitto.conf
    │   └── .env.example
    └── nginx/
        ├── nginx.conf             ← Reverse proxy (contact + login rate limits)
        └── spa.conf               ← SPA fallback routing
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- PostgreSQL 15 + PostGIS 3.x (or Docker)

### Option A — Local Development

```bash
# 1. Install all dependencies
cd scdk-full
npm run install:all

# 2. Set up PostgreSQL
psql -U postgres -c "CREATE USER scdk_user WITH PASSWORD 'yourpassword';"
psql -U postgres -c "CREATE DATABASE scdk_platform OWNER scdk_user;"
psql -U scdk_user -d scdk_platform -f database/migrations/001_initial_schema.sql
psql -U scdk_user -d scdk_platform -f database/seeds/001_seed_data.sql

# 3. Configure environment
cp backend/.env.example backend/.env
# Fill in: DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET, ANTHROPIC_API_KEY
# Optionally fill in SMTP_* for contact form email delivery

# 4. Run everything
npm run dev
```

| Service | URL |
|---------|-----|
| Website | http://localhost:3000 |
| Platform login | http://localhost:3000/app/login |
| API server | http://localhost:5000 |
| IoT WebSocket | ws://localhost:5000/ws |

### Option B — Docker Compose

```bash
cp infrastructure/docker/.env.example infrastructure/docker/.env
# Fill in secrets

npm run docker:up

# Load seed data
docker exec -i scdk_db psql -U scdk_user -d scdk_platform \
  < database/seeds/001_seed_data.sql
```

All services available at `http://localhost` (Nginx on port 80).

```bash
# Stop everything
npm run docker:down
```

---

## Routing Logic

```
/                   → Public website (hero, services, team, contact…)
/app/login          → Platform login page (with ← Back to website link)
/app                → Dashboard overview      [authenticated]
/app/projects       → Projects + Kanban       [authenticated]
/app/gis            → GIS map                 [authenticated]
/app/iot            → IoT sensors             [authenticated]
/app/twin           → Digital Twin            [admin, manager]
/app/ai             → AI Assistant            [authenticated]
/app/admin          → Admin panel             [admin only]
```

---

## Website → Platform Flow

1. Visitor lands on `scdk.io` — sees the public marketing site
2. **"Platform Login"** button in navbar → `/app/login`
3. After sign-in → `/app` dashboard
4. Login page has **"← Back to website"** link
5. A **platform CTA banner** is embedded in the hero section
6. A **"Ready to manage projects?"** band appears between Contact and the footer tagline
7. Footer has a **"⚡ Platform Login →"** link

---

## API Routes

### Public (no auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact` | Website contact form (rate-limited 3/min) |
| POST | `/api/auth/login` | Login (rate-limited 5/min) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Revoke refresh token |
| GET  | `/api/auth/me` | Current user (requires auth) |
| GET  | `/health` | Server health check |

### Platform (authenticated)
See [API Reference in scdk-platform README] for full list of `/api/projects`, `/api/iot`, `/api/ai`, `/api/admin` endpoints.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST / DB_NAME / DB_USER / DB_PASSWORD` | Yes | PostgreSQL connection |
| `JWT_SECRET` | Yes | Access token secret |
| `JWT_REFRESH_SECRET` | Yes | Refresh token secret |
| `ANTHROPIC_API_KEY` | Yes* | AI Assistant (Claude) |
| `MQTT_BROKER_URL` | No | IoT broker (disables IoT if absent) |
| `SMTP_*` | No | Email delivery for contact form |
| `ALLOWED_ORIGINS` | Prod | Comma-separated CORS origins |

---

## Default Login Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@scdk.io | Password123! | Admin |
| marcus@scdk.io | Password123! | Manager |
| lena@scdk.io | Password123! | Manager |
| viewer@scdk.io | Password123! | Viewer |

> ⚠️ Change all passwords before any production deployment.

---

## Mobile App

```bash
cd mobile
npm install
# Edit src/services/api.js → set BASE_URL to your backend
npx expo start
```

Screens: Dashboard · Projects · Sensors · AI Chat  
Tokens stored in **Expo SecureStore** (encrypted keychain).

---

## Production Deployment

1. Build the frontend: `npm run build` (outputs `frontend/build/`)
2. Set `NODE_ENV=production` in `backend/.env`
3. Point your domain to the server
4. Uncomment the HTTPS block in `infrastructure/nginx/nginx.conf`
5. Add SSL certs to `infrastructure/nginx/ssl/`
6. Run `npm run docker:up`

---

*SCDK Platform v3.0 — One codebase. Public website. Enterprise platform. Mobile app.*
