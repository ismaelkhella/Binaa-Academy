import { PrismaService } from '../prisma/prisma.service';
import { Grade, Branch } from '@prisma/client';
export declare class SubjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    listForStudent(grade: Grade, branch: Branch, userId: string): Promise<{
        id: string;
        name: string;
        grade: import(".prisma/client").$Enums.Grade;
        branch: import(".prisma/client").$Enums.Branch;
        teacherName: string | null;
        videoCount: number;
        progressPercent: number;
        locked: boolean;
        priceIls: number;
    }[]>;
    getVideos(subjectId: string, userId: string): Promise<{
        subject: {
            id: string;
            name: string;
        };
        videos: {
            id: string;
            title: string;
            description: string | null;
            durationSec: number;
            unitNumber: number;
            orderInUnit: number;
            pdfUrl: string | null;
            locked: boolean;
            mux_playback_id: string;
            video_status: string;
        }[];
        quota: number;
    }>;
    listPurchasedForStudent(userId: string): Promise<any[]>;
}
