---
name: Community attachments stored in Postgres
description: Why community chat files live in the DB as Bytes and the safety rules around serving them
---

Community chat attachments (images/files/voice, ≤15MB) are stored as Postgres `Bytes` because no object storage bucket is configured in this repl and prod ingress caps bodies at ~32MB anyway.

**Why:** deliberate tradeoff, revisit if community usage grows (follow-up task exists to move to object storage).

**How to apply:**
- Never load the `data` Bytes column in list queries — select attachment metadata only.
- Serving uploads: SVG/HTML/XML MIME types are rejected on upload; only image/audio/video/pdf are served inline, everything else gets `application/octet-stream` + `Content-Disposition: attachment` + `nosniff` (stored-XSS defense). Keep this if the storage backend changes.
