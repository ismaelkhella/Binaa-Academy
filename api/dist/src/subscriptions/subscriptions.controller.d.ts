import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
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
    getMySubscription(req: {
        user: {
            sub: string;
        };
    }): Promise<({
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
        startDate: Date;
        endDate: Date;
        isFrozen: boolean;
        notes: string | null;
        userId: string;
        planId: string;
    }) | null>;
}
