# Memory Index

- [SQLite → PostgreSQL migration](sqlite-to-postgres-migration.md) — why file-based storage is banned here, where the pre-migration backup lives, and why post-merge db push has no --accept-data-loss.
- [Published upload size cap](published-upload-cap.md) — autoscale ingress 413s bodies >~32MB; large uploads must bypass the API (object storage / external stream URLs), and only reproduce on prod.
- [Production database provisioning](prod-database-provisioning.md) — prod PG can be schema-only while dev is seeded; fix is the user re-publishing with the copy-data option, never agent-side writes.
- [Prod SPA serving trap](spa-prod-serving.md) — deep-link 404s only appear with NODE_ENV=production (Vite masks them in dev); fallback must be express middleware, not a Nest catch-all.
- [Mux integration gotchas](mux-integration.md) — webhook verifySignature is async (unawaited = forged sigs accepted + crash); dev gets no webhooks (reconciliation poll covers it); never serve null streamUrl to students.
