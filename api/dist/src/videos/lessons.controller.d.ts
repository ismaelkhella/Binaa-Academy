import { VideosService } from './videos.service';
export declare class LessonsController {
    private videosService;
    constructor(videosService: VideosService);
    listLessons(req: {
        user: {
            sub: string;
        };
    }): Promise<{
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
}
export declare class LessonController {
    private videosService;
    constructor(videosService: VideosService);
    getLesson(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        playbackUrl: string;
        thumbnail: string;
        duration: number;
        offlineAvailable: boolean;
        "Playback URL": string;
        Thumbnail: string;
        Duration: number;
        "Offline Available": boolean;
    }>;
    downloadLesson(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        downloadUrl: string;
        "Download URL": string;
    }>;
}
