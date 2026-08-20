import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStageDto, CreateQbSubjectDto, CreateUnitDto, CreateQuestionDto } from './dto/question-bank.dto';
import { Grade, Branch } from '@prisma/client';

@Injectable()
export class QuestionBankService {
  constructor(private prisma: PrismaService) {}

  // ─── IMPORT FROM SUBJECTS (CONTENT/LESSONS) ────────────────────────────────
  /**
   * Reads all subjects from the content/lessons table and automatically
   * creates matching Stages + QB Subjects in the question bank.
   * Safe to call multiple times — skips existing records (upsert-style).
   */
  async importFromSubjects() {
    const GRADE_LABEL: Record<string, string> = {
      GRADE_11: 'الصف الحادي عشر',
      GRADE_12: 'الصف الثاني عشر',
    };
    const BRANCH_LABEL: Record<string, string> = {
      SCIENTIFIC: 'العلمي',
      LITERARY: 'الأدبي',
    };

    // Fetch all subjects that have a grade & branch defined
    const contentSubjects = await this.prisma.subject.findMany({
      where: { grade: { not: undefined } },
      select: { id: true, name: true, grade: true, branch: true, stageId: true },
      orderBy: [{ grade: 'asc' }, { branch: 'asc' }, { name: 'asc' }],
    });

    const createdStages: string[] = [];
    const linkedSubjects: string[] = [];
    const skippedSubjects: string[] = [];

    // Group subjects by grade+branch → one Stage per combination
    const stageMap = new Map<string, string>(); // stageName → stageId

    for (const sub of contentSubjects) {
      const gradeLabel = GRADE_LABEL[sub.grade] ?? sub.grade;
      const branchLabel = BRANCH_LABEL[sub.branch] ?? sub.branch;
      const stageName = `${gradeLabel} - ${branchLabel}`;

      // Upsert Stage
      if (!stageMap.has(stageName)) {
        let stage = await this.prisma.stage.findUnique({ where: { name: stageName } });
        if (!stage) {
          stage = await this.prisma.stage.create({ data: { name: stageName } });
          createdStages.push(stageName);
        }
        stageMap.set(stageName, stage.id);
      }

      const stageId = stageMap.get(stageName)!;

      // Link the existing subject to the stage (if not already linked)
      if (sub.stageId === stageId) {
        skippedSubjects.push(sub.name);
      } else {
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

  // ─── STAGES ────────────────────────────────────────────────────────────────
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

  async createStage(dto: CreateStageDto) {
    const exists = await this.prisma.stage.findUnique({ where: { name: dto.name } });
    if (exists) throw new BadRequestException('اسم المرحلة الدراسية موجود بالفعل');
    return this.prisma.stage.create({ data: { name: dto.name } });
  }

  async updateStage(id: string, dto: CreateStageDto) {
    const stage = await this.prisma.stage.findUnique({ where: { id } });
    if (!stage) throw new NotFoundException('المرحلة الدراسية غير موجودة');

    const exists = await this.prisma.stage.findFirst({
      where: { name: dto.name, id: { not: id } },
    });
    if (exists) throw new BadRequestException('اسم المرحلة الدراسية مستخدم في مرحلة أخرى');

    return this.prisma.stage.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async deleteStage(id: string) {
    const stage = await this.prisma.stage.findUnique({ where: { id } });
    if (!stage) throw new NotFoundException('المرحلة الدراسية غير موجودة');
    return this.prisma.stage.delete({ where: { id } });
  }

  // ─── SUBJECTS ──────────────────────────────────────────────────────────────
  async listStageSubjects(stageId: string) {
    const stage = await this.prisma.stage.findUnique({ where: { id: stageId } });
    if (!stage) throw new NotFoundException('المرحلة الدراسية غير موجودة');

    return this.prisma.subject.findMany({
      where: { stageId },
      include: {
        _count: { select: { units: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createQbSubject(stageId: string, dto: CreateQbSubjectDto) {
    const stage = await this.prisma.stage.findUnique({ where: { id: stageId } });
    if (!stage) throw new NotFoundException('المرحلة الدراسية غير موجودة');

    // Create subject linked to stageId
    return this.prisma.subject.create({
      data: {
        name: dto.name,
        grade: dto.grade as Grade,
        branch: dto.branch as Branch,
        stageId,
        priceIls: 0,
      },
    });
  }

  async updateQbSubject(id: string, dto: CreateQbSubjectDto) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('المادة غير موجودة');

    return this.prisma.subject.update({
      where: { id },
      data: {
        name: dto.name,
        grade: dto.grade as Grade,
        branch: dto.branch as Branch,
      },
    });
  }

  async deleteQbSubject(id: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('المادة غير موجودة');

    return this.prisma.subject.delete({ where: { id } });
  }

  // ─── UNITS ─────────────────────────────────────────────────────────────────
  async listSubjectUnits(subjectId: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException('المادة غير موجودة');

    return this.prisma.unit.findMany({
      where: { subjectId },
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: { order: 'asc' },
    });
  }

  async createUnit(subjectId: string, dto: CreateUnitDto) {
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException('المادة غير موجودة');

    return this.prisma.unit.create({
      data: {
        subjectId,
        name: dto.name,
        order: dto.order ?? 1,
      },
    });
  }

  async updateUnit(id: string, dto: CreateUnitDto) {
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('الوحدة غير موجودة');

    return this.prisma.unit.update({
      where: { id },
      data: {
        name: dto.name,
        order: dto.order !== undefined ? dto.order : undefined,
      },
    });
  }

  async deleteUnit(id: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('الوحدة غير موجودة');

    return this.prisma.unit.delete({ where: { id } });
  }

  // ─── QUESTIONS & CHOICES ───────────────────────────────────────────────────
  async listUnitQuestions(unitId: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundException('الوحدة غير موجودة');

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

  async createQuestion(unitId: string, dto: CreateQuestionDto) {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundException('الوحدة غير موجودة');

    // Validation: Exactly one correct choice (or at least one)
    const hasCorrect = dto.choices.some((c) => c.isCorrect);
    if (!hasCorrect) {
      throw new BadRequestException('يجب اختيار إجابة صحيحة واحدة على الأقل');
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

  async updateQuestion(id: string, dto: CreateQuestionDto) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('السؤال غير موجود');

    // Validation: Exactly one correct choice (or at least one)
    const hasCorrect = dto.choices.some((c) => c.isCorrect);
    if (!hasCorrect) {
      throw new BadRequestException('يجب اختيار إجابة صحيحة واحدة على الأقل');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update question text/image/order
      await tx.question.update({
        where: { id },
        data: {
          text: dto.text,
          imageUrl: dto.imageUrl || null,
          order: dto.order !== undefined ? dto.order : undefined,
        },
      });

      // Delete existing choices
      await tx.choice.deleteMany({ where: { questionId: id } });

      // Recreate new choices
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

  async deleteQuestion(id: string) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('السؤال غير موجود');

    return this.prisma.question.delete({ where: { id } });
  }
}
