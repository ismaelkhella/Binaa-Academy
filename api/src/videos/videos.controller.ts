import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { VideosService } from './videos.service';
import { StudentJwtGuard } from '../auth/guards/jwt.guard';
import { UpdatePositionDto } from './dto/update-position.dto';

@Controller('videos')
export class VideosController {
  constructor(private videosService: VideosService) {}

  @Get(':id')
  @UseGuards(StudentJwtGuard)
  getLesson(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.videosService.getLessonDetails(id, req.user.sub);
  }

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

  @Post(':id/position')
  @UseGuards(StudentJwtGuard)
  updatePosition(
    @Param('id') id: string,
    @Body() dto: UpdatePositionDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.videosService.updatePosition(id, req.user.sub, dto.positionSec);
  }

  @Get(':id/download-token')
  @UseGuards(StudentJwtGuard)
  getDownloadToken(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.videosService.getDownloadToken(id, req.user.sub);
  }

  @Get(':id/download')
  @UseGuards(StudentJwtGuard)
  getDownloadDetails(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.videosService.getDownloadDetails(id, req.user.sub);
  }
}
