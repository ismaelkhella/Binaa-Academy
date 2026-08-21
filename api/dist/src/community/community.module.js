"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const community_service_1 = require("./community.service");
const community_controller_1 = require("./community.controller");
const community_gateway_1 = require("./community.gateway");
const object_storage_service_1 = require("./object-storage.service");
let CommunityModule = class CommunityModule {
};
exports.CommunityModule = CommunityModule;
exports.CommunityModule = CommunityModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule],
        controllers: [community_controller_1.CommunityController, community_controller_1.AdminCommunityController],
        providers: [community_service_1.CommunityService, community_gateway_1.CommunityGateway, object_storage_service_1.ObjectStorageService],
    })
], CommunityModule);
//# sourceMappingURL=community.module.js.map