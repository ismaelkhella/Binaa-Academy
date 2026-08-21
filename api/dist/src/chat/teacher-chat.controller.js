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
exports.TeacherChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
let TeacherChatController = class TeacherChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    getDashboard(req) {
        return this.chatService.getTeacherDashboard(req.user.sub);
    }
    getConversations(req) {
        return this.chatService.teacherGetConversations(req.user.sub);
    }
    getMessages(req, id) {
        return this.chatService.teacherGetMessages(req.user.sub, id);
    }
    sendMessage(req, id, body) {
        return this.chatService.teacherSendMessage(req.user.sub, id, body.content);
    }
};
exports.TeacherChatController = TeacherChatController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TeacherChatController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('conversations'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TeacherChatController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('conversations/:id/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeacherChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('conversations/:id/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TeacherChatController.prototype, "sendMessage", null);
exports.TeacherChatController = TeacherChatController = __decorate([
    (0, common_1.Controller)('teacher'),
    (0, common_1.UseGuards)(jwt_guard_1.TeacherJwtGuard),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], TeacherChatController);
//# sourceMappingURL=teacher-chat.controller.js.map