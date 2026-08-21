import { Grade, Branch } from '@prisma/client';
export declare class RegisterDto {
    phone: string;
    password: string;
    name: string;
    grade: Grade;
    branch: Branch;
    parentPhone?: string;
}
export declare class LoginDto {
    phone: string;
    password: string;
}
export declare class SetupProfileDto {
    grade: 'GRADE_11' | 'GRADE_12';
    branch: 'SCIENTIFIC' | 'LITERARY';
}
export declare class AdminLoginDto {
    email: string;
    password: string;
}
export declare class AdminChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class UpdateParentPhoneDto {
    parentPhone: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
