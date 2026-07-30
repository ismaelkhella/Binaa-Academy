import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SubjectsModule } from './subjects/subjects.module';
import { VideosModule } from './videos/videos.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AdminModule } from './admin/admin.module';
import { OpenapiModule } from './openapi/openapi.module';
import { AppController } from './app.controller';
import { GoalsModule } from './goals/goals.module';
import { PerformanceModule } from './performance/performance.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CartModule } from './cart/cart.module';
import { ChatModule } from './chat/chat.module';
import { MuxModule } from './mux/mux.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    SubjectsModule,
    VideosModule,
    SubscriptionsModule,
    AdminModule,
    OpenapiModule,
    GoalsModule,
    PerformanceModule,
    DashboardModule,
    CartModule,
    ChatModule,
    MuxModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
