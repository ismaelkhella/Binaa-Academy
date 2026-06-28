import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async listPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { durationDays: 'asc' },
    });
  }

  async getActiveSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId, isActive: true },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
