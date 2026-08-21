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
var CommunityGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const socket_io_1 = require("socket.io");
const community_service_1 = require("./community.service");
let CommunityGateway = CommunityGateway_1 = class CommunityGateway {
    constructor(jwt, config, community) {
        this.jwt = jwt;
        this.config = config;
        this.community = community;
        this.logger = new common_1.Logger(CommunityGateway_1.name);
    }
    handleConnection(client) {
        const token = this.extractToken(client);
        if (!token) {
            client.emit('error', { code: 'AUTH_REQUIRED', message: 'مطلوب تسجيل الدخول' });
            client.disconnect(true);
            return;
        }
        try {
            const payload = this.jwt.verify(token, { secret: this.config.get('JWT_SECRET') });
            if (payload.role !== 'STUDENT' && payload.role !== 'TEACHER')
                throw new Error('bad role');
            client.data.user = { sub: payload.sub, role: payload.role };
        }
        catch (e) {
            const code = e?.name === 'TokenExpiredError' ? 'SESSION_EXPIRED' : 'SESSION_INVALID';
            client.emit('error', { code, message: 'جلسة غير صالحة' });
            client.disconnect(true);
        }
    }
    extractToken(client) {
        const authToken = client.handshake.auth?.token;
        if (typeof authToken === 'string' && authToken) {
            return authToken.startsWith('Bearer ') ? authToken.slice(7) : authToken;
        }
        const header = client.handshake.headers.authorization;
        if (header?.startsWith('Bearer '))
            return header.slice(7);
        return null;
    }
    async handleJoin(client, body) {
        const user = client.data.user;
        const subjectId = body?.subjectId;
        if (!user)
            return { event: 'error', data: { code: 'SESSION_INVALID', message: 'جلسة غير صالحة' } };
        if (!subjectId)
            return { event: 'error', data: { message: 'subjectId مطلوب' } };
        try {
            await this.community.checkAccess(user.sub, user.role, subjectId);
            await client.join(this.room(subjectId));
            return { event: 'joined', data: { subjectId } };
        }
        catch (e) {
            return { event: 'error', data: { message: e?.message || 'لا يمكنك الوصول إلى هذا المجتمع', subjectId } };
        }
    }
    async handleLeave(client, body) {
        if (body?.subjectId)
            await client.leave(this.room(body.subjectId));
        return { event: 'left', data: { subjectId: body?.subjectId } };
    }
    broadcastNewMessage(subjectId, message) {
        this.server?.to(this.room(subjectId)).emit('message:new', message);
    }
    broadcastDeletedMessage(subjectId, messageId) {
        this.server?.to(this.room(subjectId)).emit('message:deleted', { id: messageId, subjectId });
    }
    room(subjectId) {
        return `subject:${subjectId}`;
    }
};
exports.CommunityGateway = CommunityGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], CommunityGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommunityGateway.prototype, "handleJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommunityGateway.prototype, "handleLeave", null);
exports.CommunityGateway = CommunityGateway = CommunityGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/community',
        cors: { origin: true, credentials: true },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        community_service_1.CommunityService])
], CommunityGateway);
//# sourceMappingURL=community.gateway.js.map