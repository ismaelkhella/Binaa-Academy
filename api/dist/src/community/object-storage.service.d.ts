import { Readable } from 'stream';
export declare class ObjectStorageService {
    private readonly logger;
    private readonly baseDir;
    constructor();
    buildAttachmentKey(fileName: string): string;
    upload(key: string, buffer: Buffer): Promise<void>;
    downloadStream(key: string): Readable;
    deleteQuietly(key: string): Promise<void>;
    private keyToPath;
}
