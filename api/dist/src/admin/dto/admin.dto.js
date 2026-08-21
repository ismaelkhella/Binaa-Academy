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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherCredentialsDto = exports.CreateTeacherDto = exports.CreateSubjectDto = exports.UpdateSubjectDto = exports.UpdatePlanDto = exports.UpdateVideoDto = exports.CreateVideoDto = exports.GrantSubscriptionDto = exports.FreezeSubscriptionDto = exports.UpdateStudentDto = exports.ListStudentsQuery = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class ListStudentsQuery {
}
exports.ListStudentsQuery = ListStudentsQuery;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Grade),
    __metadata("design:type", String)
], ListStudentsQuery.prototype, "grade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Branch),
    __metadata("design:type", String)
], ListStudentsQuery.prototype, "branch", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListStudentsQuery.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListStudentsQuery.prototype, "subscriptionStatus", void 0);
class UpdateStudentDto {
}
exports.UpdateStudentDto = UpdateStudentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Grade),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "grade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Branch),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "branch", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "parentPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateStudentDto.prototype, "isActive", void 0);
class FreezeSubscriptionDto {
}
exports.FreezeSubscriptionDto = FreezeSubscriptionDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FreezeSubscriptionDto.prototype, "freeze", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FreezeSubscriptionDto.prototype, "reason", void 0);
class GrantSubscriptionDto {
}
exports.GrantSubscriptionDto = GrantSubscriptionDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.PlanType),
    __metadata("design:type", String)
], GrantSubscriptionDto.prototype, "planType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GrantSubscriptionDto.prototype, "durationDays", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], GrantSubscriptionDto.prototype, "subjectIds", void 0);
class CreateVideoDto {
}
exports.CreateVideoDto = CreateVideoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVideoDto.prototype, "subjectId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVideoDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVideoDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => !o.muxUploadId),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^https?:\/\/.+/, {
        message: 'رابط الفيديو مطلوب — ارفع ملف الفيديو حتى يكتمل الرفع أو أدخل رابط بث صالحاً يبدأ بـ http',
    }),
    __metadata("design:type", String)
], CreateVideoDto.prototype, "streamUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVideoDto.prototype, "muxUploadId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateVideoDto.prototype, "durationSec", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateVideoDto.prototype, "unitNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateVideoDto.prototype, "orderInUnit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.VideoStatus),
    __metadata("design:type", String)
], CreateVideoDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVideoDto.prototype, "teacherId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVideoDto.prototype, "pdfUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateVideoDto.prototype, "questions", void 0);
class UpdateVideoDto {
}
exports.UpdateVideoDto = UpdateVideoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVideoDto.prototype, "subjectId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVideoDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVideoDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.streamUrl !== undefined),
    (0, class_validator_1.Matches)(/^https?:\/\/.+/, {
        message: 'رابط الفيديو غير صالح — يجب أن يبدأ بـ http أو https',
    }),
    __metadata("design:type", String)
], UpdateVideoDto.prototype, "streamUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVideoDto.prototype, "muxUploadId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateVideoDto.prototype, "durationSec", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateVideoDto.prototype, "unitNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateVideoDto.prototype, "orderInUnit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.VideoStatus),
    __metadata("design:type", String)
], UpdateVideoDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVideoDto.prototype, "teacherId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVideoDto.prototype, "pdfUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateVideoDto.prototype, "questions", void 0);
class UpdatePlanDto {
}
exports.UpdatePlanDto = UpdatePlanDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdatePlanDto.prototype, "priceIls", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdatePlanDto.prototype, "videosPerSubject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdatePlanDto.prototype, "discountPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePlanDto.prototype, "isActive", void 0);
class UpdateSubjectDto {
}
exports.UpdateSubjectDto = UpdateSubjectDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateSubjectDto.prototype, "priceIls", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSubjectDto.prototype, "teacherId", void 0);
class CreateSubjectDto {
}
exports.CreateSubjectDto = CreateSubjectDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "grade", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "branch", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSubjectDto.prototype, "priceIls", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "teacherId", void 0);
class CreateTeacherDto {
}
exports.CreateTeacherDto = CreateTeacherDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeacherDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeacherDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeacherDto.prototype, "bio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeacherDto.prototype, "avatarUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTeacherDto.prototype, "commissionRate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeacherDto.prototype, "subjectId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateTeacherDto.prototype, "password", void 0);
class TeacherCredentialsDto {
}
exports.TeacherCredentialsDto = TeacherCredentialsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^05\d{8}$/, { message: 'رقم الهاتف يجب أن يكون بصيغة 05XXXXXXXX' }),
    __metadata("design:type", String)
], TeacherCredentialsDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], TeacherCredentialsDto.prototype, "password", void 0);
//# sourceMappingURL=admin.dto.js.map