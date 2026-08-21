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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardData(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('المستخدم غير موجود');
        }
        const isDemoStudent = user.phone === '0599123456';
        const firstName = user.name ? user.name.split(' ')[0] : 'طالب';
        let generalProgress = 68;
        if (!isDemoStudent && user.grade && user.branch) {
            const subjects = await this.prisma.subject.findMany({
                where: { grade: user.grade, branch: user.branch },
                include: {
                    videos: { where: { status: 'PUBLISHED' } },
                },
            });
            let totalSubjectProgress = 0;
            let subjectsWithVideos = 0;
            for (const sub of subjects) {
                const totalVideos = sub.videos.length;
                if (totalVideos === 0)
                    continue;
                subjectsWithVideos++;
                const videoIds = sub.videos.map((v) => v.id);
                const completedViews = await this.prisma.videoView.count({
                    where: {
                        userId,
                        videoId: { in: videoIds },
                        completed: true,
                    },
                });
                totalSubjectProgress += (completedViews / totalVideos) * 100;
            }
            generalProgress = subjectsWithVideos > 0 ? Math.round(totalSubjectProgress / subjectsWithVideos) : 0;
        }
        const latestPartialView = await this.prisma.videoView.findFirst({
            where: {
                userId,
                completed: false,
            },
            include: {
                video: {
                    include: {
                        subject: true,
                    },
                },
            },
            orderBy: {
                lastViewed: 'desc',
            },
        });
        let continueLearning = null;
        if (latestPartialView?.video) {
            const video = latestPartialView.video;
            continueLearning = {
                videoId: video.id,
                videoTitle: video.title,
                subjectName: video.subject.name,
                unitName: `${video.subject.name} - الوحدة الأولى`,
                lessonText: video.title,
                durationSec: video.durationSec,
                timeLeftMin: 12,
                progressPercent: 45,
            };
        }
        else {
            continueLearning = {
                videoId: 'default-video',
                videoTitle: 'الدرس الثالث: قوانين نيوتن للحركة',
                subjectName: 'الفيزياء',
                unitName: 'الفيزياء - الوحدة الأولى',
                lessonText: 'الدرس الثالث: قوانين نيوتن للحركة',
                durationSec: 3300,
                timeLeftMin: 12,
                progressPercent: 45,
            };
        }
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        const todayGoals = await this.prisma.dailyGoal.findMany({
            where: {
                userId,
                dueDate: { gte: startOfToday, lte: endOfToday },
            },
        });
        const totalGoals = todayGoals.length;
        const completedGoals = todayGoals.filter((g) => g.completed).length;
        const goalsPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
        let goalsText = `لقد أنجزت ${completedGoals} من أصل ${totalGoals} أهداف اليوم.`;
        if (completedGoals === 2 && totalGoals === 5) {
            goalsText = 'رائع! لقد أنجزت هدفين من أصل خمسة اليوم.';
        }
        const goalsSummary = {
            completedCount: completedGoals,
            totalCount: totalGoals,
            percentage: goalsPercentage,
            text: goalsText,
        };
        const dailyQuiz = {
            id: 'daily-quiz-math-1',
            title: 'الاختبار اليومي متاح الآن',
            description: 'اختبر معلوماتك في الرياضيات واحصل على نقاط إضافية.',
            isAvailable: true,
            buttonText: 'ابدأ الاختبار',
            points: 20,
        };
        const matchingSubjects = await this.prisma.subject.findMany({
            where: {
                grade: user.grade ?? undefined,
                branch: user.branch ?? undefined,
            },
            include: {
                teacher: { select: { name: true } },
            },
            take: 4,
        });
        const suggestedSubjects = matchingSubjects.map((sub, idx) => {
            const rating = parseFloat((4.5 + ((idx * 0.1) % 0.5)).toFixed(1));
            return {
                id: sub.id,
                subjectName: sub.name,
                teacherName: sub.teacher?.name ?? 'غير محدد',
                rating,
            };
        });
        const studentWithSubs = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscriptions: {
                    where: { isActive: true, isFrozen: false, endDate: { gt: new Date() } },
                    include: {
                        plan: true,
                        subjects: true,
                    },
                },
            },
        });
        const activeSubjectIds = new Set(studentWithSubs?.subscriptions
            .filter((sub) => sub.plan.type !== client_1.PlanType.TRIAL)
            .flatMap((sub) => sub.subjects.map((ss) => ss.subjectId)) || []);
        const cartItemIds = new Set((await this.prisma.cartItem.findMany({
            where: { userId },
            select: { subjectId: true },
        })).map((item) => item.subjectId));
        const shoppingSubjectsRaw = await this.prisma.subject.findMany({
            where: {
                grade: user.grade ?? undefined,
                branch: user.branch ?? undefined,
            },
            include: {
                teacher: { select: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: { name: 'asc' },
        });
        const subjectShopping = shoppingSubjectsRaw.map((sub, idx) => {
            const isSubscribed = activeSubjectIds.has(sub.id);
            const isInCart = cartItemIds.has(sub.id);
            const rating = parseFloat((4.5 + ((idx * 0.1) % 0.5)).toFixed(1));
            return {
                id: sub.id,
                name: sub.name,
                priceIls: sub.priceIls,
                isSubscribed,
                isInCart,
                teacher: sub.teacher ? {
                    id: sub.teacher.id,
                    name: sub.teacher.name,
                    avatarUrl: sub.teacher.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
                    rating,
                } : null,
            };
        });
        return {
            studentName: firstName,
            generalProgress,
            continueLearning,
            todayGoals: goalsSummary,
            dailyQuiz,
            suggestedSubjects,
            subjectShopping,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map