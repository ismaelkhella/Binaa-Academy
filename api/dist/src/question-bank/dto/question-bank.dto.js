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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnswerQuestionDto = exports.CreateQuestionDto = exports.CreateChoiceDto = exports.CreateUnitDto = exports.CreateQbSubjectDto = exports.CreateStageDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateStageDto {
}
exports.CreateStageDto = CreateStageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'اسم المرحلة لا يمكن أن يكون فارغاً' }),
    __metadata("design:type", String)
], CreateStageDto.prototype, "name", void 0);
class CreateQbSubjectDto {
}
exports.CreateQbSubjectDto = CreateQbSubjectDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'اسم المادة لا يمكن أن يكون فارغاً' }),
    __metadata("design:type", String)
], CreateQbSubjectDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQbSubjectDto.prototype, "grade", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQbSubjectDto.prototype, "branch", void 0);
class CreateUnitDto {
}
exports.CreateUnitDto = CreateUnitDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'اسم الوحدة لا يمكن أن يكون فارغاً' }),
    __metadata("design:type", String)
], CreateUnitDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'الترتيب يجب أن يكون رقماً' }),
    __metadata("design:type", Number)
], CreateUnitDto.prototype, "order", void 0);
class CreateChoiceDto {
}
exports.CreateChoiceDto = CreateChoiceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'نص الاختيار لا يمكن أن يكون فارغاً' }),
    __metadata("design:type", String)
], CreateChoiceDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'حالة الاختيار الصحيح يجب أن تكون قيمة منطقية' }),
    __metadata("design:type", Boolean)
], CreateChoiceDto.prototype, "isCorrect", void 0);
class CreateQuestionDto {
}
exports.CreateQuestionDto = CreateQuestionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'نص السؤال لا يمكن أن يكون فارغاً' }),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'الترتيب يجب أن يكون رقماً' }),
    __metadata("design:type", Number)
], CreateQuestionDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'الاختيارات يجب أن تكون مصفوفة' }),
    (0, class_validator_1.ArrayMinSize)(2, { message: 'يجب إضافة اختيارين على الأقل' }),
    (0, class_validator_1.ArrayMaxSize)(6, { message: 'الحد الأقصى للاختيارات هو 6' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateChoiceDto),
    __metadata("design:type", Array)
], CreateQuestionDto.prototype, "choices", void 0);
class AnswerQuestionDto {
}
exports.AnswerQuestionDto = AnswerQuestionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnswerQuestionDto.prototype, "choiceId", void 0);
//# sourceMappingURL=question-bank.dto.js.map