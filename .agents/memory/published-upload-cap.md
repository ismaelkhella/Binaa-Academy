---
name: Published upload size cap
description: Autoscale ingress rejects large request bodies on the published site — affects any file-upload feature.
---

# Published site rejects request bodies over ~32 MB

The published (autoscale) deployment's ingress returns **413** for request bodies larger than roughly 32 MB, before the request ever reaches the NestJS app.

**Why:** Measured empirically (2026-07-17): a 1 MB POST to the published site reached the app (got 401 from auth), a 40 MB POST got 413 from the proxy. The user's ~175 MB lesson-video uploads always failed after the progress bar hit 100% ("processing on server…" then failure) — the proxy buffers the body, then rejects it. App-side multer limits (2 GB) are irrelevant; the cap is in front of the app.

**How to apply:**
- Any feature that uploads large files (lesson videos, etc.) cannot POST them through the API on the published site. Use direct-to-object-storage uploads (presigned URL / Replit App Storage) or externally hosted stream URLs instead.
- The dev workspace has no such cap, so this class of bug only reproduces on the published site — test uploads >32 MB against production behavior, not just the preview.
- The admin client shows a specific Arabic message on 413 (client.ts upload handler).
