import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import Mux from '@mux/mux-node';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Mux video hosting integration.
 * Flow: admin asks for a direct-upload URL → browser PUTs the file straight to
 * Mux (never through this API — published autoscale rejects bodies >32MB) →
 * Mux webhooks tell us when the asset is ready and we store the playback ID.
 */
@Injectable()
export class MuxService {
  private readonly logger = new Logger(MuxService.name);
  private mux: Mux | null = null;

  constructor(private prisma: PrismaService) {
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;
    if (tokenId && tokenSecret) {
      this.mux = new Mux({ tokenId, tokenSecret });
    } else {
      this.logger.warn('MUX_TOKEN_ID/MUX_TOKEN_SECRET not set — Mux uploads disabled');
    }
  }

  private client(): Mux {
    if (!this.mux) {
      throw new ServiceUnavailableException('خدمة رفع الفيديو غير مهيأة (مفاتيح Mux مفقودة)');
    }
    return this.mux;
  }

  /** HLS URL for a playback ID — kept in streamUrl for mobile-app compatibility. */
  static playbackUrl(playbackId: string): string {
    return `https://stream.mux.com/${playbackId}.m3u8`;
  }

  async createDirectUpload(): Promise<{ upload_id: string; upload_url: string; uploadId: string; uploadUrl: string }> {
    this.logger.log('Creating direct upload URL from Mux with resolution "highest" static renditions');
    const upload = await this.client().video.uploads.create({
      cors_origin: '*',
      new_asset_settings: {
        playback_policy: ['public'],
        video_quality: 'plus',
        static_renditions: [
          {
            resolution: 'highest',
          },
        ],
      },
    });
    if (!upload.url) {
      throw new ServiceUnavailableException('تعذر إنشاء رابط الرفع من Mux');
    }
    this.logger.log(`Created direct upload URL successfully. Upload ID: ${upload.id}`);
    return {
      upload_id: upload.id,
      upload_url: upload.url,
      uploadId: upload.id,
      uploadUrl: upload.url,
    };
  }

  /** Best-effort asset deletion (used when replacing/removing a video). */
  async deleteAsset(assetId: string): Promise<void> {
    if (!this.mux) return;
    try {
      await this.mux.video.assets.delete(assetId);
    } catch (err) {
      this.logger.warn(`Failed to delete Mux asset ${assetId}: ${(err as Error).message}`);
    }
  }

