import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { StudentJwtGuard } from '../auth/guards/jwt.guard';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

class CreateGoalDto {
  @IsString()
  @IsNotEmpty({ message: 'عنوان الهدف مطلوب' })
  title: string;
}

class UpdateGoalDto {
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsString()
  @IsOptional()
  title?: string;
}

@Controller('goals')
@UseGuards(StudentJwtGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  list(@Req() req: { user: { sub: string } }) {
    return this.goalsService.listGoals(req.user.sub);
  }

  @Post()
  create(@Req() req: { user: { sub: string } }, @Body() dto: CreateGoalDto) {
    return this.goalsService.createGoal(req.user.sub, dto.title);
  }

  @Patch(':id')
  update(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.updateGoal(req.user.sub, id, dto.completed, dto.title);
  }

  @Delete(':id')
  delete(@Req() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.goalsService.deleteGoal(req.user.sub, id);
  }
}
