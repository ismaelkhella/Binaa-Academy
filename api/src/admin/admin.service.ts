import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MuxService } from '../mux/mux.service';
import {
  ListStudentsQuery,
  UpdateStudentDto,
  FreezeSubscriptionDto,
  GrantSubscriptionDto,
  CreateVideoDto,
  UpdatePlanDto,
  UpdateSubjectDto,
  CreateTeacherDto,
} from './dto/admin.dto';
import { PlanType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private muxService: MuxService,
  ) {}

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalStudents,
      activeStudents,
      trialStudents,
      monthlySubs,
      lastMonthSubs,
      recentStudents,
      topSubjects,
      totalVideos,
      completedViews,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({
        where: {
          role: 'STUDENT',
          subscriptions: { some: { isActive: true, endDate: { gt: now }, isFrozen: false } },
        },
      }),
      this.prisma.user.count({
        where: {
          role: 'STUDENT',
          subscriptions: { some: { isActive: true, plan: { type: PlanType.TRIAL } } },
        },
      }),
      this.prisma.subscription.count({
        where: { createdAt: { gte: startOfMonth }, plan: { type: { not: PlanType.TRIAL } } },
      }),
      this.prisma.subscription.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          plan: { type: { not: PlanType.TRIAL } },
        },
      }),
      this.prisma.user.findMany({
        where: { role: 'STUDENT' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, phone: true, name: true, grade: true, branch: true, createdAt: true },
      }),
      this.prisma.videoView.groupBy({
        by: ['videoId'],
        _count: { videoId: true },
        orderBy: { _count: { videoId: 'desc' } },
        take: 5,
      }),
      this.prisma.video.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.videoView.count({ where: { completed: true } }),
    ]);

    const topVideoIds = topSubjects.map((t) => t.videoId);
    const videos = await this.prisma.video.findMany({
      where: { id: { in: topVideoIds } },
      include: { subject: { select: { name: true } } },
    });
    const videoMap = new Map(videos.map((v) => [v.id, v]));

    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { type: { not: PlanType.TRIAL }, isActive: true },
    });
    const monthlyRevenue = monthlySubs * (plans.find((p) => p.type === PlanType.MONTHLY)?.priceIls ?? 0);

    return {
      students: { total: totalStudents, active: activeStudents, trial: trialStudents },
      subscriptions: { thisMonth: monthlySubs, lastMonth: lastMonthSubs },
      revenue: { thisMonth: monthlyRevenue, currency: 'ILS' },
      content: { totalVideos, completionRate: totalVideos > 0 ? Math.round((completedViews / totalVideos) * 100) : 0 },
      recentStudents,
      topVideos: topSubjects.map((t) => {
        const v = videoMap.get(t.videoId);
        return {
          videoId: t.videoId,
          title: v?.title ?? '—',
          subject: v?.subject.name ?? '—',
          views: t._count.videoId,
        };
      }),
    };
  }

  async listStudents(query: ListStudentsQuery) {
    const where: Record<string, unknown> = { role: 'STUDENT' };

    if (query.grade) where.grade = query.grade;
    if (query.branch) where.branch = query.branch;
    if (query.search) {
      const isSqlite = process.env.DATABASE_URL?.startsWith('file:') || !process.env.DATABASE_URL?.includes('postgres');
      where.OR = [
        { phone: { contains: query.search } },
        { name: isSqlite ? { contains: query.search } : { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const students = await this.prisma.user.findMany({
      where,
      include: {
        subscriptions: {
          where: { isActive: true },
          include: { plan: true },
          take: 1,
        },
        _count: { select: { videoViews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return students.map((s) => ({
      id: s.id,
      phone: s.phone,
      name: s.name,
      grade: s.grade,
      branch: s.branch,
      parentPhone: s.parentPhone,
      isActive: s.isActive,
      createdAt: s.createdAt,
      viewsCount: s._count.videoViews,
      subscription: s.subscriptions[0]
        ? {
            planType: s.subscriptions[0].plan.type,
            planName: s.subscriptions[0].plan.nameAr,
            endDate: s.subscriptions[0].endDate,
            isFrozen: s.subscriptions[0].isFrozen,
          }
        : null,
    }));
  }

  async getStudent(id: string) {
    const student = await this.prisma.user.findFirst({
      where: { id, role: 'STUDENT' },
      include: {
        subscriptions: {
          include: {
            plan: true,
            subjects: {
              include: {
                subject: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        videoViews: {
          include: {
            video: {
              include: {
                subject: true,
              },
            },
          },
          orderBy: { lastViewed: 'desc' },
        },
        quizResults: {
          include: {
            quiz: {
              include: {
                subject: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        dailyGoals: {
          orderBy: { dueDate: 'desc' },
        },
        studySessions: {
          orderBy: { date: 'desc' },
        },
      },
    });
    if (!student) throw new NotFoundException('الطالب غير موجود');
    return student;
  }

  async updateStudent(id: string, dto: UpdateStudentDto) {
    const student = await this.prisma.user.findFirst({ where: { id, role: 'STUDENT' } });
    if (!student) throw new NotFoundException('الطالب غير موجود');
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  async freezeSubscription(userId: string, dto: FreezeSubscriptionDto) {
    const sub = await this.prisma.subscription.findFirst({ where: { userId, isActive: true } });
    if (!sub) throw new NotFoundException('لا يوجد اشتراك فعّال');
    return this.prisma.subscription.update({
      where: { id: sub.id },
      data: { isFrozen: dto.freeze, notes: dto.reason },
    });
  }

  async grantSubscription(userId: string, dto: GrantSubscriptionDto) {
    let sub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        endDate: { gt: new Date() },
        isFrozen: false,
        plan: { type: { not: PlanType.TRIAL } },
      },
    });

    if (!sub) {
      const plan = await this.prisma.subscriptionPlan.findFirst({
        where: { type: PlanType.YEARLY },
      }) || await this.prisma.subscriptionPlan.findFirst({
        where: { isActive: true },
      });

      if (!plan) throw new NotFoundException('خطة الاشتراك غير موجودة في النظام');

      sub = await this.prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          endDate: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000), // 10 years duration
        },
      });
    }

    if (dto.subjectIds) {
      await this.prisma.subscriptionSubject.deleteMany({
        where: {
          subscriptionId: sub.id,
          subjectId: { notIn: dto.subjectIds },
        },
      });

      for (const subjectId of dto.subjectIds) {
        await this.prisma.subscriptionSubject.upsert({
          where: {
            subscriptionId_subjectId: {
              subscriptionId: sub.id,
              subjectId,
            },
          },
          create: {
            subscriptionId: sub.id,
            subjectId,
          },
          update: {},
        });
      }
    }

    return this.prisma.subscription.findUnique({
      where: { id: sub.id },
      include: {
        plan: true,
        subjects: {
          include: {
            subject: true,
          },
        },
      },
    });
  }

  async listVideos() {
    // Sync any still-processing Mux videos before returning the list
    await this.muxService.reconcileProcessingVideos().catch(() => undefined);
    return this.prisma.video.findMany({
      include: {
        subject: { select: { name: true, grade: true, branch: true } },
        teacher: { select: { name: true } },
        _count: { select: { videoViews: true } },
        questions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createVideo(dto: CreateVideoDto) {
    const { questions, ...videoData } = dto;
    const video = await this.prisma.video.create({
      data: {
        ...videoData,
        // Mux uploads start without a URL; webhook fills streamUrl when ready.
        ...(videoData.muxUploadId ? { videoStatus: 'processing' } : {}),
      },
    });
    if (questions && questions.length > 0) {
      await this.prisma.videoQuestion.createMany({
        data: questions.map((q) => ({
          videoId: video.id,
          text: q.text,
          options: JSON.stringify(q.options),
          answer: q.answer,
        })),
      });
    }
    return this.prisma.video.findUnique({
      where: { id: video.id },
      include: { questions: true },
    });
  }

  async updateVideo(id: string, dto: Partial<CreateVideoDto>) {
    const { questions, ...videoData } = dto;
    const data: Record<string, unknown> = { ...videoData };
    const existing = await this.prisma.video.findUnique({
      where: { id },
      select: { muxAssetId: true, muxUploadId: true },
    });
    if (videoData.muxUploadId) {
      // Replacing the video with a new Mux upload: delete the old asset and
      // reset playback fields — the webhook will fill them when the new asset is ready.
      if (existing?.muxUploadId !== videoData.muxUploadId) {
        if (existing?.muxAssetId) await this.muxService.deleteAsset(existing.muxAssetId);
        data.muxAssetId = null;
        data.muxPlaybackId = null;
        data.videoStatus = 'processing';
        data.streamUrl = null;
      }
    } else if (
      videoData.streamUrl &&
      (existing?.muxAssetId || existing?.muxUploadId)
    ) {
      // Switching a Mux-backed video to a manual URL: delete the old asset and
      // clear the stale Mux linkage so status/reconciliation don't lie.
      if (existing.muxAssetId) await this.muxService.deleteAsset(existing.muxAssetId);
      data.muxUploadId = null;
      data.muxAssetId = null;
      data.muxPlaybackId = null;
      data.videoStatus = 'none';
    }
    const video = await this.prisma.video.update({ where: { id }, data: data as any });
    if (questions) {
      await this.prisma.videoQuestion.deleteMany({ where: { videoId: id } });
      if (questions.length > 0) {
        await this.prisma.videoQuestion.createMany({
          data: questions.map((q) => ({
            videoId: id,
            text: q.text,
            options: JSON.stringify(q.options),
            answer: q.answer,
          })),
        });
      }
    }
    return this.prisma.video.findUnique({
      where: { id },
      include: { questions: true },
    });
  }

  async deleteVideo(id: string) {
    // Soft-delete: set status to DRAFT instead of hard-deleting.
    // Hard deletion cascades to VideoView records (student watch history),
    // permanently erasing student data. Setting DRAFT hides the video from
    // students (only PUBLISHED videos are visible) while preserving history.
    return this.prisma.video.update({
      where: { id },
      data: { status: 'DRAFT' },
    });
  }

  async listSubjects() {
    return this.prisma.subject.findMany({
      include: { teacher: { select: { id: true, name: true } }, _count: { select: { videos: true } } },
      orderBy: [{ grade: 'asc' }, { branch: 'asc' }, { name: 'asc' }],
    });
  }

  async createSubject(dto: { name: string; grade: string; branch: string; priceIls?: number; teacherId?: string }) {
    return this.prisma.subject.create({
      data: {
        name: dto.name,
        grade: dto.grade as any,
        branch: dto.branch as any,
        priceIls: dto.priceIls ?? 0,
        teacherId: dto.teacherId || null,
      },
      include: { teacher: { select: { id: true, name: true } }, _count: { select: { videos: true } } },
    });
  }

  async updateSubject(id: string, dto: UpdateSubjectDto) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('المادة غير موجودة');

    return this.prisma.subject.update({
      where: { id },
      data: {
        priceIls: dto.priceIls !== undefined ? dto.priceIls : undefined,
        teacherId: dto.teacherId !== undefined ? (dto.teacherId === '' ? null : dto.teacherId) : undefined,
      },
      include: {
        teacher: { select: { id: true, name: true } },
      },
    });
  }

  async listPlans() {
    return this.prisma.subscriptionPlan.findMany({ orderBy: { durationDays: 'asc' } });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
  }

  async listTeachers(query?: { search?: string; page?: string; limit?: string }) {
    const page = parseInt(query?.page || '1', 10);
    const limit = parseInt(query?.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    const search = query?.search?.trim();
    if (search) {
      const isSqlite = process.env.DATABASE_URL?.startsWith('file:') || !process.env.DATABASE_URL?.includes('postgres');
      where.OR = [
        { name: isSqlite ? { contains: search } : { contains: search, mode: 'insensitive' } },
        { bio: isSqlite ? { contains: search } : { contains: search, mode: 'insensitive' } },
        { user: { phone: { contains: search } } },
        { subjects: { some: { name: isSqlite ? { contains: search } : { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [teachers, total] = await this.prisma.$transaction([
      this.prisma.teacher.findMany({
        where,
        include: {
          user: { select: { phone: true } },
          subjects: true,
          _count: { select: { subjects: true, videos: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.teacher.count({ where }),
    ]);

    const formattedTeachers = [];
    for (let idx = 0; idx < teachers.length; idx++) {
      const t = teachers[idx];
      const specialty = t.subjects.map(s => s.name).join(', ') || '—';
      
      const gradesAr: Record<string, string> = {
        GRADE_11: 'الحادي عشر',
        GRADE_12: 'الثاني عشر',
      };
      
      const gradeStrings = t.subjects.map(s => {
        const gradeVal = gradesAr[s.grade] || s.grade;
        const branchText = s.branch === 'SCIENTIFIC' ? 'علمي' : s.branch === 'LITERARY' ? 'أدبي' : '';
        return branchText ? `${gradeVal} (${branchText})` : gradeVal;
      });
      const grade = Array.from(new Set(gradeStrings)).join(', ') || '—';

      const subjectIds = t.subjects.map((s) => s.id);
      let activeStudentsCount = 0;
      if (subjectIds.length > 0) {
        const subSubjects = await this.prisma.subscriptionSubject.findMany({
          where: {
            subjectId: { in: subjectIds },
            subscription: {
              isActive: true,
              isFrozen: false,
              endDate: { gt: new Date() },
            },
          },
          select: {
            subscription: {
              select: {
                userId: true,
              },
            },
          },
        });
        activeStudentsCount = new Set(subSubjects.map((s) => s.subscription.userId)).size;
      }

      const email = `${t.name.split(' ').join('.').toLowerCase()}@bina.edu`;
      const rating = parseFloat((4.5 + (t.name.length % 5) * 0.1).toFixed(1));

      formattedTeachers.push({
        id: t.id,
        name: t.name,
        email,
        specialty,
        grade,
        lessons: activeStudentsCount,
        rating,
        status: 'نشط',
        avatar: t.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
        commissionRate: t.commissionRate,
        user: { phone: t.user?.phone || '—' },
        _count: t._count
      });
    }

    return {
      teachers: formattedTeachers,
      total,
      page,
      limit
    };
  }

  async getTeachersDashboard() {
    const totalTeachers = await this.prisma.teacher.count();
    const activeClasses = await this.prisma.subject.count({
      where: { teacherId: { not: null } },
    });

    const videos = await this.prisma.video.findMany({
      where: { status: 'PUBLISHED' },
      select: { durationSec: true },
    });
    const totalSec = videos.reduce((acc, v) => acc + (v.durationSec || 0), 0);
    const contentHours = Math.round(totalSec / 3600);

    const dbTeachers = await this.prisma.teacher.findMany({
      include: {
        subjects: true,
      },
    });

    const teachersWithStudents = [];
    for (const t of dbTeachers) {
      const subjectIds = t.subjects.map((s) => s.id);
      let activeStudentsCount = 0;
      if (subjectIds.length > 0) {
        const subSubjects = await this.prisma.subscriptionSubject.findMany({
          where: {
            subjectId: { in: subjectIds },
            subscription: {
              isActive: true,
              isFrozen: false,
              endDate: { gt: new Date() },
            },
          },
          select: {
            subscription: {
              select: {
                userId: true,
              },
            },
          },
        });
        activeStudentsCount = new Set(subSubjects.map((s) => s.subscription.userId)).size;
      }
      teachersWithStudents.push({
        id: t.id,
        name: t.name,
        avatar: t.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
        satisfactionRate: 98,
        activeStudentsCount,
      });
    }

    const topTeachersSorted = teachersWithStudents
      .sort((a, b) => b.activeStudentsCount - a.activeStudentsCount)
      .slice(0, 3)
      .map((t, idx) => ({
        id: t.id,
        name: t.name,
        satisfactionRate: 98 - idx * 2,
        avatar: t.avatar,
      }));

    return {
      stats: {
        totalTeachers,
        activeClasses,
        performanceRating: totalTeachers > 0 ? 4.8 : 0.0,
        contentHours
      },
      applications: [],
      topTeachers: topTeachersSorted
    };
  }

  async createTeacher(dto: CreateTeacherDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existingUser) {
      throw new BadRequestException('رقم الهاتف مستخدم بالفعل لمستخدم آخر');
    }

    // Create User and Teacher in transaction
    const teacher = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: dto.phone,
          name: dto.name,
          role: 'TEACHER',
        },
      });

      const teacherRecord = await tx.teacher.create({
        data: {
          userId: user.id,
          name: dto.name,
          bio: dto.bio,
          avatarUrl: dto.avatarUrl,
          commissionRate: dto.commissionRate !== undefined ? dto.commissionRate : 0.25,
        },
      });

      if (dto.subjectId) {
        await tx.subject.update({
          where: { id: dto.subjectId },
          data: { teacherId: teacherRecord.id },
        });
      }

      return teacherRecord;
    });

    return this.prisma.teacher.findUnique({
      where: { id: teacher.id },
      include: {
        user: { select: { phone: true } },
        subjects: true,
      },
    });
  }
}
