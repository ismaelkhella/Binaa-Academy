---
name: SQLite → PostgreSQL migration
description: Why the API moved to Replit PostgreSQL and where the pre-migration SQLite backup lives
---

The API originally used SQLite (`file:./dev.db`) baked into the project files.

**Why migrated (2026-07-17):** the app deploys on autoscale, so a file DB shipped
with every publish — each publish replaced production data with the dev copy, and
prod writes were lost on instance recycle. Real student signups were observed in
prod logs that never existed in dev and could not be recovered (ephemeral FS).
User explicitly approved migrating to Replit PostgreSQL to make student data
survive publishes.

**How to apply:**
- Pre-migration snapshot: `api/prisma/dev.db` and `api/prisma/dev.db.backup`
  (both unused by the app now; safe to delete once prod is confirmed healthy).
- Never reintroduce file-based storage for persistent data on this project —
  that includes SQLite AND local-disk uploads (`api/uploads` has the same
  ephemerality problem in production; object storage is the eventual fix).
- `scripts/post-merge.sh` runs `prisma db push` WITHOUT `--accept-data-loss`
  on purpose: destructive schema changes must fail loudly, not silently drop data.
