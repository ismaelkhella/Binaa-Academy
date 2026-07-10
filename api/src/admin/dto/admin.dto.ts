import { IsOptional, IsString, IsEnum, IsNumber, IsBoolean, Min, IsArray } from 'class-validator';
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

  @IsOptional()
  @IsString()
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


