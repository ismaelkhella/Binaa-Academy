import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MuxService } from './mux.service';
import { MuxController } from './mux.controller';

@Module({
  imports: [AuthModule],
  controllers: [MuxController],
  providers: [MuxService],
  exports: [MuxService],
})
export class MuxModule {}
