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
exports.SubjectsController = void 0;
const common_1 = require("@nestjs/common");
const subjects_service_1 = require("./subjects.service");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
const prisma_service_1 = require("../prisma/prisma.service");
let SubjectsController = class SubjectsController {
    constructor(subjectsService, prisma) {
        this.subjectsService = subjectsService;
        this.prisma = prisma;
    }
    async list(req) {
        const user = await this.prisma.user.findUnique({ where: { id: req.user.sub } });
        if (!user?.grade || !user?.branch) {
            throw new common_1.NotFoundException('يرجى إكمال الملف الشخصي أولاً');
        }
        return this.subjectsService.listForStudent(user.grade, user.branch, user.id);
    }
    async listMy(req) {
        const user = await this.prisma.user.findUnique({ where: { id: req.user.sub } });
        if (!user) {
            throw new common_1.NotFoundException('المستخدم غير موجود');
        }
        return this.subjectsService.listPurchasedForStudent(user.id);
    }
    getVideos(id, req) {
        return this.subjectsService.getVideos(id, req.user.sub);
    }
};
exports.SubjectsController = SubjectsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_guard_1.StudentJwtGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubjectsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, common_1.UseGuards)(jwt_guard_1.StudentJwtGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubjectsController.prototype, "listMy", null);
__decorate([
    (0, common_1.Get)(':id/videos'),
    (0, common_1.UseGuards)(jwt_guard_1.StudentJwtGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubjectsController.prototype, "getVideos", null);
exports.SubjectsController = SubjectsController = __decorate([
    (0, common_1.Controller)('subjects'),
    __metadata("design:paramtypes", [subjects_service_1.SubjectsService,
        prisma_service_1.PrismaService])
], SubjectsController);
//# sourceMappingURL=subjects.controller.js.map