import { IsString, Matches, Length, IsEnum, IsOptional } from 'class-validator';
import { Grade, Branch } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @Matches(/^05\d{8}$/, { message: 'رقم الهاتف يجب أن يكون فلسطينياً (05XXXXXXXX)' })
  phone!: string;

  @IsString()
  @Length(6, 20, { message: 'كلمة المرور يجب أن تكون بين 6 إلى 20 حرفاً' })
  password!: string;

  @IsString()
  name!: string;

  @IsEnum(Grade)
  grade!: Grade;

  @IsEnum(Branch)
  branch!: Branch;

  @IsOptional()
  @IsString()
  @Matches(/^05\d{8}$/, { message: 'رقم هاتف ولي الأمر يجب أن يكون فلسطينياً (05XXXXXXXX)' })
  parentPhone?: string;
}

export class LoginDto {
  @IsString()
  @Matches(/^05\d{8}$/, { message: 'رقم الهاتف يجب أن يكون فلسطينياً (05XXXXXXXX)' })
  phone!: string;

  @IsString()
  password!: string;
}

export class SetupProfileDto {
  @IsString()
  grade!: 'GRADE_11' | 'GRADE_12';

  @IsString()
  branch!: 'SCIENTIFIC' | 'LITERARY';
}

export class AdminLoginDto {
  @IsString()
  email!: string;

  @IsString()
  password!: string;
}

export class AdminChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @Length(8, 72, { message: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' })
  newPassword!: string;
}

export class UpdateParentPhoneDto {
  @IsString()
  @Matches(/^05\d{8}$/)
  parentPhone!: string;
}
