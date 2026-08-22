import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, MinLength, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStageDto {
  @IsString()
  @MinLength(1, { message: 'اسم المرحلة لا يمكن أن يكون فارغاً' })
  name!: string;
}

export class CreateQbSubjectDto {
  @IsString()
  @MinLength(1, { message: 'اسم المادة لا يمكن أن يكون فارغاً' })
  name!: string;

  @IsString()
  grade!: string; // 'GRADE_11' or 'GRADE_12'

  @IsString()
  branch!: string; // 'SCIENTIFIC' or 'LITERARY'
}

export class CreateUnitDto {
  @IsString()
  @MinLength(1, { message: 'اسم الوحدة لا يمكن أن يكون فارغاً' })
  name!: string;

  @IsOptional()
  @IsNumber({}, { message: 'الترتيب يجب أن يكون رقماً' })
  order?: number;
}

export class CreateChoiceDto {
  @IsString()
  @MinLength(1, { message: 'نص الاختيار لا يمكن أن يكون فارغاً' })
  text!: string;

  @IsBoolean({ message: 'حالة الاختيار الصحيح يجب أن تكون قيمة منطقية' })
  isCorrect!: boolean;
}

export class CreateQuestionDto {
  @IsString()
  @MinLength(1, { message: 'نص السؤال لا يمكن أن يكون فارغاً' })
  text!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber({}, { message: 'الترتيب يجب أن يكون رقماً' })
  order?: number;

  @IsArray({ message: 'الاختيارات يجب أن تكون مصفوفة' })
  @ArrayMinSize(2, { message: 'يجب إضافة اختيارين على الأقل' })
  @ArrayMaxSize(6, { message: 'الحد الأقصى للاختيارات هو 6' })
  @ValidateNested({ each: true })
  @Type(() => CreateChoiceDto)
  choices!: CreateChoiceDto[];
}

export class AnswerQuestionDto {
  @IsString()
  choiceId!: string;
}
