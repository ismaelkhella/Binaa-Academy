import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboard(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        studentName: string;
        generalProgress: number;
        continueLearning: {
            videoId: string;
            videoTitle: string;
            subjectName: string;
            unitName: string;
            lessonText: string;
            durationSec: number;
            timeLeftMin: number;
            progressPercent: number;
        } | null;
        todayGoals: {
            completedCount: number;
            totalCount: number;
            percentage: number;
            text: string;
        };
        dailyQuiz: {
            id: string;
            title: string;
            description: string;
            isAvailable: boolean;
            buttonText: string;
            points: number;
        };
        suggestedSubjects: {
            id: string;
            subjectName: string;
            teacherName: string;
            rating: number;
        }[];
        subjectShopping: {
            id: string;
            name: string;
            priceIls: number;
            isSubscribed: boolean;
            isInCart: boolean;
            teacher: {
                id: string;
                name: string;
                avatarUrl: string;
                rating: number;
            } | null;
        }[];
    }>;
}
