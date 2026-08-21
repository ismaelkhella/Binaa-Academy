import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { MuxService } from './mux.service';
export declare class MuxController {
    private muxService;
    constructor(muxService: MuxService);
    createUpload(): Promise<{
        upload_id: string;
        upload_url: string;
        uploadId: string;
        uploadUrl: string;
    }>;
    webhook(req: RawBodyRequest<Request>): Promise<{
        received: boolean;
    }>;
}
