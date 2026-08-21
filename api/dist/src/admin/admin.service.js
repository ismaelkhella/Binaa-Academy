"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mux_service_1 = require("../mux/mux.service");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
let AdminService = class AdminService {
    constructor(prisma, muxService) {
        this.prisma = prisma;
        this.muxService = muxService;
    }
    async getDashboardStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const [totalStudents, activeStudents, trialStudents, monthlySubs, lastMonthSubs, recentStudents, topSubjects, totalVideos, completedViews,] = await Promise.all([
            this.prisma.user.count({ where: { role: 'STUDENT' } }),
            this.prisma.user.count({
                where: {
                    role: 'STUDENT',
                    subscriptions: { some: { isActive: true, endDate: { gt: now }, isFrozen: false } },
                },
            }),
            this.prisma.user.count({
                where: {
                    role: 'STUDENT',
                    subscriptions: { some: { isActive: true, plan: { type: client_1.PlanType.TRIAL } } },
                },
            }),
            this.prisma.subscription.count({
                where: { createdAt: { gte: startOfMonth }, plan: { type: { not: client_1.PlanType.TRIAL } } },
            }),
            this.prisma.subscription.count({
                where: {
                    createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
                    plan: { type: { not: client_1.PlanType.TRIAL } },
                },
            }),
            this.prisma.user.findMany({
                where: { role: 'STUDENT' },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: { id: true, phone: true, name: true, grade: true, branch: true, createdAt: true },
            }),
            this.prisma.videoView.groupBy({
                by: ['videoId'],
                _count: { videoId: true },
                orderBy: { _count: { videoId: 'desc' } },
                take: 5,
            }),
            this.prisma.video.count({ where: { status: 'PUBLISHED' } }),
            this.prisma.videoView.count({ where: { completed: true } }),
        ]);
        const topVideoIds = topSubjects.map((t) => t.videoId);
        const videos = await this.prisma.video.findMany({
            where: { id: { in: topVideoIds } },
            include: { subject: { select: { name: true } } },
        });
        const videoMap = new Map(videos.map((v) => [v.id, v]));
        const plans = await this.prisma.subscriptionPlan.findMany({
            where: { type: { not: client_1.PlanType.TRIAL }, isActive: true },
        });
        const monthlyRevenue = monthlySubs * (plans.find((p) => p.type === client_1.PlanType.MONTHLY)?.priceIls ?? 0);
        return {
            students: { total: totalStudents, active: activeStudents, trial: trialStudents },
            subscriptions: { thisMonth: monthlySubs, lastMonth: lastMonthSubs },
            revenue: { thisMonth: monthlyRevenue, currency: 'ILS' },
            content: { totalVideos, completionRate: totalVideos > 0 ? Math.round((completedViews / totalVideos) * 100) : 0 },
            recentStudents,
            topVideos: topSubjects.map((t) => {
                const v = videoMap.get(t.videoId);
                return {
                    videoId: t.videoId,
                    title: v?.title ?? '—',
                    subject: v?.subject.name ?? '—',
                    views: t._count.videoId,
                };
            }),
        };
    }
    async listStudents(query) {
        const where = { role: 'STUDENT' };
        if (query.grade)
            where.grade = query.grade;
        if (query.branch)
            where.branch = query.branch;
        if (query.search) {
            const isSqlite = process.env.DATABASE_URL?.startsWith('file:') || !process.env.DATABASE_URL?.includes('postgres');
            where.OR = [
                { phone: { contains: query.search } },
                { name: isSqlite ? { contains: query.search } : { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const students = await this.prisma.user.findMany({
            where,
            include: {
                subscriptions: {
                    where: { isActive: true },
                    include: { plan: true },
                    take: 1,
                },
                _count: { select: { videoViews: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return students.map((s) => ({
            id: s.id,
            phone: s.phone,
            name: s.name,
            grade: s.grade,
            branch: s.branch,
            parentPhone: s.parentPhone,
            isActive: s.isActive,
            createdAt: s.createdAt,
            viewsCount: s._count.videoViews,
            subscription: s.subscriptions[0]
                ? {
                    planType: s.subscriptions[0].plan.type,
                    planName: s.subscriptions[0].plan.nameAr,
                    endDate: s.subscriptions[0].endDate,
                    isFrozen: s.subscriptions[0].isFrozen,
                }
                : null,
        }));
    }
    async getStudent(id) {
        const student = await this.prisma.user.findFirst({
            where: { id, role: 'STUDENT' },
            include: {
                subscriptions: {
                    include: {
                        plan: true,
                        subjects: {
                            include: {
                                subject: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                videoViews: {
                    include: {
                        video: {
                            include: {
                                subject: true,
                            },
                        },
                    },
                    orderBy: { lastViewed: 'desc' },
                },
                quizResults: {
                    include: {
                        quiz: {
                            include: {
                                subject: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                dailyGoals: {
                    orderBy: { dueDate: 'desc' },
                },
                studySessions: {
                    orderBy: { date: 'desc' },
                },
            },
        });
        if (!student)
            throw new common_1.NotFoundException('الطالب غير موجود');
        return student;
    }
    async updateStudent(id, dto) {
        const student = await this.prisma.user.findFirst({ where: { id, role: 'STUDENT' } });
        if (!student)
            throw new common_1.NotFoundException('الطالب غير موجود');
        return this.prisma.user.update({ where: { id }, data: dto });
    }
    async freezeSubscription(userId, dto) {
        const sub = await this.prisma.subscription.findFirst({ where: { userId, isActive: true } });
        if (!sub)
            throw new common_1.NotFoundException('لا يوجد اشتراك فعّال');
        return this.prisma.subscription.update({
            where: { id: sub.id },
            data: { isFrozen: dto.freeze, notes: dto.reason },
        });
    }
    async grantSubscription(userId, dto) {
        let sub = await this.prisma.subscription.findFirst({
            where: {
                userId,
                isActive: true,
                endDate: { gt: new Date() },
                isFrozen: false,
                plan: { type: { not: client_1.PlanType.TRIAL } },
            },
        });
        if (!sub) {
            const plan = await this.prisma.subscriptionPlan.findFirst({
                where: { type: client_1.PlanType.YEARLY },
            }) || await this.prisma.subscriptionPlan.findFirst({
                where: { isActive: true },
            });
            if (!plan)
                throw new common_1.NotFoundException('خطة الاشتراك غير موجودة في النظام');
            sub = await this.prisma.subscription.create({
                data: {
                    userId,
                    planId: plan.id,
                    endDate: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000),
                },
            });
        }
        if (dto.subjectIds) {
            await this.prisma.subscriptionSubject.deleteMany({
                where: {
                    subscriptionId: sub.id,
                    subjectId: { notIn: dto.subjectIds },
                },
            });
            for (const subjectId of dto.subjectIds) {
                await this.prisma.subscriptionSubject.upsert({
                    where: {
                        subscriptionId_subjectId: {
                            subscriptionId: sub.id,
                            subjectId,
                        },
                    },
                    create: {
                        subscriptionId: sub.id,
                        subjectId,
                    },
                    update: {},
                });
            }
        }
        return this.prisma.subscription.findUnique({
            where: { id: sub.id },
            include: {
                plan: true,
                subjects: {
                    include: {
                        subject: true,
                    },
                },
            },
        });
    }
    async listVideos() {
        await this.muxService.reconcileProcessingVideos().catch(() => undefined);
        return this.prisma.video.findMany({
            include: {
                subject: { select: { name: true, grade: true, branch: true } },
                teacher: { select: { name: true } },
                _count: { select: { videoViews: true } },
                questions: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createVideo(dto) {
        const { questions, ...videoData } = dto;
        const video = await this.prisma.video.create({
            data: {
                ...videoData,
                ...(videoData.muxUploadId ? { videoStatus: 'processing' } : {}),
            },
        });
        if (questions && questions.length > 0) {
            await this.prisma.videoQuestion.createMany({
                data: questions.map((q) => ({
                    videoId: video.id,
                    text: q.text,
                    options: JSON.stringify(q.options),
                    answer: q.answer,
                })),
            });
        }
        return this.prisma.video.findUnique({
            where: { id: video.id },
            include: { questions: true },
        });
    }
    async updateVideo(id, dto) {
        const { questions, ...videoData } = dto;
        const data = { ...videoData };
        const existing = await this.prisma.video.findUnique({
            where: { id },
            select: { muxAssetId: true, muxUploadId: true },
        });
        if (videoData.muxUploadId) {
            if (existing?.muxUploadId !== videoData.muxUploadId) {
                if (existing?.muxAssetId)
                    await this.muxService.deleteAsset(existing.muxAssetId);
                data.muxAssetId = null;
                data.muxPlaybackId = null;
                data.videoStatus = 'processing';
                data.muxStatus = 'processing';
                data.streamUrl = null;
                data.muxDuration = null;
                data.muxThumbnail = null;
                data.muxStaticMp4Name = null;
                data.offlineAvailable = false;
                data.videoSize = null;
            }
        }
        else if (videoData.streamUrl &&
            (existing?.muxAssetId || existing?.muxUploadId)) {
            if (existing.muxAssetId)
                await this.muxService.deleteAsset(existing.muxAssetId);
            data.muxUploadId = null;
            data.muxAssetId = null;
            data.muxPlaybackId = null;
            data.videoStatus = 'none';
            data.muxStatus = null;
            data.muxDuration = null;
            data.muxThumbnail = null;
            data.muxStaticMp4Name = null;
            data.offlineAvailable = false;
            data.videoSize = null;
        }
        const video = await this.prisma.video.update({ where: { id }, data: data });
        if (questions) {
            await this.prisma.videoQuestion.deleteMany({ where: { videoId: id } });
            if (questions.length > 0) {
                await this.prisma.videoQuestion.createMany({
                    data: questions.map((q) => ({
                        videoId: id,
                        text: q.text,
                        options: JSON.stringify(q.options),
                        answer: q.answer,
                    })),
                });
            }
        }
        return this.prisma.video.findUnique({
            where: { id },
            include: { questions: true },
        });
    }
    async deleteVideo(id) {
        const existing = await this.prisma.video.findUnique({
            where: { id },
            select: { muxAssetId: true },
        });
        if (existing?.muxAssetId) {
            await this.muxService.deleteAsset(existing.muxAssetId);
        }
        return this.prisma.video.update({
            where: { id },
            data: {
                status: 'DRAFT',
                muxAssetId: null,
                muxPlaybackId: null,
                muxUploadId: null,
                videoStatus: 'none',
                muxStatus: null,
                muxDuration: null,
                muxThumbnail: null,
                muxStaticMp4Name: null,
                offlineAvailable: false,
                videoSize: null,
            },
        });
    }
    async retryVideoUpload(id) {
        const video = await this.prisma.video.findUnique({
            where: { id },
        });
        if (!video)
            throw new common_1.NotFoundException('الفيديو غير موجود');
        if (video.muxAssetId) {
            await this.muxService.syncAssetStatus(video.muxAssetId, video.id);
        }
        else if (video.muxUploadId) {
            await this.muxService.syncUploadStatus(video.muxUploadId, video.id);
        }
        else {
            throw new common_1.BadRequestException('لا يوجد معرف رفع أو معرف أصل لإعادة المحاولة');
        }
        return this.prisma.video.findUnique({
            where: { id },
        });
    }
    async listSubjects() {
        return this.prisma.subject.findMany({
            include: {
                teacher: { select: { id: true, name: true } },
                _count: { select: { videos: true, units: true } },
            },
            orderBy: [{ grade: 'asc' }, { branch: 'asc' }, { name: 'asc' }],
        });
    }
    async createSubject(dto) {
        return this.prisma.subject.create({
            data: {
                name: dto.name,
                grade: dto.grade,
                branch: dto.branch,
                priceIls: dto.priceIls ?? 0,
                teacherId: dto.teacherId || null,
            },
            include: { teacher: { select: { id: true, name: true } }, _count: { select: { videos: true } } },
        });
    }
    async updateSubject(id, dto) {
        const subject = await this.prisma.subject.findUnique({ where: { id } });
        if (!subject)
            throw new common_1.NotFoundException('المادة غير موجودة');
        return this.prisma.subject.update({
            where: { id },
            data: {
                priceIls: dto.priceIls !== undefined ? dto.priceIls : undefined,
                teacherId: dto.teacherId !== undefined ? (dto.teacherId === '' ? null : dto.teacherId) : undefined,
            },
            include: {
                teacher: { select: { id: true, name: true } },
            },
        });
    }
    async listPlans() {
        return this.prisma.subscriptionPlan.findMany({ orderBy: { durationDays: 'asc' } });
    }
    async updatePlan(id, dto) {
        return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
    }
    async listTeachers(query) {
        const page = parseInt(query?.page || '1', 10);
        const limit = parseInt(query?.limit || '10', 10);
        const skip = (page - 1) * limit;
        const where = {};
        const search = query?.search?.trim();
        if (search) {
            const isSqlite = process.env.DATABASE_URL?.startsWith('file:') || !process.env.DATABASE_URL?.includes('postgres');
            where.OR = [
                { name: isSqlite ? { contains: search } : { contains: search, mode: 'insensitive' } },
                { bio: isSqlite ? { contains: search } : { contains: search, mode: 'insensitive' } },
                { user: { phone: { contains: search } } },
                { subjects: { some: { name: isSqlite ? { contains: search } : { contains: search, mode: 'insensitive' } } } },
            ];
        }
        const [teachers, total] = await this.prisma.$transaction([
            this.prisma.teacher.findMany({
                where,
                include: {
                    user: { select: { phone: true } },
                    subjects: true,
                    _count: { select: { subjects: true, videos: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.teacher.count({ where }),
        ]);
        const formattedTeachers = [];
        for (let idx = 0; idx < teachers.length; idx++) {
            const t = teachers[idx];
            const specialty = t.subjects.map(s => s.name).join(', ') || '—';
            const gradesAr = {
                GRADE_11: 'الحادي عشر',
                GRADE_12: 'الثاني عشر',
            };
            const gradeStrings = t.subjects.map(s => {
                const gradeVal = gradesAr[s.grade] || s.grade;
                const branchText = s.branch === 'SCIENTIFIC' ? 'علمي' : s.branch === 'LITERARY' ? 'أدبي' : '';
                return branchText ? `${gradeVal} (${branchText})` : gradeVal;
            });
            const grade = Array.from(new Set(gradeStrings)).join(', ') || '—';
            const subjectIds = t.subjects.map((s) => s.id);
            let activeStudentsCount = 0;
            if (subjectIds.length > 0) {
                const subSubjects = await this.prisma.subscriptionSubject.findMany({
                    where: {
                        subjectId: { in: subjectIds },
                        subscription: {
                            isActive: true,
                            isFrozen: false,
                            endDate: { gt: new Date() },
                        },
                    },
                    select: {
                        subscription: {
                            select: {
                                userId: true,
                            },
                        },
                    },
                });
                activeStudentsCount = new Set(subSubjects.map((s) => s.subscription.userId)).size;
            }
            const email = `${t.name.split(' ').join('.').toLowerCase()}@bina.edu`;
            const rating = parseFloat((4.5 + (t.name.length % 5) * 0.1).toFixed(1));
            formattedTeachers.push({
                id: t.id,
                name: t.name,
                email,
                specialty,
                grade,
                lessons: activeStudentsCount,
                rating,
                status: 'نشط',
                avatar: t.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
                commissionRate: t.commissionRate,
                user: { phone: t.user?.phone || '—' },
                _count: t._count
            });
        }
        return {
            teachers: formattedTeachers,
            total,
            page,
            limit
        };
    }
    async getTeachersDashboard() {
        const totalTeachers = await this.prisma.teacher.count();
        const activeClasses = await this.prisma.subject.count({
            where: { teacherId: { not: null } },
        });
        const videos = await this.prisma.video.findMany({
            where: { status: 'PUBLISHED' },
            select: { durationSec: true },
        });
        const totalSec = videos.reduce((acc, v) => acc + (v.durationSec || 0), 0);
        const contentHours = Math.round(totalSec / 3600);
        const dbTeachers = await this.prisma.teacher.findMany({
            include: {
                subjects: true,
            },
        });
        const teachersWithStudents = [];
        for (const t of dbTeachers) {
            const subjectIds = t.subjects.map((s) => s.id);
            let activeStudentsCount = 0;
            if (subjectIds.length > 0) {
                const subSubjects = await this.prisma.subscriptionSubject.findMany({
                    where: {
                        subjectId: { in: subjectIds },
                        subscription: {
                            isActive: true,
                            isFrozen: false,
                            endDate: { gt: new Date() },
                        },
                    },
                    select: {
                        subscription: {
                            select: {
                                userId: true,
                            },
                        },
                    },
                });
                activeStudentsCount = new Set(subSubjects.map((s) => s.subscription.userId)).size;
            }
            teachersWithStudents.push({
                id: t.id,
                name: t.name,
                avatar: t.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
                satisfactionRate: 98,
                activeStudentsCount,
            });
        }
        const topTeachersSorted = teachersWithStudents
            .sort((a, b) => b.activeStudentsCount - a.activeStudentsCount)
            .slice(0, 3)
            .map((t, idx) => ({
            id: t.id,
            name: t.name,
            satisfactionRate: 98 - idx * 2,
            avatar: t.avatar,
        }));
        return {
            stats: {
                totalTeachers,
                activeClasses,
                performanceRating: totalTeachers > 0 ? 4.8 : 0.0,
                contentHours
            },
            applications: [],
            topTeachers: topTeachersSorted
        };
    }
    async createTeacher(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { phone: dto.phone },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('رقم الهاتف مستخدم بالفعل لمستخدم آخر');
        }
        const teacher = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    phone: dto.phone,
                    name: dto.name,
                    role: 'TEACHER',
                    passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : null,
                },
            });
            const teacherRecord = await tx.teacher.create({
                data: {
                    userId: user.id,
                    name: dto.name,
                    bio: dto.bio,
                    avatarUrl: dto.avatarUrl,
                    commissionRate: dto.commissionRate !== undefined ? dto.commissionRate : 0.25,
                },
            });
            if (dto.subjectId) {
                await tx.subject.update({
                    where: { id: dto.subjectId },
                    data: { teacherId: teacherRecord.id },
                });
            }
            return teacherRecord;
        });
        return this.prisma.teacher.findUnique({
            where: { id: teacher.id },
            include: {
                user: { select: { phone: true } },
                subjects: true,
            },
        });
    }
    async updateTeacherCredentials(teacherId, dto) {
        if (!dto.phone && !dto.password) {
            throw new common_1.BadRequestException('يجب تحديد رقم هاتف أو كلمة مرور');
        }
        const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
        if (!teacher)
            throw new common_1.NotFoundException('المعلم غير موجود');
        if (dto.phone) {
            const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
            if (existing && existing.id !== teacher.userId) {
                throw new common_1.BadRequestException('رقم الهاتف مستخدم بالفعل لمستخدم آخر');
            }
        }
        await this.prisma.user.update({
            where: { id: teacher.userId },
            data: {
                ...(dto.phone ? { phone: dto.phone } : {}),
                ...(dto.password ? { passwordHash: await bcrypt.hash(dto.password, 10) } : {}),
            },
        });
        return { success: true };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mux_service_1.MuxService])
], AdminService);
//# sourceMappingURL=admin.service.js.map