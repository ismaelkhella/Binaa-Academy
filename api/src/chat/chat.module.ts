import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TeacherChatController } from './teacher-chat.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ChatController, TeacherChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
