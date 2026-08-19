---
name: Community attachments in object storage
description: Where community chat files live, legacy DB fallback, and safety rules for serving them
---

Community chat attachments (≤15MB) now live in Replit App Storage (bucket via `@replit/object-storage`); Postgres keeps only metadata + `storage_key`. Legacy rows may still have bytes in the `data` column and are served via fallback; `api/scripts/migrate-community-attachments.ts` is idempotent and moves them (must be re-run against production once).

**Why:** DB was inflating with binaries; object storage keeps backups lean and removes memory-buffered serving.

**How to apply:**
- `new Client()` without explicit `bucketId` fails here ("A bucket name is needed") — always pass `{ bucketId: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID }`; the sidecar default-bucket lookup returns empty in this environment.
- Never select the legacy `data` Bytes column in list queries.
- Serving rules survive the storage change: SVG/HTML/XML rejected on upload; only image/audio/video/pdf inline; everything else `application/octet-stream` + `attachment` + `nosniff`.
- Delete the storage object after deleting the message row (best-effort); upload before DB insert and clean up the object if the insert fails.
