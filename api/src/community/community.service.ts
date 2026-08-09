import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

// Subjects unlocked for TRIAL subscribers — keep in sync with chat.service.ts
const TRIAL_UNLOCKED_SUBJECTS = [
  'اللغة العربية',
  'اللغة الإنجليزية',
  'الفيزياء',
  'الأحياء',
  'التكنولوجيا',
];

export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024; // 15MB — prod ingress caps ~32MB

// SVG can carry scripts — never accept it as an "image".
const FORBIDDEN_MIMES = ['image/svg+xml', 'text/html', 'application/xhtml+xml', 'text/xml', 'application/xml'];

const ALLOWED_MIME_PREFIXES: Record<string, (mime: string) => boolean> = {
  image: (m) => m.startsWith('image/') && !FORBIDDEN_MIMES.includes(m),
  voice: (m) => m.startsWith('audio/'),
  file: (m) =>
    m === 'application/pdf' ||
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

/** Only these content types are served inline; everything else is forced to download. */
export function safeServeHeaders(mimeType: string): { contentType: string; disposition: string } {
  const inlineSafe =
    (mimeType.startsWith('image/') && !FORBIDDEN_MIMES.includes(mimeType)) ||
    mimeType.startsWith('audio/') ||
    mimeType.startsWith('video/') ||
    mimeType === 'application/pdf';
  return inlineSafe
    ? { contentType: mimeType, disposition: 'inline' }
    : { contentType: 'application/octet-stream', disposition: 'attachment' };
}

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  /** Subjects whose community the caller may access. */
  async listSubjects(userId: string, role: string) {
    if (role === 'TEACHER') {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) throw new NotFoundException('المعلم غير موجود');
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

  private async studentAccessibleSubjectIds(userId: string): Promise<Set<string>> {
    const subs = await this.prisma.subscription.findMany({
      where: { userId, isActive: true, isFrozen: false, endDate: { gt: new Date() } },
      include: { subjects: { select: { subjectId: true } }, plan: { select: { type: true } } },
    });

    const ids = new Set<string>();
    let hasTrial = false;
    for (const sub of subs) {
      if (sub.plan.type === 'TRIAL') hasTrial = true;
      for (const s of sub.subjects) ids.add(s.subjectId);
    }

    if (hasTrial) {
      const trialSubjects = await this.prisma.subject.findMany({
        where: { name: { in: TRIAL_UNLOCKED_SUBJECTS } },
        select: { id: true },
      });
      for (const s of trialSubjects) ids.add(s.id);
    }

    return ids;
  }

  private async assertAccess(userId: string, role: string, subjectId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: { teacher: { select: { userId: true } } },
    });
    if (!subject) throw new NotFoundException('المادة غير موجودة');

    if (role === 'TEACHER') {
      if (subject.teacher?.userId !== userId) {
        throw new ForbiddenException('لا يمكنك الوصول إلى مجتمع مادة لا تدرّسها');
      }
      return subject;
    }

    const ids = await this.studentAccessibleSubjectIds(userId);
    if (!ids.has(subjectId)) {
      throw new ForbiddenException('يجب الاشتراك في المادة للوصول إلى مجتمعها');
    }
    return subject;
  }

  async getMessages(userId: string, role: string, subjectId: string, before?: string, limit = 50) {
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

  async sendMessage(
    userId: string,
    role: string,
    subjectId: string,
    content: string | undefined,
    file?: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    type?: string,
  ) {
    await this.assertAccess(userId, role, subjectId);

    const text = content?.trim() || null;
    if (!text && !file) {
      throw new BadRequestException('الرسالة فارغة');
    }
    if (text && text.length > 4000) {
      throw new BadRequestException('الرسالة طويلة جداً (الحد 4000 حرف)');
    }

    let msgType = 'text';
    if (file) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        throw new BadRequestException('حجم الملف يتجاوز الحد المسموح (15MB)');
      }
      msgType = type === 'image' || type === 'voice' || type === 'file' ? type : this.inferType(file.mimetype);
      const validator = ALLOWED_MIME_PREFIXES[msgType];
      if (!validator || !validator(file.mimetype)) {
        throw new BadRequestException('نوع الملف غير مدعوم');
      }
    }

    const message = await this.prisma.communityMessage.create({
      data: {
        subjectId,
        senderUserId: userId,
        senderRole: role as UserRole,
        type: msgType,
        content: text,
        ...(file
          ? {
              attachment: {
                create: {
                  fileName: file.originalname || 'attachment',
                  mimeType: file.mimetype,
                  size: file.size,
                  data: new Uint8Array(file.buffer),
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

    return this.serialize(message);
  }

  private inferType(mime: string): string {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('audio/')) return 'voice';
    return 'file';
  }

  async getAttachment(userId: string, role: string, attachmentId: string) {
    const attachment = await this.prisma.communityAttachment.findUnique({
      where: { id: attachmentId },
      include: { message: { select: { subjectId: true } } },
    });
    if (!attachment) throw new NotFoundException('المرفق غير موجود');
    await this.assertAccess(userId, role, attachment.message.subjectId);
    return attachment;
  }

  // ---- Admin moderation ----

  async adminGetMessages(subjectId: string, before?: string, limit = 50) {
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

  async adminGetAttachment(attachmentId: string) {
    const attachment = await this.prisma.communityAttachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException('المرفق غير موجود');
    return attachment;
  }

  async adminDeleteMessage(messageId: string) {
    const msg = await this.prisma.communityMessage.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('الرسالة غير موجودة');
    await this.prisma.communityMessage.delete({ where: { id: messageId } });
    return { success: true };
  }

  private serialize(m: {
    id: string;
    subjectId: string;
    type: string;
    content: string | null;
    createdAt: Date;
    senderRole: string;
    sender: { id: string; name: string | null; role: string; teacher: { name: string; avatarUrl: string | null } | null };
    attachment: { id: string; fileName: string; mimeType: string; size: number } | null;
  }) {
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
}
