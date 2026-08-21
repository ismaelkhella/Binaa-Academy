import { VideosService } from './videos.service';
export declare class VideosController {
    private videosService;
    constructor(videosService: VideosService);
    getLesson(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
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
    getStream(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        streamUrl: string;
        watermark: {
            name: string;
            phone: string;
        };
        playbackRates: number[];
        qualities: string[];
    }>;
    markViewed(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
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
    getDownloadToken(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        token: string;
        expiresAt: Date;
        downloadDays: number;
    }>;
    getDownloadDetails(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        playbackId: string | null;
        streamingUrl: string | null;
        downloadUrl: string | null;
        downloadAvailable: boolean;
        downloadFilename: string;
    }>;
}
