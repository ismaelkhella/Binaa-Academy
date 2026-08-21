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
exports.GoalsController = void 0;
const common_1 = require("@nestjs/common");
const goals_service_1 = require("./goals.service");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
const class_validator_1 = require("class-validator");
class CreateGoalDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'عنوان الهدف مطلوب' }),
    __metadata("design:type", String)
], CreateGoalDto.prototype, "title", void 0);
class UpdateGoalDto {
}
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateGoalDto.prototype, "completed", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateGoalDto.prototype, "title", void 0);
let GoalsController = class GoalsController {
    constructor(goalsService) {
        this.goalsService = goalsService;
    }
    list(req) {
        return this.goalsService.listGoals(req.user.sub);
    }
    create(req, dto) {
        return this.goalsService.createGoal(req.user.sub, dto.title);
    }
    update(req, id, dto) {
        return this.goalsService.updateGoal(req.user.sub, id, dto.completed, dto.title);
    }
    delete(req, id) {
        return this.goalsService.deleteGoal(req.user.sub, id);
    }
};
exports.GoalsController = GoalsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateGoalDto]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateGoalDto]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "delete", null);
exports.GoalsController = GoalsController = __decorate([
    (0, common_1.Controller)('goals'),
    (0, common_1.UseGuards)(jwt_guard_1.StudentJwtGuard),
    __metadata("design:paramtypes", [goals_service_1.GoalsService])
], GoalsController);
//# sourceMappingURL=goals.controller.js.map