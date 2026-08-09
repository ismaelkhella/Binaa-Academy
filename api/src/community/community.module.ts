import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CommunityService } from './community.service';
import { CommunityController, AdminCommunityController } from './community.controller';
import { CommunityGateway } from './community.gateway';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CommunityController, AdminCommunityController],
  providers: [CommunityService, CommunityGateway],
})
export class CommunityModule {}
