---
name: Mux video integration gotchas
description: Non-obvious constraints of the Mux direct-upload pipeline (webhook signature is async, dev never receives webhooks, published status vs processing).
---

# Mux integration gotchas

- **`mux.webhooks.verifySignature()` is async in @mux/mux-node v12+ and MUST be awaited.** An unawaited call returns a truthy Promise → every forged signature is accepted, and the eventual rejection crashes the Node process (unhandled rejection).
  **Why:** hit exactly this in testing — bad signature returned 200, then the server died.
  **How to apply:** any webhook signature check here must `await` and wrap in try/catch; verify with a forged-signature request after changes.
- **Dev never receives Mux webhooks** (they go to the production URL only). Video readiness in dev relies on the reconciliation poll in admin `listVideos` that queries Mux for still-processing videos. Don't "fix" a stuck-processing video in dev by touching webhooks.
- **A video can be `status=PUBLISHED` while its Mux asset is still processing** (`streamUrl` null). The student stream endpoint must reject null stream URLs — the mobile player renders the site root if handed an empty URL.
- Replacing or switching a Mux-backed video (new upload OR manual URL) must delete the old Mux asset and clear the linkage fields, or assets/costs leak.
