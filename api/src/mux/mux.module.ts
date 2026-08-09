import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MuxService } from './mux.service';
import { MuxController } from './mux.controller';
import { MuxJobsService } from './mux-jobs.service';

@Module({
  imports: [AuthModule],
  controllers: [MuxController],
  providers: [MuxService, MuxJobsService],
  exports: [MuxService, MuxJobsService],
})
export class MuxModule {}
