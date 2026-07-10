import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { StudentJwtGuard } from '../auth/guards/jwt.guard';

@Controller('dashboard')
@UseGuards(StudentJwtGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@Req() req: { user: { sub: string } }) {
    return this.dashboardService.getDashboardData(req.user.sub);
  }
}
