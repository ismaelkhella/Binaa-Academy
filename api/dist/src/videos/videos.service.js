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
var VideosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const mux_service_1 = require("../mux/mux.service");
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
let VideosService = VideosService_1 = class VideosService {
    constructor(prisma, muxService) {
        this.prisma = prisma;
        this.muxService = muxService;
        this.logger = new common_1.Logger(VideosService_1.name);
    }
    mapQuestions(questions) {
        return questions.map((q) => {
            let parsedOptions = [];
            try {
                parsedOptions = JSON.parse(q.options);
            }
            catch (e) {
                parsedOptions = q.options.split(',');
            }
            return {
                id: q.id,
                text: q.text,
                options: parsedOptions,
                answer: q.answer,
            };
        });
    }
    async getLessonDetails(videoId, userId) {
        const video = await this.prisma.video.findUnique({
            where: { id: videoId },
            include: {
                subject: true,
                teacher: true,
                chapters: {
                    orderBy: { order: 'asc' },
                },
                questions: true,
            },
        });
        if (!video || video.status !== 'PUBLISHED') {
            throw new common_1.NotFoundException('الفيديو غير موجود');
        }
        await this.ensureAccess(video.subjectId, userId, videoId);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscriptions: {
                    where: { isActive: true },
                    include: { plan: true },
                },
            },
        });
        const hasPaidSubscription = user?.subscriptions.some((sub) => sub.plan.type !== client_1.PlanType.TRIAL) ?? false;
        const gradeLabel = video.subject.grade === 'GRADE_12' ? 'الصف الثالث الثانوي' : 'الصف الحادي عشر';
        const subHeader = `${video.subject.name} - ${gradeLabel}`;
        const quiz = await this.prisma.quiz.findFirst({
            where: { subjectId: video.subjectId },
            orderBy: { createdAt: 'desc' },
        });
        const chapters = video.chapters.map((ch, idx) => {
            let status = 'UNPLAYED';
            if (!hasPaidSubscription && ch.isPremium) {
                status = 'LOCKED';
            }
            else {
                if (idx === 0)
                    status = 'COMPLETED';
                else if (idx === 1)
                    status = 'PLAYING';
            }
            const durationText = `${formatTime(ch.startSec)} - ${formatTime(ch.endSec)}`;
            return {
                id: ch.id,
                title: ch.title,
                startSec: ch.startSec,
                endSec: ch.endSec,
                durationText,
                status,
            };
        });
        const rawRelated = await this.prisma.video.findMany({
            where: {
                subjectId: video.subjectId,
                status: 'PUBLISHED',
                id: { not: videoId },
            },
            include: {
                teacher: { select: { name: true } },
            },
            orderBy: [{ unitNumber: 'asc' }, { orderInUnit: 'asc' }],
            take: 4,
        });
        const relatedVideos = rawRelated.map((rv) => {
            const minutes = Math.floor(rv.durationSec / 60);
            const seconds = rv.durationSec % 60;
            const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            return {
                id: rv.id,
                title: rv.title,
                subjectName: video.subject.name,
                teacherName: rv.teacher?.name ?? null,
                durationText,
                unitName: `الوحدة ${rv.unitNumber === 1 ? 'الأولى' : rv.unitNumber}`,
            };
        });
        return {
            video: {
                id: video.id,
                title: video.title,
                description: video.description,
                streamUrl: video.streamUrl,
                pdfUrl: video.pdfUrl,
                durationSec: video.durationSec,
                unitName: `الوحدة ${video.unitNumber === 1 ? 'الأولى' : video.unitNumber}`,
                subHeader,
                teacherName: video.teacher?.name ?? null,
                dailyQuizId: quiz?.id ?? null,
                mux_playback_id: video.muxPlaybackId ?? '',
                video_status: video.videoStatus === 'ready' ? 'ready' : 'processing',
                questions: this.mapQuestions(video.questions),
            },
            chapters,
            relatedVideos,
            watermark: {
                name: user?.name ?? 'طالب',
                phone: user?.phone ?? '',
            },
        };
    }
    async getStreamUrl(videoId, userId) {
        const video = await this.prisma.video.findUnique({
            where: { id: videoId },
            include: { subject: true },
        });
        if (!video || video.status !== 'PUBLISHED') {
            throw new common_1.NotFoundException('الفيديو غير موجود');
        }
        await this.ensureAccess(video.subjectId, userId, videoId);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const view = await this.prisma.videoView.findUnique({
            where: { userId_videoId: { userId, videoId } },
        });
        if (view && view.viewCount >= video.maxViews) {
            throw new common_1.ForbiddenException('تم استنفاد عدد المشاهدات المسموح');
        }
        if (!video.streamUrl) {
            throw new common_1.NotFoundException('الفيديو قيد المعالجة حالياً — حاول مجدداً بعد قليل');
        }
        return {
            streamUrl: video.streamUrl,
            watermark: { name: user?.name ?? 'طالب', phone: user?.phone ?? '' },
            playbackRates: [0.75, 1, 1.25, 1.5, 2],
            qualities: ['auto', '360p', '480p', '720p', '1080p'],
        };
    }
    async markViewed(videoId, userId) {
        const video = await this.prisma.video.findUnique({
            where: { id: videoId },
            include: { subject: true }
        });
        if (!video)
            throw new common_1.NotFoundException('الفيديو غير موجود');
        const view = await this.prisma.videoView.upsert({
            where: { userId_videoId: { userId, videoId } },
            create: { userId, videoId, viewCount: 1, completed: true },
            update: { viewCount: { increment: 1 }, lastViewed: new Date(), completed: true },
        });
        const completedViews = await this.prisma.videoView.findMany({
            where: {
                userId,
                completed: true,
                video: { subjectId: video.subjectId },
            },
            include: {
                video: {
                    include: {
                        questions: true,
                    },
                },
            },
            orderBy: { lastViewed: 'asc' },
        });
        let triggerQuiz = null;
        if (completedViews.length % 2 === 0 && completedViews.length > 0) {
            const lastTwoViews = completedViews.slice(-2);
            const quizQuestions = lastTwoViews.flatMap((cv) => this.mapQuestions(cv.video.questions));
            if (quizQuestions.length > 0) {
                triggerQuiz = {
                    title: `اختبار قصير: ${video.subject.name}`,
                    subjectId: video.subjectId,
                    questions: quizQuestions,
                };
            }
        }
        return {
            viewCount: view.viewCount,
            maxViews: video.maxViews,
            triggerQuiz,
        };
    }
    async getDownloadDetails(videoId, userId) {
        const video = await this.prisma.video.findUnique({ where: { id: videoId } });
        if (!video)
            throw new common_1.NotFoundException('الفيديو غير موجود');
        await this.ensureAccess(video.subjectId, userId, videoId);
        const playbackId = video.muxPlaybackId || null;
        const streamingUrl = video.streamUrl || null;
        const sanitizedTitle = video.title.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
        const downloadFilename = `${sanitizedTitle || videoId}.mp4`;
        let downloadUrl = null;
        let downloadAvailable = false;
        let renditionName = null;
        if (video.muxAssetId && video.videoStatus === 'ready') {
            try {
                const details = await this.muxService.getAssetMp4Details(video.muxAssetId);
                if (details.available && details.renditionName) {
                    renditionName = details.renditionName;
                    const policy = await this.muxService.getPlaybackPolicy(video.muxAssetId);
                    if (playbackId && policy === 'signed') {
                        const token = await this.muxService.generateSignedDownloadToken(playbackId, renditionName, downloadFilename);
                        downloadUrl = `https://stream.mux.com/${playbackId}/${renditionName}?token=${token}&download=${downloadFilename}`;
                    }
                    else if (playbackId) {
                        downloadUrl = `https://stream.mux.com/${playbackId}/${renditionName}?download=${downloadFilename}`;
                    }
                    if (playbackId) {
                        downloadAvailable = true;
                    }
                    this.logger.log(`Selected download URL: ${downloadUrl}, playbackId: ${playbackId}, rendition name: ${renditionName}`);
                }
                else {
                    this.logger.warn(`MP4 rendition is not ready for asset ${video.muxAssetId} of video ${videoId}`);
                }
            }
            catch (err) {
                this.logger.error(`Failed to fetch MP4 renditions from Mux for video ${videoId}: ${err.message}`);
            }
        }
        if (!video.muxAssetId && video.streamUrl && video.streamUrl.endsWith('.mp4')) {
            downloadUrl = video.streamUrl;
            downloadAvailable = true;
            renditionName = 'local';
        }
        return {
            playbackId,
            streamingUrl,
            downloadUrl,
            downloadAvailable,
            downloadFilename,
        };
    }
    async getDownloadToken(videoId, userId) {
        const video = await this.prisma.video.findUnique({ where: { id: videoId } });
        if (!video)
            throw new common_1.NotFoundException('الفيديو غير موجود');
        const details = await this.getDownloadDetails(videoId, userId);
        const expiresAt = new Date(Date.now() + video.downloadDays * 24 * 60 * 60 * 1000);
        return {
            token: details.downloadUrl || `offline_${videoId}_${userId}_${Date.now()}`,
            expiresAt,
            downloadDays: video.downloadDays,
        };
    }
    async ensureAccess(subjectId, userId, videoId) {
        const activeSubs = await this.prisma.subscription.findMany({
            where: { userId, isActive: true, isFrozen: false, endDate: { gt: new Date() } },
            include: { plan: true, subjects: true },
        });
        if (activeSubs.length === 0) {
            throw new common_1.ForbiddenException('الاشتراك غير فعّال');
        }
        const isSubscribed = activeSubs.some((sub) => sub.plan.type !== client_1.PlanType.TRIAL && sub.subjects.some((ss) => ss.subjectId === subjectId));
        const subject = await this.prisma.subject.findUnique({
            where: { id: subjectId },
        });
        const trialUnlockedSubjects = [
            'اللغة العربية',
            'اللغة الإنجليزية',
            'الفيزياء',
            'الأحياء',
            'التكنولوجيا',
        ];
        const isTrialUnlocked = trialUnlockedSubjects.includes(subject?.name ?? '');
        if (!isSubscribed) {
            const hasTrial = activeSubs.some((sub) => sub.plan.type === client_1.PlanType.TRIAL);
            if (!hasTrial || !isTrialUnlocked) {
                throw new common_1.ForbiddenException('هذا الفيديو غير متاح في خطتك');
            }
            const trialSub = activeSubs.find((sub) => sub.plan.type === client_1.PlanType.TRIAL);
            const trialQuota = trialSub?.plan.videosPerSubject ?? 2;
            const publishedVideos = await this.prisma.video.findMany({
                where: { subjectId, status: 'PUBLISHED' },
                orderBy: [{ unitNumber: 'asc' }, { orderInUnit: 'asc' }],
                select: { id: true },
            });
            const index = publishedVideos.findIndex((v) => v.id === videoId);
            if (index === -1 || index >= trialQuota) {
                throw new common_1.ForbiddenException('هذا الفيديو غير متاح في التجربة المجانية');
            }
        }
    }
    async getLessonsList(userId) {
        const videos = await this.prisma.video.findMany({
            where: { status: 'PUBLISHED' },
            include: { subject: true },
        });
        const results = [];
        for (const video of videos) {
            const canWatch = await this.checkWatchAccess(video.subjectId, userId, video.id);
            const canDownload = canWatch && (video.offlineAvailable === true) && await this.checkDownloadAccess(video.subjectId, userId);
            const playbackId = video.muxPlaybackId || '';
            const thumbnail = video.muxThumbnail || (playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : '');
            results.push({
                title: video.title,
                thumbnail,
                duration: video.durationSec || (video.muxDuration ? Math.round(video.muxDuration) : 0),
                canDownload,
                canWatch,
                "Playback URL": playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : '',
                "Thumbnail": thumbnail,
                "Duration": video.durationSec || (video.muxDuration ? Math.round(video.muxDuration) : 0),
                "Offline Available": video.offlineAvailable,
            });
        }
        return results;
    }
    async getLessonDetailsSecure(videoId, userId) {
        const video = await this.prisma.video.findUnique({
            where: { id: videoId },
            include: { subject: true },
        });
        if (!video || video.status !== 'PUBLISHED') {
            throw new common_1.NotFoundException('الدرس غير موجود');
        }
        await this.ensureAccess(video.subjectId, userId, videoId);
        const playbackId = video.muxPlaybackId || '';
        const playbackUrl = playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : '';
        const thumbnail = video.muxThumbnail || (playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : '');
        this.logger.log(`Playback request: user ${userId} requested streaming for video ${videoId}`);
        return {
            playbackUrl,
            thumbnail,
            duration: video.durationSec || (video.muxDuration ? Math.round(video.muxDuration) : 0),
            offlineAvailable: video.offlineAvailable,
            "Playback URL": playbackUrl,
            "Thumbnail": thumbnail,
            "Duration": video.durationSec || (video.muxDuration ? Math.round(video.muxDuration) : 0),
            "Offline Available": video.offlineAvailable,
        };
    }
    async generateSecureDownloadUrl(videoId, userId) {
        const video = await this.prisma.video.findUnique({
            where: { id: videoId },
            include: { subject: true },
        });
        if (!video || video.status !== 'PUBLISHED') {
            throw new common_1.NotFoundException('الدرس غير موجود');
        }
        const isEnrolled = await this.checkDownloadAccess(video.subjectId, userId);
        if (!isEnrolled) {
            this.logger.warn(`Download access denied: user ${userId} is not enrolled in subject ${video.subjectId}`);
            throw new common_1.ForbiddenException('يجب الاشتراك في المادة لتنزيل الفيديو');
        }
        if (!video.offlineAvailable || !video.muxAssetId || !video.muxPlaybackId) {
            throw new common_1.BadRequestException('الفيديو غير متاح للتنزيل حالياً');
        }
        this.logger.log(`Download request: user ${userId} requested download for video ${videoId}`);
        const playbackId = video.muxPlaybackId;
        const renditionName = video.muxStaticMp4Name || 'highest.mp4';
        const sanitizedTitle = video.title.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
        const downloadFilename = `${sanitizedTitle || videoId}.mp4`;
        const token = await this.muxService.generateSignedDownloadTokenWithExp(playbackId, renditionName, downloadFilename, '10m');
        const downloadUrl = `https://stream.mux.com/${playbackId}/${renditionName}?token=${token}&download=${downloadFilename}`;
        return {
            downloadUrl,
            "Download URL": downloadUrl,
        };
    }
    async checkWatchAccess(subjectId, userId, videoId) {
        try {
            await this.ensureAccess(subjectId, userId, videoId);
            return true;
        }
        catch {
            return false;
        }
    }
    async checkDownloadAccess(subjectId, userId) {
        try {
            const activeSubs = await this.prisma.subscription.findMany({
                where: { userId, isActive: true, isFrozen: false, endDate: { gt: new Date() } },
                include: { plan: true, subjects: true },
            });
            if (activeSubs.length === 0)
                return false;
            const hasPaidSubForSubject = activeSubs.some((sub) => sub.plan.type !== client_1.PlanType.TRIAL && sub.subjects.some((ss) => ss.subjectId === subjectId));
            return hasPaidSubForSubject;
        }
        catch {
            return false;
        }
    }
};
exports.VideosService = VideosService;
exports.VideosService = VideosService = VideosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mux_service_1.MuxService])
], VideosService);
//# sourceMappingURL=videos.service.js.map