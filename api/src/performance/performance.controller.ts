import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { StudentJwtGuard } from '../auth/guards/jwt.guard';

@Controller('performance')
@UseGuards(StudentJwtGuard)
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get()
  getPerformance(@Req() req: { user: { sub: string } }) {
    return this.performanceService.getPerformanceData(req.user.sub);
  }
}
