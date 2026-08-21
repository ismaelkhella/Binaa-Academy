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
exports.GoalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GoalsService = class GoalsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listGoals(userId) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        const allGoals = await this.prisma.dailyGoal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        const today = allGoals.filter((g) => g.dueDate >= startOfToday && g.dueDate <= endOfToday);
        const archived = allGoals.filter((g) => g.dueDate < startOfToday);
        return {
            today: today.map((g) => ({
                id: g.id,
                title: g.title,
                completed: g.completed,
                dueDate: g.dueDate,
            })),
            archived: archived.map((g) => ({
                id: g.id,
                title: g.title,
                completed: g.completed,
                dueDate: g.dueDate,
            })),
        };
    }
    async createGoal(userId, title) {
        return this.prisma.dailyGoal.create({
            data: {
                userId,
                title,
                completed: false,
                dueDate: new Date(),
            },
        });
    }
    async updateGoal(userId, goalId, completed, title) {
        const goal = await this.prisma.dailyGoal.findUnique({
            where: { id: goalId },
        });
        if (!goal) {
            throw new common_1.NotFoundException('الهدف غير موجود');
        }
        if (goal.userId !== userId) {
            throw new common_1.ForbiddenException('غير مصرح لك بتعديل هذا الهدف');
        }
        return this.prisma.dailyGoal.update({
            where: { id: goalId },
            data: {
                ...(completed !== undefined && { completed }),
                ...(title !== undefined && { title }),
            },
        });
    }
    async deleteGoal(userId, goalId) {
        const goal = await this.prisma.dailyGoal.findUnique({
            where: { id: goalId },
        });
        if (!goal) {
            throw new common_1.NotFoundException('الهدف غير موجود');
        }
        if (goal.userId !== userId) {
            throw new common_1.ForbiddenException('غير مصرح لك بحذف هذا الهدف');
        }
        await this.prisma.dailyGoal.delete({
            where: { id: goalId },
        });
        return { success: true };
    }
};
exports.GoalsService = GoalsService;
exports.GoalsService = GoalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GoalsService);
//# sourceMappingURL=goals.service.js.map