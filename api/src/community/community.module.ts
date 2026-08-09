import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CommunityService } from './community.service';
import { CommunityController, AdminCommunityController } from './community.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CommunityController, AdminCommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
