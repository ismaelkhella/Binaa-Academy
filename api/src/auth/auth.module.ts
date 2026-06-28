import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { StudentJwtGuard, AdminJwtGuard } from './guards/jwt.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, StudentJwtGuard, AdminJwtGuard],
  exports: [AuthService, StudentJwtGuard, AdminJwtGuard, JwtModule],
})
export class AuthModule {}
