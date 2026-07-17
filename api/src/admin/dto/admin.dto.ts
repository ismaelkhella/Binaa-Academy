import { IsOptional, IsString, IsEnum, IsNumber, IsBoolean, Min, IsArray, Matches, ValidateIf } from 'class-validator';
import { Grade, Branch, PlanType, VideoStatus } from '@prisma/client';

export class ListStudentsQuery {
  @IsOptional()
  @IsEnum(Grade)
  grade?: Grade;

  @IsOptional()
  @IsEnum(Branch)
  branch?: Branch;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  subscriptionStatus?: 'active' | 'trial' | 'expired' | 'none';
}

export class UpdateStudentDto {
  @IsOptional()
  @IsEnum(Grade)
  grade?: Grade;

  @IsOptional()
  @IsEnum(Branch)
  branch?: Branch;

  @IsOptional()
  @IsString()
  parentPhone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class FreezeSubscriptionDto {
  @IsBoolean()
  freeze!: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class GrantSubscriptionDto {
  @IsEnum(PlanType)
  planType!: PlanType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectIds?: string[];
}

export class CreateVideoDto {
  @IsString()
  subjectId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Required: a lesson without a playable video URL renders the site root
  // (the admin panel page in production) inside the student's video player.
  @IsString()
  @Matches(/^https?:\/\/.+/, {
    message: 'رابط الفيديو مطلوب — ارفع ملف الفيديو حتى يكتمل الرفع أو أدخل رابط بث صالحاً يبدأ بـ http',
  })
  streamUrl!: string;

  @IsOptional()
  @IsNumber()
  durationSec?: number;

  @IsOptional()
  @IsNumber()
  unitNumber?: number;

  @IsOptional()
  @IsNumber()
  orderInUnit?: number;

  @IsOptional()
  @IsEnum(VideoStatus)
  status?: VideoStatus;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsString()
  pdfUrl?: string;

  @IsOptional()
  @IsArray()
  questions?: { text: string; options: string[]; answer: string }[];
}

export class UpdateVideoDto {
  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Optional on update, but when provided it must be a real URL —
  // an empty, null, or relative value breaks the student video player.
  // ValidateIf (not IsOptional) so that an explicit null is rejected too.
  @ValidateIf((o) => o.streamUrl !== undefined)
  @Matches(/^https?:\/\/.+/, {
    message: 'رابط الفيديو غير صالح — يجب أن يبدأ بـ http أو https',
  })
  streamUrl?: string;

  @IsOptional()
  @IsNumber()
  durationSec?: number;

  @IsOptional()
  @IsNumber()
  unitNumber?: number;

  @IsOptional()
  @IsNumber()
  orderInUnit?: number;

  @IsOptional()
  @IsEnum(VideoStatus)
  status?: VideoStatus;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsString()
  pdfUrl?: string;

  @IsOptional()
  @IsArray()
  questions?: { text: string; options: string[]; answer: string }[];
}

export class UpdatePlanDto {
  @IsOptional()
  @IsNumber()
  priceIls?: number;

  @IsOptional()
  @IsNumber()
  videosPerSubject?: number;

  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSubjectDto {
  @IsOptional()
  @IsNumber()
  priceIls?: number;

  @IsOptional()
  @IsString()
  teacherId?: string;
}

export class CreateSubjectDto {
  @IsString()
  name!: string;

  @IsString()
  grade!: string;

  @IsString()
  branch!: string;

  @IsOptional()
  @IsNumber()
  priceIls?: number;

  @IsOptional()
  @IsString()
  teacherId?: string;
}

export class CreateTeacherDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @IsOptional()
  @IsString()
  subjectId?: string;
}


