import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ListStudentsQuery,
  UpdateStudentDto,
  FreezeSubscriptionDto,
  GrantSubscriptionDto,
  CreateVideoDto,
  UpdatePlanDto,
} from './dto/admin.dto';
import { PlanType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
      where.OR = [
        { phone: { contains: query.search } },
        { name: { contains: query.search, mode: 'insensitive' } },
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
        subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
        videoViews: { include: { video: { select: { title: true } } }, take: 20, orderBy: { lastViewed: 'desc' } },
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
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { type: dto.planType } });
    if (!plan) throw new NotFoundException('الخطة غير موجودة');

    await this.prisma.subscription.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const duration = dto.durationDays ?? plan.durationDays;
    return this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
      },
      include: { plan: true },
    });
  }

  async listVideos() {
    return this.prisma.video.findMany({
      include: {
        subject: { select: { name: true, grade: true, branch: true } },
        teacher: { select: { name: true } },
        _count: { select: { videoViews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createVideo(dto: CreateVideoDto) {
    return this.prisma.video.create({ data: dto });
  }

  async updateVideo(id: string, dto: Partial<CreateVideoDto>) {
    return this.prisma.video.update({ where: { id }, data: dto });
  }

  async deleteVideo(id: string) {
    return this.prisma.video.delete({ where: { id } });
  }

  async listSubjects() {
    return this.prisma.subject.findMany({
      include: { teacher: { select: { name: true } }, _count: { select: { videos: true } } },
      orderBy: [{ grade: 'asc' }, { branch: 'asc' }, { name: 'asc' }],
    });
  }

  async listPlans() {
    return this.prisma.subscriptionPlan.findMany({ orderBy: { durationDays: 'asc' } });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
  }

  async listTeachers() {
    return this.prisma.teacher.findMany({
      include: { user: { select: { phone: true } }, _count: { select: { subjects: true, videos: true } } },
    });
  }
}
