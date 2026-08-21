import { PerformanceService } from './performance.service';
export declare class PerformanceController {
    private readonly performanceService;
    constructor(performanceService: PerformanceService);
    getPerformance(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        goalsAchievementPercent: number;
        peerComparisonPercent: number;
        weeklyStudyHours: {
            day: string;
            hours: number;
        }[];
        subjectProgress: {
            subjectName: string;
            progressPercent: number;
        }[];
        recentQuizzes: {
            title: string;
            score: number;
            totalQuestions: number;
            dateText: string;
        }[];
    }>;
}
