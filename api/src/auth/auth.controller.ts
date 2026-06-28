import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto, SetupProfileDto, AdminLoginDto } from './dto/auth.dto';
import { StudentJwtGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('request-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('setup-profile')
  @UseGuards(StudentJwtGuard)
  setupProfile(@Req() req: { user: { sub: string } }, @Body() dto: SetupProfileDto) {
    return this.authService.setupProfile(req.user.sub, dto);
  }

  @Post('admin/login')
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto);
  }
}
