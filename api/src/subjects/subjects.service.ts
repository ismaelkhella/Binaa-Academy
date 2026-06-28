import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Grade, Branch } from '@prisma/client';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async listForStudent(grade: Grade, branch: Branch) {
    const subjects = await this.prisma.subject.findMany({
      where: { grade, branch },
      include: {
        teacher: { select: { name: true } },
        _count: { select: { videos: { where: { status: 'PUBLISHED' } } } },
      },
      orderBy: { name: 'asc' },
    });

    return subjects.map((s) => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      branch: s.branch,
      teacherName: s.teacher?.name ?? null,
      videoCount: s._count.videos,
    }));
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
          where: { isActive: true },
          include: { plan: true },
          take: 1,
        },
      },
    });

    const quota = user?.subscriptions[0]?.plan.videosPerSubject ?? 0;

    return {
      subject: { id: subject.id, name: subject.name },
      videos: subject.videos.map((v, index) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        durationSec: v.durationSec,
        unitNumber: v.unitNumber,
        orderInUnit: v.orderInUnit,
        locked: index >= quota,
      })),
      quota,
    };
  }
}
