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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCommunityController = exports.CommunityController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const throttler_1 = require("@nestjs/throttler");
const community_service_1 = require("./community.service");
const community_gateway_1 = require("./community.gateway");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
async function serveAttachment(community, a, res) {
    const source = community.streamAttachment(a);
    if (source.kind === 'stream') {
        source.stream.on('error', () => {
            if (!res.headersSent)
                res.status(502);
            res.end();
        });
        source.stream.pipe(res);
    }
    else {
        res.send(await community.getLegacyAttachmentData(a.id));
    }
}
let CommunityController = class CommunityController {
    constructor(community, gateway) {
        this.community = community;
        this.gateway = gateway;
    }
    listSubjects(req) {
        return this.community.listSubjects(req.user.sub, req.user.role);
    }
    async getAttachment(req, id, res) {
        const a = await this.community.getAttachment(req.user.sub, req.user.role, id);
        const { contentType, disposition } = (0, community_service_1.safeServeHeaders)(a.mimeType);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', String(a.size));
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(a.fileName)}`);
        res.setHeader('Cache-Control', 'private, max-age=86400');
        await serveAttachment(this.community, a, res);
    }
    getMessages(req, subjectId, before, limit) {
        return this.community.getMessages(req.user.sub, req.user.role, subjectId, before, limit ? parseInt(limit, 10) : 50);
    }
    async sendMessage(req, subjectId, body, file) {
        const message = await this.community.sendMessage(req.user.sub, req.user.role, subjectId, body?.content, file, body?.type);
        this.gateway.broadcastNewMessage(subjectId, message);
        return message;
    }
};
exports.CommunityController = CommunityController;
__decorate([
    (0, common_1.Get)('subjects'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "listSubjects", null);
__decorate([
    (0, common_1.Get)('attachments/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getAttachment", null);
__decorate([
    (0, common_1.Get)(':subjectId/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('subjectId')),
    __param(2, (0, common_1.Query)('before')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "getMessages", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 20 } }),
    (0, common_1.Post)(':subjectId/messages'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: community_service_1.MAX_ATTACHMENT_BYTES } })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('subjectId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "sendMessage", null);
exports.CommunityController = CommunityController = __decorate([
    (0, common_1.Controller)('community'),
    (0, common_1.UseGuards)(jwt_guard_1.UserJwtGuard),
    __metadata("design:paramtypes", [community_service_1.CommunityService, community_gateway_1.CommunityGateway])
], CommunityController);
let AdminCommunityController = class AdminCommunityController {
    constructor(community, gateway) {
        this.community = community;
        this.gateway = gateway;
    }
    getMessages(subjectId, before, limit) {
        return this.community.adminGetMessages(subjectId, before, limit ? parseInt(limit, 10) : 50);
    }
    async getAttachment(id, res) {
        const a = await this.community.adminGetAttachment(id);
        const { contentType, disposition } = (0, community_service_1.safeServeHeaders)(a.mimeType);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', String(a.size));
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(a.fileName)}`);
        await serveAttachment(this.community, a, res);
    }
    async deleteMessage(id) {
        const result = await this.community.adminDeleteMessage(id);
        this.gateway.broadcastDeletedMessage(result.subjectId, id);
        return { success: true };
    }
};
exports.AdminCommunityController = AdminCommunityController;
__decorate([
    (0, common_1.Get)(':subjectId/messages'),
    __param(0, (0, common_1.Param)('subjectId')),
    __param(1, (0, common_1.Query)('before')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AdminCommunityController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Get)('attachments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminCommunityController.prototype, "getAttachment", null);
__decorate([
    (0, common_1.Delete)('messages/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminCommunityController.prototype, "deleteMessage", null);
exports.AdminCommunityController = AdminCommunityController = __decorate([
    (0, common_1.Controller)('admin/community'),
    (0, common_1.UseGuards)(jwt_guard_1.AdminJwtGuard),
    __metadata("design:paramtypes", [community_service_1.CommunityService, community_gateway_1.CommunityGateway])
], AdminCommunityController);
//# sourceMappingURL=community.controller.js.map