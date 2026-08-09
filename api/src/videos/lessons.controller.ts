import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { VideosService } from './videos.service';
import { StudentJwtGuard } from '../auth/guards/jwt.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('lessons')
export class LessonsController {
  constructor(private videosService: VideosService) {}

  @Get()
  @UseGuards(StudentJwtGuard)
  listLessons(@Req() req: { user: { sub: string } }) {
    return this.videosService.getLessonsList(req.user.sub);
  }
}

@Controller('lesson')
export class LessonController {
  constructor(private videosService: VideosService) {}

  @Get(':id')
  @UseGuards(StudentJwtGuard)
  getLesson(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.videosService.getLessonDetailsSecure(id, req.user.sub);
  }

  @Post(':id/download')
  @UseGuards(StudentJwtGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  downloadLesson(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.videosService.generateSecureDownloadUrl(id, req.user.sub);
  }
}
