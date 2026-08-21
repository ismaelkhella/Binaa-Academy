import { PrismaService } from '../prisma/prisma.service';
import { MuxService } from '../mux/mux.service';
export declare class VideosService {
    private prisma;
    private muxService;
    private readonly logger;
    constructor(prisma: PrismaService, muxService: MuxService);
    getLessonDetails(videoId: string, userId: string): Promise<{
        video: {
            id: string;
            title: string;
            description: string | null;
            streamUrl: string | null;
            pdfUrl: string | null;
            durationSec: number;
            unitName: string;
            subHeader: string;
            teacherName: string | null;
            dailyQuizId: string | null;
            mux_playback_id: string;
            video_status: string;
        };
        chapters: {
            id: string;
            title: string;
            startSec: number;
            endSec: number;
            durationText: string;
            status: string;
        }[];
        relatedVideos: {
            id: string;
            title: string;
            subjectName: string;
            teacherName: string | null;
            durationText: string;
            unitName: string;
        }[];
        watermark: {
            name: string;
            phone: string;
        };
    }>;
    getStreamUrl(videoId: string, userId: string): Promise<{
        streamUrl: string;
        watermark: {
            name: string;
            phone: string;
        };
        playbackRates: number[];
        qualities: string[];
    }>;
    markViewed(videoId: string, userId: string): Promise<{
        viewCount: number;
        maxViews: number;
        triggerQuiz: {
            title: string;
            subjectId: string;
            questions: {
                id: string;
                text: string;
                options: any;
                answer: string;
            }[];
        } | null;
    }>;
    getDownloadDetails(videoId: string, userId: string): Promise<{
        playbackId: string | null;
        streamingUrl: string | null;
        downloadUrl: string | null;
        downloadAvailable: boolean;
        downloadFilename: string;
    }>;
    getDownloadToken(videoId: string, userId: string): Promise<{
        token: string;
        expiresAt: Date;
        downloadDays: number;
    }>;
    private ensureAccess;
    getLessonsList(userId: string): Promise<{
        title: string;
        thumbnail: string;
        duration: number;
        canDownload: boolean;
        canWatch: boolean;
        "Playback URL": string;
        Thumbnail: string;
        Duration: number;
        "Offline Available": boolean;
    }[]>;
    getLessonDetailsSecure(videoId: string, userId: string): Promise<{
        playbackUrl: string;
        thumbnail: string;
        duration: number;
        offlineAvailable: boolean;
        "Playback URL": string;
        Thumbnail: string;
        Duration: number;
        "Offline Available": boolean;
    }>;
    generateSecureDownloadUrl(videoId: string, userId: string): Promise<{
        downloadUrl: string;
        "Download URL": string;
    }>;
    checkWatchAccess(subjectId: string, userId: string, videoId: string): Promise<boolean>;
    checkDownloadAccess(subjectId: string, userId: string): Promise<boolean>;
}
