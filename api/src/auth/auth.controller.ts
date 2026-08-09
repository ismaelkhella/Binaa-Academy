import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, SetupProfileDto, AdminLoginDto, AdminChangePasswordDto } from './dto/auth.dto';
import { StudentJwtGuard, AdminJwtGuard } from './guards/jwt.guard';
import { RegisterDto, LoginDto, SetupProfileDto, AdminLoginDto, RefreshTokenDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 5 attempts per minute per IP — prevents registration spam
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // 10 attempts per minute per IP — prevents brute-force login
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('setup-profile')
  @UseGuards(StudentJwtGuard)
  setupProfile(@Req() req: { user: { sub: string } }, @Body() dto: SetupProfileDto) {
    return this.authService.setupProfile(req.user.sub, dto);
  }

  // 5 attempts per minute per IP — admin login is high-value target
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('admin/login')
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto);
  }

  // Admin changes their own password — requires the current password.
  // AdminJwtGuard attaches the payload to req.admin (not req.user).
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('admin/change-password')
  @UseGuards(AdminJwtGuard)
  adminChangePassword(
    @Req() req: { admin: { sub: string } },
    @Body() dto: AdminChangePasswordDto,
  ) {
    return this.authService.adminChangePassword(req.admin.sub, dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }
}
