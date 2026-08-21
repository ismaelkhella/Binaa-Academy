import { PrismaService } from '../prisma/prisma.service';
export declare class MuxService {
    private prisma;
    private readonly logger;
    private mux;
    constructor(prisma: PrismaService);
    private client;
    static playbackUrl(playbackId: string): string;
    createDirectUpload(): Promise<{
        upload_id: string;
        upload_url: string;
        uploadId: string;
        uploadUrl: string;
    }>;
    deleteAsset(assetId: string): Promise<void>;
    verifyWebhookSignature(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): Promise<boolean>;
    reconcileProcessingVideos(): Promise<void>;
    handleEvent(event: {
        type: string;
        data: any;
    }): Promise<void>;
    getAssetMp4Details(assetId: string): Promise<{
        available: boolean;
        renditionName: string | null;
    }>;
    getPlaybackPolicy(assetId: string): Promise<'public' | 'signed' | null>;
    generateSignedDownloadToken(playbackId: string, renditionName: string, filename: string): Promise<string>;
    generateSignedDownloadTokenWithExp(playbackId: string, renditionName: string, filename: string, expiration: string): Promise<string>;
    syncAssetStatus(assetId: string, videoId: string): Promise<void>;
    syncUploadStatus(uploadId: string, videoId: string): Promise<void>;
}
