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
exports.UserJwtGuard = exports.AppUserJwtGuard = exports.TeacherJwtGuard = exports.AdminJwtGuard = exports.StudentJwtGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let StudentJwtGuard = class StudentJwtGuard {
    constructor(jwt, config) {
        this.jwt = jwt;
        this.config = config;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);
        if (!token)
            throw new common_1.UnauthorizedException();
        try {
            const payload = this.jwt.verify(token, { secret: this.config.get('JWT_SECRET') });
            if (payload.role !== 'STUDENT')
                throw new common_1.UnauthorizedException();
            request.user = payload;
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('جلسة غير صالحة');
        }
    }
    extractToken(request) {
        const auth = request.headers.authorization;
        if (!auth?.startsWith('Bearer '))
            return null;
        return auth.slice(7);
    }
};
exports.StudentJwtGuard = StudentJwtGuard;
exports.StudentJwtGuard = StudentJwtGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService, config_1.ConfigService])
], StudentJwtGuard);
let AdminJwtGuard = class AdminJwtGuard {
    constructor(jwt, config) {
        this.jwt = jwt;
        this.config = config;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);
        if (!token)
            throw new common_1.UnauthorizedException();
        try {
            const secret = this.config.get('ADMIN_JWT_SECRET');
            if (!secret)
                throw new common_1.UnauthorizedException('ADMIN_JWT_SECRET not configured');
            const payload = this.jwt.verify(token, { secret });
            if (payload.role !== 'ADMIN')
                throw new common_1.UnauthorizedException();
            request.admin = payload;
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('جلسة غير صالحة');
        }
    }
    extractToken(request) {
        const auth = request.headers.authorization;
        if (!auth?.startsWith('Bearer '))
            return null;
        return auth.slice(7);
    }
};
exports.AdminJwtGuard = AdminJwtGuard;
exports.AdminJwtGuard = AdminJwtGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService, config_1.ConfigService])
], AdminJwtGuard);
let TeacherJwtGuard = class TeacherJwtGuard {
    constructor(jwt, config) {
        this.jwt = jwt;
        this.config = config;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);
        if (!token)
            throw new common_1.UnauthorizedException();
        try {
            const payload = this.jwt.verify(token, { secret: this.config.get('JWT_SECRET') });
            if (payload.role !== 'TEACHER')
                throw new common_1.UnauthorizedException();
            request.user = payload;
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('جلسة غير صالحة');
        }
    }
    extractToken(request) {
        const auth = request.headers.authorization;
        if (!auth?.startsWith('Bearer '))
            return null;
        return auth.slice(7);
    }
};
exports.TeacherJwtGuard = TeacherJwtGuard;
exports.TeacherJwtGuard = TeacherJwtGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService, config_1.ConfigService])
], TeacherJwtGuard);
let AppUserJwtGuard = class AppUserJwtGuard {
    constructor(jwt, config) {
        this.jwt = jwt;
        this.config = config;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);
        if (!token)
            throw new common_1.UnauthorizedException();
        try {
            const payload = this.jwt.verify(token, { secret: this.config.get('JWT_SECRET') });
            if (payload.role !== 'STUDENT' && payload.role !== 'TEACHER') {
                throw new common_1.UnauthorizedException();
            }
            request.user = payload;
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('جلسة غير صالحة');
        }
    }
    extractToken(request) {
        const auth = request.headers.authorization;
        if (!auth?.startsWith('Bearer '))
            return null;
        return auth.slice(7);
    }
};
exports.AppUserJwtGuard = AppUserJwtGuard;
exports.AppUserJwtGuard = AppUserJwtGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService, config_1.ConfigService])
], AppUserJwtGuard);
let UserJwtGuard = class UserJwtGuard {
    constructor(jwt, config) {
        this.jwt = jwt;
        this.config = config;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const auth = request.headers.authorization;
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
        if (!token)
            throw new common_1.UnauthorizedException();
        try {
            const payload = this.jwt.verify(token, { secret: this.config.get('JWT_SECRET') });
            if (payload.role !== 'STUDENT' && payload.role !== 'TEACHER')
                throw new common_1.UnauthorizedException();
            request.user = payload;
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('جلسة غير صالحة');
        }
    }
};
exports.UserJwtGuard = UserJwtGuard;
exports.UserJwtGuard = UserJwtGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService, config_1.ConfigService])
], UserJwtGuard);
//# sourceMappingURL=jwt.guard.js.map