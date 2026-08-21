import { PrismaService } from '../prisma/prisma.service';
export declare class PerformanceService {
    private prisma;
    constructor(prisma: PrismaService);
    private getDayOfCurrentWeek;
    getPerformanceData(userId: string): Promise<{
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
