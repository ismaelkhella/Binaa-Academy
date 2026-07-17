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
- Production DB is separate and persistent — publishing never overwrites production data (schema diffs are applied by Replit's publish flow)

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

- **API**: NestJS 10, Prisma 6, SQLite, Passport JWT, class-validator
- **Admin**: React 18, Vite 6, React Router v6, TypeScript

## User Preferences

- Keep existing monorepo structure (`api/` + `admin/`)
- Do not migrate to PostgreSQL unless explicitly requested
