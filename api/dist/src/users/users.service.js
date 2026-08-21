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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscriptions: {
                    where: { isActive: true },
                    include: { plan: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                teacher: {
                    include: {
                        subjects: true,
                    },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('المستخدم غير موجود');
        const activeSub = user.subscriptions[0] ?? null;
        return {
            id: user.id,
            phone: user.phone,
            name: user.name,
            grade: user.grade,
            branch: user.branch,
            parentPhone: user.parentPhone,
            role: user.role,
            subscription: activeSub
                ? {
                    planType: activeSub.plan.type,
                    planName: activeSub.plan.nameAr,
                    endDate: activeSub.endDate,
                    isActive: activeSub.isActive && !activeSub.isFrozen,
                    videosPerSubject: activeSub.plan.videosPerSubject,
                }
                : null,
            teacher: user.teacher
                ? {
                    id: user.teacher.id,
                    bio: user.teacher.bio,
                    commissionRate: user.teacher.commissionRate,
                    subjects: user.teacher.subjects.map((s) => ({
                        id: s.id,
                        name: s.name,
                        grade: s.grade,
                        branch: s.branch,
                    })),
                }
                : null,
        };
    }
    async updateParentPhone(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { parentPhone: dto.parentPhone },
        });
        return { parentPhone: user.parentPhone };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map