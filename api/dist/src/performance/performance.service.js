"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PerformanceService = class PerformanceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getDayOfCurrentWeek(dayOffset) {
        const current = new Date();
        const day = current.getDay();
        const diff = current.getDate() - day + dayOffset;
        const result = new Date(current.setDate(diff));
        result.setHours(0, 0, 0, 0);
        return result;
    }
    async getPerformanceData(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        const isDemoStudent = user?.phone === '0599123456';
        const startOfWeek = this.getDayOfCurrentWeek(0);
        const endOfWeek = this.getDayOfCurrentWeek(6);
        endOfWeek.setHours(23, 59, 59, 999);
        const weeklyGoals = await this.prisma.dailyGoal.findMany({
            where: {
                userId,
                dueDate: { gte: startOfWeek, lte: endOfWeek },
            },
        });
        const totalGoals = weeklyGoals.length;
        const completedGoals = weeklyGoals.filter((g) => g.completed).length;
        let goalsAchievementPercent = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
        if (isDemoStudent) {
            goalsAchievementPercent = 85;
        }
        const peerComparisonPercent = 12;
        const studySessions = await this.prisma.studySession.findMany({
            where: {
                userId,
                date: { gte: startOfWeek, lte: endOfWeek },
            },
        });
        const daysOfWeekAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const weeklyStudyHours = daysOfWeekAr.map((dayName, index) => {
            const daySessions = studySessions.filter((s) => {
                const sDate = new Date(s.date);
                return sDate.getDay() === index;
            });
            const totalMin = daySessions.reduce((acc, curr) => acc + curr.durationMin, 0);
            return {
                day: dayName,
                hours: parseFloat((totalMin / 60).toFixed(1)),
            };
        });
        let subjectProgress = [];
        if (isDemoStudent) {
            subjectProgress = [
                { subjectName: 'الرياضيات', progressPercent: 75 },
                { subjectName: 'الفيزياء', progressPercent: 90 },
                { subjectName: 'اللغة العربية', progressPercent: 45 },
            ];
        }
        else if (user?.grade && user?.branch) {
            const subjects = await this.prisma.subject.findMany({
                where: { grade: user.grade, branch: user.branch },
                include: {
                    videos: { where: { status: 'PUBLISHED' } },
                },
            });
            for (const sub of subjects) {
                const totalVideos = sub.videos.length;
                if (totalVideos === 0)
                    continue;
                const videoIds = sub.videos.map((v) => v.id);
                const completedViews = await this.prisma.videoView.count({
                    where: {
                        userId,
                        videoId: { in: videoIds },
                        completed: true,
                    },
                });
                const progressPercent = Math.round((completedViews / totalVideos) * 100);
                subjectProgress.push({
                    subjectName: sub.name,
                    progressPercent,
                });
            }
        }
        const quizResults = await this.prisma.quizResult.findMany({
            where: { userId },
            include: { quiz: true },
            orderBy: { createdAt: 'desc' },
            take: 3,
        });
        const recentQuizzes = quizResults.map((qr, index) => {
            let dateText = qr.createdAt.toLocaleDateString('ar-EG');
            if (index === 0)
                dateText = 'اليوم';
            else if (index === 1)
                dateText = 'أمس';
            else if (index === 2)
                dateText = 'منذ يومين';
            return {
                title: qr.quiz.title,
                score: qr.score,
                totalQuestions: qr.totalQuestions,
                dateText,
            };
        });
        return {
            goalsAchievementPercent,
            peerComparisonPercent,
            weeklyStudyHours,
            subjectProgress,
            recentQuizzes,
        };
    }
};
exports.PerformanceService = PerformanceService;
exports.PerformanceService = PerformanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PerformanceService);
//# sourceMappingURL=performance.service.js.map