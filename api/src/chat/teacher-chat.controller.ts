import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { TeacherJwtGuard } from '../auth/guards/jwt.guard';

@Controller('teacher')
@UseGuards(TeacherJwtGuard)
export class TeacherChatController {
  constructor(private chatService: ChatService) {}

  @Get('dashboard')
  getDashboard(@Req() req: { user: { sub: string } }) {
    return this.chatService.getTeacherDashboard(req.user.sub);
  }

  @Get('conversations')
  getConversations(@Req() req: { user: { sub: string } }) {
    return this.chatService.teacherGetConversations(req.user.sub);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.chatService.teacherGetMessages(req.user.sub, id);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.chatService.teacherSendMessage(req.user.sub, id, body.content);
  }
}
