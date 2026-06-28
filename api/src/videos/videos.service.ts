import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VideosService {
  constructor(private prisma: PrismaService) {}

  async getStreamUrl(videoId: string, userId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { subject: true },
    });
    if (!video || video.status !== 'PUBLISHED') {
      throw new NotFoundException('الفيديو غير موجود');
    }

    await this.ensureAccess(video.subjectId, userId, videoId);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const view = await this.prisma.videoView.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    if (view && view.viewCount >= video.maxViews) {
      throw new ForbiddenException('تم استنفاد عدد المشاهدات المسموح');
    }

    return {
      streamUrl: video.streamUrl,
      watermark: { name: user?.name ?? 'طالب', phone: user?.phone ?? '' },
      playbackRates: [0.75, 1, 1.25, 1.5, 2],
      qualities: ['auto', '360p', '480p', '720p', '1080p'],
    };
  }

  async markViewed(videoId: string, userId: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('الفيديو غير موجود');

    const view = await this.prisma.videoView.upsert({
      where: { userId_videoId: { userId, videoId } },
      create: { userId, videoId, viewCount: 1 },
      update: { viewCount: { increment: 1 }, lastViewed: new Date() },
    });

    return { viewCount: view.viewCount, maxViews: video.maxViews };
  }

  async getDownloadToken(videoId: string, userId: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('الفيديو غير موجود');

    await this.ensureAccess(video.subjectId, userId, videoId);

    const expiresAt = new Date(Date.now() + video.downloadDays * 24 * 60 * 60 * 1000);
    return {
      token: `offline_${videoId}_${userId}_${Date.now()}`,
      expiresAt,
      downloadDays: video.downloadDays,
    };
  }

  private async ensureAccess(subjectId: string, userId: string, videoId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: { where: { isActive: true }, include: { plan: true }, take: 1 },
      },
    });

    const sub = user?.subscriptions[0];
    if (!sub || sub.isFrozen || sub.endDate < new Date()) {
      throw new ForbiddenException('الاشتراك غير فعّال');
    }

    const publishedVideos = await this.prisma.video.findMany({
      where: { subjectId, status: 'PUBLISHED' },
      orderBy: [{ unitNumber: 'asc' }, { orderInUnit: 'asc' }],
      select: { id: true },
    });

    const index = publishedVideos.findIndex((v) => v.id === videoId);
    if (index === -1 || index >= sub.plan.videosPerSubject) {
      throw new ForbiddenException('هذا الفيديو غير متاح في خطتك');
    }
  }
}
