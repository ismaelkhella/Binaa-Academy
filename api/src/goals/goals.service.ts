import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async listGoals(userId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const allGoals = await this.prisma.dailyGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const today = allGoals.filter(
      (g) => g.dueDate >= startOfToday && g.dueDate <= endOfToday,
    );
    const archived = allGoals.filter((g) => g.dueDate < startOfToday);

    return {
      today: today.map((g) => ({
        id: g.id,
        title: g.title,
        completed: g.completed,
        dueDate: g.dueDate,
      })),
      archived: archived.map((g) => ({
        id: g.id,
        title: g.title,
        completed: g.completed,
        dueDate: g.dueDate,
      })),
    };
  }

  async createGoal(userId: string, title: string) {
    return this.prisma.dailyGoal.create({
      data: {
        userId,
        title,
        completed: false,
        dueDate: new Date(),
      },
    });
  }

  async updateGoal(userId: string, goalId: string, completed?: boolean, title?: string) {
    const goal = await this.prisma.dailyGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('الهدف غير موجود');
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('غير مصرح لك بتعديل هذا الهدف');
    }

    return this.prisma.dailyGoal.update({
      where: { id: goalId },
      data: {
        ...(completed !== undefined && { completed }),
        ...(title !== undefined && { title }),
      },
    });
  }

  async deleteGoal(userId: string, goalId: string) {
    const goal = await this.prisma.dailyGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('الهدف غير موجود');
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('غير مصرح لك بحذف هذا الهدف');
    }

    await this.prisma.dailyGoal.delete({
      where: { id: goalId },
    });

    return { success: true };
  }
}
