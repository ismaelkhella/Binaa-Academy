import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanType } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { subject: { include: { teacher: true } } },
    });

    const totalPrice = cartItems.reduce((sum, item) => sum + item.subject.priceIls, 0);

    return {
      items: cartItems.map((item) => ({
        id: item.id,
        subjectId: item.subjectId,
        name: item.subject.name,
        grade: item.subject.grade,
        branch: item.subject.branch,
        priceIls: item.subject.priceIls,
        teacherName: item.subject.teacher?.name ?? null,
      })),
      totalPriceIls: totalPrice,
    };
  }

  async addToCart(userId: string, subjectId: string) {
    // 1. Check if the subject exists
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) {
      throw new NotFoundException('المادة غير موجودة');
    }

    // 2. Check if student already has an active paid subscription to this subject
    const activeSub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        endDate: { gt: new Date() },
        isFrozen: false,
        plan: {
          type: { not: PlanType.TRIAL },
        },
        subjects: {
          some: { subjectId },
        },
      },
    });
    if (activeSub) {
      throw new BadRequestException('أنت مشترك بالفعل في هذه المادة واشتراكك فعال');
    }

    // 3. Check if subject is already in the cart
    const existingCartItem = await this.prisma.cartItem.findUnique({
      where: { userId_subjectId: { userId, subjectId } },
    });
    if (existingCartItem) {
      throw new BadRequestException('المادة موجودة بالفعل في السلة');
    }

    // 4. Create the cart item
    await this.prisma.cartItem.create({
      data: { userId, subjectId },
    });

    return { message: 'تم إضافة المادة للسلة بنجاح' };
  }

  async removeFromCart(userId: string, subjectId: string) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { userId_subjectId: { userId, subjectId } },
    });
    if (!cartItem) {
      throw new NotFoundException('المادة غير موجودة في السلة');
    }

    await this.prisma.cartItem.delete({
      where: { id: cartItem.id },
    });

    return { message: 'تم حذف المادة من السلة بنجاح' };
  }

  async checkout(userId: string) {
    // The wallet checkout below is a SIMULATION (no real payment is taken).
    // It must never run in production — it would grant paid subscriptions for
    // free. Admins grant subscriptions manually from the admin panel until a
    // real payment gateway is integrated.
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException(
        'الدفع الإلكتروني غير متاح حالياً — يرجى التواصل مع إدارة الأكاديمية لتفعيل الاشتراك',
      );
    }

    // 1. Get all cart items
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { subject: true },
    });
    if (cartItems.length === 0) {
      throw new BadRequestException('السلة فارغة');
    }

    const total = cartItems.reduce((sum, item) => sum + item.subject.priceIls, 0);

    // 2. Simulate payment via Electronic Wallet (Stub/Log)
    console.log(
      `[ELECTRONIC WALLET CHECKOUT] Student with ID ${userId} paid ${total} ILS using simulated wallet for subjects:`,
      cartItems.map((i) => i.subject.name),
    );

    // 3. Get or create active paid subscription
    let subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        endDate: { gt: new Date() },
        isFrozen: false,
        plan: {
          type: { not: PlanType.TRIAL },
        },
      },
      include: { plan: true },
    });

    if (!subscription) {
      const yearlyPlan = await this.prisma.subscriptionPlan.findFirst({
        where: { type: PlanType.YEARLY },
      }) || await this.prisma.subscriptionPlan.findFirst({
        where: { isActive: true },
      });
      if (!yearlyPlan) {
        throw new InternalServerErrorException('خطة الاشتراك غير موجودة في النظام');
      }

      subscription = await this.prisma.subscription.create({
        data: {
          userId,
          planId: yearlyPlan.id,
          endDate: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000), // 10 years duration
        },
        include: { plan: true },
      });
    }

    // 4. Attach subjects to this subscription
    for (const item of cartItems) {
      await this.prisma.subscriptionSubject.upsert({
        where: {
          subscriptionId_subjectId: {
            subscriptionId: subscription.id,
            subjectId: item.subjectId,
          },
        },
        create: {
          subscriptionId: subscription.id,
          subjectId: item.subjectId,
        },
        update: {},
      });
    }

    // 5. Clear cart
    await this.prisma.cartItem.deleteMany({
      where: { userId },
    });

    return {
      message: 'تم الشراء وتفعيل الاشتراك بنجاح عن طريق المحفظة الإلكترونية الافتراضية',
      totalPriceIls: total,
      subscriptionId: subscription.id,
      endDate: subscription.endDate,
      subjects: cartItems.map((i) => i.subject.name),
    };
  }
}
