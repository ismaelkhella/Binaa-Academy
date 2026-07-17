---
name: Production database provisioning
description: Prod PG can start empty even when dev is seeded; how data gets to prod and what the agent must not do.
---

# Production PostgreSQL was provisioned empty (schema only)

On first publish after the PG migration (2026-07-17), production got the schema but **none** of the dev data (0 admins / 0 users / 0 videos, while dev had the full seeded set). Consequence: nobody can log into the published admin panel once old JWTs expire, and students see no content.

**Why:** Replit provisions the production DB from the development DB, but the copy did not include data here (likely provisioned while dev was still empty). The publish flow afterwards only applies **schema diffs** — it never copies data on its own.

**How to apply:**
- Remedy is user-side: re-publish and choose the Publish UI's option to overwrite/copy production data from development. The agent cannot do this — `executeSql` against production is strictly read-only, and writing scripts that push data/DDL to prod is forbidden (see database skill).
- Before blaming code when "the live site has no data": compare `executeSql(environment:"production")` counts against dev counts.
- Anything created on the live site before the data-copy publish gets replaced by the dev copy — warn the user.
