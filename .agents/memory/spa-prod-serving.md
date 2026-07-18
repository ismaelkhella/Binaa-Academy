---
name: Prod SPA serving & prod-only 404 trap
description: Why admin SPA deep links 404 only in production and how to test production mode locally
---

- Rule: the API serves the built admin SPA only when `NODE_ENV=production`; in dev, Vite serves it. Any bug in static serving or the SPA fallback is invisible in dev testing.

**Why:** Nest's `setGlobalPrefix('api')` makes controller routes — including `@Get('*path')` catch-alls — match only under `/api`. A controller-based "SPA fallback" therefore never sees page routes like `/login`; deep links 404'd in production while `/` still worked (served by express.static's index). Found by code review + running the prod build, not by any dev-mode testing.

**How to apply:** keep the SPA fallback as express middleware in `main.ts`, registered after static assets, skipping `/api`, `/uploads`, and paths whose last segment contains a dot (missing real files should 404, not return HTML). To verify production behavior without touching the dev workflow: `cd api && npx nest build && NODE_ENV=production PORT=3100 node dist/src/main`, then curl deep links, a real asset, a missing asset, and `/api/*` on :3100.
