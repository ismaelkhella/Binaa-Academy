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

  async createDirectUpload(): Promise<{ uploadId: string; uploadUrl: string }> {
    const upload = await this.client().video.uploads.create({
      cors_origin: '*',
      new_asset_settings: {
        playback_policy: ['public'],
        video_quality: 'plus',
      },
    });
    if (!upload.url) {
      throw new ServiceUnavailableException('تعذر إنشاء رابط الرفع من Mux');
    }
    return { uploadId: upload.id, uploadUrl: upload.url };
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
              ...(asset.duration ? { durationSec: Math.round(asset.duration) } : {}),
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

    if (type === 'video.upload.asset_created') {
      // Link the asset to the video row as soon as Mux creates it.
      await this.prisma.video.updateMany({
        where: { muxUploadId: data.id },
        data: { muxAssetId: data.asset_id, videoStatus: 'processing' },
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
      const res = await this.prisma.video.updateMany({
        where: { OR: [{ muxAssetId: data.id }, { muxUploadId: data.upload_id ?? '__none__' }] },
        data: {
          muxAssetId: data.id,
          muxPlaybackId: playbackId,
          videoStatus: 'ready',
          streamUrl: MuxService.playbackUrl(playbackId),
          ...(data.duration ? { durationSec: Math.round(data.duration) } : {}),
        },
      });
      this.logger.log(`Asset ${data.id} ready → updated ${res.count} video(s)`);
      return;
    }

    if (type === 'video.asset.errored' || type === 'video.upload.errored') {
      const where =
        type === 'video.asset.errored'
          ? { muxAssetId: data.id }
          : { muxUploadId: data.id };
      await this.prisma.video.updateMany({ where, data: { videoStatus: 'failed' } });
      this.logger.error(`Mux ${type}: ${JSON.stringify(data.errors ?? data.error ?? {})}`);
      return;
    }
    // other events (created, cancelled, static renditions…) are ignored
  }
}
