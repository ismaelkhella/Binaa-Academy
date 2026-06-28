import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateParentPhoneDto } from '../auth/dto/auth.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { isActive: true },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const activeSub = user.subscriptions[0] ?? null;
    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      grade: user.grade,
      branch: user.branch,
      parentPhone: user.parentPhone,
      role: user.role,
      subscription: activeSub
        ? {
            planType: activeSub.plan.type,
            planName: activeSub.plan.nameAr,
            endDate: activeSub.endDate,
            isActive: activeSub.isActive && !activeSub.isFrozen,
            videosPerSubject: activeSub.plan.videosPerSubject,
          }
        : null,
    };
  }

  async updateParentPhone(userId: string, dto: UpdateParentPhoneDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { parentPhone: dto.parentPhone },
    });
    return { parentPhone: user.parentPhone };
  }
}
