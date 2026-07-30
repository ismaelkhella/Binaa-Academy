# أكاديمية بناء — Bina Academy

منصة تعليمية رقمية لطلاب الصف الحادي عشر والثاني عشر في فلسطين.

## Project Overview

A monorepo with two apps:

- **`api/`** — NestJS backend (REST API) running on port 3000
- **`admin/`** — React + Vite Arabic RTL admin dashboard running on port 5000

The admin panel proxies `/api` and `/uploads` requests to the API via Vite's dev server proxy — no CORS configuration needed in development.

## How to Run

Two workflows run in parallel:

| Workflow | Command | Port | Purpose |
|---|---|---|---|
| `Start application` | `cd admin && npm run dev` | 5000 | Admin dashboard (webview) |
| `API` | `cd api && npm run start:dev` | 3000 | NestJS REST API |

## Database

- **Engine**: Replit PostgreSQL (`DATABASE_URL` env var — provided automatically in dev and production)
- **ORM**: Prisma — schema at `api/prisma/schema.prisma`
- **Push schema changes**: `cd api && npx prisma db push`
- **Re-seed**: `cd api && npx ts-node prisma/seed.ts` (⚠️ wipes data — dev only)
- **History**: migrated from SQLite on 2026-07-17; pre-migration snapshot kept at `api/prisma/dev.db` + `dev.db.backup` (no longer used by the app)
- Production DB is separate and persistent — publishing applies schema diffs only and never copies data by itself. The Publish UI has an optional "overwrite/copy data from development" choice the user can pick when prod needs the dev data (needed on 2026-07-17: prod was provisioned schema-only/empty)
- ⚠️ The published (autoscale) site rejects request bodies over ~32 MB (413 at the ingress) — large video uploads cannot go through the API in production.
- Lesson videos are hosted on **Mux**: admin uploads go straight from the browser to Mux (`POST /api/mux/create-upload` → direct PUT), so files never touch the API. `POST /api/mux/webhook` (signature-verified, raw body) marks videos ready and fills `streamUrl` with the HLS URL; `listVideos` also reconciles still-processing videos by polling Mux (webhooks only reach the production URL). Pasting an external stream URL is still supported. The Mux dashboard webhook must point at `https://<production-domain>/api/mux/webhook`.

## Production Security Posture (hardened 2026-07-18)
- `helmet` security headers with CSP tuned for the admin SPA (Google Fonts, external https media allowed); `frame-ancestors` is `'self'`-only in production (Replit preview domains allowed only in dev); `Cross-Origin-Resource-Policy: cross-origin` so the mobile app can load `/uploads`
- `trust proxy` is set — required behind Replit's proxy so rate limiting counts real client IPs, not the shared proxy IP
- Rate limiting: global 100/min; login, register, admin login, and change-password endpoints are 5-10/min
- CORS: env-driven (`CORS_ORIGIN`); production default is NO cross-origin access (admin SPA is same-origin; native mobile apps don't use CORS)
- Admin can change their password from Settings (`POST /api/auth/admin/change-password`); the seeded default password must be changed before/at launch
- Admin JWTs last 24h. Password change does NOT revoke already-issued tokens — the short TTL is the compensating control until session revocation exists
- Production serves the admin SPA from the API process via an express SPA-fallback middleware in `api/src/main.ts` (deep links like `/login` work; unknown `/api/*` routes return JSON 404). Nest's global prefix means controller catch-alls only match under `/api` — page-route fallbacks must stay express middleware
- Cart checkout is a payment SIMULATION and is hard-disabled in production (would grant paid subscriptions for free); admins grant subscriptions manually from the panel
- `npm audit` in `api/` reports vulns only in dev tooling (`@nestjs/cli` → webpack/inquirer chain), not in runtime dependencies

## Admin Login

- Email: `admin@bina.ps`
- Password: `admin123`

## Environment Variables

| Key | Where set | Notes |
|---|---|---|
| `JWT_SECRET` | Replit Secret | Student JWT signing key |
| `ADMIN_JWT_SECRET` | Replit Secret | Admin JWT signing key |
| `JWT_EXPIRES_IN` | Replit env var | Default: `30d` |
| `PORT` | Replit env var | API port, default `3000` |
| `CORS_ORIGIN` | Replit env var | Allowed origins for API CORS |

## Stack

- **API**: NestJS 10, Prisma 6, PostgreSQL (Replit), Passport JWT, class-validator
- **Admin**: React 18, Vite 6, React Router v6, TypeScript

## User Preferences

- Keep existing monorepo structure (`api/` + `admin/`)
- Never risk student data (views/subscriptions) during content changes — soft-delete only
