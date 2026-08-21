import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
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
    getMySubscription(req: {
        user: {
            sub: string;
        };
    }): Promise<({
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
