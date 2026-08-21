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
exports.LessonController = exports.LessonsController = void 0;
const common_1 = require("@nestjs/common");
const videos_service_1 = require("./videos.service");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
const throttler_1 = require("@nestjs/throttler");
let LessonsController = class LessonsController {
    constructor(videosService) {
        this.videosService = videosService;
    }
    listLessons(req) {
        return this.videosService.getLessonsList(req.user.sub);
    }
};
exports.LessonsController = LessonsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_guard_1.StudentJwtGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LessonsController.prototype, "listLessons", null);
exports.LessonsController = LessonsController = __decorate([
    (0, common_1.Controller)('lessons'),
    __metadata("design:paramtypes", [videos_service_1.VideosService])
], LessonsController);
let LessonController = class LessonController {
    constructor(videosService) {
        this.videosService = videosService;
    }
    getLesson(id, req) {
        return this.videosService.getLessonDetailsSecure(id, req.user.sub);
    }
    downloadLesson(id, req) {
        return this.videosService.generateSecureDownloadUrl(id, req.user.sub);
    }
};
exports.LessonController = LessonController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.StudentJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "getLesson", null);
__decorate([
    (0, common_1.Post)(':id/download'),
    (0, common_1.UseGuards)(jwt_guard_1.StudentJwtGuard),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "downloadLesson", null);
exports.LessonController = LessonController = __decorate([
    (0, common_1.Controller)('lesson'),
    __metadata("design:paramtypes", [videos_service_1.VideosService])
], LessonController);
//# sourceMappingURL=lessons.controller.js.map