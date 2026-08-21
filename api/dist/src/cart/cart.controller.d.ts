import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/cart.dto';
export declare class CartController {
    private cartService;
    constructor(cartService: CartService);
    getCart(req: {
        user: {
            sub: string;
        };
    }): Promise<{
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
    addToCart(req: {
        user: {
            sub: string;
        };
    }, dto: AddCartItemDto): Promise<{
        message: string;
    }>;
    removeFromCart(req: {
        user: {
            sub: string;
        };
    }, subjectId: string): Promise<{
        message: string;
    }>;
    checkout(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        message: string;
        totalPriceIls: number;
        subscriptionId: string;
        endDate: Date;
        subjects: string[];
    }>;
}
