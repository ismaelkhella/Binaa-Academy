import { OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MuxService } from './mux.service';
export declare class MuxJobsService implements OnApplicationBootstrap, OnModuleDestroy {
    private prisma;
    private muxService;
    private readonly logger;
    private intervals;
    constructor(prisma: PrismaService, muxService: MuxService);
    onApplicationBootstrap(): void;
    onModuleDestroy(): void;
    reconcileJob(): Promise<void>;
    thumbnailSyncJob(): Promise<void>;
    cleanupJob(): Promise<void>;
}
