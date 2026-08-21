"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async onModuleInit() {
        try {
            const adminCount = await this.prisma.adminUser.count();
            if (adminCount === 0) {
                const defaultAdminPassword = await bcrypt.hash('admin123', 10);
                await this.prisma.adminUser.create({
                    data: {
                        email: 'admin@bina.ps',
                        passwordHash: defaultAdminPassword,
                        name: 'مدير النظام',
                    },
                });
                this.logger.log('Default admin user created: admin@bina.ps / admin123');
            }
            const planCount = await this.prisma.subscriptionPlan.count();
            if (planCount === 0) {
                const plans = [
                    { type: client_1.PlanType.TRIAL, nameAr: 'تجربة مجانية', durationDays: 365, priceIls: 0, videosPerSubject: 2 },
                    { type: client_1.PlanType.MONTHLY, nameAr: 'اشتراك شهري', durationDays: 30, priceIls: 49, videosPerSubject: 15 },
                    { type: client_1.PlanType.QUARTERLY, nameAr: 'اشتراك فصلي', durationDays: 90, discountPercent: 10, priceIls: 132, videosPerSubject: 20 },
                    { type: client_1.PlanType.YEARLY, nameAr: 'اشتراك سنوي', durationDays: 365, discountPercent: 10, priceIls: 529, videosPerSubject: 999 },
                ];
                for (const plan of plans) {
                    await this.prisma.subscriptionPlan.create({ data: plan });
                }
                this.logger.log('Default subscription plans seeded.');
            }
        }
        catch (err) {
            this.logger.warn(`Could not bootstrap initial seed data: ${err?.message}`);
        }
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
        if (existing) {
            throw new common_1.BadRequestException('رقم الهاتف مسجل بالفعل');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                phone: dto.phone,
                passwordHash,
                name: dto.name,
                grade: dto.grade,
                branch: dto.branch,
                parentPhone: dto.parentPhone,
            },
        });
        const trialPlan = await this.prisma.subscriptionPlan.findUnique({
            where: { type: client_1.PlanType.TRIAL },
        });
        if (trialPlan) {
            await this.prisma.subscription.create({
                data: {
                    userId: user.id,
                    planId: trialPlan.id,
                    endDate: new Date(Date.now() + trialPlan.durationDays * 24 * 60 * 60 * 1000),
                },
            });
        }
        const accessToken = this.signStudentToken(user.id, user.phone, user.role);
        const refreshToken = await this.createRefreshToken(user.id);
        return {
            accessToken,
            refreshToken,
            token: accessToken,
            user: this.sanitizeUser(user),
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
        if (!user || (user.role !== 'STUDENT' && user.role !== 'TEACHER')) {
            throw new common_1.UnauthorizedException('رقم الهاتف أو كلمة المرور غير صحيحة');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('هذا الحساب معطل. يرجى مراجعة الإدارة.');
        }
        if (!user.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
            throw new common_1.UnauthorizedException('رقم الهاتف أو كلمة المرور غير صحيحة');
        }
        const accessToken = this.signStudentToken(user.id, user.phone, user.role);
        const refreshToken = await this.createRefreshToken(user.id);
        let teacher = null;
        if (user.role === 'TEACHER') {
            const t = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
            if (t)
                teacher = { id: t.id, name: t.name, bio: t.bio, avatarUrl: t.avatarUrl };
        }
        return {
            accessToken,
            refreshToken,
            token: accessToken,
            user: this.sanitizeUser(user),
            teacher,
        };
    }
    async setupProfile(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { grade: dto.grade, branch: dto.branch },
        });
        const existingSub = await this.prisma.subscription.findFirst({
            where: { userId, isActive: true },
        });
        if (!existingSub) {
            const trialPlan = await this.prisma.subscriptionPlan.findUnique({
                where: { type: client_1.PlanType.TRIAL },
            });
            if (trialPlan) {
                await this.prisma.subscription.create({
                    data: {
                        userId,
                        planId: trialPlan.id,
                        endDate: new Date(Date.now() + trialPlan.durationDays * 24 * 60 * 60 * 1000),
                    },
                });
            }
        }
        return { user: this.sanitizeUser(user) };
    }
    async adminLogin(dto) {
        const admin = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
        if (!admin || !(await bcrypt.compare(dto.password, admin.passwordHash))) {
            throw new common_1.UnauthorizedException('بيانات الدخول غير صحيحة');
        }
        const token = this.jwt.sign({ sub: admin.id, email: admin.email, role: 'ADMIN' }, { secret: this.config.get('ADMIN_JWT_SECRET') || this.config.get('JWT_SECRET'), expiresIn: '1d' });
        return { token, admin: { id: admin.id, email: admin.email, name: admin.name } };
    }
    async adminChangePassword(adminId, dto) {
        const admin = await this.prisma.adminUser.findUnique({ where: { id: adminId } });
        if (!admin || !(await bcrypt.compare(dto.currentPassword, admin.passwordHash))) {
            throw new common_1.UnauthorizedException('كلمة المرور الحالية غير صحيحة');
        }
        if (dto.currentPassword === dto.newPassword) {
            throw new common_1.BadRequestException('كلمة المرور الجديدة يجب أن تختلف عن الحالية');
        }
        const passwordHash = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.adminUser.update({ where: { id: adminId }, data: { passwordHash } });
        return { message: 'تم تغيير كلمة المرور بنجاح' };
    }
    signStudentToken(userId, phone, role) {
        return this.jwt.sign({ sub: userId, phone, role }, { secret: this.config.get('JWT_SECRET'), expiresIn: ACCESS_TOKEN_TTL });
    }
    sanitizeUser(user) {
        return {
            id: user.id,
            phone: user.phone,
            name: user.name,
            grade: user.grade,
            branch: user.branch,
            parentPhone: user.parentPhone,
            role: user.role,
            createdAt: user.createdAt,
        };
    }
    async refresh(rawToken) {
        const tokenHash = this.hashToken(rawToken);
        const stored = await this.prisma.refreshToken.findFirst({
            where: { tokenHash, isRevoked: false },
        });
        if (!stored || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('رمز التحديث غير صالح أو منتهي الصلاحية');
        }
        const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('الحساب غير نشط');
        }
        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { isRevoked: true },
        });
        const accessToken = this.signStudentToken(user.id, user.phone, user.role);
        const refreshToken = await this.createRefreshToken(user.id);
        return { accessToken, refreshToken, token: accessToken };
    }
    async logout(rawToken) {
        const tokenHash = this.hashToken(rawToken);
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash, isRevoked: false },
            data: { isRevoked: true },
        });
        return { message: 'تم تسجيل الخروج بنجاح' };
    }
    async createRefreshToken(userId) {
        const raw = crypto.randomBytes(48).toString('hex');
        const tokenHash = this.hashToken(raw);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
            },
        });
        return raw;
    }
    hashToken(raw) {
        return crypto.createHash('sha256').update(raw).digest('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
//# sourceMappingURL=auth.service.js.map