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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const admin_service_1 = require("./admin.service");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
const admin_dto_1 = require("./dto/admin.dto");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    getDashboard() {
        return this.adminService.getDashboardStats();
    }
    listStudents(query) {
        return this.adminService.listStudents(query);
    }
    getStudent(id) {
        return this.adminService.getStudent(id);
    }
    updateStudent(id, dto) {
        return this.adminService.updateStudent(id, dto);
    }
    freezeSubscription(id, dto) {
        return this.adminService.freezeSubscription(id, dto);
    }
    grantSubscription(id, dto) {
        return this.adminService.grantSubscription(id, dto);
    }
    listVideos() {
        return this.adminService.listVideos();
    }
    createVideo(dto) {
        return this.adminService.createVideo(dto);
    }
    updateVideo(id, dto) {
        return this.adminService.updateVideo(id, dto);
    }
    deleteVideo(id) {
        return this.adminService.deleteVideo(id);
    }
    retryVideo(id) {
        return this.adminService.retryVideoUpload(id);
    }
    listSubjects() {
        return this.adminService.listSubjects();
    }
    createSubject(dto) {
        return this.adminService.createSubject(dto);
    }
    updateSubject(id, dto) {
        return this.adminService.updateSubject(id, dto);
    }
    listPlans() {
        return this.adminService.listPlans();
    }
    updatePlan(id, dto) {
        return this.adminService.updatePlan(id, dto);
    }
    listTeachers(query) {
        return this.adminService.listTeachers(query);
    }
    getTeachersDashboard() {
        return this.adminService.getTeachersDashboard();
    }
    createTeacher(dto) {
        return this.adminService.createTeacher(dto);
    }
    updateTeacherCredentials(id, dto) {
        return this.adminService.updateTeacherCredentials(id, dto);
    }
    uploadFile(file, req) {
        if (!file) {
            throw new common_1.BadRequestException('لم يتم تحديد أي ملف للرفع');
        }
        const protocol = req.get('x-forwarded-proto') ?? req.protocol ?? 'https';
        const host = req.get('host') ?? '';
        const url = `${protocol}://${host}/uploads/${file.filename}`;
        return { url };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('students'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.ListStudentsQuery]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listStudents", null);
__decorate([
    (0, common_1.Get)('students/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getStudent", null);
__decorate([
    (0, common_1.Put)('students/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateStudentDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateStudent", null);
__decorate([
    (0, common_1.Post)('students/:id/subscription/freeze'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.FreezeSubscriptionDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "freezeSubscription", null);
__decorate([
    (0, common_1.Post)('students/:id/subscription/grant'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.GrantSubscriptionDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "grantSubscription", null);
__decorate([
    (0, common_1.Get)('videos'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listVideos", null);
__decorate([
    (0, common_1.Post)('videos'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.CreateVideoDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createVideo", null);
__decorate([
    (0, common_1.Put)('videos/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateVideoDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateVideo", null);
__decorate([
    (0, common_1.Delete)('videos/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteVideo", null);
__decorate([
    (0, common_1.Post)('videos/:id/retry'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "retryVideo", null);
__decorate([
    (0, common_1.Get)('subjects'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listSubjects", null);
__decorate([
    (0, common_1.Post)('subjects'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.CreateSubjectDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createSubject", null);
__decorate([
    (0, common_1.Put)('subjects/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateSubjectDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateSubject", null);
__decorate([
    (0, common_1.Get)('plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listPlans", null);
__decorate([
    (0, common_1.Put)('plans/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdatePlanDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Get)('teachers'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listTeachers", null);
__decorate([
    (0, common_1.Get)('teachers/dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getTeachersDashboard", null);
__decorate([
    (0, common_1.Post)('teachers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.CreateTeacherDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createTeacher", null);
__decorate([
    (0, common_1.Patch)('teachers/:id/credentials'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.TeacherCredentialsDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateTeacherCredentials", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = (0, path_1.extname)(file.originalname);
                callback(null, `${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|pdf|zip|mp4|webm|mov|mkv|avi)$/i;
            const allowedMimetypes = [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'application/pdf',
                'application/zip',
                'application/x-zip-compressed',
                'video/mp4',
                'video/webm',
                'video/quicktime',
                'video/x-msvideo',
                'video/x-matroska',
            ];
            const ext = (0, path_1.extname)(file.originalname);
            const isExtensionAllowed = allowedExtensions.test(ext);
            const isMimetypeAllowed = allowedMimetypes.includes(file.mimetype);
            if (isExtensionAllowed && isMimetypeAllowed) {
                callback(null, true);
            }
            else {
                callback(new common_1.BadRequestException('نوع الملف غير مسموح به. الأنواع المدعومة هي: JPG, PNG, GIF, WEBP, PDF, ZIP, MP4, WEBM, MOV'), false);
            }
        },
        limits: {
            fileSize: 2 * 1024 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "uploadFile", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_guard_1.AdminJwtGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map