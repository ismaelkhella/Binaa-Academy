import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MuxService } from './mux.service';

@Injectable()
export class MuxJobsService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(MuxJobsService.name);
  private intervals: NodeJS.Timeout[] = [];

  constructor(
    private prisma: PrismaService,
    private muxService: MuxService,
  ) { }

  onApplicationBootstrap() {
    this.logger.log('Starting Mux background jobs scheduler...');

    // Job 1: Reconcile processing videos (every 2 minutes)
    const reconcileInterval = setInterval(() => {
      this.reconcileJob().catch((err) =>
        this.logger.error(`Error in reconcileJob: ${err.message}`),
      );
    }, 2 * 60 * 1000);
    this.intervals.push(reconcileInterval);

    // Job 2: Sync missing thumbnails (every 5 minutes)
    const thumbnailInterval = setInterval(() => {
      this.thumbnailSyncJob().catch((err) =>
        this.logger.error(`Error in thumbnailSyncJob: ${err.message}`),
      );
    }, 5 * 60 * 1000);
    this.intervals.push(thumbnailInterval);

    // Job 3: Cleanup expired/failed drafts (every 24 hours)
    const cleanupInterval = setInterval(() => {
      this.cleanupJob().catch((err) =>
        this.logger.error(`Error in cleanupJob: ${err.message}`),
      );
    }, 24 * 60 * 60 * 1000);
    this.intervals.push(cleanupInterval);

    // Run immediately on boot
    this.reconcileJob().catch((err) => this.logger.error(`Initial reconcile error: ${err.message}`));
    this.thumbnailSyncJob().catch((err) => this.logger.error(`Initial thumbnail sync error: ${err.message}`));
  }

  onModuleDestroy() {
    this.logger.log('Stopping Mux background jobs scheduler...');
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
  }

  /**
   * Job 1: Polls Mux API for status of videos currently uploading/processing
   */
  async reconcileJob() {
    this.logger.log('Executing Background Job: Video Upload / Asset Processing Reconciliation...');
    await this.muxService.reconcileProcessingVideos();
  }

  /**
   * Job 2: Generates thumbnail URLs for ready videos that do not have one yet
   */
  async thumbnailSyncJob() {
    this.logger.log('Executing Background Job: Thumbnail Sync...');
    const videosMissingThumb = await this.prisma.video.findMany({
      where: {
        videoStatus: 'ready',
        muxPlaybackId: { not: null },
        muxThumbnail: null,
      },
      select: { id: true, muxPlaybackId: true },
    });

    if (videosMissingThumb.length === 0) return;

    this.logger.log(`Found ${videosMissingThumb.length} videos missing thumbnail urls. Syncing...`);
    for (const v of videosMissingThumb) {
      if (!v.muxPlaybackId) continue;
      const thumbnail = `https://image.mux.com/${v.muxPlaybackId}/thumbnail.jpg`;
      await this.prisma.video.update({
        where: { id: v.id },
        data: { muxThumbnail: thumbnail },
      });
      this.logger.log(`Synced thumbnail for video ${v.id}`);
    }
  }

  /**
   * Job 3: Cleans up database draft videos that failed processing or were abandoned > 24h ago
   */
  async cleanupJob() {
    this.logger.log('Executing Background Job: Database Cleanup...');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Delete DRAFT videos that have failed Mux processing and were created over 24 hours ago
    const deletedCount = await this.prisma.video.deleteMany({
      where: {
        status: 'DRAFT',
        videoStatus: 'failed',
        createdAt: { lt: oneDayAgo },
      },
    });

    if (deletedCount.count > 0) {
      this.logger.log(`Cleaned up ${deletedCount.count} failed draft videos older than 24 hours.`);
    }
  }
}
