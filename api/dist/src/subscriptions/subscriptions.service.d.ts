import { PrismaService } from '../prisma/prisma.service';
export declare class SubscriptionsService {
    private prisma;
    constructor(prisma: PrismaService);
    listPlans(): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.PlanType;
        nameAr: string;
        durationDays: number;
        discountPercent: number;
        priceIls: number;
        videosPerSubject: number;
        isActive: boolean;
    }[]>;
    getActiveSubscription(userId: string): Promise<({
        plan: {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.PlanType;
            nameAr: string;
            durationDays: number;
            discountPercent: number;
            priceIls: number;
            videosPerSubject: number;
            isActive: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        userId: string;
        planId: string;
        startDate: Date;
        endDate: Date;
        isFrozen: boolean;
        notes: string | null;
    }) | null>;
}
