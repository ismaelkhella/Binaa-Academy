import { PrismaService } from '../prisma/prisma.service';
export declare class CartService {
    private prisma;
    constructor(prisma: PrismaService);
    getCart(userId: string): Promise<{
        items: {
            id: string;
            subjectId: string;
            name: string;
            grade: import(".prisma/client").$Enums.Grade;
            branch: import(".prisma/client").$Enums.Branch;
            priceIls: number;
            teacherName: string | null;
        }[];
        totalPriceIls: number;
    }>;
    addToCart(userId: string, subjectId: string): Promise<{
        message: string;
    }>;
    removeFromCart(userId: string, subjectId: string): Promise<{
        message: string;
    }>;
    checkout(userId: string): Promise<{
        message: string;
        totalPriceIls: number;
        subscriptionId: string;
        endDate: Date;
        subjects: string[];
    }>;
}
