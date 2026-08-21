"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MuxController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
const mux_service_1 = require("./mux.service");
let MuxController = class MuxController {
    constructor(muxService) {
        this.muxService = muxService;
    }
    createUpload() {
        return this.muxService.createDirectUpload();
    }
    async webhook(req) {
        const rawBody = req.rawBody;
        if (!rawBody || !(await this.muxService.verifyWebhookSignature(rawBody, req.headers))) {
            throw new common_1.UnauthorizedException('Invalid Mux webhook signature');
        }
        const event = JSON.parse(rawBody.toString('utf8'));
        await this.muxService.handleEvent(event);
        return { received: true };
    }
};
exports.MuxController = MuxController;
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.AdminJwtGuard),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60000 } }),
    (0, common_1.Post)('create-upload'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MuxController.prototype, "createUpload", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MuxController.prototype, "webhook", null);
exports.MuxController = MuxController = __decorate([
    (0, common_1.Controller)('mux'),
    __metadata("design:paramtypes", [mux_service_1.MuxService])
], MuxController);
//# sourceMappingURL=mux.controller.js.map