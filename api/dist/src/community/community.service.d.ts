import { PrismaService } from '../prisma/prisma.service';
import { ObjectStorageService } from './object-storage.service';
export declare const MAX_ATTACHMENT_BYTES: number;
export declare function safeServeHeaders(mimeType: string): {
    contentType: string;
    disposition: string;
};
export declare class CommunityService {
    private prisma;
    private storage;
    constructor(prisma: PrismaService, storage: ObjectStorageService);
    listSubjects(userId: string, role: string): Promise<{
        name: string;
        grade: import(".prisma/client").$Enums.Grade;
        branch: import(".prisma/client").$Enums.Branch;
        id: string;
    }[]>;
    private studentAccessibleSubjectIds;
    checkAccess(userId: string, role: string, subjectId: string): Promise<{
        teacher: {
            userId: string;
        } | null;
    } & {
        name: string;
        grade: import(".prisma/client").$Enums.Grade;
        branch: import(".prisma/client").$Enums.Branch;
        id: string;
        createdAt: Date;
        priceIls: number;
        teacherId: string | null;
        stageId: string | null;
    }>;
    private assertAccess;
    getMessages(userId: string, role: string, subjectId: string, before?: string, limit?: number): Promise<{
        id: string;
        subjectId: string;
        type: string;
        content: string | null;
        createdAt: Date;
        sender: {
            id: string;
            role: string;
            name: string;
            avatarUrl: string | null;
        };
        attachment: {
            id: string;
            fileName: string;
            mimeType: string;
            size: number;
            url: string;
        } | null;
    }[]>;
    sendMessage(userId: string, role: string, subjectId: string, content: string | undefined, file?: {
        originalname: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
    }, type?: string): Promise<{
        id: string;
        subjectId: string;
        type: string;
        content: string | null;
        createdAt: Date;
        sender: {
            id: string;
            role: string;
            name: string;
            avatarUrl: string | null;
        };
        attachment: {
            id: string;
            fileName: string;
            mimeType: string;
            size: number;
            url: string;
        } | null;
    }>;
    private inferType;
    getAttachment(userId: string, role: string, attachmentId: string): Promise<{
        message: {
            subjectId: string;
        };
        id: string;
        fileName: string;
        mimeType: string;
        size: number;
        storageKey: string | null;
    }>;
    getLegacyAttachmentData(attachmentId: string): Promise<Buffer>;
    streamAttachment(a: {
        id: string;
        storageKey: string | null;
    }): {
        kind: "stream";
        stream: import("stream").Readable;
    } | {
        kind: "legacy";
        stream?: undefined;
    };
    adminGetMessages(subjectId: string, before?: string, limit?: number): Promise<{
        id: string;
        subjectId: string;
        type: string;
        content: string | null;
        createdAt: Date;
        sender: {
            id: string;
            role: string;
            name: string;
            avatarUrl: string | null;
        };
        attachment: {
            id: string;
            fileName: string;
            mimeType: string;
            size: number;
            url: string;
        } | null;
    }[]>;
    adminGetAttachment(attachmentId: string): Promise<{
        id: string;
        fileName: string;
        mimeType: string;
        size: number;
        storageKey: string | null;
    }>;
    adminDeleteMessage(messageId: string): Promise<{
        success: boolean;
        subjectId: string;
    }>;
    private serialize;
}
