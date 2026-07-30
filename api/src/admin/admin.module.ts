import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { MuxModule } from '../mux/mux.module';

@Module({
  imports: [AuthModule, MuxModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
