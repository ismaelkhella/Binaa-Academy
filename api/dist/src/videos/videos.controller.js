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
exports.VideosController = void 0;
const common_1 = require("@nestjs/common");
const videos_service_1 = require("./videos.service");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
let VideosController = class VideosController {
    constructor(videosService) {
        this.videosService = videosService;
    }
    getLesson(id, req) {
        return this.videosService.getLessonDetails(id, req.user.sub);
    }
    getStream(id, req) {
        return this.videosService.getStreamUrl(id, req.user.sub);
    }
    markViewed(id, req) {
        return this.videosService.markViewed(id, req.user.sub);
    }
    getDownloadToken(id, req) {
        return this.videosService.getDownloadToken(id, req.user.sub);
    }
    getDownloadDetails(id, req) {
        return this.videosService.getDownloadDetails(id, req.user.sub);
    }
};
exports.VideosController = VideosController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.StudentJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "getLesson", null);
__decorate([
    (0, common_1.Get)(':id/stream'),
    (0, common_1.UseGuards)(jwt_guard_1.StudentJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "getStream", null);
__decorate([
    (0, common_1.Post)(':id/mark-viewed'),
    (0, common_1.UseGuards)(jwt_guard_1.StudentJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "markViewed", null);
__decorate([
    (0, common_1.Get)(':id/download-token'),
    (0, common_1.UseGuards)(jwt_guard_1.StudentJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "getDownloadToken", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    (0, common_1.UseGuards)(jwt_guard_1.StudentJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VideosController.prototype, "getDownloadDetails", null);
exports.VideosController = VideosController = __decorate([
    (0, common_1.Controller)('videos'),
    __metadata("design:paramtypes", [videos_service_1.VideosService])
], VideosController);
//# sourceMappingURL=videos.controller.js.map