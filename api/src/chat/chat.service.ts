import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getTeacherDashboard(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) {
      throw new NotFoundException('المعلم غير موجود');
    }

    const subjects = await this.prisma.subject.findMany({
      where: { teacherId: teacher.id },
    });
    const subjectIds = subjects.map((s) => s.id);

    // Get unique student subscriptions for these subjects
    const subscriptions = await this.prisma.subscriptionSubject.findMany({
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

    const uniqueUserIds = new Set(subscriptions.map((s) => s.subscription.userId));
    const studentsCount = uniqueUserIds.size;
    const subjectsCount = subjects.length;

    const videosCount = await this.prisma.video.count({
      where: {
        subjectId: { in: subjectIds },
        status: 'PUBLISHED',
      },
    });

    // Engagement rate: share of subscribed students who watched at least one
    // of this teacher's videos in the last 30 days.
    let engagementRate = 0;
    if (studentsCount > 0) {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const activeViewers = await this.prisma.videoView.findMany({
        where: {
          userId: { in: Array.from(uniqueUserIds) },
          video: { subjectId: { in: subjectIds } },
          lastViewed: { gte: since },
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      engagementRate = Math.round((activeViewers.length / studentsCount) * 100);
    }

    return {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        bio: teacher.bio,
        avatarUrl: teacher.avatarUrl,
      },
      studentsCount,
      subjectsCount,
      videosCount,
      engagementRate,
    };
  }

  async studentGetTeachers(userId: string) {
    const studentSubs = await this.prisma.subscription.findMany({
      where: {
        userId,
        isActive: true,
        isFrozen: false,
        endDate: { gt: new Date() },
      },
      include: {
        subjects: {
          include: {
            subject: {
              include: {
                teacher: true,
              },
            },
          },
        },
      },
    });

    const teachersMap = new Map();

    // 1. Paid subscriptions
    for (const sub of studentSubs) {
      for (const subSubject of sub.subjects) {
        const teacher = subSubject.subject.teacher;
        if (teacher) {
          teachersMap.set(teacher.id, {
            id: teacher.id,
            name: teacher.name,
            bio: teacher.bio,
            subjectName: subSubject.subject.name,
          });
        }
      }
    }

    // 2. Trial subscription check
    const hasTrial = await this.prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        plan: { type: 'TRIAL' },
      },
    });

    if (hasTrial) {
      const trialUnlockedSubjects = [
        'اللغة العربية',
        'اللغة الإنجليزية',
        'الفيزياء',
        'الأحياء',
        'التكنولوجيا',
      ];
      const trialSubjects = await this.prisma.subject.findMany({
        where: {
          name: { in: trialUnlockedSubjects },
          teacherId: { not: null },
        },
        include: {
          teacher: true,
        },
      });

      for (const s of trialSubjects) {
        if (s.teacher) {
          teachersMap.set(s.teacher.id, {
            id: s.teacher.id,
            name: s.teacher.name,
            bio: s.teacher.bio,
            subjectName: s.name,
          });
        }
      }
    }

    return Array.from(teachersMap.values());
  }

  async studentGetConversations(userId: string) {
    return this.prisma.chat.findMany({
      where: { studentId: userId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            bio: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async studentGetOrCreateConversation(userId: string, teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('المعلم غير موجود');
    }

    return this.prisma.chat.upsert({
      where: {
        studentId_teacherId: {
          studentId: userId,
          teacherId,
        },
      },
      create: {
        studentId: userId,
        teacherId,
      },
      update: {},
      include: {
        teacher: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async studentGetMessages(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, studentId: userId },
    });
    if (!chat) {
      throw new NotFoundException('المحادثة غير موجودة');
    }

    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async studentSendMessage(userId: string, chatId: string, content: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, studentId: userId },
    });
    if (!chat) {
      throw new NotFoundException('المحادثة غير موجودة');
    }

    const msg = await this.prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content,
      },
    });

    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return msg;
  }

  async teacherGetConversations(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) {
      throw new NotFoundException('المعلم غير موجود');
    }

    return this.prisma.chat.findMany({
      where: { teacherId: teacher.id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async teacherGetMessages(userId: string, chatId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) {
      throw new NotFoundException('المعلم غير موجود');
    }

    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, teacherId: teacher.id },
    });
    if (!chat) {
      throw new NotFoundException('المحادثة غير موجودة');
    }

    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async teacherSendMessage(userId: string, chatId: string, content: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) {
      throw new NotFoundException('المعلم غير موجود');
    }

    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, teacherId: teacher.id },
    });
    if (!chat) {
      throw new NotFoundException('المحادثة غير موجودة');
    }

    const msg = await this.prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content,
      },
    });

    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return msg;
  }
}
