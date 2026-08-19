import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AdminService } from './admin.service';
import { AdminJwtGuard } from '../auth/guards/jwt.guard';
import {
  ListStudentsQuery,
  UpdateStudentDto,
  FreezeSubscriptionDto,
  GrantSubscriptionDto,
  CreateVideoDto,
  UpdateVideoDto,
  UpdatePlanDto,
  UpdateSubjectDto,
  CreateSubjectDto,
  CreateTeacherDto,
  TeacherCredentialsDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(AdminJwtGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('students')
  listStudents(@Query() query: ListStudentsQuery) {
    return this.adminService.listStudents(query);
  }

  @Get('students/:id')
  getStudent(@Param('id') id: string) {
    return this.adminService.getStudent(id);
  }

  @Put('students/:id')
  updateStudent(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.adminService.updateStudent(id, dto);
  }

  @Post('students/:id/subscription/freeze')
  freezeSubscription(@Param('id') id: string, @Body() dto: FreezeSubscriptionDto) {
    return this.adminService.freezeSubscription(id, dto);
  }

  @Post('students/:id/subscription/grant')
  grantSubscription(@Param('id') id: string, @Body() dto: GrantSubscriptionDto) {
    return this.adminService.grantSubscription(id, dto);
  }

  @Get('videos')
  listVideos() {
    return this.adminService.listVideos();
  }

  @Post('videos')
  createVideo(@Body() dto: CreateVideoDto) {
    return this.adminService.createVideo(dto);
  }

  @Put('videos/:id')
  updateVideo(@Param('id') id: string, @Body() dto: UpdateVideoDto) {
    return this.adminService.updateVideo(id, dto);
  }

  @Delete('videos/:id')
  deleteVideo(@Param('id') id: string) {
    return this.adminService.deleteVideo(id);
  }

  @Post('videos/:id/retry')
  retryVideo(@Param('id') id: string) {
    return this.adminService.retryVideoUpload(id);
  }

  @Get('subjects')
  listSubjects() {
    return this.adminService.listSubjects();
  }

  @Post('subjects')
  createSubject(@Body() dto: CreateSubjectDto) {
    return this.adminService.createSubject(dto);
  }

  @Put('subjects/:id')
  updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.adminService.updateSubject(id, dto);
  }


  @Get('plans')
  listPlans() {
    return this.adminService.listPlans();
  }

  @Put('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.adminService.updatePlan(id, dto);
  }

  @Get('teachers')
  listTeachers(@Query() query: { search?: string; page?: string; limit?: string }) {
    return this.adminService.listTeachers(query);
  }

  @Get('teachers/dashboard')
  getTeachersDashboard() {
    return this.adminService.getTeachersDashboard();
  }

  @Post('teachers')
  createTeacher(@Body() dto: CreateTeacherDto) {
    return this.adminService.createTeacher(dto);
  }

  @Patch('teachers/:id/credentials')
  updateTeacherCredentials(@Param('id') id: string, @Body() dto: TeacherCredentialsDto) {
    return this.adminService.updateTeacherCredentials(id, dto);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|pdf|zip|mp4|webm|mov|mkv|avi)$/i;
        const allowedMimetypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/zip',
          'application/x-zip-compressed',
          'video/mp4',
          'video/webm',
          'video/quicktime',
          'video/x-msvideo',
          'video/x-matroska',
          // Note: application/octet-stream intentionally excluded — too permissive
        ];

        const ext = extname(file.originalname);
        const isExtensionAllowed = allowedExtensions.test(ext);
        const isMimetypeAllowed = allowedMimetypes.includes(file.mimetype);

        if (isExtensionAllowed && isMimetypeAllowed) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              'نوع الملف غير مسموح به. الأنواع المدعومة هي: JPG, PNG, GIF, WEBP, PDF, ZIP, MP4, WEBM, MOV',
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // 2 GB limit for video files
      },
    }),
  )
  uploadFile(@UploadedFile() file: any, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('لم يتم تحديد أي ملف للرفع');
    }
    // Return an absolute URL so mobile clients can use it directly
    // regardless of whether they use the root domain or the /api base.
    const protocol = req.get('x-forwarded-proto') ?? req.protocol ?? 'https';
    const host = req.get('host') ?? '';
    const url = `${protocol}://${host}/uploads/${file.filename}`;
    return { url };
  }
}
