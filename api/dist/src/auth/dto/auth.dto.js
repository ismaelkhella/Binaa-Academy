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
exports.RefreshTokenDto = exports.UpdateParentPhoneDto = exports.AdminChangePasswordDto = exports.AdminLoginDto = exports.SetupProfileDto = exports.LoginDto = exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class RegisterDto {
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^05\d{8}$/, { message: 'رقم الهاتف يجب أن يكون فلسطينياً (05XXXXXXXX)' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 20, { message: 'كلمة المرور يجب أن تكون بين 6 إلى 20 حرفاً' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Grade),
    __metadata("design:type", String)
], RegisterDto.prototype, "grade", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Branch),
    __metadata("design:type", String)
], RegisterDto.prototype, "branch", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^05\d{8}$/, { message: 'رقم هاتف ولي الأمر يجب أن يكون فلسطينياً (05XXXXXXXX)' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "parentPhone", void 0);
class LoginDto {
}
exports.LoginDto = LoginDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^05\d{8}$/, { message: 'رقم الهاتف يجب أن يكون فلسطينياً (05XXXXXXXX)' }),
    __metadata("design:type", String)
], LoginDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class SetupProfileDto {
}
exports.SetupProfileDto = SetupProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SetupProfileDto.prototype, "grade", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SetupProfileDto.prototype, "branch", void 0);
class AdminLoginDto {
}
exports.AdminLoginDto = AdminLoginDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminLoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminLoginDto.prototype, "password", void 0);
class AdminChangePasswordDto {
}
exports.AdminChangePasswordDto = AdminChangePasswordDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 72, { message: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' }),
    __metadata("design:type", String)
], AdminChangePasswordDto.prototype, "newPassword", void 0);
class UpdateParentPhoneDto {
}
exports.UpdateParentPhoneDto = UpdateParentPhoneDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^05\d{8}$/),
    __metadata("design:type", String)
], UpdateParentPhoneDto.prototype, "parentPhone", void 0);
class RefreshTokenDto {
}
exports.RefreshTokenDto = RefreshTokenDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefreshTokenDto.prototype, "refreshToken", void 0);
//# sourceMappingURL=auth.dto.js.map