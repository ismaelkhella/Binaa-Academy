import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { VideosService } from './videos.service';
import { StudentJwtGuard } from '../auth/guards/jwt.guard';

@Controller('videos')
export class VideosController {
  constructor(private videosService: VideosService) {}

  @Get(':id/stream')
  @UseGuards(StudentJwtGuard)
  getStream(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.videosService.getStreamUrl(id, req.user.sub);
  }

  @Post(':id/mark-viewed')
  @UseGuards(StudentJwtGuard)
  markViewed(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.videosService.markViewed(id, req.user.sub);
  }

  @Get(':id/download-token')
  @UseGuards(StudentJwtGuard)
  getDownloadToken(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.videosService.getDownloadToken(id, req.user.sub);
  }
}
