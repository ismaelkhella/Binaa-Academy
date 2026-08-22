import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanType } from '@prisma/client';
import { MuxService } from '../mux/mux.service';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    private prisma: PrismaService,
    private muxService: MuxService,
  ) { }

  private mapQuestions(questions: { id: string; text: string; options: string; answer: string }[]) {
    return questions.map((q) => {
      let parsedOptions = [];
      try {
        parsedOptions = JSON.parse(q.options);
      } catch (e) {
        parsedOptions = q.options.split(',');
      }
      return {
        id: q.id,
        text: q.text,
        options: parsedOptions,
        answer: q.answer,
      };
    });
  }

  async getLessonDetails(videoId: string, userId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: {
        subject: true,
        teacher: true,
        chapters: {
          orderBy: { order: 'asc' },
        },
        questions: true,
      },
    });

    if (!video || video.status !== 'PUBLISHED') {
      throw new NotFoundException('الفيديو غير موجود');
    }

    // Verify student has access to this video based on subscription quota
    await this.ensureAccess(video.subjectId, userId, videoId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { isActive: true },
          include: { plan: true },
        },
      },
    });

    const hasPaidSubscription = user?.subscriptions.some(
      (sub) => sub.plan.type !== PlanType.TRIAL,
    ) ?? false;

    const gradeLabel = video.subject.grade === 'GRADE_12' ? 'الصف الثالث الثانوي' : 'الصف الحادي عشر';
    const subHeader = `${video.subject.name} - ${gradeLabel}`;

    const quiz = await this.prisma.quiz.findFirst({
      where: { subjectId: video.subjectId },
      orderBy: { createdAt: 'desc' },
    });

    const chapters = video.chapters.map((ch, idx) => {
      let status = 'UNPLAYED';
      if (!hasPaidSubscription && ch.isPremium) {
        status = 'LOCKED';
      } else {
        if (idx === 0) status = 'COMPLETED';
        else if (idx === 1) status = 'PLAYING';
      }

      const durationText = `${formatTime(ch.startSec)} - ${formatTime(ch.endSec)}`;

      return {
        id: ch.id,
        title: ch.title,
        startSec: ch.startSec,
        endSec: ch.endSec,
        durationText,
        status,
      };
    });

    const rawRelated = await this.prisma.video.findMany({
      where: {
        subjectId: video.subjectId,
        status: 'PUBLISHED',
        id: { not: videoId },
      },
      include: {
        teacher: { select: { name: true } },
      },
      orderBy: [{ unitNumber: 'asc' }, { orderInUnit: 'asc' }],
      take: 4,
    });

    const relatedVideos = rawRelated.map((rv) => {
      const minutes = Math.floor(rv.durationSec / 60);
      const seconds = rv.durationSec % 60;
      const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      return {
        id: rv.id,
        title: rv.title,
        subjectName: video.subject.name,
        teacherName: rv.teacher?.name ?? null,
        durationText,
        unitName: `الوحدة ${rv.unitNumber === 1 ? 'الأولى' : rv.unitNumber}`,
      };
    });

    return {
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        streamUrl: video.streamUrl,
        pdfUrl: video.pdfUrl,
        durationSec: video.durationSec,
        unitName: `الوحدة ${video.unitNumber === 1 ? 'الأولى' : video.unitNumber}`,
        subHeader,
        teacherName: video.teacher?.name ?? null,
        dailyQuizId: quiz?.id ?? null,
        mux_playback_id: video.muxPlaybackId ?? '',
        video_status: video.videoStatus === 'ready' ? 'ready' : 'processing',
        questions: this.mapQuestions(video.questions),
      },
      chapters,
      relatedVideos,
      watermark: {
        name: user?.name ?? 'طالب',
        phone: user?.phone ?? '',
      },
    };
  }

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

    // Mux uploads have no stream URL until processing completes — never hand
    // the player a null/empty URL (it would render the site root instead).
    if (!video.streamUrl) {
      throw new NotFoundException('الفيديو قيد المعالجة حالياً — حاول مجدداً بعد قليل');
    }

    return {
      streamUrl: video.streamUrl,
      watermark: { name: user?.name ?? 'طالب', phone: user?.phone ?? '' },
      playbackRates: [0.75, 1, 1.25, 1.5, 2],
      qualities: ['auto', '360p', '480p', '720p', '1080p'],
    };
  }

  async markViewed(videoId: string, userId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { subject: true }
    });
    if (!video) throw new NotFoundException('الفيديو غير موجود');

    const view = await this.prisma.videoView.upsert({
      where: { userId_videoId: { userId, videoId } },
      create: { userId, videoId, viewCount: 1, completed: true },
      update: { viewCount: { increment: 1 }, lastViewed: new Date(), completed: true },
    });

    // Check if the student completed a multiple of 2 videos in this subject
    const completedViews = await this.prisma.videoView.findMany({
      where: {
        userId,
        completed: true,
        video: { subjectId: video.subjectId },
      },
      include: {
        video: {
          include: {
            questions: true,
          },
        },
      },
      orderBy: { lastViewed: 'asc' },
    });

    let triggerQuiz = null;
    if (completedViews.length % 2 === 0 && completedViews.length > 0) {
      // Get the last two completed views
      const lastTwoViews = completedViews.slice(-2);
      
      // Get questions for these two videos
      const quizQuestions = lastTwoViews.flatMap((cv) =>
        this.mapQuestions(cv.video.questions),
      );

      if (quizQuestions.length > 0) {
        triggerQuiz = {
          title: `اختبار قصير: ${video.subject.name}`,
          subjectId: video.subjectId,
          questions: quizQuestions,
        };
      }
    }

    return {
      viewCount: view.viewCount,
      maxViews: video.maxViews,
      triggerQuiz,
    };
  }

  /** Best-effort playback position sync, used to power "Continue Learning"
   * on the dashboard. Does not touch viewCount/completed — those remain
   * markViewed's responsibility. */
  async updatePosition(videoId: string, userId: string, positionSec: number) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { durationSec: true },
    });
    if (!video) throw new NotFoundException('الفيديو غير موجود');

    const clamped = video.durationSec > 0
      ? Math.min(positionSec, video.durationSec)
      : positionSec;

    await this.prisma.videoView.upsert({
      where: { userId_videoId: { userId, videoId } },
      create: { userId, videoId, positionSec: clamped },
      update: { positionSec: clamped, lastViewed: new Date() },
    });

    return { success: true };
  }

  async getDownloadDetails(videoId: string, userId: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('الفيديو غير موجود');

    await this.ensureAccess(video.subjectId, userId, videoId);

    const playbackId = video.muxPlaybackId || null;
    const streamingUrl = video.streamUrl || null;

    // Sanitizing video title to yield a clean alphanumeric/Arabic file name
    const sanitizedTitle = video.title.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
    const downloadFilename = `${sanitizedTitle || videoId}.mp4`;

    let downloadUrl: string | null = null;
    let downloadAvailable = false;
    let renditionName: string | null = null;

    if (video.muxAssetId && video.videoStatus === 'ready') {
      try {
        const details = await this.muxService.getAssetMp4Details(video.muxAssetId);
        if (details.available && details.renditionName) {
          renditionName = details.renditionName;
          const policy = await this.muxService.getPlaybackPolicy(video.muxAssetId);
          if (playbackId && policy === 'signed') {
            const token = await this.muxService.generateSignedDownloadToken(playbackId, renditionName, downloadFilename);
            downloadUrl = `https://stream.mux.com/${playbackId}/${renditionName}?token=${token}&download=${downloadFilename}`;
          } else if (playbackId) {
            downloadUrl = `https://stream.mux.com/${playbackId}/${renditionName}?download=${downloadFilename}`;
          }
          if (playbackId) {
            downloadAvailable = true;
          }
          this.logger.log(
            `Selected download URL: ${downloadUrl}, playbackId: ${playbackId}, rendition name: ${renditionName}`
          );
        } else {
          this.logger.warn(`MP4 rendition is not ready for asset ${video.muxAssetId} of video ${videoId}`);
        }
      } catch (err) {
        this.logger.error(`Failed to fetch MP4 renditions from Mux for video ${videoId}: ${(err as Error).message}`);
      }
    }

    // Fallback to legacy local video files if there's no Mux asset ID but the local URL is an MP4
    if (!video.muxAssetId && video.streamUrl && video.streamUrl.endsWith('.mp4')) {
      downloadUrl = video.streamUrl;
      downloadAvailable = true;
      renditionName = 'local';
    }

    return {
      playbackId,
      streamingUrl,
      downloadUrl,
      downloadAvailable,
      downloadFilename,
    };
  }

  async getDownloadToken(videoId: string, userId: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('الفيديو غير موجود');
    const details = await this.getDownloadDetails(videoId, userId);
    const expiresAt = new Date(Date.now() + video.downloadDays * 24 * 60 * 60 * 1000);
    return {
      token: details.downloadUrl || `offline_${videoId}_${userId}_${Date.now()}`,
      expiresAt,
      downloadDays: video.downloadDays,
    };
  }

  private async ensureAccess(subjectId: string, userId: string, videoId: string) {
    const activeSubs = await this.prisma.subscription.findMany({
      where: { userId, isActive: true, isFrozen: false, endDate: { gt: new Date() } },
      include: { plan: true, subjects: true },
    });

    if (activeSubs.length === 0) {
      throw new ForbiddenException('الاشتراك غير فعّال');
    }

    const isSubscribed = activeSubs.some(
      (sub) => sub.plan.type !== PlanType.TRIAL && sub.subjects.some((ss) => ss.subjectId === subjectId)
    );

    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    const trialUnlockedSubjects = [
      'اللغة العربية',
      'اللغة الإنجليزية',
      'الفيزياء',
      'الأحياء',
      'التكنولوجيا',
    ];

    const isTrialUnlocked = trialUnlockedSubjects.includes(subject?.name ?? '');

    if (!isSubscribed) {
      const hasTrial = activeSubs.some((sub) => sub.plan.type === PlanType.TRIAL);
      if (!hasTrial || !isTrialUnlocked) {
        throw new ForbiddenException('هذا الفيديو غير متاح في خطتك');
      }

      const trialSub = activeSubs.find((sub) => sub.plan.type === PlanType.TRIAL);
      const trialQuota = trialSub?.plan.videosPerSubject ?? 2;

      const publishedVideos = await this.prisma.video.findMany({
        where: { subjectId, status: 'PUBLISHED' },
        orderBy: [{ unitNumber: 'asc' }, { orderInUnit: 'asc' }],
        select: { id: true },
      });

      const index = publishedVideos.findIndex((v) => v.id === videoId);
      if (index === -1 || index >= trialQuota) {
        throw new ForbiddenException('هذا الفيديو غير متاح في التجربة المجانية');
      }
    }
  }

  async getLessonsList(userId: string) {
    const videos = await this.prisma.video.findMany({
      where: { status: 'PUBLISHED' },
      include: { subject: true },
    });

    const results = [];
    for (const video of videos) {
      const canWatch = await this.checkWatchAccess(video.subjectId, userId, video.id);
      const canDownload = canWatch && (video.offlineAvailable === true) && await this.checkDownloadAccess(video.subjectId, userId);

      const playbackId = video.muxPlaybackId || '';
      const thumbnail = video.muxThumbnail || (playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : '');

      results.push({
        title: video.title,
        thumbnail,
        duration: video.durationSec || (video.muxDuration ? Math.round(video.muxDuration) : 0),
        canDownload,
        canWatch,
        // Compatibility keys
        "Playback URL": playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : '',
        "Thumbnail": thumbnail,
        "Duration": video.durationSec || (video.muxDuration ? Math.round(video.muxDuration) : 0),
        "Offline Available": video.offlineAvailable,
      });
    }

    return results;
  }

  async getLessonDetailsSecure(videoId: string, userId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { subject: true },
    });

    if (!video || video.status !== 'PUBLISHED') {
      throw new NotFoundException('الدرس غير موجود');
    }

    // Validate access
    await this.ensureAccess(video.subjectId, userId, videoId);

    const playbackId = video.muxPlaybackId || '';
    const playbackUrl = playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : '';
    const thumbnail = video.muxThumbnail || (playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : '');

    // Log the playback request
    this.logger.log(`Playback request: user ${userId} requested streaming for video ${videoId}`);

    return {
      playbackUrl,
      thumbnail,
      duration: video.durationSec || (video.muxDuration ? Math.round(video.muxDuration) : 0),
      offlineAvailable: video.offlineAvailable,
      // Compatibility keys
      "Playback URL": playbackUrl,
      "Thumbnail": thumbnail,
      "Duration": video.durationSec || (video.muxDuration ? Math.round(video.muxDuration) : 0),
      "Offline Available": video.offlineAvailable,
    };
  }

  async generateSecureDownloadUrl(videoId: string, userId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { subject: true },
    });

    if (!video || video.status !== 'PUBLISHED') {
      throw new NotFoundException('الدرس غير موجود');
    }

    // Verify course ownership (must be paid enrolled user)
    const isEnrolled = await this.checkDownloadAccess(video.subjectId, userId);
    if (!isEnrolled) {
      this.logger.warn(`Download access denied: user ${userId} is not enrolled in subject ${video.subjectId}`);
      throw new ForbiddenException('يجب الاشتراك في المادة لتنزيل الفيديو');
    }

    if (!video.offlineAvailable || !video.muxAssetId || !video.muxPlaybackId) {
      throw new BadRequestException('الفيديو غير متاح للتنزيل حالياً');
    }

    // Log the download request
    this.logger.log(`Download request: user ${userId} requested download for video ${videoId}`);

    const playbackId = video.muxPlaybackId;
    const renditionName = video.muxStaticMp4Name || 'highest.mp4';
    const sanitizedTitle = video.title.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
    const downloadFilename = `${sanitizedTitle || videoId}.mp4`;

    // Always generate a signed token with 10-minute expiration
    const token = await this.muxService.generateSignedDownloadTokenWithExp(
      playbackId,
      renditionName,
      downloadFilename,
      '10m', // 10 minutes expiration
    );

    const downloadUrl = `https://stream.mux.com/${playbackId}/${renditionName}?token=${token}&download=${downloadFilename}`;

    return {
      downloadUrl,
      "Download URL": downloadUrl,
    };
  }

  async checkWatchAccess(subjectId: string, userId: string, videoId: string): Promise<boolean> {
    try {
      await this.ensureAccess(subjectId, userId, videoId);
      return true;
    } catch {
      return false;
    }
  }

  async checkDownloadAccess(subjectId: string, userId: string): Promise<boolean> {
    try {
      const activeSubs = await this.prisma.subscription.findMany({
        where: { userId, isActive: true, isFrozen: false, endDate: { gt: new Date() } },
        include: { plan: true, subjects: true },
      });

      if (activeSubs.length === 0) return false;

      // Verify the user has a paid subscription (not PlanType.TRIAL) covering the subject
      const hasPaidSubForSubject = activeSubs.some(
        (sub) => sub.plan.type !== PlanType.TRIAL && sub.subjects.some((ss) => ss.subjectId === subjectId)
      );

      return hasPaidSubForSubject;
    } catch {
      return false;
    }
  }
}
