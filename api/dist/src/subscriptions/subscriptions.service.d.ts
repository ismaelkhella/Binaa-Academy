import { PrismaService } from '../prisma/prisma.service';
export declare class SubscriptionsService {
    private prisma;
    constructor(prisma: PrismaService);
    listPlans(): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        type: import(".prisma/client").$Enums.PlanType;
        nameAr: string;
        durationDays: number;
        discountPercent: number;
        priceIls: number;
        videosPerSubject: number;
    }[]>;
    getActiveSubscription(userId: string): Promise<({
        plan: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            type: import(".prisma/client").$Enums.PlanType;
            nameAr: string;
            durationDays: number;
            discountPercent: number;
            priceIls: number;
            videosPerSubject: number;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        userId: string;
        planId: string;
        startDate: Date;
        endDate: Date;
        isFrozen: boolean;
        notes: string | null;
    }) | null>;
}
