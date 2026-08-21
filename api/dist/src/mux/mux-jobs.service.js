"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MuxJobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MuxJobsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mux_service_1 = require("./mux.service");
let MuxJobsService = MuxJobsService_1 = class MuxJobsService {
    constructor(prisma, muxService) {
        this.prisma = prisma;
        this.muxService = muxService;
        this.logger = new common_1.Logger(MuxJobsService_1.name);
        this.intervals = [];
    }
    onApplicationBootstrap() {
        this.logger.log('Starting Mux background jobs scheduler...');
        const reconcileInterval = setInterval(() => {
            this.reconcileJob().catch((err) => this.logger.error(`Error in reconcileJob: ${err.message}`));
        }, 2 * 60 * 1000);
        this.intervals.push(reconcileInterval);
        const thumbnailInterval = setInterval(() => {
            this.thumbnailSyncJob().catch((err) => this.logger.error(`Error in thumbnailSyncJob: ${err.message}`));
        }, 5 * 60 * 1000);
        this.intervals.push(thumbnailInterval);
        const cleanupInterval = setInterval(() => {
            this.cleanupJob().catch((err) => this.logger.error(`Error in cleanupJob: ${err.message}`));
        }, 24 * 60 * 60 * 1000);
        this.intervals.push(cleanupInterval);
        this.reconcileJob().catch((err) => this.logger.error(`Initial reconcile error: ${err.message}`));
        this.thumbnailSyncJob().catch((err) => this.logger.error(`Initial thumbnail sync error: ${err.message}`));
    }
    onModuleDestroy() {
        this.logger.log('Stopping Mux background jobs scheduler...');
        for (const interval of this.intervals) {
            clearInterval(interval);
        }
    }
    async reconcileJob() {
        this.logger.log('Executing Background Job: Video Upload / Asset Processing Reconciliation...');
        await this.muxService.reconcileProcessingVideos();
    }
    async thumbnailSyncJob() {
        this.logger.log('Executing Background Job: Thumbnail Sync...');
        const videosMissingThumb = await this.prisma.video.findMany({
            where: {
                videoStatus: 'ready',
                muxPlaybackId: { not: null },
                muxThumbnail: null,
            },
            select: { id: true, muxPlaybackId: true },
        });
        if (videosMissingThumb.length === 0)
            return;
        this.logger.log(`Found ${videosMissingThumb.length} videos missing thumbnail urls. Syncing...`);
        for (const v of videosMissingThumb) {
            if (!v.muxPlaybackId)
                continue;
            const thumbnail = `https://image.mux.com/${v.muxPlaybackId}/thumbnail.jpg`;
            await this.prisma.video.update({
                where: { id: v.id },
                data: { muxThumbnail: thumbnail },
            });
            this.logger.log(`Synced thumbnail for video ${v.id}`);
        }
    }
    async cleanupJob() {
        this.logger.log('Executing Background Job: Database Cleanup...');
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const deletedCount = await this.prisma.video.deleteMany({
            where: {
                status: 'DRAFT',
                videoStatus: 'failed',
                createdAt: { lt: oneDayAgo },
            },
        });
        if (deletedCount.count > 0) {
            this.logger.log(`Cleaned up ${deletedCount.count} failed draft videos older than 24 hours.`);
        }
    }
};
exports.MuxJobsService = MuxJobsService;
exports.MuxJobsService = MuxJobsService = MuxJobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mux_service_1.MuxService])
], MuxJobsService);
//# sourceMappingURL=mux-jobs.service.js.map