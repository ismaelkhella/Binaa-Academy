import { PrismaService } from '../prisma/prisma.service';
export declare class GoalsService {
    private prisma;
    constructor(prisma: PrismaService);
    listGoals(userId: string): Promise<{
        today: {
            id: string;
            title: string;
            completed: boolean;
            dueDate: Date;
        }[];
        archived: {
            id: string;
            title: string;
            completed: boolean;
            dueDate: Date;
        }[];
    }>;
    createGoal(userId: string, title: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        completed: boolean;
        title: string;
        dueDate: Date;
    }>;
    updateGoal(userId: string, goalId: string, completed?: boolean, title?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        completed: boolean;
        title: string;
        dueDate: Date;
    }>;
    deleteGoal(userId: string, goalId: string): Promise<{
        success: boolean;
    }>;
}