  async verifyWebhookSignature(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<boolean> {
    const secret = process.env.MUX_WEBHOOK_SECRET;
    if (!secret || !this.mux) return false;
    try {
      // NOTE: verifySignature is async in this SDK version — it MUST be awaited,
      // otherwise the returned (truthy) Promise silently accepts bad signatures.
      await this.mux.webhooks.verifySignature(rawBody.toString('utf8'), headers as any, secret);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Safety net for missed webhooks (and for development, where Mux can only
   * reach the production webhook URL): poll Mux for videos still marked
   * "processing" and sync their status. Best-effort — errors are swallowed.
   */
  async reconcileProcessingVideos(): Promise<void> {
    if (!this.mux) return;
    const pending = await this.prisma.video.findMany({
      where: { videoStatus: { in: ['uploading', 'processing'] } },
      select: { id: true, muxAssetId: true, muxUploadId: true },
      take: 20,
    });
    for (const v of pending) {
      try {
        let assetId = v.muxAssetId;
        if (!assetId && v.muxUploadId) {
          const upload = await this.mux.video.uploads.retrieve(v.muxUploadId);
          if (upload.status === 'errored' || upload.status === 'cancelled' || upload.status === 'timed_out') {
            await this.prisma.video.update({ where: { id: v.id }, data: { videoStatus: 'failed' } });
            continue;
          }
          assetId = upload.asset_id ?? null;
        }
        if (!assetId) continue;
        const asset = await this.mux.video.assets.retrieve(assetId);
        if (asset.status === 'ready') {
          const playbackId = asset.playback_ids?.find((p) => p.policy === 'public')?.id ?? asset.playback_ids?.[0]?.id;
          if (!playbackId) continue;
          await this.prisma.video.update({
            where: { id: v.id },
            data: {
              muxAssetId: assetId,
              muxPlaybackId: playbackId,
              videoStatus: 'ready',
              streamUrl: MuxService.playbackUrl(playbackId),
              ...(asset.duration ? { durationSec: Math.round(asset.duration), videoDuration: Math.round(asset.duration) } : {}),
            },
          });
        } else if (asset.status === 'errored') {
          await this.prisma.video.update({ where: { id: v.id }, data: { muxAssetId: assetId, videoStatus: 'failed' } });
        } else if (assetId !== v.muxAssetId) {
          await this.prisma.video.update({ where: { id: v.id }, data: { muxAssetId: assetId } });
        }
      } catch (err) {
        this.logger.warn(`Reconcile failed for video ${v.id}: ${(err as Error).message}`);
      }
    }
  }

  /** Handle a verified Mux webhook event. */
  async handleEvent(event: { type: string; data: any }): Promise<void> {
    const { type, data } = event;
    this.logger.log(`Received Mux webhook event: ${type}`);

    if (type === 'video.upload.asset_created') {
      // Link the asset to the video row as soon as Mux creates it.
      await this.prisma.video.updateMany({
        where: { muxUploadId: data.id },
        data: { muxAssetId: data.asset_id, videoStatus: 'processing', muxStatus: 'processing' },
      });
      return;
    }

    if (type === 'video.asset.ready') {
      const playbackId: string | undefined = data.playback_ids?.find(
        (p: any) => p.policy === 'public',
      )?.id ?? data.playback_ids?.[0]?.id;
      if (!playbackId) {
        this.logger.error(`Asset ${data.id} ready but has no playback ID`);
        return;
      }
      const duration = data.duration ? Math.round(data.duration) : 0;
      const thumbnail = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

      const res = await this.prisma.video.updateMany({
        where: { OR: [{ muxAssetId: data.id }, { muxUploadId: data.upload_id ?? '__none__' }] },
        data: {
          muxAssetId: data.id,
          muxPlaybackId: playbackId,
          videoStatus: 'ready',
          muxStatus: 'ready',
          streamUrl: MuxService.playbackUrl(playbackId),
          durationSec: duration,
          videoDuration: duration,
          muxDuration: duration,
          muxThumbnail: thumbnail,
        },
      });
      this.logger.log(`Webhook video.asset.ready: Asset ${data.id} ready (playbackId: ${playbackId}, duration: ${duration}) -> updated ${res.count} video(s)`);
      return;
    }

    if (type === 'video.asset.static_rendition.ready') {
      const files = data.static_renditions?.files || [];
      const mp4Files = files.filter((f: any) => f.ext === 'mp4' || f.name?.endsWith('.mp4'));
      if (mp4Files.length > 0) {
        mp4Files.sort((a: any, b: any) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0));
        const highestRendition = mp4Files[0];
        const filename = highestRendition.name;
        const filesize = highestRendition.filesize ? parseInt(highestRendition.filesize, 10) : null;

        const res = await this.prisma.video.updateMany({
          where: { muxAssetId: data.id },
          data: {
            muxStaticMp4Name: filename,
            offlineAvailable: true,
            videoSize: filesize,
          },
        });
        this.logger.log(`Webhook video.asset.static_rendition.ready: Asset ${data.id} static rendition ${filename} ready (size: ${filesize}) -> updated ${res.count} video(s)`);
      } else {
        this.logger.warn(`Webhook video.asset.static_rendition.ready: No MP4 files in rendition list for Asset ${data.id}`);
      }
      return;
    }

    if (type === 'video.asset.static_rendition.errored') {
      const res = await this.prisma.video.updateMany({
        where: { muxAssetId: data.id },
        data: {
          offlineAvailable: false,
        },
      });
      this.logger.error(`Webhook video.asset.static_rendition.errored for Asset ${data.id}. Error details: ${JSON.stringify(data.errors ?? data.error ?? {})}`);
      return;
    }

    if (type === 'video.asset.errored' || type === 'video.upload.errored') {
      const where =
        type === 'video.asset.errored'
          ? { muxAssetId: data.id }
          : { muxUploadId: data.id };
      await this.prisma.video.updateMany({ where, data: { videoStatus: 'failed', muxStatus: 'failed' } });
      this.logger.error(`Mux ${type}: ${JSON.stringify(data.errors ?? data.error ?? {})}`);
      return;
    }
  }

  async getAssetMp4Details(assetId: string): Promise<{ available: boolean; renditionName: string | null }> {
    if (!this.mux) return { available: false, renditionName: null };
    try {
      const asset = await this.mux.video.assets.retrieve(assetId);
      if (
        asset.static_renditions &&
        asset.static_renditions.status === 'ready' &&
        asset.static_renditions.files
      ) {
        const mp4Files = asset.static_renditions.files.filter(
          (f) => f.ext === 'mp4' || f.name?.endsWith('.mp4'),
        );
        if (mp4Files.length > 0) {
          // Sort by width * height descending to find the highest resolution
          mp4Files.sort((a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0));
          return { available: true, renditionName: mp4Files[0].name ?? null };
        }
      }
      return { available: false, renditionName: null };
    } catch (err) {
      this.logger.warn(`Failed to retrieve Mux asset ${assetId} for MP4 details: ${(err as Error).message}`);
      return { available: false, renditionName: null };
    }
  }

  async getPlaybackPolicy(assetId: string): Promise<'public' | 'signed' | null> {
    if (!this.mux) return null;
    try {
      const asset = await this.mux.video.assets.retrieve(assetId);
      const mainPlayback = asset.playback_ids?.[0];
      return (mainPlayback?.policy as 'public' | 'signed') || null;
    } catch (err) {
      this.logger.warn(`Failed to retrieve Mux asset ${assetId} for playback policy: ${(err as Error).message}`);
      return null;
    }
  }

  async generateSignedDownloadToken(playbackId: string, renditionName: string, filename: string): Promise<string> {
    const signingKeyId = process.env.MUX_SIGNING_KEY;
    const signingPrivateKey = process.env.MUX_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!signingKeyId || !signingPrivateKey) {
      throw new Error('Mux signing credentials (MUX_SIGNING_KEY/MUX_PRIVATE_KEY) are not configured');
    }
    return await this.client().jwt.signPlaybackId(playbackId, {
      keyId: signingKeyId,
      keySecret: signingPrivateKey,
      type: 'video',
      params: {
        download: filename,
      },
    });
  }

  async generateSignedDownloadTokenWithExp(
    playbackId: string,
    renditionName: string,
    filename: string,
    expiration: string,
  ): Promise<string> {
    const signingKeyId = process.env.MUX_SIGNING_KEY;
    const signingPrivateKey = process.env.MUX_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!signingKeyId || !signingPrivateKey) {
      this.logger.warn('MUX_SIGNING_KEY/MUX_PRIVATE_KEY not set — returning mock bypass token for development');
      return 'dev_token_bypass';
    }
    return await this.client().jwt.signPlaybackId(playbackId, {
      keyId: signingKeyId,
      keySecret: signingPrivateKey,
      type: 'video',
      expiration,
      params: {
        download: filename,
      },
    });
  }

