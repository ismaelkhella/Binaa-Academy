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
exports.QuestionBankService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let QuestionBankService = class QuestionBankService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async importFromSubjects() {
        const GRADE_LABEL = {
            GRADE_11: 'الصف الحادي عشر',
            GRADE_12: 'الصف الثاني عشر',
        };
        const BRANCH_LABEL = {
            SCIENTIFIC: 'العلمي',
            LITERARY: 'الأدبي',
        };
        const contentSubjects = await this.prisma.subject.findMany({
            where: { grade: { not: undefined } },
            select: { id: true, name: true, grade: true, branch: true, stageId: true },
            orderBy: [{ grade: 'asc' }, { branch: 'asc' }, { name: 'asc' }],
        });
        const createdStages = [];
        const linkedSubjects = [];
        const skippedSubjects = [];
        const stageMap = new Map();
        for (const sub of contentSubjects) {
            const gradeLabel = GRADE_LABEL[sub.grade] ?? sub.grade;
            const branchLabel = BRANCH_LABEL[sub.branch] ?? sub.branch;
            const stageName = `${gradeLabel} - ${branchLabel}`;
            if (!stageMap.has(stageName)) {
                let stage = await this.prisma.stage.findUnique({ where: { name: stageName } });
                if (!stage) {
                    stage = await this.prisma.stage.create({ data: { name: stageName } });
                    createdStages.push(stageName);
                }
                stageMap.set(stageName, stage.id);
            }
            const stageId = stageMap.get(stageName);
            if (sub.stageId === stageId) {
                skippedSubjects.push(sub.name);
            }
            else {
                await this.prisma.subject.update({
                    where: { id: sub.id },
                    data: { stageId },
                });
                linkedSubjects.push(sub.name);
            }
        }
        return {
            message: 'تم الاستيراد بنجاح',
            createdStages,
            linkedSubjects,
            skippedSubjects,
            summary: {
                stages: stageMap.size,
                linked: linkedSubjects.length,
                skipped: skippedSubjects.length,
            },
        };
    }
    async listStages() {
        return this.prisma.stage.findMany({
            include: {
                _count: {
                    select: { subjects: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    async createStage(dto) {
        const exists = await this.prisma.stage.findUnique({ where: { name: dto.name } });
        if (exists)
            throw new common_1.BadRequestException('اسم المرحلة الدراسية موجود بالفعل');
        return this.prisma.stage.create({ data: { name: dto.name } });
    }
    async updateStage(id, dto) {
        const stage = await this.prisma.stage.findUnique({ where: { id } });
        if (!stage)
            throw new common_1.NotFoundException('المرحلة الدراسية غير موجودة');
        const exists = await this.prisma.stage.findFirst({
            where: { name: dto.name, id: { not: id } },
        });
        if (exists)
            throw new common_1.BadRequestException('اسم المرحلة الدراسية مستخدم في مرحلة أخرى');
        return this.prisma.stage.update({
            where: { id },
            data: { name: dto.name },
        });
    }
    async deleteStage(id) {
        const stage = await this.prisma.stage.findUnique({ where: { id } });
        if (!stage)
            throw new common_1.NotFoundException('المرحلة الدراسية غير موجودة');
        return this.prisma.stage.delete({ where: { id } });
    }
    async listStageSubjects(stageId) {
        const stage = await this.prisma.stage.findUnique({ where: { id: stageId } });
        if (!stage)
            throw new common_1.NotFoundException('المرحلة الدراسية غير موجودة');
        return this.prisma.subject.findMany({
            where: { stageId },
            include: {
                _count: { select: { units: true } },
            },
            orderBy: { name: 'asc' },
        });
    }
    async createQbSubject(stageId, dto) {
        const stage = await this.prisma.stage.findUnique({ where: { id: stageId } });
        if (!stage)
            throw new common_1.NotFoundException('المرحلة الدراسية غير موجودة');
        return this.prisma.subject.create({
            data: {
                name: dto.name,
                grade: dto.grade,
                branch: dto.branch,
                stageId,
                priceIls: 0,
            },
        });
    }
    async updateQbSubject(id, dto) {
        const subject = await this.prisma.subject.findUnique({ where: { id } });
        if (!subject)
            throw new common_1.NotFoundException('المادة غير موجودة');
        return this.prisma.subject.update({
            where: { id },
            data: {
                name: dto.name,
                grade: dto.grade,
                branch: dto.branch,
            },
        });
    }
    async deleteQbSubject(id) {
        const subject = await this.prisma.subject.findUnique({ where: { id } });
        if (!subject)
            throw new common_1.NotFoundException('المادة غير موجودة');
        return this.prisma.subject.delete({ where: { id } });
    }
    async listSubjectUnits(subjectId) {
        const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject)
            throw new common_1.NotFoundException('المادة غير موجودة');
        return this.prisma.unit.findMany({
            where: { subjectId },
            include: {
                _count: { select: { questions: true } },
            },
            orderBy: { order: 'asc' },
        });
    }
    async createUnit(subjectId, dto) {
        const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject)
            throw new common_1.NotFoundException('المادة غير موجودة');
        return this.prisma.unit.create({
            data: {
                subjectId,
                name: dto.name,
                order: dto.order ?? 1,
            },
        });
    }
    async updateUnit(id, dto) {
        const unit = await this.prisma.unit.findUnique({ where: { id } });
        if (!unit)
            throw new common_1.NotFoundException('الوحدة غير موجودة');
        return this.prisma.unit.update({
            where: { id },
            data: {
                name: dto.name,
                order: dto.order !== undefined ? dto.order : undefined,
            },
        });
    }
    async deleteUnit(id) {
        const unit = await this.prisma.unit.findUnique({ where: { id } });
        if (!unit)
            throw new common_1.NotFoundException('الوحدة غير موجودة');
        return this.prisma.unit.delete({ where: { id } });
    }
    async listUnitQuestions(unitId) {
        const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
        if (!unit)
            throw new common_1.NotFoundException('الوحدة غير موجودة');
        return this.prisma.question.findMany({
            where: { unitId },
            include: {
                choices: {
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { order: 'asc' },
        });
    }
    async createQuestion(unitId, dto) {
        const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
        if (!unit)
            throw new common_1.NotFoundException('الوحدة غير موجودة');
        const hasCorrect = dto.choices.some((c) => c.isCorrect);
        if (!hasCorrect) {
            throw new common_1.BadRequestException('يجب اختيار إجابة صحيحة واحدة على الأقل');
        }
        return this.prisma.$transaction(async (tx) => {
            const question = await tx.question.create({
                data: {
                    unitId,
                    text: dto.text,
                    imageUrl: dto.imageUrl || null,
                    order: dto.order ?? 1,
                },
            });
            await tx.choice.createMany({
                data: dto.choices.map((c) => ({
                    questionId: question.id,
                    text: c.text,
                    isCorrect: c.isCorrect,
                })),
            });
            return tx.question.findUnique({
                where: { id: question.id },
                include: { choices: true },
            });
        });
    }
    async updateQuestion(id, dto) {
        const question = await this.prisma.question.findUnique({ where: { id } });
        if (!question)
            throw new common_1.NotFoundException('السؤال غير موجود');
        const hasCorrect = dto.choices.some((c) => c.isCorrect);
        if (!hasCorrect) {
            throw new common_1.BadRequestException('يجب اختيار إجابة صحيحة واحدة على الأقل');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.question.update({
                where: { id },
                data: {
                    text: dto.text,
                    imageUrl: dto.imageUrl || null,
                    order: dto.order !== undefined ? dto.order : undefined,
                },
            });
            await tx.choice.deleteMany({ where: { questionId: id } });
            await tx.choice.createMany({
                data: dto.choices.map((c) => ({
                    questionId: id,
                    text: c.text,
                    isCorrect: c.isCorrect,
                })),
            });
            return tx.question.findUnique({
                where: { id },
                include: { choices: true },
            });
        });
    }
    async deleteQuestion(id) {
        const question = await this.prisma.question.findUnique({ where: { id } });
        if (!question)
            throw new common_1.NotFoundException('السؤال غير موجود');
        return this.prisma.question.delete({ where: { id } });
    }
};
exports.QuestionBankService = QuestionBankService;
exports.QuestionBankService = QuestionBankService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuestionBankService);
//# sourceMappingURL=question-bank.service.js.map