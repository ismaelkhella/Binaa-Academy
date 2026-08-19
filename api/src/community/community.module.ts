import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CommunityService } from './community.service';
import { CommunityController, AdminCommunityController } from './community.controller';
import { CommunityGateway } from './community.gateway';
import { ObjectStorageService } from './object-storage.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CommunityController, AdminCommunityController],
  providers: [CommunityService, CommunityGateway, ObjectStorageService],
})
export class CommunityModule {}
