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
exports.QuestionBankController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
const question_bank_service_1 = require("./question-bank.service");
const question_bank_dto_1 = require("./dto/question-bank.dto");
let QuestionBankController = class QuestionBankController {
    constructor(qbService) {
        this.qbService = qbService;
    }
    importFromSubjects() {
        return this.qbService.importFromSubjects();
    }
    listStages() {
        return this.qbService.listStages();
    }
    createStage(dto) {
        return this.qbService.createStage(dto);
    }
    updateStage(id, dto) {
        return this.qbService.updateStage(id, dto);
    }
    deleteStage(id) {
        return this.qbService.deleteStage(id);
    }
    listStageSubjects(stageId) {
        return this.qbService.listStageSubjects(stageId);
    }
    createQbSubject(stageId, dto) {
        return this.qbService.createQbSubject(stageId, dto);
    }
    updateQbSubject(id, dto) {
        return this.qbService.updateQbSubject(id, dto);
    }
    deleteQbSubject(id) {
        return this.qbService.deleteQbSubject(id);
    }
    listSubjectUnits(subjectId) {
        return this.qbService.listSubjectUnits(subjectId);
    }
    createUnit(subjectId, dto) {
        return this.qbService.createUnit(subjectId, dto);
    }
    updateUnit(id, dto) {
        return this.qbService.updateUnit(id, dto);
    }
    deleteUnit(id) {
        return this.qbService.deleteUnit(id);
    }
    listUnitQuestions(unitId) {
        return this.qbService.listUnitQuestions(unitId);
    }
    createQuestion(unitId, dto) {
        return this.qbService.createQuestion(unitId, dto);
    }
    updateQuestion(id, dto) {
        return this.qbService.updateQuestion(id, dto);
    }
    deleteQuestion(id) {
        return this.qbService.deleteQuestion(id);
    }
};
exports.QuestionBankController = QuestionBankController;
__decorate([
    (0, common_1.Post)('import-from-subjects'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "importFromSubjects", null);
__decorate([
    (0, common_1.Get)('stages'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "listStages", null);
__decorate([
    (0, common_1.Post)('stages'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [question_bank_dto_1.CreateStageDto]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "createStage", null);
__decorate([
    (0, common_1.Put)('stages/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_bank_dto_1.CreateStageDto]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "updateStage", null);
__decorate([
    (0, common_1.Delete)('stages/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "deleteStage", null);
__decorate([
    (0, common_1.Get)('stages/:stageId/subjects'),
    __param(0, (0, common_1.Param)('stageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "listStageSubjects", null);
__decorate([
    (0, common_1.Post)('stages/:stageId/subjects'),
    __param(0, (0, common_1.Param)('stageId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_bank_dto_1.CreateQbSubjectDto]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "createQbSubject", null);
__decorate([
    (0, common_1.Put)('subjects/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_bank_dto_1.CreateQbSubjectDto]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "updateQbSubject", null);
__decorate([
    (0, common_1.Delete)('subjects/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "deleteQbSubject", null);
__decorate([
    (0, common_1.Get)('subjects/:subjectId/units'),
    __param(0, (0, common_1.Param)('subjectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "listSubjectUnits", null);
__decorate([
    (0, common_1.Post)('subjects/:subjectId/units'),
    __param(0, (0, common_1.Param)('subjectId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_bank_dto_1.CreateUnitDto]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "createUnit", null);
__decorate([
    (0, common_1.Put)('units/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_bank_dto_1.CreateUnitDto]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "updateUnit", null);
__decorate([
    (0, common_1.Delete)('units/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "deleteUnit", null);
__decorate([
    (0, common_1.Get)('units/:unitId/questions'),
    __param(0, (0, common_1.Param)('unitId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "listUnitQuestions", null);
__decorate([
    (0, common_1.Post)('units/:unitId/questions'),
    __param(0, (0, common_1.Param)('unitId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_bank_dto_1.CreateQuestionDto]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "createQuestion", null);
__decorate([
    (0, common_1.Put)('questions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_bank_dto_1.CreateQuestionDto]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "updateQuestion", null);
__decorate([
    (0, common_1.Delete)('questions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "deleteQuestion", null);
exports.QuestionBankController = QuestionBankController = __decorate([
    (0, common_1.Controller)('admin/qb'),
    (0, common_1.UseGuards)(jwt_guard_1.AdminJwtGuard),
    __metadata("design:paramtypes", [question_bank_service_1.QuestionBankService])
], QuestionBankController);
//# sourceMappingURL=question-bank.controller.js.map