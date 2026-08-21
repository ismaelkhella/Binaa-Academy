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
exports.CommunityService = exports.MAX_ATTACHMENT_BYTES = void 0;
exports.safeServeHeaders = safeServeHeaders;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const object_storage_service_1 = require("./object-storage.service");
const TRIAL_UNLOCKED_SUBJECTS = [
    'اللغة العربية',
    'اللغة الإنجليزية',
    'الفيزياء',
    'الأحياء',
    'التكنولوجيا',
];
exports.MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const FORBIDDEN_MIMES = ['image/svg+xml', 'text/html', 'application/xhtml+xml', 'text/xml', 'application/xml'];
const ALLOWED_MIME_PREFIXES = {
    image: (m) => m.startsWith('image/') && !FORBIDDEN_MIMES.includes(m),
    voice: (m) => m.startsWith('audio/'),
    file: (m) => m === 'application/pdf' ||
        m === 'application/zip' ||
        m === 'application/x-zip-compressed' ||
        m.startsWith('application/vnd.openxmlformats-officedocument') ||
        m === 'application/msword' ||
        m === 'application/vnd.ms-excel' ||
        m === 'application/vnd.ms-powerpoint' ||
        m === 'text/plain' ||
        (m.startsWith('image/') && !FORBIDDEN_MIMES.includes(m)) ||
        m.startsWith('audio/') ||
        m.startsWith('video/'),
};
function safeServeHeaders(mimeType) {
    const inlineSafe = (mimeType.startsWith('image/') && !FORBIDDEN_MIMES.includes(mimeType)) ||
        mimeType.startsWith('audio/') ||
        mimeType.startsWith('video/') ||
        mimeType === 'application/pdf';
    return inlineSafe
        ? { contentType: mimeType, disposition: 'inline' }
        : { contentType: 'application/octet-stream', disposition: 'attachment' };
}
let CommunityService = class CommunityService {
    constructor(prisma, storage) {
        this.prisma = prisma;
        this.storage = storage;
    }
    async listSubjects(userId, role) {
        if (role === 'TEACHER') {
            const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
            if (!teacher)
                throw new common_1.NotFoundException('المعلم غير موجود');
            return this.prisma.subject.findMany({
                where: { teacherId: teacher.id },
                select: { id: true, name: true, grade: true, branch: true },
                orderBy: { name: 'asc' },
            });
        }
        const subjectIds = await this.studentAccessibleSubjectIds(userId);
        return this.prisma.subject.findMany({
            where: { id: { in: Array.from(subjectIds) } },
            select: { id: true, name: true, grade: true, branch: true },
            orderBy: { name: 'asc' },
        });
    }
    async studentAccessibleSubjectIds(userId) {
        const subs = await this.prisma.subscription.findMany({
            where: { userId, isActive: true, isFrozen: false, endDate: { gt: new Date() } },
            include: { subjects: { select: { subjectId: true } }, plan: { select: { type: true } } },
        });
        const ids = new Set();
        let hasTrial = false;
        for (const sub of subs) {
            if (sub.plan.type === 'TRIAL')
                hasTrial = true;
            for (const s of sub.subjects)
                ids.add(s.subjectId);
        }
        if (hasTrial) {
            const trialSubjects = await this.prisma.subject.findMany({
                where: { name: { in: TRIAL_UNLOCKED_SUBJECTS } },
                select: { id: true },
            });
            for (const s of trialSubjects)
                ids.add(s.id);
        }
        return ids;
    }
    async checkAccess(userId, role, subjectId) {
        return this.assertAccess(userId, role, subjectId);
    }
    async assertAccess(userId, role, subjectId) {
        const subject = await this.prisma.subject.findUnique({
            where: { id: subjectId },
            include: { teacher: { select: { userId: true } } },
        });
        if (!subject)
            throw new common_1.NotFoundException('المادة غير موجودة');
        if (role === 'TEACHER') {
            if (subject.teacher?.userId !== userId) {
                throw new common_1.ForbiddenException('لا يمكنك الوصول إلى مجتمع مادة لا تدرّسها');
            }
            return subject;
        }
        const ids = await this.studentAccessibleSubjectIds(userId);
        if (!ids.has(subjectId)) {
            throw new common_1.ForbiddenException('يجب الاشتراك في المادة للوصول إلى مجتمعها');
        }
        return subject;
    }
    async getMessages(userId, role, subjectId, before, limit = 50) {
        await this.assertAccess(userId, role, subjectId);
        const take = Math.min(Math.max(limit, 1), 100);
        const messages = await this.prisma.communityMessage.findMany({
            where: {
                subjectId,
                ...(before ? { createdAt: { lt: new Date(before) } } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take,
            include: {
                sender: { select: { id: true, name: true, role: true, teacher: { select: { name: true, avatarUrl: true } } } },
                attachment: { select: { id: true, fileName: true, mimeType: true, size: true } },
            },
        });
        return messages.map((m) => this.serialize(m));
    }
    async sendMessage(userId, role, subjectId, content, file, type) {
        await this.assertAccess(userId, role, subjectId);
        const text = content?.trim() || null;
        if (!text && !file) {
            throw new common_1.BadRequestException('الرسالة فارغة');
        }
        if (text && text.length > 4000) {
            throw new common_1.BadRequestException('الرسالة طويلة جداً (الحد 4000 حرف)');
        }
        let msgType = 'text';
        if (file) {
            if (file.size > exports.MAX_ATTACHMENT_BYTES) {
                throw new common_1.BadRequestException('حجم الملف يتجاوز الحد المسموح (15MB)');
            }
            msgType = type === 'image' || type === 'voice' || type === 'file' ? type : this.inferType(file.mimetype);
            const validator = ALLOWED_MIME_PREFIXES[msgType];
            if (!validator || !validator(file.mimetype)) {
                throw new common_1.BadRequestException('نوع الملف غير مدعوم');
            }
        }
        let storageKey = null;
        if (file) {
            storageKey = this.storage.buildAttachmentKey(file.originalname || 'attachment');
            await this.storage.upload(storageKey, file.buffer);
        }
        let message;
        try {
            message = await this.prisma.communityMessage.create({
                data: {
                    subjectId,
                    senderUserId: userId,
                    senderRole: role,
                    type: msgType,
                    content: text,
                    ...(file && storageKey
                        ? {
                            attachment: {
                                create: {
                                    fileName: file.originalname || 'attachment',
                                    mimeType: file.mimetype,
                                    size: file.size,
                                    storageKey,
                                },
                            },
                        }
                        : {}),
                },
                include: {
                    sender: { select: { id: true, name: true, role: true, teacher: { select: { name: true, avatarUrl: true } } } },
                    attachment: { select: { id: true, fileName: true, mimeType: true, size: true } },
                },
            });
        }
        catch (e) {
            if (storageKey)
                await this.storage.deleteQuietly(storageKey);
            throw e;
        }
        return this.serialize(message);
    }
    inferType(mime) {
        if (mime.startsWith('image/'))
            return 'image';
        if (mime.startsWith('audio/'))
            return 'voice';
        return 'file';
    }
    async getAttachment(userId, role, attachmentId) {
        const attachment = await this.prisma.communityAttachment.findUnique({
            where: { id: attachmentId },
            select: {
                id: true,
                fileName: true,
                mimeType: true,
                size: true,
                storageKey: true,
                message: { select: { subjectId: true } },
            },
        });
        if (!attachment)
            throw new common_1.NotFoundException('المرفق غير موجود');
        await this.assertAccess(userId, role, attachment.message.subjectId);
        return attachment;
    }
    async getLegacyAttachmentData(attachmentId) {
        const row = await this.prisma.communityAttachment.findUnique({
            where: { id: attachmentId },
            select: { data: true },
        });
        if (!row?.data)
            throw new common_1.NotFoundException('المرفق غير موجود');
        return Buffer.from(row.data);
    }
    streamAttachment(a) {
        if (a.storageKey) {
            return { kind: 'stream', stream: this.storage.downloadStream(a.storageKey) };
        }
        return { kind: 'legacy' };
    }
    async adminGetMessages(subjectId, before, limit = 50) {
        const take = Math.min(Math.max(limit, 1), 100);
        const messages = await this.prisma.communityMessage.findMany({
            where: { subjectId, ...(before ? { createdAt: { lt: new Date(before) } } : {}) },
            orderBy: { createdAt: 'desc' },
            take,
            include: {
                sender: { select: { id: true, name: true, role: true, teacher: { select: { name: true, avatarUrl: true } } } },
                attachment: { select: { id: true, fileName: true, mimeType: true, size: true } },
            },
        });
        return messages.map((m) => this.serialize(m));
    }
    async adminGetAttachment(attachmentId) {
        const attachment = await this.prisma.communityAttachment.findUnique({
            where: { id: attachmentId },
            select: { id: true, fileName: true, mimeType: true, size: true, storageKey: true },
        });
        if (!attachment)
            throw new common_1.NotFoundException('المرفق غير موجود');
        return attachment;
    }
    async adminDeleteMessage(messageId) {
        const msg = await this.prisma.communityMessage.findUnique({
            where: { id: messageId },
            include: { attachment: { select: { storageKey: true } } },
        });
        if (!msg)
            throw new common_1.NotFoundException('الرسالة غير موجودة');
        await this.prisma.communityMessage.delete({ where: { id: messageId } });
        if (msg.attachment?.storageKey)
            await this.storage.deleteQuietly(msg.attachment.storageKey);
        return { success: true, subjectId: msg.subjectId };
    }
    serialize(m) {
        return {
            id: m.id,
            subjectId: m.subjectId,
            type: m.type,
            content: m.content,
            createdAt: m.createdAt,
            sender: {
                id: m.sender.id,
                role: m.senderRole,
                name: m.sender.teacher?.name || m.sender.name || 'مستخدم',
                avatarUrl: m.sender.teacher?.avatarUrl || null,
            },
            attachment: m.attachment
                ? {
                    id: m.attachment.id,
                    fileName: m.attachment.fileName,
                    mimeType: m.attachment.mimeType,
                    size: m.attachment.size,
                    url: `/api/community/attachments/${m.attachment.id}`,
                }
                : null,
        };
    }
};
exports.CommunityService = CommunityService;
exports.CommunityService = CommunityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, object_storage_service_1.ObjectStorageService])
], CommunityService);
//# sourceMappingURL=community.service.js.map