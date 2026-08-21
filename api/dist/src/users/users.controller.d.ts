import { UsersService } from './users.service';
import { UpdateParentPhoneDto } from '../auth/dto/auth.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getMe(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        id: string;
        phone: string;
        name: string | null;
        grade: import(".prisma/client").$Enums.Grade | null;
        branch: import(".prisma/client").$Enums.Branch | null;
        parentPhone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        subscription: {
            planType: import(".prisma/client").$Enums.PlanType;
            planName: string;
            endDate: Date;
            isActive: boolean;
            videosPerSubject: number;
        } | null;
        teacher: {
            id: string;
            bio: string | null;
            commissionRate: number;
            subjects: {
                id: string;
                name: string;
                grade: import(".prisma/client").$Enums.Grade;
                branch: import(".prisma/client").$Enums.Branch;
            }[];
        } | null;
    }>;
    updateParentPhone(req: {
        user: {
            sub: string;
        };
    }, dto: UpdateParentPhoneDto): Promise<{
        parentPhone: string | null;
    }>;
}
