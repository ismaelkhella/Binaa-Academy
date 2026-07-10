import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { StudentJwtGuard } from '../auth/guards/jwt.guard';

@Controller('chat')
@UseGuards(StudentJwtGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('teachers')
  getTeachers(@Req() req: { user: { sub: string } }) {
    return this.chatService.studentGetTeachers(req.user.sub);
  }

  @Get('conversations')
  getConversations(@Req() req: { user: { sub: string } }) {
    return this.chatService.studentGetConversations(req.user.sub);
  }

  @Post('conversations')
  createConversation(
    @Req() req: { user: { sub: string } },
    @Body() body: { teacherId: string },
  ) {
    return this.chatService.studentGetOrCreateConversation(req.user.sub, body.teacherId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.chatService.studentGetMessages(req.user.sub, id);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.chatService.studentSendMessage(req.user.sub, id, body.content);
  }
}
