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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatService = class ChatService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTeacherDashboard(userId) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { userId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('المعلم غير موجود');
        }
        const subjects = await this.prisma.subject.findMany({
            where: { teacherId: teacher.id },
        });
        const subjectIds = subjects.map((s) => s.id);
        const subscriptions = await this.prisma.subscriptionSubject.findMany({
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
        const uniqueUserIds = new Set(subscriptions.map((s) => s.subscription.userId));
        const studentsCount = uniqueUserIds.size;
        const subjectsCount = subjects.length;
        const videosCount = await this.prisma.video.count({
            where: {
                subjectId: { in: subjectIds },
                status: 'PUBLISHED',
            },
        });
        let engagementRate = 0;
        if (studentsCount > 0) {
            const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const activeViewers = await this.prisma.videoView.findMany({
                where: {
                    userId: { in: Array.from(uniqueUserIds) },
                    video: { subjectId: { in: subjectIds } },
                    lastViewed: { gte: since },
                },
                select: { userId: true },
                distinct: ['userId'],
            });
            engagementRate = Math.round((activeViewers.length / studentsCount) * 100);
        }
        return {
            teacher: {
                id: teacher.id,
                name: teacher.name,
                bio: teacher.bio,
                avatarUrl: teacher.avatarUrl,
            },
            studentsCount,
            subjectsCount,
            videosCount,
            engagementRate,
        };
    }
    async studentGetTeachers(userId) {
        const studentSubs = await this.prisma.subscription.findMany({
            where: {
                userId,
                isActive: true,
                isFrozen: false,
                endDate: { gt: new Date() },
            },
            include: {
                subjects: {
                    include: {
                        subject: {
                            include: {
                                teacher: true,
                            },
                        },
                    },
                },
            },
        });
        const teachersMap = new Map();
        for (const sub of studentSubs) {
            for (const subSubject of sub.subjects) {
                const teacher = subSubject.subject.teacher;
                if (teacher) {
                    teachersMap.set(teacher.id, {
                        id: teacher.id,
                        name: teacher.name,
                        bio: teacher.bio,
                        subjectName: subSubject.subject.name,
                    });
                }
            }
        }
        const hasTrial = await this.prisma.subscription.findFirst({
            where: {
                userId,
                isActive: true,
                plan: { type: 'TRIAL' },
            },
        });
        if (hasTrial) {
            const trialUnlockedSubjects = [
                'اللغة العربية',
                'اللغة الإنجليزية',
                'الفيزياء',
                'الأحياء',
                'التكنولوجيا',
            ];
            const trialSubjects = await this.prisma.subject.findMany({
                where: {
                    name: { in: trialUnlockedSubjects },
                    teacherId: { not: null },
                },
                include: {
                    teacher: true,
                },
            });
            for (const s of trialSubjects) {
                if (s.teacher) {
                    teachersMap.set(s.teacher.id, {
                        id: s.teacher.id,
                        name: s.teacher.name,
                        bio: s.teacher.bio,
                        subjectName: s.name,
                    });
                }
            }
        }
        return Array.from(teachersMap.values());
    }
    async studentGetConversations(userId) {
        return this.prisma.chat.findMany({
            where: { studentId: userId },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        bio: true,
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async studentGetOrCreateConversation(userId, teacherId) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { id: teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('المعلم غير موجود');
        }
        return this.prisma.chat.upsert({
            where: {
                studentId_teacherId: {
                    studentId: userId,
                    teacherId,
                },
            },
            create: {
                studentId: userId,
                teacherId,
            },
            update: {},
            include: {
                teacher: true,
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
    }
    async studentGetMessages(userId, chatId) {
        const chat = await this.prisma.chat.findFirst({
            where: { id: chatId, studentId: userId },
        });
        if (!chat) {
            throw new common_1.NotFoundException('المحادثة غير موجودة');
        }
        return this.prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async studentSendMessage(userId, chatId, content) {
        const chat = await this.prisma.chat.findFirst({
            where: { id: chatId, studentId: userId },
        });
        if (!chat) {
            throw new common_1.NotFoundException('المحادثة غير موجودة');
        }
        const msg = await this.prisma.message.create({
            data: {
                chatId,
                senderId: userId,
                content,
            },
        });
        await this.prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() },
        });
        return msg;
    }
    async teacherGetConversations(userId) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { userId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('المعلم غير موجود');
        }
        return this.prisma.chat.findMany({
            where: { teacherId: teacher.id },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async teacherGetMessages(userId, chatId) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { userId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('المعلم غير موجود');
        }
        const chat = await this.prisma.chat.findFirst({
            where: { id: chatId, teacherId: teacher.id },
        });
        if (!chat) {
            throw new common_1.NotFoundException('المحادثة غير موجودة');
        }
        return this.prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async teacherSendMessage(userId, chatId, content) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { userId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('المعلم غير موجود');
        }
        const chat = await this.prisma.chat.findFirst({
            where: { id: chatId, teacherId: teacher.id },
        });
        if (!chat) {
            throw new common_1.NotFoundException('المحادثة غير موجودة');
        }
        const msg = await this.prisma.message.create({
            data: {
                chatId,
                senderId: userId,
                content,
            },
        });
        await this.prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() },
        });
        return msg;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
//# sourceMappingURL=chat.service.js.map