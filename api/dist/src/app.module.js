"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const subjects_module_1 = require("./subjects/subjects.module");
const videos_module_1 = require("./videos/videos.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const admin_module_1 = require("./admin/admin.module");
const openapi_module_1 = require("./openapi/openapi.module");
const app_controller_1 = require("./app.controller");
const goals_module_1 = require("./goals/goals.module");
const performance_module_1 = require("./performance/performance.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const cart_module_1 = require("./cart/cart.module");
const chat_module_1 = require("./chat/chat.module");
const community_module_1 = require("./community/community.module");
const mux_module_1 = require("./mux/mux.module");
const question_bank_module_1 = require("./question-bank/question-bank.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            subjects_module_1.SubjectsModule,
            videos_module_1.VideosModule,
            subscriptions_module_1.SubscriptionsModule,
            admin_module_1.AdminModule,
            openapi_module_1.OpenapiModule,
            goals_module_1.GoalsModule,
            performance_module_1.PerformanceModule,
            dashboard_module_1.DashboardModule,
            cart_module_1.CartModule,
            chat_module_1.ChatModule,
            community_module_1.CommunityModule,
            mux_module_1.MuxModule,
            question_bank_module_1.QuestionBankModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [{ provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map