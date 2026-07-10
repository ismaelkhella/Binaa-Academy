import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { StudentJwtGuard, AdminJwtGuard, TeacherJwtGuard, AppUserJwtGuard } from './guards/jwt.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, StudentJwtGuard, AdminJwtGuard, TeacherJwtGuard, AppUserJwtGuard],
  exports: [AuthService, StudentJwtGuard, AdminJwtGuard, TeacherJwtGuard, AppUserJwtGuard, JwtModule],
})
export class AuthModule {}
