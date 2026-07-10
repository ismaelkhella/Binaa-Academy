import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
    const video = await this.prisma.video.create({ data: videoData });
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
    const video = await this.prisma.video.update({ where: { id }, data: videoData });
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
    return this.prisma.video.delete({ where: { id } });
  }

  async listSubjects() {
    return this.prisma.subject.findMany({
      include: { teacher: { select: { id: true, name: true } }, _count: { select: { videos: true } } },
      orderBy: [{ grade: 'asc' }, { branch: 'asc' }, { name: 'asc' }],
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
    const dbTeachers = await this.prisma.teacher.findMany({
      include: {
        user: { select: { phone: true } },
        subjects: true,
        _count: { select: { subjects: true, videos: true } }
      },
    });

    const specialties = ["الفيزياء", "الرياضيات", "اللغة العربية", "الكيمياء", "الأحياء", "اللغة الإنجليزية", "التكنولوجيا"];
    const grades = ["العاشر", "الحادي عشر", "الثاني عشر"];
    
    const firstNames = ["سمير", "سارة", "يوسف", "خالد", "عمر", "أحمد", "ريم", "ليلى", "إبراهيم", "نورة", "محمود", "هاني", "فاطمة", "منى", "سعيد", "أميرة"];
    const lastNames = ["الخطيب", "المنصوري", "حسن", "عبد الله", "حسان", "علي", "أحمد", "محمود", "فارس", "النجار", "خليل", "سعيد", "العلي", "صالح", "عبيد", "القدس"];
    const statusOptions = ["نشط", "نشط", "نشط", "في إجازة"];

    const avatars = [
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
    ];

    const allTeachersList = [];

    // 1. Populate from DB first
    for (let idx = 0; idx < dbTeachers.length; idx++) {
      const t = dbTeachers[idx];
      const specialty = t.subjects[0]?.name || specialties[idx % specialties.length];
      const branchText = t.subjects[0]?.branch === 'SCIENTIFIC' ? 'علمي' : t.subjects[0]?.branch === 'LITERARY' ? 'أدبي' : '';
      const gradeVal = t.subjects[0]?.grade === 'GRADE_12' ? 'الثاني عشر' : t.subjects[0]?.grade === 'GRADE_11' ? 'الحادي عشر' : grades[idx % grades.length];
      const grade = branchText ? `${gradeVal} (${branchText})` : gradeVal;
      const email = t.name.includes("عمر حسان") ? "omar.h@bina.edu" :
                  t.name.includes("محمد علي") ? "mohammad.a@bina.edu" :
                  t.name.includes("سارة أحمد") ? "sara.a@bina.edu" :
                  t.name.includes("خالد محمود") ? "khaled.m@bina.edu" :
                  t.name.includes("ريم فارس") ? "reem.f@bina.edu" :
                  t.name.includes("يوسف النجار") ? "youssef.n@bina.edu" :
                  t.name.includes("ليلى خليل") ? "layla.k@bina.edu" : `teacher_${idx}@bina.edu`;
      
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

      allTeachersList.push({
        id: t.id,
        name: t.name,
        email,
        specialty,
        grade,
        lessons: activeStudentsCount,
        rating: 4.5 + ((idx * 0.1) % 0.5),
        status: idx === 5 ? "في إجازة" : "نشط",
        avatar: t.avatarUrl || avatars[idx % avatars.length],
        commissionRate: t.commissionRate,
        user: { phone: t.user?.phone || '0599000000' },
        _count: t._count
      });
    }

    // 2. Generate up to 142 teachers
    const targetCount = 142;
    for (let i = allTeachersList.length; i < targetCount; i++) {
      const fName = firstNames[i % firstNames.length];
      const lName = lastNames[(i + 3) % lastNames.length];
      const prefix = i % 7 === 0 ? "د. " : i % 5 === 0 ? "م. " : "أ. ";
      const name = `${prefix}${fName} ${lName}`;
      
      const cleanName = fName.toLowerCase();
      const cleanLastName = lName.replace(/\s+/g, '').toLowerCase();
      const email = `${cleanName}.${cleanLastName.substring(0, 1)}@bina.edu`;

      const specialty = specialties[i % specialties.length];
      const branchText = i % 2 === 0 ? 'علمي' : 'أدبي';
      const gradeVal = grades[(i + 1) % grades.length];
      const grade = `${gradeVal} (${branchText})`;
      const lessons = 20 + (i % 35);
      const rating = parseFloat((4.2 + (i % 9) * 0.1).toFixed(1));
      const status = statusOptions[i % statusOptions.length];
      const avatar = avatars[i % avatars.length];

      allTeachersList.push({
        id: `mock_t_${i}`,
        name,
        email,
        specialty,
        grade,
        lessons,
        rating,
        status,
        avatar,
        commissionRate: 0.25,
        user: { phone: `059900${(1000 + i).toString().substring(1)}` },
        _count: { subjects: 1, videos: lessons }
      });
    }

    // Apply Search
    let filtered = allTeachersList;
    const search = query?.search?.trim();
    if (search) {
      filtered = allTeachersList.filter(t => 
        t.name.includes(search) || 
        t.specialty.includes(search) || 
        t.email.includes(search) ||
        t.grade.includes(search)
      );
    }

    const page = parseInt(query?.page || '1', 10);
    const limit = parseInt(query?.limit || '10', 10);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      teachers: paginated,
      total: filtered.length,
      page,
      limit
    };
  }

  async getTeachersDashboard() {
    return {
      stats: {
        totalTeachers: 142,
        activeClasses: 56,
        performanceRating: 4.8,
        contentHours: 840
      },
      applications: [
        {
          id: "app_1",
          name: "إبراهيم سعيد",
          title: "معلم كيمياء - خبرة 5 سنوات",
          timeText: "منذ ساعتين"
        },
        {
          id: "app_2",
          name: "نورة العلي",
          title: "معلمة لغة إنجليزية - دكتوراه",
          timeText: "منذ يوم"
        }
      ],
      topTeachers: [
        {
          id: "t_mock_0",
          name: "د. سمير الخطيب",
          satisfactionRate: 98,
          avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=100&q=80"
        },
        {
          id: "t_mock_1",
          name: "أ. سارة المنصوري",
          satisfactionRate: 96,
          avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80"
        },
        {
          id: "t_mock_3",
          name: "أ. خالد عبد الله",
          satisfactionRate: 95,
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"
        }
      ]
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
