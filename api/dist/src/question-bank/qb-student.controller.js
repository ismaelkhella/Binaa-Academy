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
exports.QbStudentController = void 0;
const common_1 = require("@nestjs/common");
const question_bank_service_1 = require("./question-bank.service");
const question_bank_dto_1 = require("./dto/question-bank.dto");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
let QbStudentController = class QbStudentController {
    constructor(qbService) {
        this.qbService = qbService;
    }
    getSubjects(req) {
        return this.qbService.getStudentSubjects(req.user.sub);
    }
    getUnits(subjectId, req) {
        return this.qbService.getStudentUnits(subjectId, req.user.sub);
    }
    getQuestions(unitId, req) {
        return this.qbService.getStudentQuestions(unitId, req.user.sub);
    }
    answerQuestion(questionId, dto, req) {
        return this.qbService.answerQuestion(questionId, dto.choiceId, req.user.sub);
    }
};
exports.QbStudentController = QbStudentController;
__decorate([
    (0, common_1.Get)('subjects'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QbStudentController.prototype, "getSubjects", null);
__decorate([
    (0, common_1.Get)('subjects/:id/units'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QbStudentController.prototype, "getUnits", null);
__decorate([
    (0, common_1.Get)('units/:id/questions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QbStudentController.prototype, "getQuestions", null);
__decorate([
    (0, common_1.Post)('questions/:id/answer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_bank_dto_1.AnswerQuestionDto, Object]),
    __metadata("design:returntype", void 0)
], QbStudentController.prototype, "answerQuestion", null);
exports.QbStudentController = QbStudentController = __decorate([
    (0, common_1.Controller)('qb'),
    (0, common_1.UseGuards)(jwt_guard_1.StudentJwtGuard),
    __metadata("design:paramtypes", [question_bank_service_1.QuestionBankService])
], QbStudentController);
//# sourceMappingURL=qb-student.controller.js.map