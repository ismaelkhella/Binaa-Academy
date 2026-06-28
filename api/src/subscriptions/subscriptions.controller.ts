import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { StudentJwtGuard } from '../auth/guards/jwt.guard';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  listPlans() {
    return this.subscriptionsService.listPlans();
  }

  @Get('me')
  @UseGuards(StudentJwtGuard)
  getMySubscription(@Req() req: { user: { sub: string } }) {
    return this.subscriptionsService.getActiveSubscription(req.user.sub);
  }
}
