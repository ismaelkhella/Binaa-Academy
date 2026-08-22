import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { QuestionBankService } from './question-bank.service';
import { AnswerQuestionDto } from './dto/question-bank.dto';
import { StudentJwtGuard } from '../auth/guards/jwt.guard';

/** Student-facing question bank endpoints (subscription-gated). Distinct
 * from QuestionBankController, which is the admin-only CRUD surface under
 * /admin/qb guarded by AdminJwtGuard. */
@Controller('qb')
@UseGuards(StudentJwtGuard)
export class QbStudentController {
  constructor(private qbService: QuestionBankService) {}

  @Get('subjects')
  getSubjects(@Req() req: { user: { sub: string } }) {
    return this.qbService.getStudentSubjects(req.user.sub);
  }

  @Get('subjects/:id/units')
  getUnits(@Param('id') subjectId: string, @Req() req: { user: { sub: string } }) {
    return this.qbService.getStudentUnits(subjectId, req.user.sub);
  }

  @Get('units/:id/questions')
  getQuestions(@Param('id') unitId: string, @Req() req: { user: { sub: string } }) {
    return this.qbService.getStudentQuestions(unitId, req.user.sub);
  }

  @Post('questions/:id/answer')
  answerQuestion(
    @Param('id') questionId: string,
    @Body() dto: AnswerQuestionDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.qbService.answerQuestion(questionId, dto.choiceId, req.user.sub);
  }
}
