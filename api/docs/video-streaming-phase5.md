# Video Streaming — Phase 5: DRM & Signed URLs

## Current State (Phase 4)

Videos are served via a `streamUrl` stored in the database. The admin can:

1. **Upload a video file** to the API (`POST /api/admin/upload`) — the file is stored in `api/uploads/` and served as a static asset at `/uploads/<filename>`.  
2. **Paste an external HLS URL** (e.g. from Bunny.net, Cloudflare Stream, or Vimeo) directly into the `streamUrl` field.

Students access the stream URL via `GET /api/videos/:id/stream`, which enforces:
- Active subscription check
- Per-video view-count quota (`maxViews`)
- Watermark injection (name + phone returned alongside the URL)

Seeded data uses Apple's public HLS demo streams so the player is functional from day one.

---

## Phase 5 Plan: Signed URLs & DRM

### Recommended Architecture

**Hosting provider:** [Bunny.net Stream](https://bunny.net/stream/) or [Cloudflare Stream](https://cloudflare.com/stream/)

Both support:
- HLS + DASH delivery
- Token-signed URLs (time-limited, IP-locked)
- Widevine / FairPlay / PlayReady DRM

### Signed URL Flow

```
Student clicks Play
  → GET /api/videos/:id/stream          (authenticated)
  → Server validates subscription + quota
  → Server requests signed token from CDN provider API
      e.g. Bunny:      GET https://video.bunnycdn.com/library/{libId}/videos/{videoId}/token?expires=...
      e.g. Cloudflare: POST https://api.cloudflare.com/client/v4/accounts/{accountId}/stream/{videoId}/token
  → Server returns { streamUrl: "https://cdn.example.com/video.m3u8?token=<signed>" }
  → Client plays the signed URL (expires in 2–6 hours)
```

### Implementation Steps

1. **Store `externalVideoId`** on the `Video` model (the CDN's video ID, not the local file path).
2. **Add CDN credentials** as environment secrets (`BUNNY_LIBRARY_ID`, `BUNNY_API_KEY` or `CF_ACCOUNT_ID`, `CF_STREAM_TOKEN`).
3. **Update `getStreamUrl`** in `videos.service.ts` to call the CDN signing API instead of returning the raw DB value.
4. **Admin upload flow**: replace local `multer` upload with a direct-to-CDN upload using the CDN's tus or presigned-PUT API.
5. **Enable DRM** in the CDN dashboard and configure the player (Video.js / HLS.js / Shaka Player) with the appropriate DRM license URLs.

### Token Expiry Recommendation

| Use Case | Token TTL |
|---|---|
| Casual viewing session | 2 hours |
| Offline / download mode | 24–48 hours (separate download token, already implemented) |
| Admin preview | 15 minutes |

### Watermarking Note

The server-side watermark (student name + phone) should be rendered by the video player overlay (already implemented client-side). For server-side watermarking, Bunny.net supports dynamic watermark injection per stream request.

### Anti-Sharing Measures

- Signed URLs are single-IP or single-origin; sharing the URL to another device fails.
- View count quota (`maxViews`) is already enforced server-side.
- Student name + phone watermark deters screen-recording sharing.
- Cloudflare Stream supports hotlink protection by referer.

---

## Local Development Fallback

While Phase 5 is not yet deployed, videos uploaded locally to `api/uploads/` are served as plain MP4/WebM files. The player will treat them as a progressive download — HLS adaptive bitrate and DRM are CDN features that require the cloud provider.
