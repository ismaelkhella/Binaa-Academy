import { SubjectsService } from './subjects.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class SubjectsController {
    private subjectsService;
    private prisma;
    constructor(subjectsService: SubjectsService, prisma: PrismaService);
    list(req: {
        user: {
            sub: string;
        };
    }): Promise<{
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
    listMy(req: {
        user: {
            sub: string;
        };
    }): Promise<any[]>;
    getVideos(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
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
}
