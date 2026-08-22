import { Module } from '@nestjs/common';
import { QuestionBankController } from './question-bank.controller';
import { QbStudentController } from './qb-student.controller';
import { QuestionBankService } from './question-bank.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [QuestionBankController, QbStudentController],
  providers: [QuestionBankService],
})
export class QuestionBankModule {}
