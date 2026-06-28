import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminJwtGuard } from '../auth/guards/jwt.guard';
import {
  ListStudentsQuery,
  UpdateStudentDto,
  FreezeSubscriptionDto,
  GrantSubscriptionDto,
  CreateVideoDto,
  UpdatePlanDto,
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
  updateVideo(@Param('id') id: string, @Body() dto: Partial<CreateVideoDto>) {
    return this.adminService.updateVideo(id, dto);
  }

  @Delete('videos/:id')
  deleteVideo(@Param('id') id: string) {
    return this.adminService.deleteVideo(id);
  }

  @Get('subjects')
  listSubjects() {
    return this.adminService.listSubjects();
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
  listTeachers() {
    return this.adminService.listTeachers();
  }
}
