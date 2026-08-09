import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Grade, Branch, PlanType } from '@prisma/client';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async listForStudent(grade: Grade, branch: Branch, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { isActive: true, isFrozen: false, endDate: { gt: new Date() } },
          include: {
            plan: true,
            subjects: true,
          },
        },
      },
    });

    const subjects = await this.prisma.subject.findMany({
      where: { grade, branch },
      include: {
        teacher: { select: { name: true } },
        _count: { select: { videos: { where: { status: 'PUBLISHED' } } } },
      },
      orderBy: { name: 'asc' },
    });

    const trialUnlockedSubjects = [
      'اللغة العربية',
      'اللغة الإنجليزية',
      'الفيزياء',
      'الأحياء',
      'التكنولوجيا',
    ];

    const result = [];
    for (const s of subjects) {
      const completedCount = await this.prisma.videoView.count({
        where: {
          userId,
          completed: true,
          video: { subjectId: s.id, status: 'PUBLISHED' },
        },
      });

      const totalVideos = s._count.videos;
      const progressPercent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;
      
      let locked = true;
      
      // Check if they are subscribed to this subject in any active paid subscription
      const isSubscribed = user?.subscriptions.some(
        (sub) => sub.plan.type !== PlanType.TRIAL && sub.subjects.some((ss) => ss.subjectId === s.id)
      );

      if (isSubscribed) {
        locked = false;
      } else {
        // Check if they have an active trial subscription, and this is a trial unlocked subject
        const hasTrial = user?.subscriptions.some((sub) => sub.plan.type === PlanType.TRIAL);
        if (hasTrial && trialUnlockedSubjects.includes(s.name)) {
          locked = false;
        }
      }

      result.push({
        id: s.id,
        name: s.name,
        grade: s.grade,
        branch: s.branch,
        teacherName: s.teacher?.name ?? null,
        videoCount: totalVideos,
        progressPercent,
        locked,
        priceIls: s.priceIls,
      });
    }

    return result;
  }

  async getVideos(subjectId: string, userId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        videos: {
          where: { status: 'PUBLISHED' },
          orderBy: [{ unitNumber: 'asc' }, { orderInUnit: 'asc' }],
        },
      },
    });
    if (!subject) throw new NotFoundException('المادة غير موجودة');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { isActive: true, isFrozen: false, endDate: { gt: new Date() } },
          include: { plan: true, subjects: true },
        },
      },
    });

    const isSubscribed = user?.subscriptions.some(
      (sub) => sub.plan.type !== PlanType.TRIAL && sub.subjects.some((ss) => ss.subjectId === subjectId)
    );

    const trialSub = user?.subscriptions.find((sub) => sub.plan.type === PlanType.TRIAL);
    const trialQuota = trialSub?.plan.videosPerSubject ?? 2;

    const trialUnlockedSubjects = [
      'اللغة العربية',
      'اللغة الإنجليزية',
      'الفيزياء',
      'الأحياء',
      'التكنولوجيا',
    ];
    const isTrialUnlocked = trialUnlockedSubjects.includes(subject.name);

    return {
      subject: { id: subject.id, name: subject.name },
      videos: subject.videos.map((v, index) => {
        let locked = true;
        if (isSubscribed) {
          locked = false;
        } else if (trialSub && isTrialUnlocked && index < trialQuota) {
          locked = false;
        }

        return {
          id: v.id,
          title: v.title,
          description: v.description,
          durationSec: v.durationSec,
          unitNumber: v.unitNumber,
          orderInUnit: v.orderInUnit,
          pdfUrl: v.pdfUrl,
          locked,
          mux_playback_id: v.muxPlaybackId ?? '',
          video_status: v.videoStatus === 'ready' ? 'ready' : 'processing',
        };
      }),
      quota: isSubscribed ? subject.videos.length : (isTrialUnlocked ? trialQuota : 0),
    };
  }

  async listPurchasedForStudent(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { isActive: true, isFrozen: false, endDate: { gt: new Date() } },
          include: {
            plan: { select: { type: true } },
            subjects: {
              include: {
                subject: {
                  include: {
                    teacher: { select: { name: true } },
                    _count: { select: { videos: { where: { status: 'PUBLISHED' } } } }
                  }
                }
              }
            },
          },
        },
      },
    });

    const activePaidSubs = user?.subscriptions.filter((sub) => sub.plan.type !== PlanType.TRIAL) || [];
    const subjectsMap = new Map<string, any>();

    for (const sub of activePaidSubs) {
      for (const ss of sub.subjects) {
        const s = ss.subject;
        if (!s) continue;

        const completedCount = await this.prisma.videoView.count({
          where: {
            userId,
            completed: true,
            video: { subjectId: s.id, status: 'PUBLISHED' },
          },
        });

        const totalVideos = s._count.videos;
        const progressPercent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

        subjectsMap.set(s.id, {
          id: s.id,
          name: s.name,
          grade: s.grade,
          branch: s.branch,
          teacherName: s.teacher?.name ?? null,
          videoCount: totalVideos,
          progressPercent,
          locked: false,
          priceIls: s.priceIls,
        });
      }
    }

    return Array.from(subjectsMap.values());
  }
}
