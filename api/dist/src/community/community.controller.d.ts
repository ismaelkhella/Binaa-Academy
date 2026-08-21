import { Response } from 'express';
import { CommunityService } from './community.service';
import { CommunityGateway } from './community.gateway';
export declare class CommunityController {
    private community;
    private gateway;
    constructor(community: CommunityService, gateway: CommunityGateway);
    listSubjects(req: any): Promise<{
        name: string;
        grade: import(".prisma/client").$Enums.Grade;
        branch: import(".prisma/client").$Enums.Branch;
        id: string;
    }[]>;
    getAttachment(req: any, id: string, res: Response): Promise<void>;
    getMessages(req: any, subjectId: string, before?: string, limit?: string): Promise<{
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
    sendMessage(req: any, subjectId: string, body: {
        content?: string;
        type?: string;
    }, file?: Express.Multer.File): Promise<{
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
}
export declare class AdminCommunityController {
    private community;
    private gateway;
    constructor(community: CommunityService, gateway: CommunityGateway);
    getMessages(subjectId: string, before?: string, limit?: string): Promise<{
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
    getAttachment(id: string, res: Response): Promise<void>;
    deleteMessage(id: string): Promise<{
        success: boolean;
    }>;
}
