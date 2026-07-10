import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanType } from '@prisma/client';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

@Injectable()
export class VideosService {
  constructor(private prisma: PrismaService) { }

  async getLessonDetails(videoId: string, userId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: {
        subject: true,
        teacher: true,
        chapters: {
          orderBy: { order: 'asc' },
        },
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
        cv.video.questions.map((q) => {
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
        })
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
}
