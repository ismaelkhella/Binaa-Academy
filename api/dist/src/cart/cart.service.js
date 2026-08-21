"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CartService = class CartService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCart(userId) {
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
    async addToCart(userId, subjectId) {
        const subject = await this.prisma.subject.findUnique({
            where: { id: subjectId },
        });
        if (!subject) {
            throw new common_1.NotFoundException('المادة غير موجودة');
        }
        const activeSub = await this.prisma.subscription.findFirst({
            where: {
                userId,
                isActive: true,
                endDate: { gt: new Date() },
                isFrozen: false,
                plan: {
                    type: { not: client_1.PlanType.TRIAL },
                },
                subjects: {
                    some: { subjectId },
                },
            },
        });
        if (activeSub) {
            throw new common_1.BadRequestException('أنت مشترك بالفعل في هذه المادة واشتراكك فعال');
        }
        const existingCartItem = await this.prisma.cartItem.findUnique({
            where: { userId_subjectId: { userId, subjectId } },
        });
        if (existingCartItem) {
            throw new common_1.BadRequestException('المادة موجودة بالفعل في السلة');
        }
        await this.prisma.cartItem.create({
            data: { userId, subjectId },
        });
        return { message: 'تم إضافة المادة للسلة بنجاح' };
    }
    async removeFromCart(userId, subjectId) {
        const cartItem = await this.prisma.cartItem.findUnique({
            where: { userId_subjectId: { userId, subjectId } },
        });
        if (!cartItem) {
            throw new common_1.NotFoundException('المادة غير موجودة في السلة');
        }
        await this.prisma.cartItem.delete({
            where: { id: cartItem.id },
        });
        return { message: 'تم حذف المادة من السلة بنجاح' };
    }
    async checkout(userId) {
        if (process.env.NODE_ENV === 'production') {
            throw new common_1.BadRequestException('الدفع الإلكتروني غير متاح حالياً — يرجى التواصل مع إدارة الأكاديمية لتفعيل الاشتراك');
        }
        const cartItems = await this.prisma.cartItem.findMany({
            where: { userId },
            include: { subject: true },
        });
        if (cartItems.length === 0) {
            throw new common_1.BadRequestException('السلة فارغة');
        }
        const total = cartItems.reduce((sum, item) => sum + item.subject.priceIls, 0);
        console.log(`[ELECTRONIC WALLET CHECKOUT] Student with ID ${userId} paid ${total} ILS using simulated wallet for subjects:`, cartItems.map((i) => i.subject.name));
        let subscription = await this.prisma.subscription.findFirst({
            where: {
                userId,
                isActive: true,
                endDate: { gt: new Date() },
                isFrozen: false,
                plan: {
                    type: { not: client_1.PlanType.TRIAL },
                },
            },
            include: { plan: true },
        });
        if (!subscription) {
            const yearlyPlan = await this.prisma.subscriptionPlan.findFirst({
                where: { type: client_1.PlanType.YEARLY },
            }) || await this.prisma.subscriptionPlan.findFirst({
                where: { isActive: true },
            });
            if (!yearlyPlan) {
                throw new common_1.InternalServerErrorException('خطة الاشتراك غير موجودة في النظام');
            }
            subscription = await this.prisma.subscription.create({
                data: {
                    userId,
                    planId: yearlyPlan.id,
                    endDate: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000),
                },
                include: { plan: true },
            });
        }
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
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CartService);
//# sourceMappingURL=cart.service.js.map