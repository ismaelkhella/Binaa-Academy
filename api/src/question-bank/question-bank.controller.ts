import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../auth/guards/jwt.guard';
import { QuestionBankService } from './question-bank.service';
import { CreateStageDto, CreateQbSubjectDto, CreateUnitDto, CreateQuestionDto } from './dto/question-bank.dto';

@Controller('admin/qb')
@UseGuards(AdminJwtGuard)
export class QuestionBankController {
  constructor(private qbService: QuestionBankService) {}

  // ─── IMPORT FROM SUBJECTS (CONTENT/LESSONS) ────────────────────────────────
  /** استيراد المراحل الدراسية والمواد تلقائياً من جدول المحتوى/الدروس */
  @Post('import-from-subjects')
  importFromSubjects() {
    return this.qbService.importFromSubjects();
  }

  // ─── STAGES ────────────────────────────────────────────────────────────────
  @Get('stages')
  listStages() {
    return this.qbService.listStages();
  }

  @Post('stages')
  createStage(@Body() dto: CreateStageDto) {
    return this.qbService.createStage(dto);
  }

  @Put('stages/:id')
  updateStage(@Param('id') id: string, @Body() dto: CreateStageDto) {
    return this.qbService.updateStage(id, dto);
  }

  @Delete('stages/:id')
  deleteStage(@Param('id') id: string) {
    return this.qbService.deleteStage(id);
  }

  // ─── SUBJECTS ──────────────────────────────────────────────────────────────
  @Get('stages/:stageId/subjects')
  listStageSubjects(@Param('stageId') stageId: string) {
    return this.qbService.listStageSubjects(stageId);
  }

  @Post('stages/:stageId/subjects')
  createQbSubject(@Param('stageId') stageId: string, @Body() dto: CreateQbSubjectDto) {
    return this.qbService.createQbSubject(stageId, dto);
  }

  @Put('subjects/:id')
  updateQbSubject(@Param('id') id: string, @Body() dto: CreateQbSubjectDto) {
    return this.qbService.updateQbSubject(id, dto);
  }

  @Delete('subjects/:id')
  deleteQbSubject(@Param('id') id: string) {
    return this.qbService.deleteQbSubject(id);
  }

  // ─── UNITS ─────────────────────────────────────────────────────────────────
  @Get('subjects/:subjectId/units')
  listSubjectUnits(@Param('subjectId') subjectId: string) {
    return this.qbService.listSubjectUnits(subjectId);
  }

  @Post('subjects/:subjectId/units')
  createUnit(@Param('subjectId') subjectId: string, @Body() dto: CreateUnitDto) {
    return this.qbService.createUnit(subjectId, dto);
  }

  @Put('units/:id')
  updateUnit(@Param('id') id: string, @Body() dto: CreateUnitDto) {
    return this.qbService.updateUnit(id, dto);
  }

  @Delete('units/:id')
  deleteUnit(@Param('id') id: string) {
    return this.qbService.deleteUnit(id);
  }

  // ─── QUESTIONS ─────────────────────────────────────────────────────────────
  @Get('units/:unitId/questions')
  listUnitQuestions(@Param('unitId') unitId: string) {
    return this.qbService.listUnitQuestions(unitId);
  }

  @Post('units/:unitId/questions')
  createQuestion(@Param('unitId') unitId: string, @Body() dto: CreateQuestionDto) {
    return this.qbService.createQuestion(unitId, dto);
  }

  @Put('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() dto: CreateQuestionDto) {
    return this.qbService.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  deleteQuestion(@Param('id') id: string) {
    return this.qbService.deleteQuestion(id);
  }
}
