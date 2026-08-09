import { Module } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { LessonsController, LessonController } from './lessons.controller';
import { AuthModule } from '../auth/auth.module';
import { MuxModule } from '../mux/mux.module';

@Module({
  imports: [AuthModule, MuxModule],
  controllers: [VideosController, LessonsController, LessonController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule {}