  async syncAssetStatus(assetId: string, videoId: string): Promise<void> {
    if (!this.mux) return;
    try {
      const asset = await this.mux.video.assets.retrieve(assetId);
      if (asset.status === 'ready') {
        const playbackId = asset.playback_ids?.find((p) => p.policy === 'public')?.id ?? asset.playback_ids?.[0]?.id;
        if (!playbackId) return;
        const duration = asset.duration ? Math.round(asset.duration) : 0;
        const thumbnail = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

        let staticMp4Name: string | null = null;
        let offlineAvailable = false;
        let videoSize: number | null = null;

        if (asset.static_renditions && asset.static_renditions.status === 'ready' && asset.static_renditions.files) {
          const mp4Files = asset.static_renditions.files.filter((f) => f.ext === 'mp4' || f.name?.endsWith('.mp4'));
          if (mp4Files.length > 0) {
            mp4Files.sort((a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0));
            staticMp4Name = mp4Files[0].name ?? null;
            offlineAvailable = true;
            videoSize = mp4Files[0].filesize ? parseInt(mp4Files[0].filesize, 10) : null;
          }
        }

        await this.prisma.video.update({
          where: { id: videoId },
          data: {
            muxAssetId: assetId,
            muxPlaybackId: playbackId,
            videoStatus: 'ready',
            muxStatus: 'ready',
            streamUrl: MuxService.playbackUrl(playbackId),
            durationSec: duration,
            videoDuration: duration,
            muxDuration: duration,
            muxThumbnail: thumbnail,
            muxStaticMp4Name: staticMp4Name,
            offlineAvailable,
            videoSize,
          },
        });
        this.logger.log(`Manually synchronized asset ${assetId} to ready for video ${videoId}`);
      } else if (asset.status === 'errored') {
        await this.prisma.video.update({
          where: { id: videoId },
          data: {
            videoStatus: 'failed',
            muxStatus: 'failed',
          },
        });
        this.logger.error(`Asset ${assetId} is in errored status for video ${videoId}`);
      }
    } catch (err) {
      this.logger.warn(`syncAssetStatus failed for asset ${assetId}: ${(err as Error).message}`);
    }
  }

  async syncUploadStatus(uploadId: string, videoId: string): Promise<void> {
    if (!this.mux) return;
    try {
      const upload = await this.mux.video.uploads.retrieve(uploadId);
      if (upload.status === 'asset_created' && upload.asset_id) {
        await this.prisma.video.update({
          where: { id: videoId },
          data: {
            muxAssetId: upload.asset_id,
            videoStatus: 'processing',
            muxStatus: 'processing',
          },
        });
        await this.syncAssetStatus(upload.asset_id, videoId);
      } else if (upload.status === 'errored' || upload.status === 'cancelled' || upload.status === 'timed_out') {
        await this.prisma.video.update({
          where: { id: videoId },
          data: {
            videoStatus: 'failed',
            muxStatus: 'failed',
          },
        });
        this.logger.error(`Upload ${uploadId} is in failed status (${upload.status}) for video ${videoId}`);
      }
    } catch (err) {
      this.logger.warn(`syncUploadStatus failed for upload ${uploadId}: ${(err as Error).message}`);
    }
  }
}
