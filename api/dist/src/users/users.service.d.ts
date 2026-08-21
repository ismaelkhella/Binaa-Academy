import { PrismaService } from '../prisma/prisma.service';
import { UpdateParentPhoneDto } from '../auth/dto/auth.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getMe(userId: string): Promise<{
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
    updateParentPhone(userId: string, dto: UpdateParentPhoneDto): Promise<{
        parentPhone: string | null;
    }>;
}
