import { Controller, Get, Param, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { StudentJwtGuard } from '../auth/guards/jwt.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('subjects')
export class SubjectsController {
  constructor(
    private subjectsService: SubjectsService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(StudentJwtGuard)
  async list(@Req() req: { user: { sub: string } }) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user?.grade || !user?.branch) {
      throw new NotFoundException('يرجى إكمال الملف الشخصي أولاً');
    }
    return this.subjectsService.listForStudent(user.grade, user.branch, user.id);
  }

  @Get('my')
  @UseGuards(StudentJwtGuard)
  async listMy(@Req() req: { user: { sub: string } }) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }
    return this.subjectsService.listPurchasedForStudent(user.id);
  }

  @Get(':id/videos')
  @UseGuards(StudentJwtGuard)
  getVideos(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.subjectsService.getVideos(id, req.user.sub);
  }
}
