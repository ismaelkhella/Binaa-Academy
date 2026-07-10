import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, SetupProfileDto, AdminLoginDto } from './dto/auth.dto';
import { StudentJwtGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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
