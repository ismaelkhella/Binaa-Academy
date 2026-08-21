import { Grade, Branch, PlanType, VideoStatus } from '@prisma/client';
export declare class ListStudentsQuery {
    grade?: Grade;
    branch?: Branch;
    search?: string;
    subscriptionStatus?: 'active' | 'trial' | 'expired' | 'none';
}
export declare class UpdateStudentDto {
    grade?: Grade;
    branch?: Branch;
    parentPhone?: string;
    isActive?: boolean;
}
export declare class FreezeSubscriptionDto {
    freeze: boolean;
    reason?: string;
}
export declare class GrantSubscriptionDto {
    planType: PlanType;
    durationDays?: number;
    subjectIds?: string[];
}
export declare class CreateVideoDto {
    subjectId: string;
    title: string;
    description?: string;
    streamUrl?: string;
    muxUploadId?: string;
    durationSec?: number;
    unitNumber?: number;
    orderInUnit?: number;
    status?: VideoStatus;
    teacherId?: string;
    pdfUrl?: string;
    questions?: {
        text: string;
        options: string[];
        answer: string;
    }[];
}
export declare class UpdateVideoDto {
    subjectId?: string;
    title?: string;
    description?: string;
    streamUrl?: string;
    muxUploadId?: string;
    durationSec?: number;
    unitNumber?: number;
    orderInUnit?: number;
    status?: VideoStatus;
    teacherId?: string;
    pdfUrl?: string;
    questions?: {
        text: string;
        options: string[];
        answer: string;
    }[];
}
export declare class UpdatePlanDto {
    priceIls?: number;
    videosPerSubject?: number;
    discountPercent?: number;
    isActive?: boolean;
}
export declare class UpdateSubjectDto {
    priceIls?: number;
    teacherId?: string;
}
export declare class CreateSubjectDto {
    name: string;
    grade: string;
    branch: string;
    priceIls?: number;
    teacherId?: string;
}
export declare class CreateTeacherDto {
    name: string;
    phone: string;
    bio?: string;
    avatarUrl?: string;
    commissionRate?: number;
    subjectId?: string;
    password?: string;
}
export declare class TeacherCredentialsDto {
    phone?: string;
    password?: string;
}
