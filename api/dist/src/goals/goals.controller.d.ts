import { GoalsService } from './goals.service';
declare class CreateGoalDto {
    title: string;
}
declare class UpdateGoalDto {
    completed?: boolean;
    title?: string;
}
export declare class GoalsController {
    private readonly goalsService;
    constructor(goalsService: GoalsService);
    list(req: {
        user: {
            sub: string;
        };
    }): Promise<{
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
    create(req: {
        user: {
            sub: string;
        };
    }, dto: CreateGoalDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        completed: boolean;
        title: string;
        dueDate: Date;
    }>;
    update(req: {
        user: {
            sub: string;
        };
    }, id: string, dto: UpdateGoalDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        completed: boolean;
        title: string;
        dueDate: Date;
    }>;
    delete(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
        success: boolean;
    }>;
}
export {};
