import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { StudentJwtGuard } from '../auth/guards/jwt.guard';
import { UpdateParentPhoneDto } from '../auth/dto/auth.dto';

@Controller()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(StudentJwtGuard)
  getMe(@Req() req: { user: { sub: string } }) {
    return this.usersService.getMe(req.user.sub);
  }

  @Put('me/parent-phone')
  @UseGuards(StudentJwtGuard)
  updateParentPhone(@Req() req: { user: { sub: string } }, @Body() dto: UpdateParentPhoneDto) {
    return this.usersService.updateParentPhone(req.user.sub, dto);
  }
}
